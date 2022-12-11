/********************************************************/
/*														*/
/* Para executar use: node gw-server.js &				*/
/*														*/
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
	// Envia log
	writelog(device.id,'S',cmd);
}
