/********************************************************/
/* GW-SERVER                                            */
/* Para executar use: node gw-server.js &               */
/********************************************************/
process.title = 'gw-server';
Version = 'V1.0.0';

async function FormatDate() {
	function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }
	let date = new Date();
	return date.getFullYear()+ii(date.getMonth()+1)+ii(date.getDate())+ii(date.getHours())+ii(date.getMinutes())+ii(date.getSeconds());
}

async function GetDate() {
	let offset = new Date(new Date().getTime()).getTimezoneOffset();
	return new Date(new Date().getTime() - (offset*60*1000)).toISOString().replace(/T/,' ').replace(/\..+/, '');
}

/****************************************************************************************************/
/* Classe Tracker																					*/
/****************************************************************************************************/
class Tracker {

	constructor(socket) {
		this.usocket=socket;
		this.did='';
		this.login=0;
		this.logout=0;
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

	async SendLog(log) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('log:'+this.did, function (err, result) {
			if (result==1) {
				// Publish
				hub.publish('log:'+this.did,'<div class=datetime>'+GetDate()+': </div>'+log);
			};
		});
	}

	async PubTracker(str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('did:'+this.did, function (err, result) {
			if (result==1) {
				hub.publish('did:'+this.did,'{"did":"'+this.did+'",'+str+'}');
			};
		});
	}

	async SendTracker(buff){
		// Calcula o check digit
		let checkdigit = buff[0];
		for (let i = 1; i < buff.length; i++) { checkdigit ^= buff[i]; }
		// Adiciona check digit no final do buffer
		buff.splice(buff.length,0,checkdigit);
		// Faz o escape do 0x7d
		let y=buff.indexOf(0x7d,0);
		while (y!=-1) {
			buff.splice(y+1,0,0x01);
			// Next
			y=buff.indexOf(0x7d,y+2);
		}
		// Faz o escape do 0x7e
		y=buff.indexOf(0x7e,0);
		while (y!=-1) {
			buff.splice(y,1,0x7d,0x02);
			// Next
			y=buff.indexOf(0x7e,y+2);
		}
		// Adciona indentificadores
		buff.splice(0,0,0x7e);
		buff.splice(buff.length,0,0x7e);
		// Envia pelo socket
		this.usocket.write(buff);
		// Update counters
		this.bytout+=buff.length;
		this.msgout++;
		bytsout+=buff.length;
		msgsout++;
		// send log
		this.SendLog(buff);
	}

	async SendUnivesalReply(packg,serial,code){
		const buff = new ArrayBuffer(21);
		let PackType = new Uint16Array(buff,0,1);
		let BodyLen = new Uint16Array(buff,2,1);
		let MobPhoneNum = new Uint8Array(buff,4,12);
		let AnswerSerial = new Uint16Array(buff,16,1);
		let AnswerPackg = new Uint16Array(buff,18,1);
		let ResultCode = new Uint8Array(buff,20,1);
		let Buf = new Uint8Array(buff);
		// Fill variables
		PackType[0] = 0x8001;
		BodyLen[0] = 0x0500;
		MobPhoneNum[0] = this.did;
		AnswerSerial[0] = serial;
		AnswerPackg[0] = packg;
		ResultCode[0] = code;
		// Send packge
		this.SendTracker(Array.from(Buf));
	}

	async InitTracker(did) {
		// Update ID and login datetime
		this.did = did;
		this.login = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
		// Publish login
		this.PubTracker('"dte":"'+this.login+'","type":"login"').catch(err => console.error(err));
		// Send log
		this.SendLog('<div class=warning>Login</div>');
		numdev++;
	}

