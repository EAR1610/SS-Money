eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
			recibo token, idasesor, monto
		*/
		
		if (arrays.length==4){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if( decoded.t == "1" || decoded.t == "2" || decoded.t == "0" || decoded.t == "5" || decoded.t == "4" ){

					// redisClient.get("base_"+arrays[2],function(ersr,replcy) {
					// 	if(replcy!==""){
					// 		redisClient.rename("base_"+arrays[2],"dol_base_"+arrays[2]+"_"+ides,function(ersr,replcy) {});
					// 	}
						
					// 	arrays[0] = ides;
						
					// 	redisClient.set("base_"+arrays[2],JSON.stringify(arrays),function(err,reply) {
					// 		resolve([true,true]);
					// 	});
						
					// });

					var moment = require("moment-timezone");
					var fecha = moment().tz("America/Guatemala").format('YYYY-MM-DD');
					var hora = moment().tz("America/Guatemala").format('hh:mm A');
					var arraybase = [hora, arrays[1],arrays[3],false]

					/*
						guardoo la nueva base 
					*/

					redisClient.set("base_"+arrays[2]+"_"+fecha,JSON.stringify(arraybase),function(err,reply) {
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
