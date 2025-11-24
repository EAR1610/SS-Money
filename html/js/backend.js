var backend = this;

backend.dev =  false;

if(!backend.dev){
	backend.usuando = "api-financieracapitalservices.supersistemas.com.gt";
} else {
	backend.usuando = "192.168.1.27:3330";
}

backend.conexionEnvio = function (datos,callback){
	if ("WebSocket" in window){
        if (!backend.dev) {
            var ws = new WebSocket("wss://" + backend.usuando);
        } else {
            var ws = new WebSocket("ws://" + backend.usuando);
        }

		ws.onopen = function(){
			$("#conectado_server")[0].innerText ="true";
			ws.send(datos);
		};
		ws.onmessage = function (evt) {
			ws.close();
			return callback(evt.data);
		};
		ws.onerror = function (evt) {
			toastr.error('Error en la conexion de internet','Atención!');
			$("#conectado_server")[0].innerText ="false";
		};
		window.onbeforeunload = function(event) {
			ws.close();
		};
	} else {
	   return callback(JSON.stringify({"e":true,"m":"WebSocket NOT supported by your Browser"}));
	}
};