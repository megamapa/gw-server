/********************************************************/
/*                                                      */
/* Para executar use: node gw-server.js &               */
/*                                                      */
/********************************************************/
process.title = 'gw-server';
Version = 'V1.0.0';

function GetDate() {
	offset = new Date(new Date().getTime()).getTimezoneOffset();
	return new Date(new Date().getTime() - (offset*60*1000)).toISOString().replace(/T/,' ').replace(/\..+/, '');
}

function FormatDate() {
	function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }
	date = new Date();
	return date.getFullYear()+ii(date.getMonth()+1)+ii(date.getDate())+ii(date.getHours())+ii(date.getMinutes())+ii(date.getSeconds());
}

async function writelog(id,kind,log) {
	// Verifica se a chave existe indicando que o cliente ainda esta conectado
	cfg.exists('log:'+id, function (err, result) {
		if (result==1) {
			cfg.publish('log:'+id,GetDate()+': '+log);
		};
	});
	// Show Log in terminal
	if (process.env.ShowLog) { console.log('\033[1;30m'+GetDate()+': \033[0;0m'+log);}
}

async function SendCmd(device,cmd){
	device.usocket.write(cmd);
	// Update counters
	device.bytout+=cmd.length;
	device.msgout++;
	bytsout+=cmd.length;
	msgsout++;
	// send log
	writelog(device.id,'S',cmd);
}


/****************************************************************************************************/
/* Classe Tracker																					*/
/****************************************************************************************************/
class Tracker {

	constructor(socket) {
		this.usocket=socket;
		this.id='';
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

	async initTracker(id) {
		// Update counters and ID
		this.id=id;
		this.login = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
		numdev++;
	}

	async pubTracker(id,str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		cfg.exists('id:'+id, function (err, result) {
			if (result==1) {
				cfg.publish('dev:'+id,'{"did":"'+id+'",'+str+'}');
			};
		});
	}

	async incomingTracker(data){
		this.bytin+=data.length;
		bytsin+=data.length;


	}

	async closeTracker(){
		// Verifica se a conexão foi de um device
		if (this.id!=='') {
			let th=this;
			// Publica
			this.pubTracker(th.id,'"type":"close","err":"'+th.err+'"').catch(err => console.error(err)); 
			// Grava log da conexão do device
			db.getConnection(function (err, connection) {
				if (!err) {
					connection.query('INSERT INTO devlog (did,login,bytin,bytout,msgin,msgout) VALUES (?,?,?,?,?,?)', [th.id, th.login, th.bytin, th.bytout, th.msgin, th.msgout], function (err, result) { connection.release(); if (err) { err => console.error(err); } });
				}
			});
			// Send log
			writelog(th.id,'O','Logout: '+th.err);
			numdev--;
		}	
	}
}

// Initialize new connection
function OpenSocket(socket) {
	const device=new Tracker(socket);
	
	socket.on('data',function(data){device.incomingTracker(data);});
	socket.on('close',async function(){await device.closeTracker(); delete device;});
	socket.on('end',function(){device.err='0-End'; device.usocket.destroy();});
	socket.on('error',function(){device.err='1-Error'; device.usocket.destroy();});
	// Close connection when inactive (5 min)
	socket.setTimeout(300000,function(){device.err='2-Timeout'; device.usocket.destroy();});
}

// Update statistics
var numdev=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0;
setInterval(function(){ 
			db.getConnection(function(err,connection){
				if (!err) {
					connection.query('INSERT INTO sysmtr (protocol,devices,msgsin,msgsout,bytsin,bytsout) VALUES (?,?,?,?,?,?)',['GW', numdev, msgsin, msgsout, bytsin, bytsout],function (err, result) {connection.release(); if (err) err => console.error(err);});
				}
				msgsin=0;
				msgsout=0;
				bytsin=0;
				bytsout=0;
			});
},60000);

// Read enviroment variables
const dotenv = require('dotenv');
dotenv.config();

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
console.log('\033[1;30m'+GetDate()+': \033[0;31m================================');
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + 'APP : ' + process.title + ' ('+Version+')');
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + 'IP/Port : ' + process.env.SrvIP + ':' + process.env.SrvPort);
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + 'Process: '+ OS.cpus().length);
console.log('\033[1;30m'+GetDate()+': \033[0;31m================================');
console.log('\033[1;30m'+GetDate()+': \033[0;31msWaiting clients...\033[0;0m');