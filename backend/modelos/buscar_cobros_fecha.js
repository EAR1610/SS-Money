eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
			recibe token y idasesor
		*/
		if (arrays.length==3){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				} else if(decoded.t == "1" || decoded.t == "0" || decoded.t == "2" || decoded.t == "5" || decoded.t == "4") {
					
					// var moment = require("moment");
					// var dia = moment().format('YYYY-MM-DD');
					var comando = "monto_"+arrays[1]+"_*_"+arrays[2]+"_*_*"
					/*
						toma los monto y los suma
					*/
					
					redisClient.keys(comando,function(err3,reply3){

						if(reply3!==null){
							var lista = []
							//var reply_montos = JSON.parse(reply3);
							
							// for (var i=0; i<reply3.length;i++){
							// 	 elementos  = reply3[i].split("_");
							// 	 cedula = elementos[elementos.length-1];
							// 	 clientes.push(cedula);
							// }

							function recurso(ind,arrs){
								if (ind==arrs.length) {
									const moment = require('moment-timezone');
									// Convertir la hora a un objeto moment()
									lista.forEach((item) => {
										item.hora = moment.tz(item.hora, 'hh:mm A', 'America/Guatemala');
									});
									
									// Ordenar el JSON por la hora
									lista.sort((a, b) => {
										return a.hora.diff(b.hora);
									});
									lista.forEach((item) => {
										item.hora = item.hora.format('hh:mm A');
									});
									resolve([true,lista]);
								} else {
									var partes = arrs[ind].split("_");
									redisClient.get("cliente_"+partes[partes.length-1], function(error,replycliente){
										if ( replycliente!=null && replycliente !== undefined ){
											var datoscliente = JSON.parse(replycliente);
											var nombre = datoscliente[8]+" "+datoscliente[9]+" "+datoscliente[10]+" "+datoscliente[11];
											lista.push({"dpi":datoscliente[7], "nombre":nombre, "direccion":datoscliente[12],"monto":partes[2],"hora":partes[4]+":"+partes[5]+" "+partes[6]});
											ind++;
											recurso(ind,arrs);
										}
									});
								}
							} recurso(0,reply3);
						}else{
							resolve([false,lista]);
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