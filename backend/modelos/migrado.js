eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		/*
		if (arrays.length==8){
		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1" || decoded.t=="2" || decoded.t=="0" || decoded.t=="5"){
					
					redisClient.keys("cliente_*"+arrays[5],function(err3,reply3){
						if(reply3.length > 0){
							
							function randomIntFromInterval(min,max){
								return Math.floor(Math.random()*(max-min+1)+min);
							}
							var ids = randomIntFromInterval(1000000,9999999);
							
							var rut = reply3[0].split("_");
							var code = rut[1];
							var fechas =[];
							var moment = require("moment");
							
							if(arrays[1]=="1"){//diario
								
								if(!arrays[3]=="0"){
									
									var inde = moment().format('E');
									if(inde=="6"){
										var prox = moment().add(2, 'days').format('YYYY-MM-DD');
									}else if(inde=="7"){
										 var prox = moment().add(1, 'days').format('YYYY-MM-DD');
									}else{
										 var prox = moment().format('YYYY-MM-DD');
									}
									for(var k = 0; k < parseInt(arrays[2]); k++){
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":0});
										var prox = moment(prox).add(1, 'days').format('YYYY-MM-DD');
										var inde = moment(prox,"YYYY-MM-DD").format('E');
										if(inde=="6"){
											var prox = moment(prox,"YYYY-MM-DD").add(2, 'days').format('YYYY-MM-DD');
										}else if(inde=="7"){
											 var prox = moment(prox,"YYYY-MM-DD").add(1, 'days').format('YYYY-MM-DD');
										}else{
											 var prox = moment(prox,"YYYY-MM-DD").format('YYYY-MM-DD');
										}
									}
									
								}else{
									var inde = moment().format('E');
									if(inde=="6"){
										var prox = moment().add(2, 'days').format('YYYY-MM-DD');
									}else if(inde=="7"){
										 var prox = moment().add(1, 'days').format('YYYY-MM-DD');
									}else{
										 var prox = moment().format('YYYY-MM-DD');
									}
									for(var k = 0; k < parseInt(arrays[2])+1; k++){
										if(k==0){
											fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":arrays[3]});
										}else{
											fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":0});	
										}
										var prox = moment(prox).add(1, 'days').format('YYYY-MM-DD');
										var inde = moment(prox,"YYYY-MM-DD").format('E');
										if(inde=="6"){
											var prox = moment(prox,"YYYY-MM-DD").add(2, 'days').format('YYYY-MM-DD');
										}else if(inde=="7"){
											 var prox = moment(prox,"YYYY-MM-DD").add(1, 'days').format('YYYY-MM-DD');
										}else{
											 var prox = moment(prox,"YYYY-MM-DD").format('YYYY-MM-DD');
										}
									}
									
								}
								
							}else if(arrays[1]=="2"){//semans
								
								if(!arrays[3]=="0"){
									
									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":0});
									for(var k = 1; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(7, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}else{
									
									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":arrays[3]});
									for(var k = 0; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(7, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}
								
							}else if(arrays[1]=="3"){//quicenal
								
								if(!arrays[3]=="0"){
									
									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":0});
									for(var k = 1; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(15, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}else{
									
									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":arrays[3]});
									for(var k = 0; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(15, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}
								
							}else if(arrays[1]=="4"){//mensual
								if(arrays[3]=="0"){ //cantidad que abono
									
									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":0});
									for(var k = 1; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(30, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}else{

									var prox = moment().format('YYYY-MM-DD');
									fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox,"pendiente":arrays[3]});
									for(var k = 0; k < parseInt(arrays[2]); k++){
										var prox2 = moment(prox).add(30, 'days').format('YYYY-MM-DD');
										fechas.push({"cantidad_cuota_paga":parseInt(arrays[4]),"completa":false,"fecha":prox2,"pendiente":0});
										prox = prox2;
									}
									
								}
							}
							
							redisClient.get(reply3[0],function(errs3,replys3){
								var cliens = JSON.parse(replys3);
								
								function randomIntFromInterval(min,max){
									return Math.floor(Math.random()*(max-min+1)+min);
								}
								var ids = randomIntFromInterval(1000000,9999999);
								var moment = require("moment");
								var edsa = moment().format('YYYY-MM-DD');
								var esde = parseInt(arrays[2]) * parseInt(arrays[4]) + parseInt(arrays[3]);
								
								var ese = [ decoded.d,arrays[5],arrays[6],esde,arrays[2],edsa,"0","0",arrays[4], decoded.d,arrays[1],0,arrays[7]];
								
								redisClient.set("contrato_cuotas_"+arrays[5]+"_"+arrays[6]+"_"+ids,JSON.stringify(fechas),function(err,reply) {
									
									redisClient.set("contrato_" + arrays[5] + "_" + arrays[6] + "_" + edsa + "_" + decoded.d, JSON.stringify(ese), function (err, reply) {
									
										redisClient.get("registro_contrato_"+arrays[6],function(errw,replyw) {
											if(replyw!==null){
												var esa = JSON.parse(replyw);
												esa.push("contrato_" + arrays[5] + "_" + arrays[6] + "_" + edsa + "_" + decoded.d);
												redisClient.set("registro_contrato_"+arrays[6],JSON.stringify(esa),function(erwrw,repelyw) {

													redisClient.set("contrato_" + arrays[5] + "_" + arrays[6] + "_" + edsa + "_" + decoded.d, JSON.stringify(ese), function (err, reply) {
														resolve([true,true]);
													});

												});
											}else{
												var esa = [];
												esa.push("contrato_" + arrays[5] + "_" + arrays[6] + "_" + edsa + "_" + decoded.d);
												redisClient.set("registro_contrato_"+arrays[6],JSON.stringify(esa),function(erwrw,repelyw) {

													redisClient.set("contrato_" + arrays[5] + "_" + arrays[6] + "_" + edsa + "_" + decoded.d, JSON.stringify(ese), function (err, reply) {
														resolve([true,true]);
													});

												});
											}
										});
										
									});

								});

							});
							
						}else{
							reject([false,"4"]);
						}
					});
					
				}else{
					reject([false,"2"]);
				}
			});
			
		}else{
			reject([false,"3"]);
		}
		*/
	});
};

module.exports = eje;
