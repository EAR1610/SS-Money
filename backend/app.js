var redis = require('redis');
var dev = false;
const { generarReportePagos } = require('./reportes/estado_cuenta_contrato');
const { generarTicketPago } = require('./ticket_pago/ticket_pago');
const { generarReporteCierre } = require('./reportes/reporte_cierre');

/*
	? Este codigo es el core del sistema
*/

/*
	? Solo una variable me indica si estoy en produccion o desarrollo
*/

if(!dev){
	var redisClient = redis.createClient({ host : 'redis-10495.c83.us-east-1-2.ec2.redns.redis-cloud.com', port : 10495 });
	redisClient.auth('RAABKOGsZg1BXOrmvyKyjgY6xfMV6QfX',function(err,reply) {
		console.log(err);
		if(!err) {
			console.log("Bien: Verificando la seguridad del sistema redis "+reply+" "+ Date());
		} else {
			console.log('Mal: Configure la seguridad del sistema redis  con > redi-cli.exe CONFIG SET requirepass "carlos-0426269350" '+err+' '+Date());
		}
	});
}else{
	var redisClient = redis.createClient({host : 'localhost', port : 6379});
	redisClient.auth('1045671764',function(err,reply) {
		if(!err) {
			console.log("Bien: Verificando la seguridad del sistema redis "+reply+" "+ Date());
		}else{
			console.log('Mal: Configure la seguridad del sistema redis  con > redi-cli.exe CONFIG SET requirepass "carlos-0426269350" '+err+' '+Date());
		}
	});
}

/*
	* Conexion buena o no mediantes estos eventos en redis
*/
redisClient.on('ready',function() {
	console.log("Bien: Redis is ready... OK "+ Date());
});

redisClient.on('error',function() {
	console.log("Mal: Error in Redis "+Date());
});
/*
	* Siempre asignaré la clave de acceso del root
*/
var arrays = [ "admin@prestamoselamigo.com","123","2019-04-15 00:53:46",true,0,"1000000","Super Admin" ];
redisClient.set("usuario_admin@prestamoselamigo.com_1000000",JSON.stringify(arrays),function(err2,reply2){
	console.log("Asignacion de cuenta admin");
});

var WebSocketServer = require('websocket').server;
var http = require('http');

// * Modificar el servidor HTTP para manejar solicitudes específicas
var server = http.createServer(async function(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  // ? Endpoint ejemplo: /reporte?asesor=2809258&contrato=1&dpi=2222222222222
  if (url.pathname === '/reporte' && request.method === 'GET') {
    const asesor = url.searchParams.get('asesor');
    const contrato = url.searchParams.get('contrato');
    const dpi = url.searchParams.get('dpi');
	const configuracion = url.searchParams.get('configuracion');
	const plan = url.searchParams.get('plan');

    if (!asesor || !contrato || !dpi || !configuracion || !plan) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Faltan parámetros: asesor, contrato, dpi, configuracion o plan' }));
      return;
    }

    await generarReportePagos(response, redisClient, asesor, contrato, dpi, configuracion, plan);
    return;
  } else if (url.pathname === '/ticket' && request.method === 'GET') {
    // Ruta para ticket de pago
    const fecha = url.searchParams.get('fecha');
    const asesor = url.searchParams.get('asesor');
    const cliente = url.searchParams.get('cliente');
    const numeroCuota = url.searchParams.get('numeroCuota');
    const montoPagado = url.searchParams.get('montoPagado');
    const saldoPendiente = url.searchParams.get('saldoPendiente');
    const saldoAnterior = url.searchParams.get('saldoAnterior');
    const fechaVencimiento = url.searchParams.get('fechaVencimiento');
    const configId = url.searchParams.get('configId');
    const plan = url.searchParams.get('plan');

    if (!fecha || !asesor || !cliente || !numeroCuota || !montoPagado || !saldoPendiente || !saldoAnterior || !fechaVencimiento || !configId || !plan) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Faltan parámetros requeridos para el ticket' }));
      return;
    }

    await generarTicketPago(response, redisClient, fecha, asesor, cliente, numeroCuota, montoPagado, saldoPendiente, saldoAnterior, fechaVencimiento, configId, plan);
    return;
  } else if (url.pathname === '/reporte-cierre' && request.method === 'GET') {
    // Ruta para reporte de cierre
    const token = url.searchParams.get('token');
    const idAsesor = url.searchParams.get('idAsesor');
    const idConfiguracion = url.searchParams.get('idConfiguracion');
    const fecha = url.searchParams.get('fecha');

    if (!token || !idAsesor || !idConfiguracion || !fecha) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Faltan parámetros: token, idAsesor, idConfiguracion o fecha' }));
      return;
    }

    await generarReporteCierre(response, redisClient, token, idAsesor, idConfiguracion, fecha);
    return;
  }

  // * Respuesta por defecto
  response.writeHead(200);
  response.write("Online:active:3335");
  response.end();
});
/*
	* Conexion escucho ws en el puerto 3016
*/
server.listen(3016, function() {
	console.log("Online:active:3016");
});

wsServer = new WebSocketServer({
	maxReceivedFrameSize: 20204848, //bytes
	maxReceivedMessageSize: 20482048, //bytes
	autoAcceptConnections: false,
	httpServer: server
});

wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	connection.on('message', function(message) {
		if( message.type === 'utf8' ) {
			try {				
				/*
					* Recibo un array lo parseo y lo redirigo a la funcion que se necesite
				*/
				var text = JSON.parse(message.utf8Data.toString());
				var ejecucion = require('./modelos/'+text.r+'');
				ejecucion(text.d,text.r,redisClient).then(function(info) {
					connection.send(JSON.stringify({"e":false,"d":info}));
				}).catch(function(err){
					connection.send(JSON.stringify({"e":true,"d":err}));
				});
			} catch( e ){
				connection.send(JSON.stringify({"e":true,"d":e}));
			}		
		}
	});
	connection.on('close', function(connection) {
		console.log("Bien: salida de usuario: "+request.origin);
	});  
});