	async DataParse(packg){
		function ih(ii) {return packg[ii]*256+packg[ii+1]}
		function hh(ii) {return packg[ii].toString(16)}
		// Faz o unescape do 0x7d
		let y=packg.indexOf(0x7d,1);
		while (y!=-1) {
			if (packg[y+1]==0x02) {packg[y]=0x7e}
			packg.splice(y+1,1);
			// Next
			y=packg.indexOf(0x7d,y+1);
		}
		// Calcula o check digit
		let checkdigit = packg[1];
		for (let i = 2; i < packg.length-2; i++) { checkdigit ^= packg[i]; }
		// Verifica o check digit
		if ( checkdigit == packg[packg.length-2]) {
			// Recolhe os parâmetros
			let PkgType = ih(1); // Packge Type
			let BodyLen = ih(3) & 0x1ff; // Body length
			let MobPhoneNum = hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10); // Mobile Phone Number
			let MsgSerial = ih(11); // Message serial number
			// Testar os subpacotes

			// Verifica se é a primeira mensagem
			if (this.did==='') { this.InitTracker(MobPhoneNum); }
			// Atualiza contadores de msg
			this.bytin+=packg.length;
			this.msgin++;
			msgsin++;
			// Processa a informação conforme o tipo de pacote
			switch (PkgType) {
				case 0x0002 : // Terminal heart beat
					SendUnivesalReply(0x0002,MsgSerial,0);
					break;

				case 0x0200 : // Location information reporting
					break;

				case 0x0704 : // Upload location data in batches
					break;

				case 0x0102 : // Terminal autentication
					break;

				case 0x0100 : // Terminal registration
					break;

			}
		}
	}

	async IncomingTracker(data){
		bytsin+=data.length;
		// Processa os dados do buffer
		while (data.length > 0) {
			// Verifica se a linha comeca com 0x7e
			let i=data.indexOf(0x7e,0);
			if (i==0) { 
				// Procura o final da linha
				i=data.indexOf(0x7e,1);
				if (i>0) {
					// Extrai linha do data
					let packg=data.slice(0,i+1);
					data = data.slice(i+1);
					// Parse data
					await this.DataParse(packg);
				
				} else { data = []; bytserr+=data.length; }
			} else { if (i==-1) {data = []; bytserr+=data.length;} else {data = data.slice(i+1); bytserr+=i; }}
		} 
	}

	async CloseTracker() {
		// Verifica se a conexão foi de um device valido
		if (this.did!=='') {
			// Update logout datetime
			this.logout = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
			// Grava log da conexão do device
			let th=this;
			db.getConnection(function (err, connection) {
				if (!err) {
					connection.query('INSERT INTO devlog (did,login,logout,bytin,bytout,msgin,msgout) VALUES (?,?,?,?,?,?,?)', [th.did, th.login, th.logout, th.bytin, th.bytout, th.msgin, th.msgout], function (err, result) { connection.release(); if (err) { err => console.error(err); } });
				}
			});
			// Publish logout
			this.PubTracker('"dte":"'+this.logout+'","type":"logout","err":"'+this.err+'"').catch(err => console.error(err)); 
			// Send log
			this.SendLog('<div class=warning>Logout: '+this.err+'</div>');
			numdev--;
		}	
	}
}

// Initialize new connection
async function OpenSocket(socket) {
	const device=new Tracker(socket);
	
	socket.on('data',function(data){ device.IncomingTracker(data); });
	socket.on('close',async function(){ await device.CloseTracker(); delete device; });
	socket.on('end',function(){ device.err='0-Normal End'; device.usocket.destroy(); });
	socket.on('error',function(){ device.err = '1-Error'; device.usocket.destroy(); });
	// Close connection when inactive (5 min)
	socket.setTimeout(300000,function(){ device.err='2-Timeout'; device.usocket.destroy(); });
}

// Update statistics
var numdev=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0,bytserr=0;
setInterval(function(){ 
			db.getConnection(function(err,connection){
				if (!err) {
					connection.query('INSERT INTO syslog (protocol,devices,msgsin,msgsout,bytsin,bytsout,bytserr) VALUES (?,?,?,?,?,?,?)',['GW', numdev, msgsin, msgsout, bytsin, bytsout, bytserr],function (err, result) {connection.release(); if (err) err => console.error(err);});
				}
				msgsin=0;
				msgsout=0;
				bytsin=0;
				bytsout=0;
				bytserr=0;
			});
},60000);

// Read enviroment variables
const dotenv = require('dotenv');
dotenv.config();

// Create and open Redis connection
const Redis = require('ioredis');
const hub = new Redis({ host: process.env.RD_host, port: process.env.RD_port, showFriendlyErrorStack: true });

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
	console.log('\033[1;30m'+dte+': \033[0;31m' + 'CPUs: '+ OS.cpus().length);
	console.log('\033[1;30m'+dte+': \033[0;31m================================');
	console.log('\033[1;30m'+dte+': \033[0;31mWaiting clients...\033[0;0m');});