/********************************************************/
/* GW-SERVER                                            */
/* Para executar use: node gw-server.js &               */
/*                                                      */
/********************************************************/
process.title = 'gw-server';
Version = 'V1.0.0';

async function FormatDate() {
	function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }
	date = new Date();
	return date.getFullYear()+ii(date.getMonth()+1)+ii(date.getDate())+ii(date.getHours())+ii(date.getMinutes())+ii(date.getSeconds());
}

async function GetDate() {
	offset = new Date(new Date().getTime()).getTimezoneOffset();
	return new Date(new Date().getTime() - (offset*60*1000)).toISOString().replace(/T/,' ').replace(/\..+/, '');
}

async function WriteLog(did,kind,log) {
	// Get date and time
	let dte = await GetDate();
	// Verifica se a chave existe indicando que o cliente ainda esta conectado
	cfg.exists('log:'+did, function (err, result) {
		if (result==1) {
			cfg.publish('log:'+did,dte+': '+log);
		};
	});
	// Show Log in terminal
	if (ShowLog) {
		console.log('\033[1;30m'+dte+': '+((kind=='S')?'\033[0;32m':'\033[0;20m')+log);
	}
}

/****************************************************************************************************/
/* Classe Tracker																					*/
/****************************************************************************************************/
class Tracker {

	constructor(socket) {
		this.usocket=socket;
		this.did='';
		this.login=0;
		this.bytin=0;
		this.bytout=0;
		this.msgin=0;
		this.msgout=0;
		this.err='';

		this.iccid='';
		this.dte=0;
		this.lat=0;
		this.lng=0;
		this.spd=0;
		this.dir=0;
		this.alt=0;
		this.bat=0;
		this.sat=0;
		this.sig=0;
	}

	async pubTracker(did,str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		cfg.exists('did:'+did, function (err, result) {
			if (result==1) {
				cfg.publish('did:'+did,'{"did":"'+did+'",'+str+'}');
			};
		});
	}

	async initTracker(did) {
		// Update counters and ID
		this.did=did;
		this.login = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
		numdev++;
	}

	async closeTracker(){
		// Verifica se a conexão foi de um device
		if (this.did!=='') {
			let th=this;
			// Publish
			this.pubTracker(th.did,'"type":"close","err":"'+th.err+'"').catch(err => console.error(err)); 
			// Grava log da conexão do device
			db.getConnection(function (err, connection) {
				if (!err) {
					connection.query('INSERT INTO devlog (did,login,bytin,bytout,msgin,msgout) VALUES (?,?,?,?,?,?)', [th.did, th.login, th.bytin, th.bytout, th.msgin, th.msgout], function (err, result) { connection.release(); if (err) { err => console.error(err); } });
				}
			});
			// Send log
			WriteLog(th.did,'O','Logout: '+th.err);
			numdev--;
		}	
	}

	async sendTracker(cmd){



		
		this.usocket.write(cmd);
		// Update counters
		this.bytout+=cmd.length;
		this.msgout++;
		bytsout+=cmd.length;
		msgsout++;
		// send log
		WriteLog(this.did,'S',cmd);
	}

	async incomingTracker(data){
		this.bytin+=data.length;
		bytsin+=data.length;
		let th=this;
		// Processa os dados do buffer
		while (data.length > 0) {
			if (data[0]===0x7e) {
				let i=data.indexOf(0x7e);


				// Publish
				this.pubTracker(th.did,'"type":"data"').catch(err => console.error(err));
			} else  { data = data.slice(1); }
		} 
	}
}

// Initialize new connection
async function OpenSocket(socket) {
	const device=new Tracker(socket);
	
	socket.on('data',function(data){ device.incomingTracker(data); });
	socket.on('close',async function(){ await device.closeTracker(); delete device; });
	socket.on('end',function(){ device.err='0-Normal End'; device.usocket.destroy(); });
	socket.on('error',function(){ device.err = '1-Error'; device.usocket.destroy(); });
	// Close connection when inactive (5 min)
	socket.setTimeout(300000,function(){ device.err='2-Timeout'; device.usocket.destroy(); });
}

// Update statistics
var numdev=0,msgserr=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0;
setInterval(function(){ 
			db.getConnection(function(err,connection){
				if (!err) {
					connection.query('INSERT INTO sysmtr (protocol,devices,msgserr,msgsin,msgsout,bytsin,bytsout) VALUES (?,?,?,?,?,?)',['GW', numdev, msgserr, msgsin, msgsout, bytsin, bytsout],function (err, result) {connection.release(); if (err) err => console.error(err);});
				}
				msgserr=0;
				msgsin=0;
				msgsout=0;
				bytsin=0;
				bytsout=0;
			});
},60000);

// Read enviroment variables
const dotenv = require('dotenv');
dotenv.config();

// Initialize debug enviroment
const ShowLog = process.env.ShowLog || false;

// Create and open Redis connection
const Redis = require('ioredis');
const cfg = new Redis({ host: process.env.RD_host, port: process.env.RD_port, showFriendlyErrorStack: true });

// Create and open MySQL connection
const mysql = require('mysql');
const db = mysql.createPool({host:process.env.DB_host, database:process.env.DB_name, user:process.env.DB_user, password:process.env.DB_pass, connectionLimit:10});

// Create and open server connection
const net = require('net');
const server = net.createServer(OpenSocket);
server.listen(process.env.SrvPort, process.env.SrvIP);

// Show parameters and waiting clients
const OS = require('os');
GetDate().then(dte => {
	console.log('\033[1;30m'+dte+': \033[0;31m================================');
	console.log('\033[1;30m'+dte+': \033[0;31m' + 'APP : ' + process.title + ' ('+Version+')');
	console.log('\033[1;30m'+dte+': \033[0;31m' + 'IP/Port : ' + process.env.SrvIP + ':' + process.env.SrvPort);
	console.log('\033[1;30m'+dte+': \033[0;31m' + 'Process: '+ OS.cpus().length);
	console.log('\033[1;30m'+dte+': \033[0;31m================================');
	console.log('\033[1;30m'+dte+': \033[0;31mWaiting clients...\033[0;0m');});