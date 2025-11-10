eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*          0        1         2        3            4
			Recibe token, IdAsesor,  cedula, porcentaje, idContrato
		*/
		if ( arrays.length == 5 ){
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {	
				if (err) {
					reject([false,"1"]);
				} else if(decoded.t=="1" || decoded.t=="0" || decoded.t=="5" || decoded.t == "2" || decoded.t == "4") {
					var litado =[];
					/*
						organizo los contratos 
					*/                    
					redisClient.keys("registry_"+arrays[2]+"_contrato_*_"+arrays[1]+"_"+arrays[4], function(err, reply) {                           
                        if(reply !== undefined && reply !== null){ 

                            redisClient.get(reply[0], function(err, replyContratoEncontrado) {
                                if(replyContratoEncontrado !== undefined && replyContratoEncontrado !== null){
                                    var contrato = JSON.parse(replyContratoEncontrado);
                                    let interes = parseInt(contrato[3].replace(/\./g, '')) * arrays[3];
                                    let valorUltimaCuota = contrato[13][contrato[13].length-1].cp.replace(/\./g, '' );
                                    let valorUltimaCuotaConInteres = parseInt(valorUltimaCuota) + interes;
                                    contrato[13][contrato[13].length - 1].cp = String(valorUltimaCuotaConInteres);

                                    redisClient.set(reply[0], JSON.stringify(contrato), function(err, reply) {
                                        if(reply !== undefined && reply !== null){
                                            resolve([true,true]);
                                        } else {
                                            reject([false,"5"]);
                                        }
                                    });
                                } else {
                                    reject([false,"4"]);
                                }
                            });

                        } else {
                            reject([false,"4"]);                        
                        }
                    });
				} else {
					reject([false,"2"]);
				}
			});
		}else{
			reject([false,"3"]);
		}
	});
};

module.exports = eje;