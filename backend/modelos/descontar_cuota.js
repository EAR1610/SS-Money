/*
	* ## Descripción General
	Este módulo maneja el proceso de descuento de cuotas en un sistema de préstamos. Permite registrar pagos de cuotas, actualizar el estado de los contratos y gestionar los registros en la base de datos Redis.

	* ## Función Principal
	### eje(arrays, origen, redisClient)
	Descripción : Procesa el pago de cuotas de un contrato y actualiza su estado en la base de datos.

	* Parámetros :

	- arrays : Array con 5 elementos:
	- arrays[0] : Token JWT para autenticación
	- arrays[1] : ID del asesor
	- arrays[2] : Monto de la cuota a pagar
	- arrays[3] : ID del contrato
	- arrays[4] : Cédula del cliente
	- origen : Origen de la solicitud (no utilizado en el código actual)
	- redisClient : Cliente de Redis para operaciones en la base de datos
	Retorno :

	- Promise que resuelve a [true, interno, sreeply] si la operación es exitosa
	- Promise que rechaza con [false, código_error] si hay errores
	## Flujo de Trabajo
	* 1. Validación inicial :
	
	- Verifica que el array tenga 5 elementos
	- Valida el token JWT y comprueba que el usuario tenga permisos (tipo 1 o 2)
	* 2. Búsqueda del contrato :
	
	- Busca el contrato usando la cédula y el ID del contrato
	- Obtiene la información del cliente asociado
	* 3. Procesamiento de cuotas :
	
	- Recorre la lista de cuotas ( lista_contrato ) del contrato
	- Calcula totales: adelantos, cuotas completas, finiquitadas, etc.
	- Actualiza el estado de cada cuota según el monto pagado:
		- Si el monto es menor que la cuota y hay pago parcial previo
		- Si el monto es igual a la cuota
		- Si el monto es mayor que la cuota
		- Si es un pago exacto
		- Si es un pago parcial
	* 4. Registro de estadísticas :
	
	- Guarda información de pagos para el asesor
	- Registra el monto liquidado
	- Almacena la fecha y hora del pago

	* 5. Finalización del proceso :	
	- Si el pago cubre exactamente el saldo pendiente: marca el contrato como pagado y lo renombra
	- Si el pago es mayor que el saldo: marca el contrato como pagado y registra el sobrepago
	- Si es un pago parcial: actualiza el estado del contrato

	* ## Códigos de Error
	- 1 : Error en la verificación del token JWT
	- 2 : Usuario sin permisos suficientes
	- 3 : Número incorrecto de parámetros
	- 4 : Contrato no encontrado

	* ## Estructura de Datos
	- Contrato : Almacenado en Redis con clave registry_[cedula]_contrato_*_*_[idcontrato]
	- Cliente : Almacenado en Redis con clave cliente_[cedula]
	- Cuota : Objeto con propiedades:
	- ct : Boolean que indica si la cuota está completada
	- pe : Monto pagado parcialmente
	- cp : Valor total de la cuota
	- pago : Fecha del último pago

	* ## Observaciones
	- El código utiliza Redis como base de datos principal
	- Se manejan diferentes escenarios de pago (exacto, parcial, sobrepago)
	- Se registran estadísticas de pagos por asesor
	- Se utiliza moment-timezone para manejar fechas en la zona horaria de Guatemala
 */

