/********************************************************/
/* GW-SERVER                                            */
/* Para executar use: node gw-server.js &               */
/********************************************************/
process.title = 'gw-server';
const Version = 'v1.0.0';

async function GetDate() {
	let offset = new Date(new Date().getTime()).getTimezoneOffset();
	return new Date(new Date().getTime() - (offset*60*1000)).toISOString().replace(/T/,' ').replace(/\..+/, '');
}

/****************************************************************************************************/
/* Classe Device																					*/
/****************************************************************************************************/
class Device {

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
		this.mpnum=[]; // Mobile phone number
		this.msnum=0; // Mensagem serial number

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

	// Publish log
	async PublishLog(logtype,log) {
		function hh(ii) {return log[ii].toString(16)}
		function ih(ii) {return packg[ii]*256+packg[ii+1]}
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('log:'+this.did, function (err, result) {
			if (result==0) {
				if (logtype) {
					// Cria html para o header
					let str = '<p><div class=datetime>'+GetDate()+': </div>';
					str+='<div class=identification>'+hh(0)+'</div><div class=packtype>'+hh(1)+hh(2)+'</div><div class=packlength>'+hh(3)+hh(4)+'</div><div class=terminalnumber>'+hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10)+'</div>';
					str+='<div class=messageserial>'+hh(11)+hh(12)+'</div>';
					// Cria html para o body
					let pkgtype = ih(1);
					switch (pkgtype) {
						case 0x0704 : // Upload location data in batches
							break;
											
						case 0x0102 : // Terminal autentication
							break;
						
						case 0x0100 : // Terminal registration
							break;
						
					}
					str+='<div class=checkdigit>'+hh(log.length-1)+'</div><div class=identification>'+hh(log.length)+'</div></p>';
					// Publish data
					hub.publish('log:'+this.did,str);
				} else {
					// Publish text
					hub.publish('log:'+this.did,'<p><div class=datetime>'+GetDate()+': </div>'+log+'</p>');
				};
			};
		});
	}

	async PublishDevice(str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('did:'+this.did, function (err, result) {
			if (result) {
				hub.publish('did:'+this.did,'{"did":"'+this.did+'",'+str+'}');
			};
		});
	}

	async InitDevice(did) {
		// Update ID and login datetime
		this.did = did;
		this.login = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
		// Publish login
		this.PublishDevice('"dte":"'+this.login+'","type":"login"').catch(err => console.error(err));
		// Publish log
		this.PublishLog(0,'<div class=warning>Login</div>');
		numdev++;
	}

	async SendToDevice(buff){
		// Envia pelo socket
		// this.usocket.write(buff);
		// Update counters
		this.bytout+=buff.length;
		this.msgout++;
		bytsout+=buff.length;
		msgsout++;
	}

	async GWMakeReply(packg,body){
		function si(ii,vv) {buff[ii]=Math.floor(vv / 256); buff[ii+1]=vv % 256;}
		// Fill parameters
		let buff = [];
		si(0,packg);
		si(2,body.length);
		buff.push(this.mpnum[0],this.mpnum[1],this.mpnum[2],this.mpnum[3],this.mpnum[4],this.mpnum[5]);
		this.msnum++;
		si(10,this.msnum);
		for (let x=0; x<body.length; x++) {buff[x+12]=body[x]}
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
		// Send packge
		this.SendToDevice(buff);
		// Publish log
		this.PublishLog(1,buff);
	}

	async GWTerminalRegistration(packg, serial) {
		function si(ii,vv) {body[ii]=Math.floor(vv / 256); body[ii+1]=vv % 256;}

		// Fill parameters
		let body = [];
		si(0,serial);
		body[2]=0;         //ok
		for (let x=3; x<19; x++) {body[x]= Math.floor(Math.random() * 90 + 33)}
		this.GWMakeReply(0x8100, body);
	}

	async GWParse(packg){
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
			let BodyLen = ih(3) & 0x1ff; // Body length
			this.mpnum = packg.slice(5,11); // Mobile Phone Number
			let MsgSerial = ih(11); // Message serial number
			// Testar os subpacotes

			// Verifica se é a primeira mensagem
			if (this.did==='') { this.InitDevice(hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10)); }
			// Atualiza contadores de msg
			this.bytin+=packg.length;
			this.msgin++;
			msgsin++;
			// Publish Log
			this.PublishLog(1,packg);
			// Processa a informação conforme o tipo de pacote
			let PkgType = ih(1);	// Packge Type
			switch (PkgType) {
				case 0x0002 : // Terminal heart beat
					break;

				case 0x0200 : // Location information reporting
					break;

				case 0x0704 : // Upload location data in batches
					break;

				case 0x0102 : // Terminal autentication
					break;

				case 0x0100 : // Terminal registration
					await GWTerminalRegistration(packg.slice(13,-2), MsgSerial);
					break;

			}
		}
	}

	async IncomingDevice(data){
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
					await this.GWParse(packg);
				
				} else { data = []; bytserr+=data.length; }
			} else { if (i==-1) {data = []; bytserr+=data.length;} else {data = data.slice(i+1); bytserr+=i; }}
		} 
	}

	async CloseDevice() {
		// Verifica se a conexão foi de um device valido
		if (this.did!=='') {
			// Get logout datetime
			this.logout = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
			// Grava log da conexão do device
			let th=this;
			db.getConnection(function (err, connection) {
				if (!err) {
					connection.query('INSERT INTO devlog (did,login,logout,bytin,bytout,msgin,msgout) VALUES (?,?,?,?,?,?,?)', [th.did, th.login, th.logout, th.bytin, th.bytout, th.msgin, th.msgout], function (err, result) { connection.release(); if (err) { err => console.error(err); } });
				}
			});
			// Publish logout
			this.PublishDevice('"dte":"'+this.logout+'","type":"logout","err":"'+this.err+'"').catch(err => console.error(err));
			// Publish log
			this.PublishLog(0,'<div class=warning>Logout: '+this.err+'</div>');
			numdev--;
		}	
	}
}

