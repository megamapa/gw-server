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

	// Publish device data
	async PublishDevice(str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('did:'+this.did, function (err, result) {
			if (result) {
				hub.publish('did:'+this.did,'{"did":"'+this.did+'",'+str+'}');
			};
		});
	}

	// Publish text in san terminal
	async PublishTxt(str) {
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('log:'+this.did, function (err, result) {
			if (result==0) {
				// Publish text
				GetDate().then(dte => {	hub.publish('san:monitor_update','<li><div class=datetime>'+dte+' : </div>'+str+'</li>'); });
			}
		});
	}

	async InitDevice(did) {
		// Update ID and login datetime
		this.did = did;
		this.login = new Date(new Date().getTime()).toISOString().replace(/T/,' ').replace(/\..+/, '');
		// Publish login
		this.PublishDevice('"datetime":"'+this.login+'","type":"login"').catch(err => console.error(err));
		// Publish login
		this.PublishTxt('<div class=warning>Connected</div>');
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

	// Publish log in SAN terminal
	async GWPublishLog(log) {
		function ih(ii) {return log[ii]*256+log[ii+1]}
		function hh(ii) {let h=log[ii].toString(16).toUpperCase(); return h.length==1?'0'+h:h;}
		function ch(ii) {return String.fromCharCode(log[ii]);}
		function ft(ss) {return '('+ss.substring(1,3)+') '+ss.substring(3,8)+'-'+ss.substring(8,12);}
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('log:'+this.did, async function (err, result) {
			if (result==0) {
				// Cria html para o header
				let bdy = '';
				let str = await GetDate();
				str = '<li><div class=datetime>'+str+' : </div>';
				str+='<div class="identification tooltip">'+hh(0)+'<span class=tooltiptext>Start identification</span></div><div class="packtype tooltip">'+hh(1)+hh(2)+'<span class="tooltiptext">Pack Type: ';
				// Cria html para o body
				let pkgtype = ih(1);
				switch (pkgtype) {
					case 0x0704 : // Upload location data in batches
						break;
										
					case 0x0102 : // Terminal autentication
						break;
					
					case 0x8001 : // Platform general response
						str+='Platform general response';
						break;

					case 0x0003 : // Terminal heartbeat
						str+='Terminal heartbeat';
						break;
					
					case 0x0100 : // Terminal registration
						str+='Terminal registration';
						bdy ='<div class="provincialid tooltip">'+hh(13)+hh(14)+'<span class=tooltiptext>Provincial ID: '+ih(13)+'</span></div>';
						bdy+='<div class="citycoutryid tooltip">'+hh(15)+hh(16)+'<span class=tooltiptext>City county ID: '+ih(15)+'</span></div>';
						bdy+='<div class="manufacturerid tooltip">'+hh(17)+hh(18)+hh(19)+hh(20)+hh(21)+'<span class=tooltiptext>Manufacturer ID: '+ch(17)+ch(18)+ch(19)+ch(20)+ch(21)+'</span></div>';

						bdy+='<div class="terminaltype tooltip">';
						for (let x=22; x<42; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Terminal type: ';
						for (let x=22; x<42; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						bdy+='<div class="terminalid tooltip">';
						for (let x=42; x<49; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Terminal ID: ';
						for (let x=42; x<49; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						bdy+='<div class="licenseplatecolor tooltip">'+hh(49)+'<span class=tooltiptext>License plate color</span></div>';

						bdy+='<div class="vehicleid tooltip">';
						let y=log.length-2;
						for (let x=50; x<y; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Vehicle ID: ';
						for (let x=50; x<y; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						break;

					case 0x8100 : // Terminal registration reply
						str+='Terminal registration reply';
						bdy ='<div class="serialreplay tooltip">'+hh(13)+hh(14)+'<span class=tooltiptext>Response serial: '+ih(13)+'</span></div>';
						bdy+='<div class="result tooltip">'+hh(15)+'<span class=tooltiptext>Result: ';
						switch (log[15]) {
							case 0 : 
								bdy+='0: Successful</span></div>';
								break;

							case 1 :
								bdy+='1: the vehicle has been registered</span></div>';
								break;

							case 2 :
								bdy+='2: the vehicle is not in the database</span></div>';
								break;

							case 3 :
								bdy+='3: the terminal has been registered</span></div>';
								break;

							case 4 :
								bdy+='4: the terminal is not in the database</span></div>';
								break;

							default:
								bdy+='Error invalid value</span></div>';
								break;
						}
						break;
					}

				let tn = hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10);
				str+='</span></div><div class="packlength tooltip">'+hh(3)+hh(4)+'<span class=tooltiptext>Body length: '+(ih(3) & 0x01ff)+'</span></div><div class="terminalnumber tooltip">'+tn+'<span class=tooltiptext>Terminal number :'+ft(tn)+'</span></div>';
				str+='<div class="messageserial tooltip">'+hh(11)+hh(12)+'<span class=tooltiptext>Serial msg: '+ih(11)+'</span></div>';
				str+=bdy+'<div class="checkdigit tooltip">'+hh(log.length-2)+'<span class=tooltiptext>Check digit</span></div><div class="identification tooltip">'+hh(log.length-1)+'<span class=tooltiptext>End identification</span></div></li>';
				// Publish data
				hub.publish('san:monitor_update',str);
			}
		});
	}

	async GWMakeReply(packg,body) {
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
		// Adciona indentificadores de inicio e fim
		buff.splice(0,0,0x7e);
		buff.splice(buff.length,0,0x7e);
		// Send packge
		this.SendToDevice(buff);
		// Publish log
		this.GWPublishLog(buff);
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

	async GWParse(packg) {
		function ih(ii) {return packg[ii]*256+packg[ii+1]}
		function hh(ii) {let h=packg[ii].toString(16).toUpperCase(); return h.length==1?'0'+h:h;}
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
			this.GWPublishLog(packg);
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
					await this.GWTerminalRegistration(packg.slice(13,-2), MsgSerial);
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
			this.PublishDevice('"datetime":"'+this.logout+'","type":"logout","err":"'+this.err+'"').catch(err => console.error(err));
			// Publish log
			this.PublishTxt('<div class=warning>Disconnected: '+this.err+'</div>');
			numdev--;
		}	
	}
}

// Initialize new device connection
async function OpenDevice(socket) {
	const device=new Device(socket);
	
	socket.on('data',function(data){ device.IncomingDevice(data); });
	socket.on('close',async function(){ await device.CloseDevice(); delete device; });
	socket.on('end',function(){ device.err='0-Normal end'; device.usocket.destroy(); });
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
setInterval(function() {
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