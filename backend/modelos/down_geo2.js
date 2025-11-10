eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;		
		/*
			Recibo un array con los valores token,idasesor,idempresa;
		*/		
		if (arrays.length==3){		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1" || decoded.t=="2"){
					/*
						busco registro de contratos de la empresa idEmpresa
					*/		
					redisClient.get("registro_contrato_"+arrays[2],function(err,replyv) {						
						if( replyv!==null && replyv !== undefined ){												
							var reply = JSON.parse(replyv);							
							if(reply.length>0){								
								/*
									al tener los registros los intero etilo kanban usando recursividad
								*/								
								var lista = [];
								function recurso(ind,arrs){
									if(ind==arrs.length){										
										/*
											revuelvo
										*/										
										resolve([true,lista]);
									} else {										
										var inus = arrs[ind].split("_");
										redisClient.get(arrs[ind],function(exrrs,daxtse){

											var infeos = JSON.parse(daxtse);
											
											/*
												xtraigo informacion de cliente
											*/
                                            var fechaHoy = new Date().toISOString().split('T')[0];
                                            // var fechaHoy = "2023-10-26";
                                            var clientesHoy = infeos[13].filter(cliente => cliente.fe == fechaHoy && cliente.ct === false);
                                            if(clientesHoy.length){
                                                redisClient.get("cliente_"+inus[1],function(errs,datse){
                                                
                                                    if( datse!==null && datse !== undefined ) {
                                                        var infes = JSON.parse(datse);
                                                        var uno   = infes[8],
                                                            tres  = infes[10],
                                                            cedua = infes[7],
                                                            direc = infes[12],
                                                            tele  = infes[17],
															lat   = infes[20],
															lon   = infes[21];
                                                        
                                                        /*
                                                        	tomo la direccion y la reuno en un array
                                                        */
														lista.push({"u":uno+" "+tres,"c":cedua,"a":lat,"o":lon,"d":direc,"e":tele,"id":inus[5],"m":infeos[3],"f":infeos[5]});
														ind++;
														recurso(ind, arrs);
                                                         
                                                    }else{
                                                        ind++;
                                                        recurso(ind, arrs);
                                                    }
                                                });
                                            }else{
                                                ind++;
                                                recurso(ind, arrs);
                                            }
										});
									}
								}
								recurso(0,reply);
							}else{
								reject([false,"4"]);
							}
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
