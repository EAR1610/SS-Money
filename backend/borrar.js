var redis = require('redis');

var redisClient = redis.createClient({host : 'localhost', port : 6379});
redisClient.auth('1045671764',function(err,reply) {
	if(!err) {
		console.log("Bien: Verificando la seguridad del sistema redis "+reply+" "+ Date());
	}else{
		console.log('Mal: Configure la seguridad del sistema redis  con > redi-cli.exe CONFIG SET requirepass "carlos-0426269350" '+err+' '+Date());
	}
});

/*
redisClient.keys('contra*',function(err3,reply3){
	if(reply3.length > 0){
		
		var litado = [];
		function iterar(ind,arrs){
			if(ind == arrs.length){
				console.log([true,litado]);
			}else{
				redisClient.get(arrs[ind],function(err,reply) {
					if(reply!==null){
						litado.push(reply);
						ind++;
						iterar(ind,arrs);
					}else{
						ind++;
						iterar(ind,arrs);
					}
				});
			}
		}
		
		iterar(0,reply3);
	}else{
		reject([false,"4"]);
	}
});

*/
	
redisClient.keys('contra*',function(err3,reply3){
	if(reply3.length > 0){
		
		var litado = [];
		function iterar(ind,arrs){
			if(ind == arrs.length){
				console.log("Borrado");
			}else{
				redisClient.del(arrs[ind],function(err,reply) {
					console.log("deletiado "+arrs[ind]);
					ind++;
					iterar(ind,reply3);
				});
			}
		}
		
		iterar(0,reply3);
	}else{
		console.log("No existen datos");
	}
});



redisClient.keys('ex*',function(err3,reply3){
	if(reply3.length > 0){

		var litado = [];
		function iterar(ind,arrs){
			if(ind == arrs.length){
				console.log("Borrado");
			}else{
				redisClient.del(arrs[ind],function(err,reply) {
					console.log("deletiado "+arrs[ind]);
					ind++;
					iterar(ind,reply3);
				});
			}
		}

		iterar(0,reply3);
	}else{
		console.log("No existen datos");
	}
});