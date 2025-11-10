eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*recibo muchos datos */
		
		if (arrays.length==21){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1"){
					
					if(arrays[18]=="a"){
						var tipo = "asesor",numes = 2;
					}else if(arrays[18]=="b"){
						var tipo = "ayudante",numes = 3;
					}else if(arrays[18]=="c"){
						var tipo = "supervisor",numes = 4;
					}else if(arrays[18]=="d"){
						var tipo = "administrador",numes = 5;
					}
					var moment = require("moment-timezone");
					var hoy = moment().tz("America/Guatemala").format('YYYY-MM-DD HH:mm:ss');
					
					function randomIntFromInterval(min,max){
						return Math.floor(Math.random()*(max-min+1)+min);
					}
					
					var ids = randomIntFromInterval(1000000,9999999);

					var new_user = [];
					new_user.push(arrays[17]);
					new_user.push(arrays[20]);
					new_user.push(hoy); //se agrega la fecha de registro de empresa
					new_user.push(true);//no ha sido aprobado por super administrador
					new_user.push(numes);//tipo de usuario 2 es decir empresario
					new_user.push(decoded.d);//id empresa
					new_user.push(ids);//id empresa
					
					/* y los guardo, csm*/
					
					redisClient.set('usuario_'+arrays[17]+"_"+decoded.d,JSON.stringify(new_user),function(err2,reply2){
						redisClient.set('relacion_usuario_'+arrays[6]+"_"+arrays[17],"true",function(err2,reply2){
							console.log("Creado el usuario");
						});
					});

					arrays.push(hoy);
					arrays.push(ids);
					arrays.push(decoded.d);

					redisClient.set("listado_"+decoded.d+"_"+tipo+"_"+ids,JSON.stringify(arrays),function(err,reply) {
						resolve([true,true]);
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
