eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
		
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		/*
			0		1		2		    3				4				5					6						7						8			9			10			       11	       12   13 14  15  16 
	recibo tokens, dpi ,idasesor ,monto a prestar ,cicloendiad, fecha_prestamoNoSEUSA, descontarCUOTADEuNA, porcentajeDEPRESTAMO ,quedo_cuotauNICA, IDEMPRESA, dIARIOSEMANALMENSUAL, UltimaCuota,  C1, C2, C3, C4, contratosMultiplesAsesores]
		*/
		console.log(arrays)
		if ( arrays.length == 17 ){
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if( decoded.t=="1" || decoded.t=="2" || decoded.t=="5" ) {
					if( arrays[0]!==null && arrays[1] !==null && arrays[2] !==null && arrays[3] !==null && arrays[4] !==null && arrays[5] !==null && arrays[6] !==null && arrays[7] !==null && arrays[8] !==null && arrays[9] !==null && arrays[10] !==null ){
						function randomIntFromInterval(min,max){
							return Math.floor(Math.random()*(max-min+1)+min);
						}
						// var ids = randomIntFromInterval(1000000,9999999);

						function generateUUID() {
							try {
								// ? Intentar usar crypto.randomUUID() si está disponible (Node.js 14.17+)
								if (typeof crypto !== 'undefined' && crypto.randomUUID) {
									return crypto.randomUUID();
								}
								
								// ? Fallback: generar UUID manualmente
								return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
									var r = Math.random() * 16 | 0,
										v = c == 'x' ? r : (r & 0x3 | 0x8);
									return v.toString(16);
								});
							} catch (error) {
								// Si falla todo, usar timestamp + random
								return Date.now().toString(36) + Math.random().toString(36).substr(2);
							}
						}

						var idContrato = generateUUID();

						/*
							? agrego otros valores al array principal y verifico la configuracion que tengo a crear el contrato
						*/

						arrays[0] = decoded.d;
						arrays.push(0);
						arrays.push(idContrato);						
						redisClient.get("configuracion_" + arrays[9], function (err, reply) {
							if( reply!==null && reply !== undefined ){
								var info = JSON.parse(reply);
								var extric = info[11]; 								
								redisClient.keys("registry_"+arrays[1]+"_contrato_"+arrays[0]+"_"+arrays[2]+"_*",function(ersr,replsy) {
									if( replsy.length >= info[16] ){
										var miEmpresa = replsy.length;
									}else{
										var miEmpresa = 0;
									}
									/*
										? verifiquo si tiene otros contratos
									*/
									redisClient.keys("registry_"+arrays[1]+"_contrato_*",function(erxsr,replxsy) {
										const contratosAsesoresDiferentes = replxsy.filter( registro => {
											let partes = registro.split('_');
											let id = partes[4];
											return id != arrays[2];
										});

										if( contratosAsesoresDiferentes.length > 0 ){
											var otrasEmpresa = replxsy.length - miEmpresa;
										} else {
											var otrasEmpresa = 0;
										}										
										/*
											? verifiquo si tiene otros contratos en otras empresas										
										*/
										if( extric == "3" && miEmpresa > 0 ) {
											resolve( [false,"4",miEmpresa] );
										} else if( extric == "3" && otrasEmpresa > 0 && arrays[16] == "2" ) {
											resolve( [false,"5",otrasEmpresa] );
										} else {
											var moment = require("moment-timezone");
											/*
												? creo la cantidad de cuotas que require según el ciclo que tengan
											*/
											
											ultima_cuota = arrays[11].toString();

											if( ultima_cuota === undefined || ultima_cuota === null || ultima_cuota === "" ) return;
																						
											var fes =[];

											/**
											 * TODO: FRECUENCIA DE PAGO: SEMANAL
											*/				

											if(arrays[10]=="2"){
												let cuotaD = arrays[8].replace(/\./g, ""),
													tiempo = arrays[4],
													fechaBase = moment(arrays[5], "YYYY-MM-DD"),
													// ? Obtener el día de la semana (1=lunes, 7=domingo)
													diaSemana = fechaBase.isoWeekday(),
													// ? Usar la fecha base como punto de partida
													prox = fechaBase.format('YYYY-MM-DD');
												
												console.log("Fecha inicial semanal:", prox);
												console.log("Día de la semana:", diaSemana);

												for (let k = 1; k < tiempo + 1; k++) {
													let prox2 = moment(prox).add(7, 'days').format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2}`);
													prox = prox2;
												}
												
												if (fes.length > parseInt(arrays[4])) fes.pop();

											} else if(arrays[10]=="1") { 
												/**
												 * TODO: FRECUENCIA DE PAGO: DIARIA
												 */												
												let cuotaD = arrays[8].replace(/\./g, ""), // * Regex global para eliminar todos los puntos
													fechaBase = moment(arrays[5], "YYYY-MM-DD"),
													prox = fechaBase,
													tiempo = arrays[4];
												
												console.log("Fecha inicial diaria:", prox);

												for(let k = 1; k < tiempo + 1; k++){
													let prox2 = moment(prox).add(1, 'days');
													
													// ? Saltar domingos (day() === 0)
													if(prox2.day() === 0) prox2 = prox2.add(1, 'days');
													
													prox2 = prox2.format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2}`);
													prox = prox2;
												}
												
												if(fes.length > parseInt(arrays[4]))fes.pop();

											} else if(arrays[10]=="3"){ 
												/**
												 * TODO: FRECUENCIA DE PAGO: QUINCENAL
												 */	
												let cuotaD = arrays[8].replace(/\./g, ""),
													fechaBase = arrays[5],
													prox = fechaBase,
													tiempo = arrays[4];
												
												console.log("Fecha inicial quincenal:", prox);

												for(let k = 1; k < tiempo + 1; k++){
													let prox2 = moment(prox).add(15, 'days');
													
													// ? Saltar domingos (day() === 0)
													if(prox2.day() === 0) prox2 = prox2.add(1, 'days');													
													
													prox2 = prox2.format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2}`);
													prox = prox2;
												}
											} else if(arrays[10]=="4"){
												/**
												 * TODO: FRECUENCIA DE PAGO: MENSUAL
												 */	
												console.log("arrays[5]");
												console.log(arrays[5]);
												
												let cuotaD = arrays[8].replace(/\./g, ""),
													//? Especificar el formato exacto de la fecha
													fechaBase = arrays[5],
													prox = fechaBase,
													tiempo = arrays[4];
												
												console.log("Fecha inicial mensual:", prox);

												for(let k = 1; k < tiempo + 1; k++){
													let prox2 = moment(prox).add(30, 'days').format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2}`);
													prox = prox2;
												}
											} else if (arrays[10] == "5") {
												/**
												 * TODO: FRECUENCIA DE PAGO: PAGO CONFIGURABLE 4 PAGOS EN 25 DÍAS
												 */	
												let cuotaD = arrays[8].replace(/\./g, ""),
													tiempo = arrays[4],
													indi = 12; // * Fecha de la primera Cuota (posición 12 en el array)

												console.log("Frecuencia configurable 4 pagos - fechas desde arrays:", arrays.slice(12, 16));

												for (let k = 1; k < 4 + 1; k++) {
													// ? Validar que la fecha existe en el array
													if (!arrays[indi]) {
														console.error(`Fecha no proporcionada en posición ${indi}`);
														break;
													}
													
													// ? Asegurar que la fecha esté en formato correcto y timezone CON PARSING ESTRICTO
													let fechaPago = moment(arrays[indi], "YYYY-MM-DD").tz("America/Guatemala").format('YYYY-MM-DD');
													let cuota = (k == 4) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													
													fes.push({ 
														"cp": cuota,
														"ct": false,
														"fe": fechaPago,
														"pe": 0, 
														"pago": "" 
													});
													
													console.log(`Cuota ${k}: ${fechaPago} - Monto: ${cuota}`);
													indi++;
												}
												
												if (fes.length > parseInt(arrays[4])) fes.pop();												
											} else if( arrays[10] == "6" ) {
												/**
												 * TODO: FRECUENCIA DE PAGO: PAGO CONFIGURABLE 3 PAGOS EN 30 DÍAS
												 */

												let cuotaD = arrays[8].replace(/\./g, ""),
													fechaBase = arrays[5],
													prox = fechaBase,
													tiempo = arrays[4],

													// ? Asegurar timezone en fechaFinal CON PARSING ESTRICTO

													fechaFinal = moment(prox).add(30, 'days').format('YYYY-MM-DD'),
													interes = parseInt( arrays[7].replace(/\./g, "") ),
													ganancia = (parseInt(cuotaD) * interes) / 100,
													pagosDeInteres = String( Math.ceil( ganancia / 2) );
												
												console.log("Fecha inicial 3 pagos:", prox);
												console.log("Fecha final:", fechaFinal);
												console.log("Pagos de interés:", pagosDeInteres);

												for(let k = 1; k < tiempo + 1; k++){
													if( k == 3 ){
														// * Última cuota - capital final
														fes.push({ 
															"cp": ultima_cuota.replace(/\./g, ""), 
															"ct": false, 
															"fe": fechaFinal, 
															"pe": 0, 
															"pago": "" 
														});
														console.log(`Cuota ${k} (Final): ${fechaFinal} - Monto: ${ultima_cuota.replace(/\./g, "")}`);
													} else {
														// * Cuotas de interés (primera y segunda)
														let prox2 = moment(prox).add(15, 'days').format("YYYY-MM-DD");														
														// Saltar domingos
														if(prox2.day() === 0) prox2 = prox2.add(1, 'days').format("YYYY-MM-DD");
														
														fes.push({ 
															"cp": pagosDeInteres, 
															"ct": false, 
															"fe": prox2, 
															"pe": 0, 
															"pago": "" 
														});

														console.log(`Cuota ${k} (Interés): ${prox2} - Monto: ${pagosDeInteres}`);
														prox = prox2;
													}
												}
											} else if( arrays[10] == "7" ) {
												/**
												 * TODO: FRECUENCIA DE PAGO: CATORCENAL
												 */	
												let cuotaD = arrays[8].replace(/\./g, ""),
													fechaBase = arrays[5],
													prox = fechaBase,
													tiempo = arrays[4];								
												console.log("Fecha inicial catorcenal:", prox);
												for(let k = 1; k < tiempo + 1; k++){
													let prox2 = moment(prox).add(14, 'days');
													// * Saltar domingos (day() === 0)
													if(prox2.day() === 0) prox2 = prox2.add(1, 'days');
													
													prox2 = prox2.format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2} - Monto: ${cuota}`);
													prox = prox2;
												}
											}  else if( arrays[10] == "8" ) {
												/**
												 * TODO: FRECUENCIA DE PAGO: MENSUAL SEGUN INTERESES
												 */	
												let capitalInicial = parseInt(arrays[3].replace(/\./g, "")); // * Capital inicial
												let porcentajeInteres = parseInt(arrays[7].replace(/\./g, "")); // * Porcentaje de interés
												let fechaBase = arrays[5];
												let prox = fechaBase;
												
												console.log("Modalidad según intereses - Capital:", capitalInicial, "Interés:", porcentajeInteres + "%");
												
												// * Calcular el monto total objetivo (capital + interés total)
												let montoTotalObjetivo = capitalInicial + (capitalInicial * porcentajeInteres / 100);
												let saldoPendiente = capitalInicial;
												let totalPagado = 0;
												
												console.log("Monto total objetivo:", montoTotalObjetivo);
												
												// * Generar cuotas hasta que se alcance el monto total
												while (totalPagado < montoTotalObjetivo && fes.length < 240) { // ? Límite de 240 cuotas como seguridad
													// ? Calcular interés sobre saldo pendiente
													let interesCuota = Math.ceil(saldoPendiente * porcentajeInteres / 100);
													let cuota = interesCuota;
													
													//?  Avanzar fecha (mensual)
													prox = moment(prox).add(30, 'days');
													
													if(prox.day() === 0) {
														prox = prox.add(1, 'days').format("YYYY-MM-DD");
													} else {
														prox = prox.format("YYYY-MM-DD");
													}

													// ? Agregar cuota
													fes.push({
														"cp": String(cuota),
														"ct": false,
														"fe": prox,
														"pe": 0,
														"pago": ""
													});
													
													console.log(`Cuota ${fes.length}: ${prox} - Monto: ${cuota})`);
												}																	
												console.log("Total de cuotas generadas:", fes.length);
											} else if(arrays[10]=="9"){
												/**
												 * TODO: FRECUENCIA DE PAGO: MENSUAL UNICO PAGO 25 DIAS
												 */	
												console.log("arrays[5]");
												console.log(arrays[5]);
												
												let cuotaD = arrays[8].replace(/\./g, ""),
													// * Especificar el formato exacto de la fecha
													fechaBase = arrays[5],
													prox = fechaBase,
													tiempo = arrays[4];
												
												console.log("Fecha inicial mensual:", prox);

												for(let k = 1; k < tiempo + 1; k++){
													let prox2 = moment(prox).add(25, 'days').format('YYYY-MM-DD');
													let cuota = (k == tiempo) ? ultima_cuota.replace(/\./g, "") : cuotaD;
													fes.push({ "cp":cuota,"ct":false,"fe":prox2,"pe":0, "pago":"" });
													console.log(`Cuota ${k}: ${prox2}`);
													prox = prox2;
												}
											}

											if( fes.length > 0 ){
												/**
												 * ? Si tiene cuotas a descontar
												 */	
												let desc = parseInt(arrays[6]);
												let fechaBase = arrays[5];
												let prox = fechaBase;
												console.log("Fecha para cuotas descontadas:", prox);

												if( desc > 0 ) {
													console.log(`Descontando ${desc} cuotas`);
													for(let d = 0; d < desc; d++){
														if(d < fes.length) { // ? Validar que existe la cuota
															fes[d].ct = true;
															fes[d].pago = prox;
															console.log(`Cuota ${d + 1} marcada como descontada: ${prox}`);
														}
													}
													arrays.push(fes);
												} else {
													arrays.push(fes);
												}

												redisClient.keys("registry_" + arrays[1] + "_contrato_*", function(err, keys) {
													if(err) {
														reject([false, "Error al buscar contratos existentes"]);
														return;
													}
													
													// let maxNum = 0;
													// keys.forEach(key => {
													// 	const parts = key.split('_');
													// 	const num = parseInt(parts[parts.length - 1]); //* Último segmento es el número
													// 	if(!isNaN(num) && num > maxNum) maxNum = num;
													// });
													// const idContrato = maxNum + 1;
													
													const oriegn = "registry_" + arrays[1] + "_contrato_" + arrays[0] + "_" + arrays[2] + "_" + idContrato;
													console.log("oriegn")
													console.log(oriegn)
													const arraysDB = arrays.slice(0, 11).concat(arrays.slice(17)); // ? Se ajusta los elementos del array del contrato. 
													console.log("arraysDB")
													console.log(arraysDB)
													
													console.log("Guardando contrato:", oriegn);
													
													redisClient.set(oriegn, JSON.stringify(arraysDB), function(err, reply) {
														if(err) {
															reject([false, "Error al guardar el contrato"]);
															return;
														}
														
														redisClient.get("registro_contrato_" + arrays[2], function(errw, replyw) {
															if(errw) {
																reject([false, "Error al registrar contrato"]);
																return;
															}
															
															const esa = replyw ? JSON.parse(replyw) : [];
															esa.push(oriegn);
															
															redisClient.set("registro_contrato_" + arrays[2], JSON.stringify(esa), function(erwrw, repelyw) {
																if(erwrw) {
																	reject([false, "Error al actualizar registro"]);
																	return;
																}
																console.log("Contrato guardado exitosamente");
																resolve([true, miEmpresa, otrasEmpresa]);
															});
														});
													});
												});
											} else{
												reject([false,"8"]);
											}
										}
									});
								});
							}
						});					
					}					
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