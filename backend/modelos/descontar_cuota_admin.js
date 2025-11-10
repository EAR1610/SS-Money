eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
			Recibe varios datos no me acuerdo cuantos 
		*/
		
		if (arrays.length==6){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1" || decoded.t=="2" || decoded.t=="5"){

					var moment = require("moment-timezone");
					
					/*listo los contratos*/
					
					redisClient.keys("contrato_"+arrays[1]+"_*_"+arrays[5]+"_"+arrays[3],function(lerr,rleply) {

						if(rleply.length>0) {

							var ges = rleply[0].split("_");
							var ines = ges[2];

							redisClient.keys("contrato_cuotas_" + arrays[1] + "_" + ines + "_*", function (err, reply) {
								
								if (reply.length > 1) {
									
									redisClient.get(rleply[0], function (ersr, reeply) {
										var uno = JSON.parse(reeply),
											couta = uno[8].replace(".",""),
											coutaOri = couta.replace(".","");
										
										redisClient.get(reply[0], function (ersr, reeplys) {
											var unos = JSON.parse(reeplys),
												couta1 = unos[0].cantidad_cuota_paga;
												
												if(coutaOri == couta1){
													var origena = reply[0];	
												}else{
													var origena = reply[1];
												}
												
												redisClient.get(origena, function (errx, replyx) {

													var lisa = JSON.parse(replyx),
														monto = parseInt(arrays[2]),
														monto2 = monto,
														adelantos = 0,
														complete = 0,
														finiquite = 0,
														tota = 0;

													for (var w = 0; w < lisa.length; w++) {

														if (lisa[w].completa || lisa[w].pendiente > 0) {
															finiquite++;
														}

														adelantos = adelantos + lisa[w].pendiente;
														if (lisa[w].pendiente > 0) {
															tota = tota + (parseInt(lisa[w].cantidad_cuota_paga) - parseInt(lisa[w].pendiente));
														}

														if (!lisa[w].completa) {
															complete++;
														}

														var canti = parseInt(lisa[w].cantidad_cuota_paga);

														if (!lisa[w].completa) {

															if (monto > canti && lisa[w].pendiente == 0) {
																lisa[w].completa = true;
																monto = monto - parseInt(lisa[w].cantidad_cuota_paga);
															} else if (monto == canti && lisa[w].pendiente == 0) {
																lisa[w].completa = true;
																monto = 0;
															} else if (lisa[w].pendiente == 0 && monto > 0) {
																lisa[w].completa = false;
																lisa[w].pendiente = monto;
																monto = 0;
															}

														}

													}
													
													var moment = require("moment-timezone");
													var fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD');
													redisClient.set("liquido_"+arrays[1]+"_"+fechaq+"_"+arrays[2]+"_"+lisa[lisa.length-1].cantidad_cuota_paga,"true", function (errex, rewprlyx) { console.log("monto firme"+arrays[2]); });

													var moment = require("moment-timezone"),fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD_hh_mm_ss'),asesorw = arrays[4];
													redisClient.set("monto_" + asesorw + "_"+arrays[2]+"_"+fechaq,"true", function (errex, rewprlyx) { console.log("sumado "+arrays[2]); });

													if (finiquite == lisa.length && adelantos > 0) {

														redisClient.get("exten_" + origena, function (errx, rewplyx) {
															if (rewplyx !== null) {
																var info = JSON.parse(rewplyx);
																if (info[0] > 0) {

																	if (monto > 0) {
																		if (info[0] > monto) {
																			info[0] = info[0] - monto;
																		} else {
																			monto = info[0];
																			info[0] = 0;
																		}

																		var moment = require("moment-timezone");
																		info[1].push({
																			"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																			"monto": monto
																		});

																		redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																			//guarde bien el cierre

																			redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																				redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																					
																					var nuew = origena.split("_");
																					redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																						var infes = JSON.parse(repslyx), nuva =[];
																						for(var j = 0; j < infes.length; j++){
																							if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																								nuva.push(infes[j]);
																							}
																						}
																						redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																							resolve([true, true]);
																						});
																					});
																					
																				});
																			});

																		});
																	} else {
																		resolve([true, true]);
																	}
																} else if (info[0] == 0) {
																	//ya page todos. debo renombrar el objero
																	redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																		redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																			
																			var nuew = origena.split("_");
																			redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																				var infes = JSON.parse(repslyx), nuva =[];
																				for(var j = 0; j < infes.length; j++){
																					if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																						nuva.push(infes[j]);
																					}
																				}
																				redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																					resolve([true, true]);
																				});
																			});
																			
																		});
																	});
																}
															} else {
																if (tota == monto) {
																	//no tengo una extencion de cuota pero pago de insofacto
																	var moment = require("moment-timezone");
																	var info = [0, [{
																		"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																		"monto": monto
																	}]];

																
																	redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																		//guarde bien el cierre

																		redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																			redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																				
																				var nuew = origena.split("_");
																				redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																					var infes = JSON.parse(repslyx), nuva =[];
																					for(var j = 0; j < infes.length; j++){
																						if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																							nuva.push(infes[j]);
																						}
																					}
																					redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																						resolve([true, true]);
																					});
																				});
																				
																			});
																		});

																	});
																} else if (tota > monto) {
																	//no tengo una extencion de cuota pero abono un monto de cuota
																	if (monto > 0) {
																		var resto = tota - monto;
																		var moment = require("moment-timezone");
																		var info = [resto, [{
																			"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																			"monto": monto
																		}]];

																		redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																			//guarde en pedazos

																			redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																				redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																					
																					var nuew = origena.split("_");
																					redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																						var infes = JSON.parse(repslyx), nuva =[];
																						for(var j = 0; j < infes.length; j++){
																							if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																								nuva.push(infes[j]);
																							}
																						}
																						redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																							resolve([true, true]);
																						});
																					});
																					
																				});
																			});

																		});
																	} else {
																		resolve([true, true]);
																	}
																} else if (tota < monto) {
																	//no tengo una extencion de cuota pero puedo pagar todoq y lo hare
																	if (monto > 0) {
																		var moment = require("moment-timezone");
																		var info = [0, [{
																			"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																			"monto": tota
																		}]];

																		redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																			//guarde en bie

																			resolve([true, true]);

																		});
																	} else {
																		resolve([true, true]);
																	}
																}

															}
														});

													} else {

														if (finiquite == lisa.length && adelantos == 0) {
															redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																
																var nuew = origena.split("_");
																redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																	var infes = JSON.parse(repslyx), nuva =[];
																	for(var j = 0; j < infes.length; j++){
																		if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																			nuva.push(infes[j]);
																		}
																	}
																	redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																		resolve([true, lisa, 0, monto2, complete, tota, []]);
																	});
																});
																
															});
														} else {
															redisClient.set(origena, JSON.stringify(lisa), function (errx, replyx) {
																resolve([true, lisa, adelantos, monto2, complete, tota, []]);
															});
														}
													}

												});
												
										});
										
									});

								}else if (reply.length > 0) {
									
									var origena = reply[0];
									redisClient.get(reply[0], function (errx, replyx) {

										var lisa = JSON.parse(replyx),
											monto = parseInt(arrays[2]),
											monto2 = monto,
											adelantos = 0,
											complete = 0,
											finiquite = 0,
											tota = 0;

										for (var w = 0; w < lisa.length; w++) {

											if (lisa[w].completa || lisa[w].pendiente > 0) {
												finiquite++;
											}

											adelantos = adelantos + lisa[w].pendiente;
											if (lisa[w].pendiente > 0) {
												tota = tota + (parseInt(lisa[w].cantidad_cuota_paga) - parseInt(lisa[w].pendiente));
											}

											if (!lisa[w].completa) {
												complete++;
											}

											var canti = parseInt(lisa[w].cantidad_cuota_paga);

											if (!lisa[w].completa) {

												if (monto > canti && lisa[w].pendiente == 0) {
													lisa[w].completa = true;
													monto = monto - parseInt(lisa[w].cantidad_cuota_paga);
												} else if (monto == canti && lisa[w].pendiente == 0) {
													lisa[w].completa = true;
													monto = 0;
												} else if (lisa[w].pendiente == 0 && monto > 0) {
													lisa[w].completa = false;
													lisa[w].pendiente = monto;
													monto = 0;
												}

											}

										}
										
										var moment = require("moment-timezone");
										var fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD');
										redisClient.set("liquido_"+arrays[1]+"_"+fechaq+"_"+arrays[2]+"_"+lisa[lisa.length-1].cantidad_cuota_paga,"true", function (errex, rewprlyx) { console.log("monto firme"+arrays[2]); });

										var fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD_hh_mm_ss'),asesorw = arrays[4];
										redisClient.set("monto_" + asesorw + "_"+arrays[2]+"_"+fechaq,"true", function (errex, rewprlyx) { console.log("sumado "+arrays[2]); });


										if (finiquite == lisa.length && adelantos > 0) {

											redisClient.get("exten_" + origena, function (errx, rewplyx) {
												if (rewplyx !== null) {
													var info = JSON.parse(rewplyx);
													if (info[0] > 0) {

														if (monto > 0) {
															if (info[0] > monto) {
																info[0] = info[0] - monto;
															} else {
																monto = info[0];
																info[0] = 0;
															}

															var moment = require("moment-timezone");
															info[1].push({
																"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																"monto": monto
															});

															
															redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																//guarde bien el cierre

																redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																	redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																		
																		var nuew = origena.split("_");
																		redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																			var infes = JSON.parse(repslyx), nuva =[];
																			for(var j = 0; j < infes.length; j++){
																				if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																					nuva.push(infes[j]);
																				}
																			}
																			redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																				resolve([true, true]);
																			});
																		});
																		
																	});
																});

															});
														} else {
															resolve([true, true]);
														}
													} else if (info[0] == 0) {
														//ya page todos. debo renombrar el objero
														redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
															redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																
																var nuew = origena.split("_");
																redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																	var infes = JSON.parse(repslyx), nuva =[];
																	for(var j = 0; j < infes.length; j++){
																		if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																			nuva.push(infes[j]);
																		}
																	}
																	redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																		resolve([true, true]);
																	});
																});
																
															});
														});
													}
												} else {
													if (tota == monto) {
														//no tengo una extencion de cuota pero pago de insofacto
														var moment = require("moment-timezone");
														var info = [0, [{
															"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
															"monto": monto
														}]];

														redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
															//guarde bien el cierre

															redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																	
																	var nuew = origena.split("_");
																	redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																		var infes = JSON.parse(repslyx), nuva =[];
																		for(var j = 0; j < infes.length; j++){
																			if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																				nuva.push(infes[j]);
																			}
																		}
																		redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																			resolve([true, true]);
																		});
																	});
																	
																});
															});

														});
													} else if (tota > monto) {
														//no tengo una extencion de cuota pero abono un monto de cuota
														if (monto > 0) {
															var resto = tota - monto;
															var moment = require("moment-timezone");
															var info = [resto, [{
																"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																"monto": monto
															}]];

															redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																//guarde en pedazos

																redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
																	redisClient.rename("exten_" + origena, "old_exten_" + origena, function (errx, replyx) {
																		
																		var nuew = origena.split("_");
																		redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
																			var infes = JSON.parse(repslyx), nuva =[];
																			for(var j = 0; j < infes.length; j++){
																				if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																					nuva.push(infes[j]);
																				}
																			}
																			redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
																				resolve([true, true]);
																			});
																		});
																		
																	});
																});

															});
														} else {
															resolve([true, true]);
														}
													} else if (tota < monto) {
														//no tengo una extencion de cuota pero puedo pagar todoq y lo hare
														if (monto > 0) {
															var moment = require("moment-timezone");
															var info = [0, [{
																"fecha": moment().tz("America/Guatemala").format('YYYY-MM-DD'),
																"monto": tota
															}]];

															redisClient.set("exten_" + origena, JSON.stringify(info), function (errx, rewplyx) {
																//guarde en bie

																resolve([true, true]);

															});
														} else {
															resolve([true, true]);
														}
													}

												}
											});

										} else {

											
											if (finiquite == lisa.length && adelantos == 0) {
												redisClient.rename(origena, "old_" + origena, function (errx, replyx) {
													
													var nuew = origena.split("_");
													redisClient.get("registro_contrato_"+nuew[3], function (errx, repslyx) {
														var infes = JSON.parse(repslyx), nuva =[];
														for(var j = 0; j < infes.length; j++){
															if(infes[j].indexOf(nuew[0]+"_"+nuew[2]+"_"+nuew[3])==-1){
																nuva.push(infes[j]);
															}
														}
														redisClient.set("registro_contrato_"+nuew[3],JSON.stringify(nuva), function (errx, repslyx) {
															resolve([true, lisa, 0, monto2, complete, tota, []]);
														});
													});
													
												});
											} else {
														
												redisClient.set(origena, JSON.stringify(lisa), function (errx, replyx) {
													resolve([true, lisa, adelantos, monto2, complete, tota, []]);
												});
											}
										}


									});
									
								} else {
									reject([false, "4"]);
								}
							});

						}else{
							reject([false, "4"]);
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