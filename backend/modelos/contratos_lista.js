eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
		recibo token y iadsesor
		*/
		
		if (arrays.length==2){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1" || decoded.t=="0" || decoded.t=="5"){
					
					/*
					listo los contrato en orden y los muestros
					*/
					
					redisClient.keys('contrato_'+arrays[1]+'_*',function(err3,reply3){
						if(reply3.length > 0){

							var litado = [];
							function iterar(ind,arrs){
								if(ind == arrs.length){
									resolve([true,litado]);
								}else{
									redisClient.get(arrs[ind],function(err,reply) {
										if(reply!==null){
											var infe = JSON.parse(reply);
											var ide = infe[12];
											var resd = infe[0];
											var resd2 = infe[2];
											
											/*
											listo y muestro
											*/
											
											redisClient.keys('contrato_cuotas_'+arrays[1]+'_*_'+ide,function(edrr3,repdly3){
												if(repdly3.length > 0){

													redisClient.get(repdly3[0],function(err,repsly) {

														redisClient.keys("cliente_*_"+arrays[1],function(serr,repslsy) {

															redisClient.get(repslsy[0],function(err,repslqy) {
																var fesc = JSON.parse(reply);
																var fech = fesc[5].split("-");
																var fech2 = fech[2]+"_"+fech[1]+"_"+fech[0];

																/*
																inserto informacion de supervidor y de ayudante
																*/
																redisClient.keys("asig_supervisor_"+fesc[0]+"_*_"+fech2,function(sesrr,srepslsy) {

																	if(srepslsy.length>0){

																		redisClient.keys("asig_ayudante_"+fesc[0]+"_*_"+fech2,function(sesrr,srepslsyx) {
																			if(srepslsyx.length>0){

																				redisClient.get(srepslsy[0],function(ses2rr,srepslsy2xq) {
																					redisClient.get(srepslsyx[0],function(ses2rr,srepslsy2x) {

																						redisClient.get("listado_"+resd+"_asesor_"+resd2,function(ses2srr,srepslsy2sx) {
																							litado.push([reply, repsly, repslqy, srepslsy2xq, srepslsy2x,srepslsy2sx]);
																							ind++;
																							iterar(ind, arrs);
																						});

																					});
																				});

																			}else{
																				redisClient.get("listado_"+resd+"_asesor_"+resd2,function(ses2srr,srepslsy2sx) {
																					litado.push([reply, repsly, repslqy, srepslsy, [],srepslsy2sx]);
																					ind++;
																					iterar(ind, arrs);
																				});
																			}
																		});

																	}else{

																		srepslsy = [];
																		redisClient.keys("asig_ayudante_"+fesc[0]+"_*_"+fech2,function(sesrr,srepslsyx) {
																			if(srepslsyx.length>0){
																				redisClient.get("listado_"+resd+"_asesor_"+resd2,function(ses2srr,srepslsy2sx) {
																					redisClient.get(srepslsyx[0],function(ses2rr,srepslsy2x) {
																						litado.push([reply, repsly,repslqy,srepslsy,srepslsy2x,srepslsy2sx]);
																						ind++;
																						iterar(ind, arrs);
																					});
																				});

																			}else{
																				redisClient.get("listado_"+resd+"_asesor_"+resd2,function(ses2srr,srepslsy2sx) {
																					litado.push([reply, repsly, repslqy, [], [], srepslsy2sx]);
																					ind++;
																					iterar(ind, arrs);
																				});
																			}
																		});

																	}

																});

															});

														});
													});
												}
											});

										}else{
											ind++;
											iterar(ind,arrs);
										}
									});
								}
							}
							
							iterar(0,reply3);
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
