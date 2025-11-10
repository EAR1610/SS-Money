eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
			Recibe token
		*/
		if ( arrays.length == 4 ){
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {	
				if (err) {
					reject([false,"1"]);
				} else if(decoded.t=="1" || decoded.t=="0" || decoded.t=="5" || decoded.t == "2" || decoded.t == "4") {
					var litado =[];
					/*
						organizo los contratos 
					*/
					redisClient.get("registro_contrato_"+arrays[3],function(edrr,redpsly) {
						if( redpsly!==null && redpsly !== undefined ) {
							var infex = JSON.parse(redpsly);							
							if(infex[arrays[2]] !== null && infex[arrays[2]] !== undefined){
								var ogens = infex[arrays[2]].split("_");
								var esde = ogens[5];

								redisClient.get(infex[arrays[2]], function (edrr3, repdly3) {
									if( repdly3 !== null && repdly3 !== undefined ) {
										var infe = JSON.parse(repdly3),
											cedula = infe[1],
											fecha = infe[5],
											ruta = infe[2],
											vesd = fecha.split("-"),
											fech2 = vesd[2] + "_" + vesd[1] + "_" + vesd[0];
										
										/*
											extraigo clientes
										*/
										
										redisClient.get("cliente_"+cedula, function (serr, srepsy) {
											if( srepsy !== null && srepsy !== undefined ){
												redisClient.keys("asig_supervisor_*"+fech2+"_"+ruta, function (sesrr, srepslsy) {
													if (srepslsy.length > 0) {
														/*
															verifico que tengan supervidor o ayudante
														*/														
														redisClient.keys("asig_ayudante_*"+fech2+"_"+ruta, function (sesr, srepslsyx) {
															if (srepslsyx.length > 0) {																									
																redisClient.get(srepslsy[0], function (ses2rr, srepslsy2xq) {																	
																	redisClient.get(srepslsyx[0], function (ses2rr, srepslsy2x) {																		
																		litado.push([repdly3, srepslsy2xq, srepslsy2x,srepsy,esde]);
																		resolve([true, litado]);
																	});
																});
																
															}else{																
																redisClient.get(srepslsy[0], function (ses2rr, srepslsy2xq) { //JEFE TERMINAN ACA																	
																	litado.push([repdly3, srepslsy2xq, [],srepsy,esde]);																	
																	resolve([true, litado]);
																});
																
															}
														});
													}else{
														redisClient.keys("asig_ayudante_*"+fech2+"_"+ruta, function (sesr, srepslsyx) {
															
															if (srepslsyx.length > 0) {
																redisClient.get(srepslsyx[0], function (ses2rr, srepslsy2x) {
																	litado.push([repdly3, [], srepslsy2x,srepsy,esde]);
																	resolve([true, litado]);
																});

															}else{																
																litado.push( [ repdly3, [], [],srepsy,esde ] );
																resolve( [ true, litado ] );

															}
														});

													}
												});
											} else {
												redisClient.get("registro_contrato_"+arrays[3],function(edrr,redpsly) {
													var redpslys = JSON.parse(redpsly);
													reject([false,"4",redpslys.length]);
												});

											}
										});

									} else {
										redisClient.get("registro_contrato_"+arrays[3],function(edrr,redpsly) {
											var redpslys = JSON.parse(redpsly);
											reject([false,"4",redpslys.length]);
										});

									}
								});
							}
						} else {
							reject([false,"4","0"]);
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