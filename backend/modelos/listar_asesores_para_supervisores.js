eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;		
		/*
			recibo token
		*/
		if (arrays.length==1){		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t == "1" || decoded.t == "0" || decoded.t == "4" || decoded.t=="5"){					
					/*
						Según el token me extraigo los asesores que pertenecen a esta empresa
					*/					
					redisClient.keys('listado_'+decoded.d+'_asesor_*',function(err3,reply3){
						if( reply3 !== undefined && reply3 !== null ){
							if(reply3.length > 0){							
								/*Recursividad para guardar los datos*/							
								var litado = [];
								var datosSupervisor = [];
								var contratos = [];
	
								for(let i = 0; i < reply3.length; i++){
									var lista = reply3[i].split('_');								
									contratos.push(lista[3]);
								}
	
								redisClient.keys('asig_supervisor_'+decoded.d+'_'+decoded.n+'_*', function(err4, replySup){
									if( replySup !== undefined && replySup !== null){
										if(replySup.length > 0) {
											for(let i = 0; i < replySup.length; i+=1){
												const campos = replySup[i].split('_');
												const posicionSupervisor = campos[3];
												const posicionAsesor = campos[7];
												datosSupervisor.push([posicionSupervisor, posicionAsesor]);
											}
										}                                
		
										for(let i = 0; i < datosSupervisor.length; i++){
											if( reply3[i] !== null && reply3[i] !== undefined ){
		
												var listado = [];
												var elemento = datosSupervisor[i][1];										
												listado = reply3[i].split('_');
												
												if(contratos.includes(elemento)){
													redisClient.get(reply3[contratos.indexOf(elemento)],function(err,reply) {
														if (reply!==null && reply !== undefined) {
															litado.push(reply);														
														}
			
														if( i === (datosSupervisor.length - 1)) {
															resolve([true,litado]);
														}
													});												
												}
											}
										}																
									} 
								});
							}else{
								reject([false,"4"]);
							}
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
