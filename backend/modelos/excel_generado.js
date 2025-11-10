eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
		recibo token, 
		*/
		
		if (arrays.length==3){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1" || decoded.t=="5"){
					
					var nuevos_contr = [];
					
					function cancelado(nombreEmpresa,nit,nombreAsesor,cedula_Aseso,correo_Aseso,jefe_Aseso,nuevos,nuevos_contr){
						var moment = require("moment-timezone");
						var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
												
						redisClient.get("gasto_"+arrays[1]+"_"+dia,function(erur,repuly) {						
							if(repuly!==null){
								var repulys = JSON.parse(repuly);
								resolve([true,nombreEmpresa,nit,nombreAsesor,cedula_Aseso,correo_Aseso,jefe_Aseso,nuevos,repulys,nuevos_contr]);
							}else{
								resolve([true,nombreEmpresa,nit,nombreAsesor,cedula_Aseso,correo_Aseso,jefe_Aseso,nuevos,[],nuevos_contr]);
							}
						});
					}
					
					redisClient.get("configuracion_" + decoded.d, function (err, reply) {
						if( reply !==null && reply !== undefined ){
							var unes = JSON.parse(reply),
								nombreEmpresa = unes[13],
								nit = unes[15];
							
							redisClient.keys("listado_*_asesor_" + arrays[1], function (ersr, resply) {
								if(resply.length>0){
									
									redisClient.get(resply[0], function (errw, reoply) {
										
										var jesa =JSON.parse(reoply),
											nombreAsesor = jesa[7] + " " + jesa[8]+ " " + jesa[9]+ " " + jesa[10],
											cedula_Aseso = jesa[6],
											correo_Aseso = jesa[17],
											jefe_Aseso = jesa[23];
											
											var moment = require("moment-timezone");
											var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
											
											redisClient.keys("contrato_*_"+arrays[1]+"_*_"+arrays[2], function (erwsr, rwesply) {
												if(rwesply.length>0){
													
													var nuevos = [];
													function iterar(ind,arrs){
														if(ind == arrs.length){
															cancelado(nombreEmpresa,nit,nombreAsesor,cedula_Aseso,correo_Aseso,jefe_Aseso,nuevos,nuevos_contr);
														}else{
															var inesd = arrs[ind];
															redisClient.get(inesd,function(err,reply) {
																if( reply !== null && reply !== undefined ){
																																		
																	var unes = inesd.split("_");
																	redisClient.get("cliente_"+arrays[1]+"_"+unes[1],function(eqrr,rqeply) {
																		
																		if(unes[3]==dia){
																			nuevos_contr.push([reply,rqeply]);
																		}
																		
																		redisClient.keys("liquido_"+unes[1]+"_"+dia+"_*",function(eqrqr,rqeplyw) {
																			nuevos.push([reply,rqeply,rqeplyw]);
																			ind++;
																			iterar(ind,arrs);
																		});
																		
																	});
																	
																}else{
																	ind++;
																	iterar(ind,arrs);
																}
															});
														}
													}
													
													iterar(0,rwesply);
													
												}else{
													var nuevos = [];
													cancelado(nombreEmpresa,nit,nombreAsesor,cedula_Aseso,correo_Aseso,jefe_Aseso,nuevos,nuevos_contr);
												}
											});
										
									});
								}else{
									reject([false,"5"]);
								}
							});
							
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
