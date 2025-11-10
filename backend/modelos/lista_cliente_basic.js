eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
			recibo token y idaseor
		*/
		if (arrays.length==2){
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if( decoded.t == "1" || decoded.t == "0" || decoded.t == "4" || decoded.t == "5" ){
					
					/*
						emito lista de clientes basica segun su orden
					*/
					
                    redisClient.get("registro_client_"+decoded.d,function(ewr,sreply){
						const clientesTotales = JSON.parse( sreply );
                        if( clientesTotales !==null && clientesTotales !== undefined ) {

							var listado = [];

							function iterar(ind, arrs){			
								if(ind == arrs.length){
									resolve([true, listado, 0]);
								} else {									
									redisClient.get(arrs[ind], function(errCliente, replyCliente){										
										if(replyCliente !== null && replyCliente !== undefined) {
											let [ id, imagen1, imagen2, imagen3, imagen4, tipoUno, clase, dpi, nombre, nombre2, apellido, apellido2, direccion, departamento, municipio, barrio, celular1, celular2, correo, alias, lat, lon, fecha, identificador ] = JSON.parse(replyCliente);
											let datosCliente = [];

											datosCliente.push(dpi)
											datosCliente.push(nombre)
											datosCliente.push(nombre2)
											datosCliente.push(apellido)
											datosCliente.push(apellido2)
											datosCliente.push(direccion)
											datosCliente.push(celular1)
											datosCliente.push(celular2)
											datosCliente.push(id)
											datosCliente.push(imagen1)
											datosCliente.push(imagen2)
											datosCliente.push(imagen3)
											datosCliente.push(imagen4)
											datosCliente.push(tipoUno)
											datosCliente.push(clase)
											datosCliente.push(departamento)
											datosCliente.push(municipio)
											datosCliente.push(barrio)
											datosCliente.push(celular1)
											datosCliente.push(celular2)
											datosCliente.push(correo)
											datosCliente.push(alias)
											datosCliente.push(fecha)
											datosCliente.push(lat)
											datosCliente.push(lon)
											datosCliente.push(identificador)

											listado.push(datosCliente);
											ind++;
											iterar(ind, arrs);
										} else {
											ind++;	
											iterar(ind, arrs);
										}
									})
								}
							}
							iterar(0, clientesTotales);                            
                        }else{
							redisClient.get("registro_client_"+decoded.d,function(ewr,sreply){
								var ines = JSON.parse(sreply);
								reject([false,"4",ines]);
							});
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
