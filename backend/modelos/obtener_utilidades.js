eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;

		/*
			Recibo tokens,idempresa, fechaInicio, fechaFinal
		*/
		if ( arrays.length == 4){            
            var jwt = require('jsonwebtoken');
			jwt.verify( arrays[0], 'clWve-G*-9)1', function( err, decoded ) {                
                if( err ){
                    reject([false,"1"]);
                } else if( decoded.t == "1" ){                    
                    redisClient.keys("old_registry_*_contrato_*_*_*", function( error, replyContratosFinalizados ) {                        
                        if( replyContratosFinalizados !== null && replyContratosFinalizados !== undefined ){
                            if( replyContratosFinalizados.length > 0 ) {
                                var utilidadesGeneradas = [];                            
    
                                function iterar(ind, arrs) {
                                    if( ind === arrs.length ){
                                        resolve( [ true, utilidadesGeneradas ] );
                                    } else {
                                        redisClient.get(arrs[ind], function(errorContrato, replyContrato){
                                            if( replyContrato !== null && replyContrato !== undefined ){
                                                let [,dpiContrato,,cantidad,,fecha,,porcentaje,,,,,,,] = JSON.parse(replyContrato); 
                                                let porcentajeFinal = parseInt(porcentaje) / 100;
                                                let utilidadContrato = parseInt(cantidad.replace(".", "")) * porcentajeFinal;
    
                                                if( replyContrato !== null && replyContrato !== undefined ){
                                                    if( fecha >= arrays[2] && fecha <= arrays[3] ) {
                                                        redisClient.get("cliente_"+dpiContrato, function(error, replyCliente){
                                                            if( replyCliente !== null && replyCliente !== undefined ){
                                                                let infoCliente = replyCliente;
                                                                let [,,,,,,, dpi, nombre1, nombre2, apellido1, apellido2 ,,,,,,,,,,,] = JSON.parse( infoCliente );                                                            
                                                                let informacionContrato = [];
    
                                                                informacionContrato.push(dpi);
                                                                informacionContrato.push(nombre1);
                                                                informacionContrato.push(nombre2);
                                                                informacionContrato.push(apellido1);
                                                                informacionContrato.push(apellido2);
                                                                informacionContrato.push(fecha);
                                                                informacionContrato.push(utilidadContrato);
    
                                                                utilidadesGeneradas.push(informacionContrato);                                                                
                                                            }
                                                        })
                                                    }
                                                }                                            
                                                ind++;
                                                iterar(ind, arrs);
                                            } else {
                                                ind++;
                                                iterar(ind, arrs);
                                            }
                                        })
                                    }
                                } iterar(0, replyContratosFinalizados);
                            } 
                        }
                    })
                }
            })
        }
    });
};

module.exports = eje;