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
	// Desativar esta linha quando for para produção
	console.log('\033[1;30m'+GetDate()+': \033[0;0m'+log);
}

async function SendCmd(device,cmd){
	device.usocket.write(cmd);
	// Atualiza contadores
	device.bytout+=cmd.length;
	device.msgout++;
	bytsout+=cmd.length;
	msgsout++;
	// send log
	writelog(device.id,'S',cmd);
}















// Update statistics
var numdev=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0;
setInterval(function(){
			// Grava
			db.getConnection(function(err,connection){
				if (!err) {
					connection.query('INSERT INTO sysmtr (protocol,devices,msgsin,msgsout,bytsin,bytsout) VALUES (?,?,?,?,?,?)',['SG/HQ', numdev, msgsin, msgsout, bytsin, bytsout],function (err, result) {connection.release(); if (err) err => console.error(err);});
				}
				msgsin=0;
				msgsout=0;
				bytsin=0;
				bytsout=0;
			});
},60000);

// Read enviroment variables
const dotenv = require('dotenv');
dotenv.config("config.env");

// Create and open MySQL conection
const mysql = require('mysql');
const db = mysql.createPool({host:process.env.DB_host, database:process.env.DB_name, user:process.env.DB_user, password:process.env.DB_pass, connectionLimit:10});


// Show parameters and wating clients
const OS = require('os');
console.log('\033[1;30m'+GetDate()+': \033[0;31m================================');
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + process.title + ' ('+Version+')');
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + 'IP/Port : ' + process.env.SrvIP + ':' + process.env.SrvPort);
console.log('\033[1;30m'+GetDate()+': \033[0;31m' + 'Process: '+OS.cpus().length);
console.log('\033[1;30m'+GetDate()+': \033[0;31m================================\033[0;0m');