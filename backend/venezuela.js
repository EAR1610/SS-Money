//node venezuela.js "V7692265"
var numero = process.argv[2];

if(numero!==undefined){
	
	var letra = numero.substr(0,1);
	var num = numero.substr(1,numero.length);
	if (!/^([0-9])*$/.test(letra)){
		var request = require("request");
		var options = { method: 'GET',url: 'http://www.cne.gob.ve/web/registro_electoral/ce.php',qs: { nacionalidad: letra.toUpperCase(), ' cedula': num } };
		request(options, function (error, response, body) {
			if (error){
				console.log('__');
			}else{
				if(body.indexOf("no corresponde a un elector")==-1){
					var todos = body,
						inici = todos.indexOf("Nombre:"),
						fin = todos.substr(inici,todos.length),
						finas = fin.indexOf("color"),
						ext= fin.substr(0,finas),
						list = ext.split("<b>"),
						unico = list[1].substr(0,list[1].indexOf("</b>"));
						console.log(unico+'__');
				}else{
					console.log('__');
				}
			}
		});
	}else{
		console.log('__');
	}
	
}else{
	console.log('Sin antecedentes');
	console.log('node venezuela.js "V7692265"');
}
