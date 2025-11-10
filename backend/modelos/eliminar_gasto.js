eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
		    RECIBO TOKEN, NOMBREGASTO, IDASESOR, FECHAGASTO
		*/
		
		if ( arrays.length == 4 ){
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t == "1" || decoded.t == "0" || decoded.t == "2" || decoded.t == "5" || decoded.t == "4"){
					
					/* listo los gastos y elimino la que necesito eliminar y ya */
                    redisClient.get('gasto_'+arrays[2]+'_'+arrays[3], function(err, replyGastoDetallado){
                        if( replyGastoDetallado !== undefined && replyGastoDetallado !== null ){
                            let miGasto = JSON.parse(replyGastoDetallado);

                            // Encuentra el índice del gasto que deseas eliminar
                            let index = miGasto.findIndex(gasto => gasto[1] == arrays[1]);

                            // Si el gasto existe en el arreglo, elimínalo
                            if(index != -1) {
                                miGasto.splice(index, 1);
                                
                                // Si no quedan más gastos en el arreglo, elimina todo el registro de Redis
                                if( miGasto.length == 0 ) {
                                    redisClient.del('gasto_'+arrays[2]+'_'+arrays[3], function(err, reply) {
                                        resolve( [ true, true ] );
                                    });
                                } else {
                                    // Si aún quedan gastos en el arreglo, almacena el arreglo actualizado en Redis
                                    redisClient.set('gasto_'+arrays[2]+'_'+arrays[3], JSON.stringify(miGasto), function(err, reply) {
                                        resolve( [ true, true ] );
                                    });
                                }
                            }                                                                              
                        }else {
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
