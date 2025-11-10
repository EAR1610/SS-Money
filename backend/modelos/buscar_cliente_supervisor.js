eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;		
		/*
			recibo token y cedula
		*/		
		if (arrays.length==2){		
			var jwt = require('jsonwebtoken');
			const moment = require("moment");
			jwt.verify(arrays[0], 'clWve-G*-9)1', function( err, decoded ) {
				if ( err ) {
					reject([false,"1"]);
				} else if( decoded.t=="4" || decoded.t=="1" ){					
					/*verifico que no este betado el cliente*/
					redisClient.get("betado_"+arrays[1],function( erkr,rkeply ) {
						if( rkeply == null ) {
							/*emito la informacion del cliente*/
							redisClient.keys( 'cliente_'+arrays[1],function( err3,reply3 ){								
								if( reply3.length > 0 ){
									var litado  = [];									
									redisClient.get( reply3[0], function(err,reply ) {
										if( reply !== null ){
											litado.push( reply );
											let indiceFinal = 0;
											let comportamiento = 0;
											redisClient.keys('old_registry_'+arrays[1]+'_contrato_*_*_*', function( err4, replyCantidadContratos ){
												if( replyCantidadContratos !== null && replyCantidadContratos.length > 0 ){
													for ( let index = 0; index < replyCantidadContratos.length; index++ ) {	
														redisClient.get(replyCantidadContratos[index], function(error, replyContrato) {
															let contrato;
															if( replyContrato !== null && replyContrato !== undefined ){
																contrato = JSON.parse( replyContrato );
																for (let i = 0; i < contrato[13].length; i++) {
																	const fechaAsignada = moment(contrato[13][i].fe)
																	const fechaPago = moment(contrato[13][i].pago)
																	const diferenciaDias = fechaPago.diff(fechaAsignada, "days");
																	comportamiento += diferenciaDias;
																}
															}
															indiceFinal++;
															if( indiceFinal == replyCantidadContratos.length) {
																comportamiento = parseInt( comportamiento / contrato[13].length );																
																resolve( [ true, litado, replyCantidadContratos.length, comportamiento ] );
															}
														})
													}
												} else {
													reject([ false, "El cliente no tiene contratos finalizados"] );
												}
											})
										} else {
											reject([ false, "El cliente no tiene contratos finalizados"] );
										}
									});
								}else{
									reject([false,"4"]);
								}
							});							
						} else {
							var fesd = JSON.parse(rkeply);
							if (decoded.d==fesd[3]) {
								reject([false,"6",rkeply]);
							} else {								
								/*emito la informacion del cliente*/								
								redisClient.keys('cliente_*_'+arrays[1],function(err3,reply3){
									if(reply3.length > 0){
										var litado  = [];
										redisClient.get(reply3[0],function(err,reply) {
											if(reply!==null){
												litado.push(reply);
												reject([false,"8",rkeply,litado]);
											}
										});
									} else {
										reject([false,"4"]);
									}
								});
							}
						}
					});					
				}else {
					reject([false,"2"]);
				}
			});			
		}else{
			reject([false,"3"]);
		}		
	});
};

module.exports = eje;