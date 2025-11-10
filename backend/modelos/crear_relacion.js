eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;		
		/* Recibe token, tipoCargo, asesor y superviros*/		
		if (arrays.length==4){		
			var jwt = require('jsonwebtoken');
			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				}else if(decoded.t=="1"){

					//["eyVHyXo","c","2652592_asesor_2019-05-08 11:52:10_JUAN_MENCO","7495148_supervisor_2019-05-09 16:34:08_CARMITA_FONSECA"]

					var moment = require("moment-timezone");
					var hoy = moment().tz("America/Guatemala").format('DD_MM_YYYY');
					var uni = arrays[3].split("_");
					var uni2 = arrays[2].split("_");
					var existeAsesor = false;
					arrays[0]=hoy;					

					redisClient.keys("asig_"+uni[1]+"_"+uni[2]+"_*",function (sali,slai) {
						redisClient.keys("asig_" + uni[1] + "_*_" + uni[0] + "_" + hoy,function (salix,slais) {	
							if( slais !== undefined && slais !== null){
								redisClient.keys("asig_supervisor_"+arrays[3].split("_")[2]+"_*_*", function(errorAsesores, replyAsesores){
									if( replyAsesores !== null && replyAsesores !== undefined){
										if( replyAsesores.length > 0 ){
											for ( let i = 0; i < replyAsesores.length; ++i ){
												if( replyAsesores[i].split("_")[7] === arrays[2].split("_")[0] ){
													existeAsesor = true;
												}
											}
											if(existeAsesor){
												reject([false,"6"]);									
											} else {										
												if (slais.length > 0) {
													reject([false,"6"]);
												}else{
													redisClient.set("asig_" + uni[1] + "_" + uni[2] + "_" + uni[0] + "_" + hoy+"_"+uni2[0], JSON.stringify(arrays), function (err, reply) {
														resolve([true, true]);
													});
												}
											}
										} else {									
											if (slais.length > 0) {
												reject([false,"6"]);
											}else{
												redisClient.set("asig_" + uni[1] + "_" + uni[2] + "_" + uni[0] + "_" + hoy+"_"+uni2[0], JSON.stringify(arrays), function (err, reply) {
													resolve([true, true]);
												});
											}
										}
									} 
								})
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
