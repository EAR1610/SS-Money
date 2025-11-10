eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
				
		var textos = /^[A-Za-z\s]{0,100}/;
		var fecha = /^[0-9\/\%\s]{1,20}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		//{"r":"informacionfoto","d":["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpIjoibmV0aW5nYmV0YUBnbWFpbC5jb20iLCJkIjoiQzEyMzQ1Njc4IiwiaWF0IjoxNTQzMTUxMTE2LCJleHAiOjE1NDMxOTQzMTZ9.YqxN1Mg-H96zCTb_d-NXSYueVdcmlnkUqcGirQ4aPRc","Es una lapto nueva","https://ebay.com/lapto.php","R2445536625","425","12354","10.445333","-71.344533","12.445333","-72.344533","1","Venezuela","Zulia","Maracaibo","Colombia","Bogota","Capital","i"]}
		//{"e":false,"d":[true,true]}
		//configuracion personal
			 
		if (arrays.length==20){
			
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else{		

					var moment = require("moment-timezone");
					var hoy = moment().tz("America/Guatemala").format('YYYY-MM-DD HH:mm:ss');
					
					if(arrays[18]!==decoded.i){
					
						if(largoc.test(arrays[2]) && largoc.test(arrays[3]) && largoc.test(arrays[4]) && numero.test(arrays[5]) && largoc.test(arrays[7]) && largoc.test(arrays[8]) && largoc.test(arrays[9]) && largoc.test(arrays[10]) && numero.test(arrays[11]) && numero.test(arrays[12]) && numero.test(arrays[13]) && numero.test(arrays[14]) && numero.test(arrays[16]) && fecha.test(arrays[17]) && correo.test(arrays[18]) ){
							
							arrays[0] = decoded.i;
							arrays[20] = hoy;
							arrays[21] = false;
							redisClient.set('aplica_'+arrays[18]+'_des3o_'+decoded.i,JSON.stringify(arrays),function(err2,reply2){	
								resolve([true,true]);
							});
							
						}else{
							reject([false,"2"]);
						}
						
					}else{
						reject([false,"4"]);
					}
			
				}
			});
			
		}else{
			reject([false,"3"]);
		}
		
	});
};

module.exports = eje;
