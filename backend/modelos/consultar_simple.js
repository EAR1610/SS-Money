eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		
		/*
		recibe token, cedula, pass, navegador
		*/
		
		if (arrays.length==4){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					
					var comando =  'node simple.js "'+arrays[1]+'" "'+arrays[2]+'" "'+arrays[3]+'" ';
					
					/*ejecuta comano*/
					
					const { exec } = require('child_process');
					exec(comando, (error, stdout, stderr) => {
						if (!error) {
							var test = stdout.split("\n").join("");
							require('child_process').exec(`killall chrome`);
							resolve([true, test, comando]);
						}
					});
					
				}else if(decoded.t=="6"){
					
					/*ejecuta comano*/
					
					var comando =  'node simple.js "'+arrays[1]+'" "'+arrays[2]+'" "'+arrays[3]+'" ';

					const { exec } = require('child_process');
					exec(comando, (error, stdout, stderr) => {
						if (!error) {
							var test = stdout.split("\n").join("");
							require('child_process').exec(`killall chrome`);
							resolve([true, test, comando]);
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