eje = function(arrays,origen,redisClient) {
	return new Promise(function(resolve, reject) {
	
		var textos = /^[A-Za-z\s]{0,100}/;
		var coment = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,100}/;
		var numero = /^[0-9\.\,]{0,10}/;
		var largoc = /^[A-Za-z0-9\-\_\.\;\#\$\%\s]{0,300}/;
		var valurl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
		var correo = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
		var infoContrato

		/*          0            1         2         3        4
			* Recibo tokens, idasesor, Numcuota, idcontrato, cedula
		*/
		
		if ( arrays.length == 5 ){
			var jwt = require('jsonwebtoken');
			var contratoModadlidadMensual = false
			var cuotaACancelar = 0

			jwt.verify(arrays[0], 'clWve-G*-9)1', function(err, decoded) {
				if (err) {
					reject([false,"1"]);
				} else if( decoded.t=="1" || decoded.t=="2" ){

					if( arrays[2]!=="" && arrays[2]!=="0" && arrays[2]!==0 ){
						/*
							? Busco contrato y traigo la información
						*/
						redisClient.keys("registry_"+arrays[4]+"_contrato_*_*_"+arrays[3],function(err,reply) {
							if( reply != null && reply != undefined ){
								if( reply.length > 0 ){
									var origena = reply[0], cedulax = origena.split("_") ;

									redisClient.get(origena, function ( ersr, reeplyOrigena ) {
										if ( reeplyOrigena != null && reeplyOrigena != undefined ){
											infoContrato = JSON.parse(reeplyOrigena);
											if(infoContrato[10] == "8") contratoModadlidadMensual = true
										}
									});
									
									/*
										? Busco el cliente de ese contrato
									*/
									
									redisClient.get("cliente_"+cedulax[1], function (qersr, sreeply) {
										redisClient.get(reply[0], function (ersr, reeply) {
											
											var interno = JSON.parse(reeply);
											var lista_contrato = interno[13],
												monto = parseInt(arrays[2].toString().replace(".","")),
												monto2 = monto,
												adelantos = 0,
												complete = 0,
												finiquite = 0,
												tota = 0,
												tolete = 0;
											
											for(var indiceCuota = 0; indiceCuota < lista_contrato.length; indiceCuota++){

												if(lista_contrato[indiceCuota].ct || lista_contrato[indiceCuota].pe> 0) finiquite++;
												adelantos = adelantos + lista_contrato[indiceCuota].pe;

												if(lista_contrato[indiceCuota].pe> 0) tota = tota + (parseInt(lista_contrato[indiceCuota].cp) - parseInt(lista_contrato[indiceCuota].pe));												

												if(lista_contrato[indiceCuota].pe> 0){
													tolete = tolete + (parseInt(lista_contrato[indiceCuota].cp) - parseInt(lista_contrato[indiceCuota].pe));
												} else if(!lista_contrato[indiceCuota].ct){
													tolete = tolete + (parseInt(lista_contrato[indiceCuota].cp));
												}
	
												if(!lista_contrato[indiceCuota].ct)complete++;
												
												var canti = parseInt(lista_contrato[indiceCuota].cp);
												var moment = require("moment-timezone");
												var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
												
												if( !lista_contrato[indiceCuota].ct ) {
													if( monto < canti && lista_contrato[indiceCuota].pe != 0){ // ? Si el monto es menor que la cuota y hay pago parcial previo
														monto += lista_contrato[indiceCuota].pe;
														if(monto < canti) {
															lista_contrato[indiceCuota].pe = monto;
															lista_contrato[indiceCuota].pago = dia;
															monto=0;
														} else if (monto == canti){
															lista_contrato[indiceCuota].ct = true;
															lista_contrato[indiceCuota].pe = 0;
															lista_contrato[indiceCuota].pago = dia;
															monto=0;
														} else{
															lista_contrato[indiceCuota].ct = true;
															lista_contrato[indiceCuota].pe = 0;
															lista_contrato[indiceCuota].pago = dia;
															monto -= canti;
														}

													} else if (monto > canti &&  lista_contrato[indiceCuota].pe != 0) { // ? Si el monto es igual a la cuota
														monto -= (canti - lista_contrato[indiceCuota].pe);
														lista_contrato[indiceCuota].ct = true;
														lista_contrato[indiceCuota].pe = 0;
														lista_contrato[indiceCuota].pago = dia;

													} else if (monto > canti &&  lista_contrato[indiceCuota].pe == 0) { // ? Si el monto es mayor que la cuota
														lista_contrato[indiceCuota].ct = true;
														monto = monto - parseInt(lista_contrato[indiceCuota].cp);
														lista_contrato[indiceCuota].pago = dia;

															/**
															 * ? Si es modalidad mensual y paga el valor restande del contrato, entonces no 
															 * ? necesitamos salirnos del bucle.
														 	*/

														if ( contratoModadlidadMensual && ( parseInt(arrays[2]) != parseInt(infoContrato[8].toString().replace(".",""))) ) {
															/*
																*	Obtener tolete y salirnos del bucle.
															*/
															for(var indiceCuota = 0; indiceCuota < lista_contrato.length; indiceCuota++){
																if(lista_contrato[indiceCuota].pe> 0){
																	tolete = tolete + (parseInt(lista_contrato[indiceCuota].cp) - parseInt(lista_contrato[indiceCuota].pe));
																} else if(!lista_contrato[indiceCuota].ct){
																	tolete = tolete + (parseInt(lista_contrato[indiceCuota].cp));
																}
															}
															break;
														}
														console.log("Se sigue el for principal")

													} else if (monto == canti && lista_contrato[indiceCuota].pe == 0) { // ? Si es un pago exacto
														lista_contrato[indiceCuota].ct = true;
														monto = 0;
														lista_contrato[indiceCuota].pago = dia;

													} else if(lista_contrato[indiceCuota].pe == 0 && monto>0){ // ? Si es un pago parcial
														lista_contrato[indiceCuota].ct = false;
														lista_contrato[indiceCuota].pe = monto;
														monto = 0;
														lista_contrato[indiceCuota].pago = dia;														
													}
												}
											}

											// ? Obtenemos el indice de la cuota que no ha sido cancelada
											for(var indiceCuota = 0; indiceCuota < lista_contrato.length; indiceCuota++){
												if( !lista_contrato[indiceCuota].ct && lista_contrato[indiceCuota].pe == 0 ){
													cuotaACancelar = indiceCuota;
													break;
												}
											}

											/*
												* descuento y sumo los valores que necesito calcular
											*/										
											var asesorw = arrays[1];

											if( arrays[2] == lista_contrato[lista_contrato.length-1].cp ){
												redisClient.get("tolete_"+asesorw+"_"+fechaqx2, function (errex, rewprelyx) { 
													if(rewprelyx == null){
														redisClient.set("tolete_"+asesorw+"_"+fechaqx2,JSON.stringify({"n":1,"c":arrays[2]}), function (errex, rewprelyx) {});
													}else{
														var infqo = JSON.parse(rewprelyx);
														var sumo1 = parseInt(infqo.n) +1;
														var sumo2 = parseInt(infqo.c) + parseInt(arrays[2]);
														redisClient.set("tolete_"+asesorw+"_"+fechaqx2,JSON.stringify({"n":sumo1,"c":sumo2}), function (errex, rewprelyx) {});
													}
												});
											}
	
											redisClient.set("liquido_"+arrays[4]+"_"+fechaq+"_"+arrays[2]+"_"+lista_contrato[lista_contrato.length-1].cp,"true", function (errex, rewprlyx) { 
											});
	
											var moment = require("moment-timezone"),fechaqx2 = moment().tz("America/Guatemala").format('YYYY-MM-DD');													
											var fechaq = moment().tz("America/Guatemala").format('YYYY-MM-DD_hh_mm_A'),asesorw = arrays[1];
											redisClient.set("monto_" + asesorw + "_"+arrays[2]+"_"+fechaq+"_"+arrays[3]+"_"+cedulax[1],"true", function (errex, rewprlyx) {
											});
	
											if ( tolete == monto2 ) { // ? Si pago exacto
												console.log("Si pago exacto")
												interno[13] = lista_contrato;

												redisClient.set(origena,JSON.stringify(interno),function(errx,replyxs) {
													redisClient.rename(origena,"old_"+origena,function(errx,replyx) {
														var moment = require("moment-timezone");
														var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
														var bou = [interno,arrays[2]];
														redisClient.set('cancelado_'+arrays[1]+"_"+dia,JSON.stringify(bou),function(err3,reply3){															
															redisClient.get("registro_contrato_"+arrays[1], function (errx, repslyx) {
																var infes = JSON.parse(repslyx), nuva =[];
																for(var j = 0; j < infes.length; j++){
																	if(infes[j].indexOf(origena)==-1){
																		nuva.push(infes[j]);
																	}
																	if(j==infes.length-1){
																		redisClient.set("registro_contrato_"+arrays[1],JSON.stringify(nuva), function (errx, repslyx) {
																			resolve([true,interno,sreeply]);
																		});
																	}
																}
															});													
														});													
													});												
												});
											} else if( tolete < monto2 ){ // ? si pago demas (tolete = resto del contrato, monto2 = valor pagado)
												console.log("Si pagó demás")

												interno[13] = lista_contrato;
												redisClient.set(origena,JSON.stringify(interno),function(errx,replyxs) {

													redisClient.rename(origena,"old_"+origena,function(errx,replyx) {

														var moment = require("moment-timezone");
														var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
														var bou = [interno,arrays[2]];
														
														redisClient.set('cancelado_'+arrays[1]+"_"+dia,JSON.stringify(bou),function(err3,reply3){

															redisClient.get("registro_contrato_"+arrays[1], function (errx, repslyx) {

																var infes = JSON.parse(repslyx), nuva =[];

																for(var j = 0; j < infes.length; j++){
																	if(infes[j].indexOf(origena)==-1){
																		nuva.push(infes[j]);
																	}
																	if(j==infes.length-1){																		
																		redisClient.set("registro_contrato_"+arrays[1],JSON.stringify(nuva), function (errx, repslyx) {
																			resolve([true,interno,sreeply]);
																		});
																	}
																}
															});															
														});														
													});													
												});											
											} else { // ? Descuento normal

												 /**
												 	* ? Si es contrato mensual, verificamos los pagos para reajustarlos...
												 */

												console.log("Descuento normal");

												if ( contratoModadlidadMensual ) {
													let proximaCuotaACancelar = parseInt( lista_contrato[ cuotaACancelar ].cp );

													// ? Si la cuota pagada es igual al valor del contrato, modificamos los registros para dejar el contrato en cancelado.
													if ( parseInt(arrays[2]) == infoContrato[8].toString().replace(".","") ) {
														var lista_contrato_finalizado = []
														for (let indice = 0; indice < cuotaACancelar; indice++) {
															lista_contrato_finalizado[indice] = lista_contrato[indice];
														}
														interno[13] = lista_contrato_finalizado;

														/**
														 * * RENOMBRAMOS EL CONTRATO FINALIZADO
														 */
														
														redisClient.set(origena,JSON.stringify(interno),function(errx,replyxs) {
															redisClient.rename(origena,"old_"+origena,function(errx,replyx) {
																var moment = require("moment-timezone");
																var dia = moment().tz("America/Guatemala").format('YYYY-MM-DD');
																var bou = [interno,arrays[2]];
																redisClient.set('cancelado_'+arrays[1]+"_"+dia,JSON.stringify(bou),function(err3,reply3){															
																	redisClient.get("registro_contrato_"+arrays[1], function (errx, repslyx) {
																		var infes = JSON.parse(repslyx), nuva =[];
																		for(var j = 0; j < infes.length; j++){
																			if(infes[j].indexOf(origena)==-1){
																				nuva.push(infes[j]);
																			}
																			if(j==infes.length-1){
																				redisClient.set("registro_contrato_"+arrays[1],JSON.stringify(nuva), function (errx, repslyx) {
																					resolve([true,interno,sreeply]);
																				});
																			}
																		}
																	});													
																});													
															});												
														});
													} else if ( proximaCuotaACancelar < parseInt(arrays[2]) ) { // ? Si la proxima cuota a cancelar es menor que la cuota pagada, reajustamos el pago...
														let valorContrato = parseInt(interno[3].replace(".",""));
														let nuevoValorContrato = valorContrato - ( parseInt( arrays[2].replace(".","") - proximaCuotaACancelar) );
														interno[3] = nuevoValorContrato.toString();														
														interno[8] = ( nuevoValorContrato + ( ( nuevoValorContrato * parseInt( interno[7].replace(".","") ) ) / 100 ) ).toString();
														let nuevaCuotaValor = ( ( parseInt( interno[7] ) * nuevoValorContrato ) / 100 );

														/*
															* REAJUSTAMOS EL VALOR DEL CONTRATO Y LA CUOTA A PAGAR
														*/
														for (let i = cuotaACancelar; i < lista_contrato.length; i++) {
															lista_contrato[i].cp = nuevaCuotaValor.toString();
														}
														interno[13] = lista_contrato;
													}
													contratoModadlidadMensual = false

													// ? Actualizamos el contrato en redis
													redisClient.set(origena,JSON.stringify(interno),function(errx,replyxs) {
														resolve([true,interno,sreeply]);
													});

												} else { // * Los demás contratos (normales)
													interno[13] = lista_contrato;
													
													// ? Actualizamos el contrato en redis
													redisClient.set(origena,JSON.stringify(interno),function(errx,replyxs) {
														resolve([true,interno,sreeply]);
													});
												}																								

											}
										});
									});
								} else {
									reject([false,"4"]);
								}
							} else{
								reject([false,"4"]);
							}
						});
					}
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