// Initialize new device connection
async function OpenDevice(socket) {
	const device=new Device(socket);
	
	socket.on('data',function(data){ device.IncomingDevice(data); });
	socket.on('close',async function(){ await device.CloseDevice(); delete device; });
	socket.on('end',function(){ device.err='0-Normal End'; device.usocket.destroy(); });
	socket.on('error',function(){ device.err = '1-Error'; device.usocket.destroy(); });
	// Close connection when inactive (5 min)
	socket.setTimeout(300000,function(){ device.err='2-Timeout'; device.usocket.destroy(); });
}

// Publish update status
async function PublishUpdate() {
	hub.publish('san:server_update','{"name":"'+process.title+'","version":"'+Version+'","ipport":"'+process.env.SrvIP+':'+process.env.SrvPort+'","uptime":"'+Math.floor(OS.uptime()/60)+'"}');
}

// Initialize global variables
var numdev=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0,bytserr=0;

// Update statistics ever 60s
setInterval(function(){
			// Get datetime
			let dte = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
			// Publish update status
			PublishUpdate();
			// Update database
			db.getConnection(function(err,connection){
				if (!err) {
					connection.query('INSERT INTO syslog (datlog,server,version,ipport,devices,msgsin,msgsout,bytsin,bytsout,bytserr) VALUES (?,?,?,?,?,?,?,?,?,?)',[dte, process.title, Version, process.env.SrvIP + ':' + process.env.SrvPort, numdev, msgsin, msgsout, bytsin, bytsout, bytserr],function (err, result) {connection.release(); if (err) err => console.error(err);});
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
const hub = new Redis({host:process.env.RD_host, port:process.env.RD_port, showFriendlyErrorStack: true });

// Updates server status as soon as it successfully connects
hub.on('connect', function () { PublishUpdate(); });

// Create and open MySQL connection
const mysql = require('mysql');
const db = mysql.createPool({host:process.env.DB_host, database:process.env.DB_name, user:process.env.DB_user, password:process.env.DB_pass, connectionLimit:10});

// Create and open server connection
const net = require('net');
const server = net.createServer(OpenDevice);
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