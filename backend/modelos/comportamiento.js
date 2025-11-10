eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		//["token","2762282"]
		
		if (arrays.length==2){

			var verifi=[],asesorX="",estime=0,verifi2=[],capital=0,dieron = 0,dieronCuentos = 0,nopagadosCuentos=0,pagasCuantos=0,pagas =0,nopagados=0,falta = 0,moment = require("moment"),ides = moment().format('YYYY-MM-DD');
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				} else if(decoded.t == "1" || decoded.t == "0" || decoded.t == "2" || decoded.t == "5" || decoded.t == "4"){
					
					function otravesmas(arraco,tempA1,tempA2,tempB1,tempB2,tempC1,tempC2){
						
						var moment = require("moment-timezone");
						var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
						
						redisClient.keys('cancelado_'+asesorX+"_"+dia,function(err3,reply3){
							if(reply3.length > 0){
							
								/*
								guardo los datos en array mediante kanban
								*/
								
								//se adiciona los descontar (descontar_couta.js 99 - 110)
								//,tempA1,tempA2,tempB1,tempB2,tempC1,tempC2,numMonto,numCant
								var litado = [];
								function iterar(ind,arrs){
									if(ind == arrs.length){
										arraco.push(litado,tempA1,tempA2,tempB1,tempB2,tempC1,tempC2);
										
										var moment = require("moment-timezone"),fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD');
										redisClient.get("tolete_"+asesorX+"_"+fechaq, function (errex, rewprelyx) {
											if(rewprelyx!==null){
												var infqo = JSON.parse(rewprelyx);
												arraco.push(infqo.c,infqo.n);
											}else{
												arraco.push(0,0);
											}
											resolve(arraco);
										});
										
									}else{
										redisClient.get(arrs[ind],function(err,reply) {
											if(reply!==null){
												litado.push(reply);
												ind++;
												iterar(ind,arrs);
											}else{
												ind++;
												iterar(ind,arrs);
											}
										});
									}
								}
								
								iterar(0,reply3);
							}else{
								arraco.push("[]",tempA1,tempA2,tempB1,tempB2,tempC1,tempC2);
								var moment = require("moment-timezone"),fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD');
								redisClient.get("tolete_"+asesorX+"_"+fechaq, function (errex, rewprelyx) {
									if(rewprelyx!==null){
										var infqo = JSON.parse(rewprelyx);
										arraco.push(infqo.c,infqo.n);
									}else{
										arraco.push(0,0);
									}
									resolve(arraco);
								});
							}
						});
					}
					
					function volver_a_procesar(dieron,falta,dieronCuentos,nopagados,nopagadosCuentos,verifi,capital,estime,busqueda,cuanBus,busquedaVola,cuanVol,busquedaFic,cuanFic,tempA1,tempA2,tempB1,tempB2,tempC1,tempC2){
						
						var realcantidad = 0,realmonto=0,realbono = 0, realmotocuanto=0;
						var moment = require("moment-timezone");
						var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
						
						function consultar_de(inds,arrwa){
							if(inds==arrwa.length){
								
								redisClient.keys('pendiente_'+asesorX+'_*',function(err3,reply3){
									if(reply3.length > 0){
										
										var litadoa = 0;
										function iterarx(zind,arrsz){
											if(zind == arrsz.length){
												otravesmas([dieron,falta,dieronCuentos,nopagados,nopagadosCuentos,realcantidad,realmonto,capital,estime,busqueda,cuanBus,busquedaVola,cuanVol,busquedaFic,cuanFic,reply3.length,litadoa],tempA1,tempA2,tempB1,tempB2,tempC1,tempC2);
											}else{
												redisClient.get(arrsz[zind],function(err,replyq) {
													if(replyq!==null){
														var ede = JSON.parse(replyq);
														litadoa = litadoa + parseInt(ede[2]);
														zind++;
														iterarx(zind,arrsz);
													}
												});
											}
										}
										
										iterarx(0,reply3);
									}else{
										otravesmas([dieron,falta,dieronCuentos,nopagados,nopagadosCuentos,realcantidad,realmonto,capital,estime,busqueda,cuanBus,busquedaVola,cuanVol,busquedaFic,cuanFic,0,0],tempA1,tempA2,tempB1,tempB2,tempC1,tempC2);
									}
								});
								
							}else{
								
								redisClient.keys('liquido_'+arrwa[inds]+'_'+dia+'_*',function(err,replyj) {
									if(replyj.length>0){
										
										if(replyj.length==1){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
										}else if(replyj.length==2){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
											var valorex = replyj[1].split("_"),
												montoTotalx = valorex[3],
												cuotaswx = valorex[4];
											
											if(montoTotalx>=cuotaswx){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswx);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalx) - parseInt(cuotaswx));
												dieron = parseInt(dieron) + parseInt(montoTotalx);
												dieronCuentos++;
											}
											
										}else if(replyj.length==3){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
											var valorex = replyj[1].split("_"),
												montoTotalx = valorex[3],
												cuotaswx = valorex[4];
											
											if(montoTotalx>=cuotaswx){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswx);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalx) - parseInt(cuotaswx));
												dieron = parseInt(dieron) + parseInt(montoTotalx);
												dieronCuentos++;
											}
											
											var valorexv = replyj[2].split("_"),
												montoTotalxv = valorexv[3],
												cuotaswxv = valorexv[4];
											
											if(montoTotalxv>=cuotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalxv) - parseInt(cuotaswxv));
												dieron = parseInt(dieron) + parseInt(montoTotalxv);
												dieronCuentos++;
											}
											
										}else if(replyj.length==4){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
											var valorex = replyj[1].split("_"),
												montoTotalx = valorex[3],
												cuotaswx = valorex[4];
											
											if(montoTotalx>=cuotaswx){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswx);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalx) - parseInt(cuotaswx));
												dieron = parseInt(dieron) + parseInt(montoTotalx);
												dieronCuentos++;
											}
											
											var valorexv = replyj[2].split("_"),
												montoTotalxv = valorexv[3],
												cuotaswxv = valorexv[4];
											
											if(montoTotalxv>=cuotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalxv) - parseInt(cuotaswxv));
												dieron = parseInt(dieron) + parseInt(montoTotalxv);
												dieronCuentos++;
											}
											
											var alorexv = replyj[3].split("_"),
												ontoTotalxv = alorexv[3],
												uotaswxv = alorexv[4];
											
											if(ontoTotalxv>=uotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(uotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(ontoTotalxv) - parseInt(uotaswxv));
												dieron = parseInt(dieron) + parseInt(ontoTotalxv);
												dieronCuentos++;
											}
											
										}else if(replyj.length==5){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
											var valorex = replyj[1].split("_"),
												montoTotalx = valorex[3],
												cuotaswx = valorex[4];
											
											if(montoTotalx>=cuotaswx){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswx);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalx) - parseInt(cuotaswx));
												dieron = parseInt(dieron) + parseInt(montoTotalx);
												dieronCuentos++;
											}
											
											var valorexv = replyj[2].split("_"),
												montoTotalxv = valorexv[3],
												cuotaswxv = valorexv[4];
											
											if(montoTotalxv>=cuotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalxv) - parseInt(cuotaswxv));
												dieron = parseInt(dieron) + parseInt(montoTotalxv);
												dieronCuentos++;
											}
											
											var alorexv = replyj[3].split("_"),
												ontoTotalxv = alorexv[3],
												uotaswxv = alorexv[4];
											
											if(ontoTotalxv>=uotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(uotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(ontoTotalxv) - parseInt(uotaswxv));
												dieron = parseInt(dieron) + parseInt(ontoTotalxv);
												dieronCuentos++;
											}
											
											var lorexv = replyj[4].split("_"),
												ntoTotalxv = lorexv[3],
												otaswxv = lorexv[4];
											
											if(ntoTotalxv>=otaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(otaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(ntoTotalxv) - parseInt(otaswxv));
												dieron = parseInt(dieron) + parseInt(ntoTotalxv);
												dieronCuentos++;
											}
											
										}else if(replyj.length==6){
											
											var valore = replyj[0].split("_"),
												montoTotal = valore[3],
												cuotasw = valore[4];
											
											if(montoTotal>=cuotasw){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotasw);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotal) - parseInt(cuotasw));
												dieron = parseInt(dieron) + parseInt(montoTotal);
												dieronCuentos++;
											}
											
											var valorex = replyj[1].split("_"),
												montoTotalx = valorex[3],
												cuotaswx = valorex[4];
											
											if(montoTotalx>=cuotaswx){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswx);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalx) - parseInt(cuotaswx));
												dieron = parseInt(dieron) + parseInt(montoTotalx);
												dieronCuentos++;
											}
											
											var valorexv = replyj[2].split("_"),
												montoTotalxv = valorexv[3],
												cuotaswxv = valorexv[4];
											
											if(montoTotalxv>=cuotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(cuotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(montoTotalxv) - parseInt(cuotaswxv));
												dieron = parseInt(dieron) + parseInt(montoTotalxv);
												dieronCuentos++;
											}
											
											var alorexv = replyj[3].split("_"),
												ontoTotalxv = alorexv[3],
												uotaswxv = alorexv[4];
											
											if(ontoTotalxv>=uotaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(uotaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(ontoTotalxv) - parseInt(uotaswxv));
												dieron = parseInt(dieron) + parseInt(ontoTotalxv);
												dieronCuentos++;
											}
											
											var lorexv = replyj[4].split("_"),
												ntoTotalxv = lorexv[3],
												otaswxv = lorexv[4];
											
											if(ntoTotalxv>=otaswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(otaswxv);
											}else{
												falta = parseInt(falta) + (parseInt(ntoTotalxv) - parseInt(otaswxv));
												dieron = parseInt(dieron) + parseInt(ntoTotalxv);
												dieronCuentos++;
											}
											
											var orexv = replyj[5].split("_"),
												toTotalxv = orexv[3],
												taswxv = orexv[4];
											
											if(toTotalxv>=taswxv){
												realcantidad++;
												realmonto = parseInt(realmonto) + parseInt(taswxv);
											}else{
												falta = parseInt(falta) + (parseInt(toTotalxv) - parseInt(taswxv));
												dieron = parseInt(dieron) + parseInt(toTotalxv);
												dieronCuentos++;
											}
										}
										inds++;
										consultar_de(inds,arrwa);
									}else{
										inds++;
										consultar_de(inds,arrwa);
									}
								});
							}
						}
						consultar_de(0,verifi);
					}
					
					redisClient.keys('registry_*_'+arrays[1]+'_*',function(err,repla){
						if(repla.length>0){
							
							//old
							//contrato_cuotas_19210513_2762282_5536509
							
							//new
							//"registry_19210513_contrato_1234567_2762282_4";
							asesorX = arrays[1];
							var capital = 0;
							
							var litado = [],busqueda=0,cuanBus=0,busquedaVola=0,cuanVol=0,busquedaFic=0,cuanFic=0;
							var tempA1 = 0,tempA2 = 0,tempB1 = 0, tempB2 = 0, tempC1 = 0,tempC2 = 0;

							function iterar(ind,arrs){
								if(ind == arrs.length){
									volver_a_procesar(dieron,falta,dieronCuentos,nopagados,nopagadosCuentos,verifi,capital,estime,busqueda,cuanBus,busquedaVola,cuanVol,busquedaFic,cuanFic,tempA1,tempA2,tempB1,tempB2,tempC1,tempC2);
								}else{
									var nues = arrs[ind].split("_");
									var cedul = nues[1];
									
									redisClient.get("betado_"+cedul,function(ersr,sreply) {
										
										if(sreply!==null){
											var ties = JSON.parse(sreply);
											var betado = ties[1];
											if(ties[1]=="1"){
												cuanBus++;
											}else if(ties[1]=="2"){
												cuanVol++;
											}else if(ties[1]=="3"){
												cuanFic++;
											}
										}else{
											var betado = 0;
										}
										
										/*const getDaysDiff = (start_date, end_date, date_format = 'YYYY-MM-DD') => {
										  const getDateAsArray = (date) => {
											return moment(date.split(/\D+/), date_format);
										  }
										  return getDateAsArray(end_date).diff(getDateAsArray(start_date), 'days') + 1;
										}*/
									
										redisClient.get(arrs[ind],function(err,reply) {
											
											if(reply!==null){
												var infex = JSON.parse(reply);
												var infe = infex[13];
												for(var s = 0; s <infe.length; s++){
													
													if(infe[s].fe==ides){
														
														estime = parseInt(estime) + parseInt(infe[s].cp);
														if(infe[s].pe!==0){
															dieron = parseInt(dieron) + parseInt(infe[s].pe);
															falta = parseInt(falta) +  parseInt(infe[s].cp) - parseInt(infe[s].pe);
															dieronCuentos++;
															verifi.push(cedul);
														}else if(infe[s].pe==0 && !infe[s].ct){
															nopagados = parseInt(nopagados) + parseInt(infe[s].cp);
															nopagadosCuentos++;
														}else if(infe[s].pe==0 && infe[s].ct){
															pagas = parseInt(pagas) + parseInt(infe[s].cp);
															pagasCuantos++;
															verifi.push(cedul);
														}
														
														if(infe[s].ct==false && infe[s].pe==0){ //si no pago nada (sumo los monto no pagados)
															tempA1 = tempA1 + parseInt(infe[s].cp);
															tempA2 = tempA2 + 1;
														}
														
														if(infe[s].ct==false && infe[s].pe!==0){ //no pagon completo pero pago un repele (sumos los repeles)
															tempB1 = tempB1 + parseInt(infe[s].pe);
															tempB2 = tempB2 + 1;
														}
														
														if(infe[s].ct==false && infe[s].pe!==0){ //si no pagaron (sumo la deuda de lo que debe el asesor) 
															tempC1 = tempC1 + parseInt(infe[s].cp) - parseInt(infe[s].pe);
															tempC2 = tempC2 + 1;
														}
													}else{
														/*var dif = getDaysDiff(infe[s].fe,ides);
														if(dif>1){
															if(infe[s].pe!==0){
																dieron = dieron + infe[s].pe;
																falta = falta +  parseInt(infe[s].cp) - infe[s].pe;
																dieronCuentos++;
																verifi.push(cedul);
															}else if(infe[s].pe==0 && !infe[s].ct){
																nopagados = nopagados + parseInt(infe[s].cp);
																console.log(nopagados);
																nopagadosCuentos++;
															}else if(infe[s].pe==0 && infe[s].ct){
																pagas = pagas + parseInt(infe[s].cp);
																pagasCuantos++;
																verifi.push(cedul);
															}
														}*/
														
													}

													if(infe[s].pe!==0){
														capital = capital + (parseInt(infe[s].cp) - infe[s].pe);
													}else if(infe[s].pe==0 && !infe[s].ct){
														capital = capital + parseInt(infe[s].cp);
													}
													
													if(betado==1){
														if(infe[s].pe!==0){
															busqueda = busqueda + (parseInt(infe[s].cp) - infe[s].pe);
														}else if(infe[s].pe==0 && !infe[s].ct){
															busqueda = busqueda + parseInt(infe[s].cp);
														}
													}
													
													if(betado==2){
														if(infe[s].pe!==0){
															busquedaVola = busquedaVola + (parseInt(infe[s].cp) - infe[s].pe);
														}else if(infe[s].pe==0 && !infe[s].ct){
															busquedaVola = busquedaVola + parseInt(infe[s].cp);
														}
													}
													
													if(betado==3){
														if(infe[s].pe!==0){
															busquedaFic = busquedaFic + (parseInt(infe[s].cp) - infe[s].pe);
														}else if(infe[s].pe==0 && !infe[s].ct){
															busquedaFic = busquedaFic + parseInt(infe[s].cp);
														}
													}
													
												}
												ind++;
												iterar(ind,arrs);
											}else{
												ind++;
												iterar(ind,arrs);
											}
										});
									});
								}
							}
							iterar(0,repla);

						}else{
							reject([false,"4"]);
						}
					});
				}else{
					reject([false,"2"]);
				}
			});
		}else{
			reject([false,"3"]);
		}
	});
};

module.exports = eje;
