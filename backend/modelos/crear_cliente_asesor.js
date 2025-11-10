eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/* 
			? recibo tokens, foto_perfil, foto_normal, foto_reverso, foto_frontal, block.pais, tipoletracedula, numerocedula, nom1, nom2, ape1, ape2, direction, departamento, ciudad, barrio, telefofijo, telefomovil, correo, alias, lat, lon
		*/
				
		if ( arrays.length == 22 ){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				} else if(decoded.t=="2"){ //Solmante el Asesor, tiene derecho a este archivo

					var moment = require("moment-timezone");
					var hoy = moment().tz("America/Guatemala").format('YYYY-MM-DD HH:mm:ss');
					let identificadorMayor = 1;
					
					function randomIntFromInterval(min,max){
						return Math.floor(Math.random()*(max-min+1)+min);
					}
					var ids = randomIntFromInterval(1000000,9999999);
					arrays.push(hoy);
					arrays[0] = ids;
					/*
						asigno idicadores a cliente					
					*/

					redisClient.get("cliente_"+arrays[7],function(err, clienteActualizado){ //El cliente se va actualizar.
						if( clienteActualizado !== null && clienteActualizado !== undefined ){
							let actualizaciónCliente= JSON.parse(clienteActualizado);
							arrays.push(actualizaciónCliente[23]) //Se le adjunta el Identificador.
							if( clienteActualizado !== null && clienteActualizado !== undefined){
								redisClient.set("cliente_"+arrays[7],JSON.stringify(arrays),function(err,reply) {						
									/*
										verifico si existe y listo
									*/
									redisClient.get("registro_client_"+decoded.d,function(errw,replyw) {
										if( replyw!==null && reply !== undefined){
											var esa = JSON.parse(replyw);								
											/*
												guardo
											*/								
											if(esa.indexOf("cliente_"+arrays[7])==-1){
												esa.push("cliente_"+arrays[7]);
												redisClient.set("registro_client_"+decoded.d,JSON.stringify(esa),function(erwrw,repelyw) {
													resolve([true,true]);
												});
											}else{
												resolve([true,true]);
											}
										}else{
											var esa = [];
											esa.push("cliente_"+arrays[7]);
											redisClient.set("registro_client_"+decoded.d,JSON.stringify(esa),function(erwrw,repelyw) {
												resolve([true,true]);
											});
										}
									});						
								});
							}
						}
					});

					redisClient.keys("cliente_*",function(err, todosLosClientes){
						if (todosLosClientes !== null && todosLosClientes !== undefined) {
							function recurso(ind, arrs){
								if(ind === arrs.length){
									arrays.push(++identificadorMayor);
									redisClient.set("cliente_"+arrays[7],JSON.stringify(arrays),function(err,reply) {						
										/*
											verifico si existe y listo
										*/						
										redisClient.get("registro_client_"+decoded.d,function(errw,replyw) {
											if( replyw!==null && reply !== undefined){
												var esa = JSON.parse(replyw);								
												/*
													guardo
												*/								
												if(esa.indexOf("cliente_"+arrays[7])==-1){
													esa.push("cliente_"+arrays[7]);
													redisClient.set("registro_client_"+decoded.d,JSON.stringify(esa),function(erwrw,repelyw) {
														resolve([true,true]);
													});
												}else{
													resolve([true,true]);
												}
											}else{
												var esa = [];
												esa.push("cliente_"+arrays[7]);
												redisClient.set("registro_client_"+decoded.d,JSON.stringify(esa),function(erwrw,repelyw) {
													resolve([true,true]);
												});
											}
										});						
									});
								} else {
									redisClient.get(arrs[ind], function(errorCliente, miCliente){
										var infoCliente = JSON.parse(miCliente);
										if( infoCliente !== null && infoCliente !== undefined){																				
											if( identificadorMayor < infoCliente[23] ) identificadorMayor = infoCliente[23];
										}
										ind++;
										recurso(ind, arrs);
									})
								}
							} 
							recurso(0, todosLosClientes)
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