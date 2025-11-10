eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
				
		var textos = /^[A-Za-z\s]{0,100}/;
		var fecha = /^[0-9\/\%\s]{1,20}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^\w+([\.\+\-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
		
		
		/*
		recibo token correo, pass, tipoapp
		*/
		
		if (arrays.length==3){
			
			if(correo.test(arrays[0]) && largoc.test(arrays[1]) ){
				
				var moment = require("moment-timezone");
				var hoy = moment().tz("America/Guatemala").format('YYYY-MM-DD HH:mm:ss');
				
				function randomIntFromInterval(min,max){
					return Math.floor(Math.random()*(max-min+1)+min);
				}
				
				var id = randomIntFromInterval(1000000,9999999);
				
				arrays.push(false);//no ha sido aprobado por super administrador
				
				if(arrays[2]=="credict"){
					arrays.push(1);//es para credit
				}else if(arrays[2]=="store"){
					arrays.push(7);//es solo para store
				}else if(arrays[2]=="zimple"){
					arrays.push(6);//es solo para zimple
				}
				arrays[2] = hoy; //se agrega la fecha de registro de empresa
				arrays.push(id);//id empresa
				arrays.push("-");//Nombre empresa
				
				/*
				verifico sino esta registrao y guardo
				*/
				
				redisClient.keys('usuario_'+arrays[0]+"_*",function(er2,repl2){
					if(repl2.length !== 0 ){
						reject([false,"1"]);
					}else{
						redisClient.set('usuario_'+arrays[0]+"_"+id,JSON.stringify(arrays),function(err2,reply2){
							//redisClient.expire('usuario_'+arrays[0]+"_"+id, 60 * 60 * 24 * 30);
							resolve([true,true]);
						});
					}
				});

			}else{
				reject([false,"2"]);
			}
			
		}
		
	});
};

module.exports = eje;
