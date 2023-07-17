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
		this.buff='';
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
				pub.publish('did:'+this.did,'{"did":"'+this.did+'",'+str+'}');
			};
		});
	}

	// Publish text in SAN terminal
	async PublishTxt(str) {
		// Verifica se a chave existe indicando que o cliente ainda está conectado
		hub.exists('log:'+this.did, function (err, result) {
			if (result==0) {
				// Publish text
				GetDate().then(dte => {	pub.publish('san:monitor_update','{"msg":"<li><div class=datetime>'+dte+' : </div>'+str+'</li>"}'); });
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
		this.PublishTxt('<div class=warning>Conectado</div>');
		numdev++;
	}

	async SendToDevice(buff){
		// Envia pelo socket
		this.usocket.write(buff);
		// Update counters
		this.bytout+=buff.length;
		this.msgout++;
		bytsout+=buff.length;
		msgsout++;
	}

	// Publish log in SAN terminal
	async GWPublishLog(log) {
		function ih(ii) {return log[ii]*256+log[ii+1]}
		function lh(ii) {return (log[ii]*256+log[ii+1])*65536+(log[ii+2]*256+log[ii+3])}
		function hh(ii) {let h=log[ii].toString(16).toUpperCase(); return h.length==1?'0'+h:h;}
		function ch(ii) {if (log[ii]<32) {return ' '} else {return String.fromCharCode(log[ii]);}}
		function ft(ss) {return '('+ss.substring(1,3)+') '+ss.substring(3,8)+'-'+ss.substring(8,12);}
		// Verifica se a chave existe indicando que o cliente ainda esta conectado
		hub.exists('log:'+this.did, async function (err, result) {
			if (result==0) {
				// Cria html para o header
				let bdy = '';
				let str = await GetDate();
				str = "<li><div class=datetime>"+str+" : </div>";
				str+= "<div class='identification tooltip'>"+hh(0)+"<span class=tooltiptext>Start identification</span></div><div class='packtype tooltip'>"+hh(1)+hh(2)+"<span class=tooltiptext>Pack Type: ";
				// Cria html para o body
				let b=log.length-2; // Tamanho do body
				let pkgtype = ih(1); // Tipo do pacote
				switch (pkgtype) {
					case 0x0200 : // Location information report
					
					console.log(log);
			
				
						let lat = lh(21); if (log[20] & 4) {lat=lat*-1;} lat=lat / 1000000;
						let lng = lh(25); if (log[20] & 8) {lng=lng*-1;} lng=lng / 1000000;
						str+='Location information report';
						bdy ="<div class='alarmsign tooltip'>"+hh(13)+hh(14)+hh(15)+hh(16)+'<span class=tooltiptext>Alarmes: </span></div>';
						bdy+="<div class='status tooltip'>"+hh(17)+hh(18)+hh(19)+hh(20)+'<span class=tooltiptext>Status<br>';

						bdy+='<br>ACC: ';
						if (log[20] & 1) {bdy+='on'} else {bdy+='on'}
						bdy+='<br>Posição: ';
						if (log[20] & 2) {bdy+='Válida'} else {bdy+='Inválida'}
						bdy+='<br>Latitude: ';
						if (log[20] & 4) {bdy+='Sul'} else {bdy+='Norte'}
						bdy+='<br>Longitude: ';
						if (log[20] & 8) {bdy+='Oeste'} else {bdy+='Leste'}
						bdy+='<br>Em movimento: ';
						if (log[20] & 16) {bdy+='Sim'} else {bdy+='Não'}
						bdy+='<br>Posição encriptada: ';
						if (log[20] & 32) {bdy+='Sim'} else {bdy+='Não'}
						bdy+='<br>';
						switch (log[19] & 3) {
							case 0x00 : 
								bdy+="Carga: Vazio";
								break;
							case 0x01 : 
								bdy+="Carga: Metade";
								break;
							case 0x03 : 
								bdy+="Carga: Cheio";
								break;
						}
						bdy+='<br>Combustível: ';
						if (log[19] & 4) {bdy+='Ligado'} else {bdy+='Desligado'}
						bdy+='<br>Elêtrica: ';
						if (log[19] & 8) {bdy+='Ligado'} else {bdy+='Desligado'}
						bdy+='<br>Portas: ';
						if (log[19] & 16) {bdy+='Trancadas'} else {bdy+='Destrancadas'}
						bdy+='<br>Portas abertas: ';
						let tmp = '';
						if (log[19] & 32) {tmp+='Porta 1,'}
						if (log[19] & 64) {tmp+='Porta 2,'}
						if (log[19] & 128) {tmp+='Porta 3,'}
						if (log[18] & 1) {tmp+='Porta 4,'}
						if (log[18] & 2) {tmp+='Porta 5,'}
						if (tmp=='') {bdy+='Nenhuma'} else {bdy+=tmp.substring(0,tmp.length-1);}

						bdy+='<br>Constelações: ';
						tmp = '';
						if (log[18] & 4) {tmp+='GPS,'}
						if (log[18] & 8) {tmp+='BEIDOU,'}
						if (log[18] & 16) {tmp+='GLONASS,'}
						if (log[18] & 32) {tmp+='GALILEO,'}
						if (tmp=='') {bdy+='Nenhuma'} else {bdy+=tmp.substring(0,tmp.length-1);}

						bdy+="</span></div><div class='latitude tooltip'>"+hh(21)+hh(22)+hh(23)+hh(24)+'<span class=tooltiptext>Latitude: '+lat+'</span></div>';
						bdy+="<div class='longitude tooltip'>"+hh(25)+hh(26)+hh(27)+hh(28)+'<span class=tooltiptext>Longitude: '+lng+'</span></div>';
						bdy+="<div class='elevation tooltip'>"+hh(29)+hh(30)+'<span class=tooltiptext>Altitude: '+ih(29)+'m</span></div>';
						bdy+="<div class='speed tooltip'>"+hh(31)+hh(32)+'<span class=tooltiptext>Speed: '+ih(31)+'km/h</span></div>';
						bdy+="<div class='direction tooltip'>"+hh(33)+hh(34)+'<span class=tooltiptext>Direction: '+ih(33)+'o</span></div>';
						bdy+="<div class='localtime tooltip'>"+hh(35)+hh(36)+hh(37)+hh(38)+hh(39)+hh(40)+'<span class=tooltiptext>Local time: '+hh(35)+'-'+hh(36)+'-'+hh(37)+' '+hh(38)+':'+hh(39)+':'+hh(40)+'</span></div>';

						let y = 41;
						while (y<b) {
							switch (log[y]) {
								case 0x01 : 
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+hh(y+4)+hh(y+5)+'<span class=tooltiptext>Mileage: '+lh(y+2)+'</span></div>';
									break;
								case 0x02 : 
									bdy+="<div class='oilquantity tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+'<span class=tooltiptext>Oil quantity: '+ih(y+2)+'</span></div>';
									break;
								case 0x03 : 
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+'<span class=tooltiptext>Drive record: '+ih(y+2)+'</span></div>';
									break;
								case 0x14 : 
									bdy+="<div class='oilquantity tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+hh(y+4)+hh(y+5)+'<span class=tooltiptext>Video alarm: '+lh(y+2)+'</span></div>';
									break;
								case 0x15 : 
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+hh(y+4)+hh(y+5)+'<span class=tooltiptext>Video sign loss alarm status: '+lh(y+2)+'</span></div>';
									break;
								case 0x16 : 
									bdy+="<div class='oilquantity tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+hh(y+4)+hh(y+5)+'<span class=tooltiptext>Video sign blocking alarm status: '+lh(y+2)+'</span></div>';
									break;
								case 0x17 : 
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+'<span class=tooltiptext>Memory failure alarm status: '+ih(y+2)+'</span></div>';
									break;
								case 0x18 : 
									bdy+="<div class='oilquantity tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+'<span class=tooltiptext>Abnormal driving behavior alarm: '+ih(y+2)+'</span></div>';
									break;
								case 0x2b : 
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+hh(y+3)+hh(y+4)+hh(y+5)+'<span class=tooltiptext>Power line voltage/capacity: '+ih(y+2)+'V '+ih(y+4)+'%</span></div>';
									break;
								case 0x30 :
									bdy+="<div class='oilquantity tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+'<span class=tooltiptext>Wireless signal intensity: '+log[y+2]+'</span></div>';
									break;
								case 0x31 :
									bdy+="<div class='mileage tooltip'>"+hh(y)+hh(y+1)+hh(y+2)+'<span class=tooltiptext>Number of satellites: '+log[y+2]+'</span></div>';
									break;
								default:
									bdy+="<div class='warning tooltip'>"+hh(y)+hh(y+1);
									for (let x=y;x<y+log[y+1];x++) {bdy+=hh(x)}
									bdy+='<span class=tooltiptext>Unknow</span></div>';
							}
							y+=log[y+1]+2;
						}
						
						break;
										
					case 0x0704 : // Upload location data in batches
						str+='Upload location data';
						bdy ="<div class='numberofitens tooltip'>"+hh(13)+hh(14)+'<span class=tooltiptext>Number of itens: '+ih(13)+'</span></div>';
						bdy+="<div class='result tooltip'>"+hh(15)+'<span class=tooltiptext>Location type: ';
						switch (log[15]) {
							case 0 : 
								bdy+='0: Normal position batch report</span></div>';
								break;
							case 1 : 
								bdy+='1: Blind area supplement report</span></div>';
								break;
						}

						


						y = 16;     // Inicio do buffer
						let c = ih(13); // Quantidade de blocos a serem processados
						while (c > 0) {
							let b = ih(y); // Tamando do bloco
							bdy+="<div class='packlength tooltip'>"+hh(y)+hh(y+1)+"<span class=tooltiptext>Tamanho do pack: "+ih(y)+"</span></div>";
							y+=2;

							bdy+="<div class='authcode tooltip'>";
							for (let x=y; x<b; x++) {bdy+=hh(x)}
							bdy+='<span class=tooltiptext>Authentication code: </span></div>';

							c--;
						}


						break;
										
					case 0x8001 : // Platform general response
						str+='Platform general response';
						bdy ="<div class='serialreplay tooltip'>"+hh(13)+hh(14)+'<span class=tooltiptext>Response serial: '+ih(13)+'</span></div>';
						bdy+="<div class='terminalmsg tooltip'>"+hh(15)+hh(16)+'<span class=tooltiptext>Response message: '+ih(15)+'</span></div>';
						bdy+="<div class='result tooltip'>"+hh(17)+"<span class=tooltiptext>Result: ";
						switch (log[17]) {
							case 0 : 
								bdy+='0: Successful</span></div>';
								break;
							case 1 : 
								bdy+='1: Failure</span></div>';
								break;
							case 2 : 
								bdy+='2: The message is incorrect</span></div>';
								break;
							case 3 : 
								bdy+='3: Not suported</span></div>';
								break;
							case 4 : 
								bdy+='4: Call the police</span></div>';
								break;
							default:
								bdy+='Error invalid value</span></div>';
						}
						break;

					case 0x0002 : // Terminal heartbeat
						str+='Terminal heartbeat';
						break;
					
					case 0x0102 : // Terminal autentication
						str+='Terminal autentication';
						bdy ="<div class='authcode tooltip'>";
						for (let x=13; x<b; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Authentication code: ';
						for (let x=13; x<b; x++) {bdy+=hh(x)}
						bdy+='</span></div>';
						break;
					
					case 0x0100 : // Terminal registration
						str+='Terminal registration';
						bdy ="<div class='provincialid tooltip'>"+hh(13)+hh(14)+'<span class=tooltiptext>Province ID: '+ih(13)+'</span></div>';
						bdy+="<div class='citycoutryid tooltip'>"+hh(15)+hh(16)+'<span class=tooltiptext>City county ID: '+ih(15)+'</span></div>';
						bdy+="<div class='manufacturerid tooltip'>"+hh(17)+hh(18)+hh(19)+hh(20)+hh(21)+'<span class=tooltiptext>Manufacturer ID: '+ch(17)+ch(18)+ch(19)+ch(20)+ch(21)+'</span></div>';

						bdy+="<div class='terminaltype tooltip'>";
						for (let x=22; x<42; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Terminal type: ';
						for (let x=22; x<42; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						bdy+="<div class='terminalid tooltip'>";
						for (let x=42; x<49; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Terminal ID: ';
						for (let x=42; x<49; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						bdy+="<div class='licenseplatecolor tooltip'>"+hh(49)+'<span class=tooltiptext>License plate color</span></div>';

						bdy+="<div class='vehicleid tooltip'>";
						for (let x=50; x<b; x++) {bdy+=hh(x)}
						bdy+='<span class=tooltiptext>Vehicle ID: ';
						for (let x=50; x<b; x++) {bdy+=ch(x)}
						bdy+='</span></div>';

						break;

					case 0x8100 : // Terminal registration reply
						str+='Terminal registration reply';
						bdy ="<div class='serialreplay tooltip'>"+hh(13)+hh(14)+'<span class=tooltiptext>Response serial: '+ih(13)+'</span></div>';
						bdy+="<div class='result tooltip'>"+hh(15)+'<span class=tooltiptext>Result: ';
						switch (log[15]) {
							case 0 : 
								bdy+='0: Successful</span></div>';

								bdy+="<div class='authcode tooltip'>";
								for (let x=16; x<b; x++) {bdy+=hh(x)}
								bdy+='<span class=tooltiptext>Authentication code: ';
								for (let x=16; x<b; x++) {bdy+=hh(x)}
								bdy+='</span></div>';

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

					case 0x8104 : // Check terminal parameter
						str+='Check terminal parameter';
						break;
						
					case 0x0003 : // Terminal desconnection
						str+='Terminal desconnection';
						break;
				}

				let tn = hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10);
				str+="</span></div><div class='packlength tooltip'>"+hh(3)+hh(4)+"<span class=tooltiptext>Body length: "+(ih(3) & 0x03ff)+"<br>Sub-package: "+(ih(3) & 0x2000)+"</span></div><div class='terminalnumber tooltip'>"+tn+"<span class=tooltiptext>Terminal number :<br>"+ft(tn)+"</span></div>";
				str+="<div class='messageserial tooltip'>"+hh(11)+hh(12)+"<span class=tooltiptext>Serial msg: "+ih(11)+"</span></div>";
				str+=bdy+"<div class='checkdigit tooltip'>"+hh(log.length-2)+"<span class=tooltiptext>Check digit</span></div><div class='identification tooltip'>"+hh(log.length-1)+"<span class=tooltiptext>End identification</span></div></li>";
				// Publica o log no SAN
				pub.publish('san:monitor_update','{"msg":"'+str+'"}');
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
		let y=buff.indexOf(0x7d);
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
		this.SendToDevice(new Uint8Array(buff));
		// Publish log
		this.GWPublishLog(buff);
	}

	async GWUploadLocation(packg) {
		// Fill parameters
		let body = [packg[11],packg[12]]; // Serial number
		body[2]=2; body[3]=0;   // 0x0200
		body[4]=0;              // ok
		this.GWMakeReply(0x8001, body);
	}

	async GWLocationInformation(packg) {
		// Fill parameters
		let body = [packg[11],packg[12]]; // Serial number
		body[2]=2; body[3]=0;   // 0x0200
		body[4]=0;              // ok
		this.GWMakeReply(0x8001, body);
	}

	async GWHeartbeat(packg) {
		// Fill parameters
		let body = [packg[11],packg[12]]; // Serial number
		body[2]=0; body[3]=2;  // 0x0002
		body[4]=0;             // ok
		this.GWMakeReply(0x8001, body);
	}

	async GWTerminalAutentication(packg) {
		// Fill parameters
		let body = [packg[11],packg[12]]; // Serial number
		body[2]=1; body[3]=2;  // 0x0102 
		body[4]=0;             // ok
		this.GWMakeReply(0x8001, body);
	}

	async GWTerminalRegistration(packg) {
		// Fill parameters
		let body = [packg[11],packg[12]]; // Serial Number
		body[2]=0;         				  //ok
		for (let x=3; x<19; x++) {body[x]= Math.floor(Math.random() * 90 + 48)} // Autentication code
		this.GWMakeReply(0x8100, body);
	}

	async GWParse(packg) {
		function ih(ii) {return packg[ii]*256+packg[ii+1]}
		function hh(ii) {let h=packg[ii].toString(16).toUpperCase(); return h.length==1?'0'+h:h;}
		// Faz o unescape do 0x7d
		let y=packg.indexOf(0x7d,1);
		while (y!=-1) {
			if (packg[y+1]==0x02) {packg[y]=0x7e;}
			packg.splice(y+1,1);
			// Next
			y=packg.indexOf(0x7d,y+1);
		}
		// Calcula o check digit
		let checkdigit = packg[1];
		for (let i = 2; i < packg.length-2; i++) { checkdigit ^= packg[i]; }
		// Verifica o check digit
		if (checkdigit == packg[packg.length-2]) {
			// Recolhe os parâmetros
			this.mpnum = packg.slice(5,11); // Mobile Phone Number
			// Testar os subpacotes

			// Verifica se é a primeira mensagem
			if (this.did==='') { this.InitDevice(hh(5)+hh(6)+hh(7)+hh(8)+hh(9)+hh(10)); }
			// Publica o Log no SAN
			this.GWPublishLog(packg);
			// Processa a informação conforme o tipo de pacote
			let PkgType = ih(1);	// Packge Type
			switch (PkgType) {
				case 0x0002 : // Terminal heart beat
					this.GWHeartbeat(packg);
					break;

				case 0x0200 : // Location information reporting
					this.GWLocationInformation(packg);
					break;

				case 0x0704 : // Upload location data in batches
					this.GWUploadLocation(packg);
					break;

				case 0x0102 : // Terminal autentication
					this.GWTerminalAutentication(packg);
					this.GWMakeReply(0x8104, '');
					break;

				case 0x0100 : // Terminal registration
					this.GWTerminalRegistration(packg);
					break;

			}
			// Atualiza contadores de msg
			this.bytin+=packg.length;
			this.msgin++;
			msgsin++;	
		}
	}

	async IncomingDevice(data) {
		// Adciona os dados recebidos ao buffer
		this.buff+=data;
		// Começa a tratar o buffer
		console.log(data);
		console.log(this.buff.toString());
		while (true) {
			// Verifica se o pack comeca com 0x7e
			if (this.buff[0]==0x7e) {
				// Procura o final do pack
				let i = this.buff.indexOf(0x7e,1);
				// Se nao achou sai
				if (i==-1) {break;}
				// Extrai o pack do buffer
				let ln = this.buff.substring(0, i);
				this.buff=this.buff.substring(i+1);
				// Atualiza contador
				bytsin+=ln.length;
				// Decodifica a linha
				await this.GWParse(Array.from(ln));
			} else {bytserr+=this.buff.length; this.buff='';}
			// Se o buffer estiver vazio sai
			if (this.buff=='') {break;}
			// Se o buffer estiver cheio zera e sai
			if (this.buff.length > 4000) {bytserr+=this.buff.length; this.buff=''; break;}
		}
	} 

	async CloseDevice() {
		// Verifica se a conexão foi de um device válido
		if (this.did!=='') {
			let th=this;
			// Pega data e hora de logout
			GetDate().then(dte => {
				this.logout = dte;
				// Grava log da conexão do device
				db.getConnection(function (err, connection) {
					if (!err) {
						connection.query('INSERT INTO devlog (did,login,logout,bytin,bytout,msgin,msgout) VALUES (?,?,?,?,?,?,?)', [th.did, th.login, th.logout, th.bytin, th.bytout, th.msgin, th.msgout], function (err, result) { connection.release(); if (err) { err => console.error(err); } });
					}
				});
				// Publish logout
				this.PublishDevice('"datetime":"'+this.logout+'","type":"logout","err":"'+this.err+'"').catch(err => console.error(err));
			});	
			// Publish log
			this.PublishTxt('<div class=warning>Desconectado: '+this.err+'</div>');
			numdev--;
		}	
	}
}

// Initialize new device connection
async function OpenDevice(socket) {
	const device=new Device(socket);
	
	socket.on('data',function(data){ device.IncomingDevice(data); });
	socket.on('close',async function(){ await device.CloseDevice(); delete device; });
	socket.on('end',function(){ device.err='0-Normal'; device.usocket.destroy(); });
	socket.on('error',function(){ device.err = '1-Erro'; device.usocket.destroy(); });
	// Close connection when inactive (5 min)
	socket.setTimeout(300000,function(){ device.err='2-Timeout'; device.usocket.destroy(); });
}

// Publish update status
async function PublishUpdate() {
	GetDate().then(dte => {
		let uptime = Date.parse(dte) - starttime;
		pub.publish('san:server_update','{"name":"'+process.title+'","version":"'+Version+'","ipport":"'+process.env.SrvIP+':'+process.env.SrvPort+'","uptime":"'+Math.floor(uptime/60000)+'"}');
	});
}

/****************************************************************************************************/
/* Read enviroment variables																		*/
/****************************************************************************************************/
const dotenv = require('dotenv');
dotenv.config();

/****************************************************************************************************/
/* Cria e abre uma conexão do Redis																	*/
/****************************************************************************************************/
const Redis = require('ioredis');
const hub = new Redis({host:process.env.RD_host, port:process.env.RD_port, password:process.env.RD_pass});
const pub = new Redis({host:process.env.RD_host, port:process.env.RD_port, password:process.env.RD_pass});

// Envia o estatus para o SAN assim que a conexão for estabelicida 
pub.on('connect', function () { GetDate().then(dte => { // Imprime no terminal 
														console.log('\033[36m'+dte+' \033[32mHUB conectado.\033[0;0m');
														console.log('\033[36m'+dte+' \033[32mAguardando clientes...\033[0;0m');
														// Salva data e hora de início
														starttime = Date.parse(dte);
														// Publica no SAN
														PublishUpdate();
													   });
							  }
);

/****************************************************************************************************/
/* Cria e abre uma conexão MySQL																	*/
/****************************************************************************************************/
const mysql = require('mysql');
const db = mysql.createPool({host:process.env.DB_host, database:process.env.DB_name, user:process.env.DB_user, password:process.env.DB_pass, connectionLimit:10});

// Initialize global variables
var starttime=0,numdev=0,msgsin=0,msgsout=0,bytsin=0,bytsout=0,bytserr=0;

// Atualiza estatísticas a cada 60s
setInterval(function() {
			// Publica estatus do serviço
			PublishUpdate();
			// Pega data e hora
			GetDate().then(dte => {
				// Grava contadores para estatísticas
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
			});
},60000);

/****************************************************************************************************/
/* Cria uma conexão e fica ouvindo o IP/Porta														*/
/****************************************************************************************************/
const net = require('net');
const server = net.createServer(OpenDevice);
server.listen(process.env.SrvPort, process.env.SrvIP);

// Imprime o status no terminal assim que estiver pronto 
server.on('listening', function () { GetDate().then(dte => { console.log('\033[36m'+dte+' \033[32mServidor pronto.\033[0;0m'); }); });

/****************************************************************************************************/
/* Mostra parâmetros no terminal e fica aguardado clientes											*/
/****************************************************************************************************/
const OS = require('os');
GetDate().then(dte => {
	// Mostra parâmetros no terminal
	console.log('\033[36m'+dte+' \033[37m================================');
	console.log('\033[36m'+dte+' \033[37mAPP : ' + process.title + ' ('+Version+')');
	console.log('\033[36m'+dte+' \033[37mIP/Port : ' + process.env.SrvIP + ':' + process.env.SrvPort);
	console.log('\033[36m'+dte+' \033[37mCPUs: '+ OS.cpus().length);
	console.log('\033[36m'+dte+' \033[37m================================\033[0;0m');
});