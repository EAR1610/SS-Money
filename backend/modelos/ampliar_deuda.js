eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;		
		/*
			Recibo un array con los valores Token, idEmpresa, idcontrato, monto
		*/	
		if (arrays.length==5){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="2"){// Uso exclusivo del Asesor					
					/*
						busco contrato
					*/					
					redisClient.keys("registry_"+arrays[2]+"_contrato_*_"+arrays[1]+"_"+arrays[3],function(erre,daex){
						if( daex !== null && daex !== undefined){
							if(daex.length>0) {								
								var orin = daex[0];
								let cuotasCanceladas = 0;

								redisClient.get(orin,function(erre,dae) {
									if( dae !== null && dae !== undefined ) {									
										/*
											lo abro y le sumo una cuota con el monto
										*/
										redisClient.keys("configuracion_*", function(errorConfig, configuraciones){
											if( configuraciones !== null && configuraciones !== undefined ){
												if(configuraciones.length > 0) {
													let configuracion = configuraciones;
													let indiceFinal = 0;
													redisClient.get("configuracion_"+configuracion[0].split('_')[1], function(errorConf, configuracionData){
														let configuracionesEmpresa = JSON.parse(configuracionData)
														var jues = JSON.parse(dae);
		
														if(jues.length > 0){
															for(let i = 0; i < jues[13].length; i++){														
																if(jues[13][i].ct == true) {
																	cuotasCanceladas += 1;
																}
															}
														}
														indiceFinal++;
														if(indiceFinal === daex.length) {	
															if( parseInt( configuracionesEmpresa[12] ) < cuotasCanceladas ) {
																var moment = require("moment-timezone");
																var ultimo = jues[13][jues[13].length-1];
																var fecha = ultimo.fe;
																//var dia = moment.tz(fecha,"America/Guatemala").add(1, 'days').format("YYYY-MM-DD");
																var dia = moment.tz(fecha, "America/Guatemala").add(1, 'days').format("YYYY-MM-DD");
							
																jues[13].push( { "cp":arrays[4],"ct":false,"fe":dia,"pe":0 } );
																
																redisClient.set(orin,JSON.stringify(jues),function(erre,dae){
																	resolve([true,true]);
																});
															} else {	
																reject([false, "No ha llegado a la cantida de cuotas mínimas para refinanciación"]);
															}
														}													
													})
												}
											}
										});									
									}
								});							
							}
						} else {
							reject([false,"2"]);
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
