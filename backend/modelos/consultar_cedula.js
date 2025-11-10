eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
		recibe tokens, cedula, navegador, letra_cedula, venezuelaColombia
		
		*/
		
		
		if (arrays.length==5){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
					
				}else if(decoded.t=="1" || decoded.t=="0" || decoded.t=="2" || decoded.t=="5"){

					redisClient.keys('relacion_usuario_'+arrays[1]+'_*',function(err2,reply2){
						
						/*
						preparo el comando a ejecutar
						*/
						
						if(arrays[4]=="1"){
							var comando =  'node colombia2.js "'+arrays[1]+'" "'+arrays[2]+'" ';
						}else{
							var comando =  'node venezuela.js "'+arrays[3]+arrays[1]+'"';
						}

						redisClient.get("betado_"+arrays[1],function(erkr,rkeply) {
							if( rkeply==null && rkeply !== undefined ){
								
								/*
								verifico si esta betado el cliente
								*/
								
								function volver_a_consultar(){//1001830082

									var comando =  'node colombia.js "'+arrays[1]+'" "'+arrays[2]+'" ';
									const { exec } = require('child_process');
									exec(comando, (error, stdout, stderr) => {
										if (!error) {
											var test = stdout.split("\n").join("");
											var teh = test.split("_");

											require('child_process').exec(`killall chrome`);
											resolve([true, teh, comando]);

										}
									});

								}

								const { exec } = require('child_process');
								exec(comando, (error, stdout, stderr) => {
									if (!error) {
										var test = stdout.split("\n").join("");
										var teh = test.split("_");

										if(teh[0]==""){
											
											/*
											si no es correcto el resultado entonces pido otro comando
											*/
											
											volver_a_consultar();
										}else{
										
											require('child_process').exec(`killall chrome`);
											resolve([true, teh, comando]);

										}
									}
								});
								
							}else{
								reject([false,"5",rkeply]);
							}
						});

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
