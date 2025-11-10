
var numero = process.argv[2];
var path = require('chromedriver').path;

var chrome = require('selenium-webdriver/chrome');

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver'); 
require('chromedriver');
var chromeCapabilities = Capabilities.chrome();

if(process.platform=="win32") {
	var chromeOptions = {
		'args': ['--headless', '--remote-debugging-port=9222', 'no-sandbox']
	};
}else{
	var chromeOptions = {
		'args': [ '--remote-debugging-port=9222', 'no-sandbox'],
		'binary': '/usr/bin/google-chrome-stable'
	};
}
chromeCapabilities.set('chromeOptions', chromeOptions);  

(async function example() {
  let driver = await new Builder().forBrowser('chrome')  
	.withCapabilities(chromeCapabilities)
	.build();

	await driver.getCapabilities();

  try {  
	
	await driver.get('http://www.procuraduria.gov.co/CertWEB/Certificado.aspx?tpo=1');
	await driver.findElement(By.name('ddlTipoID')).sendKeys("Cédula de ciudadanía",Key.ENTER)
	await driver.findElement(By.name('txtNumID')).sendKeys(numero);
	await driver.findElement(By.name('ImageButton1')).sendKeys(Key.ENTER);
	
	var encontrado = false;
	function procesar(interesa,callback){
		if(interesa == "¿Número de colores en la bandera de Colombia?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("3");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cuanto es 2+20?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("22");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cuanto es 3 X 5?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("15");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cuanto es 4+5?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("9")
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cuanto es 12+8?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("20");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cuanto es 6 X 6?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("36");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cual es la Capital de Colombia? (Sin tilde)"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("bogota");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cual es la Capital del Valle del Cauca? (Sin tilde)?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("cali");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cual es la Capital de Antioquia? (Sin tilde)"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("medellin");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿ Cual es la Capital del Atlantico? (Sin tilde)"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("barranquilla");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿Escriba los tres primeros digitos del documento a consultar?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys(numero.substr(0,3));
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿Cuanto es 22+8?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys("30");
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else if(interesa == "¿Escriba los dos ultimos digitos del documento a consultar?"){
			driver.findElement(By.name('txtRespuestaPregunta')).sendKeys(numero.substr(numero.length-2,numero.length-1));
			driver.findElement(By.name('btnConsultar')).sendKeys(Key.ENTER);
			encontrado = true;
			return callback(true);
		}else{ 
			driver.findElement(By.name('ImageButton1')).sendKeys(Key.ENTER);
			return callback(false);
		}
	}
	var ins = false;
	async function start(){
		if(!ins){
			setTimeout(async function(){
				let elements = await driver.findElements(By.id('lblPregunta'));
				elements.forEach(async function(element, index) {
					element.getText().then(function(textoPregunta) {
						procesar(textoPregunta.trim(),function(sa){
							if(!sa){
								start();
							}else{
								ins = true;
								start();
							}			
						});
					}, console.log);
				});
			},700);
		}else{
			var nombre = "",un = 0,rastro = false;
			setTimeout(async function(){
				
				try{
					let elements = await driver.findElements(By.xpath("//*[@id='divSec']/div/span"));
					elements.forEach(async function(element, index) {
						element.getText().then(function(textoPregunta) {
							rastro = true;
							nombre = nombre + " " + textoPregunta;
							un++;
							if(un==4){
								console.log(nombre+'_'); 
							}
						}, console.log);
					});
				}catch(e){
					console.log("_");
				}
				
				let elementsx = await driver.findElements(By.xpath("//*[@id='divSec']"));
				elementsx.forEach(async function(elementa, index) {
					elementa.getText().then(function(textoPreguntax) {
						if(textoPreguntax.indexOf("El ciudadano no presenta antecedentes")!==-1){
							console.log('No');
						}else{
							if(!rastro){
								console.log("_");
							}
							console.log('Si');
						}
					}, console.log);
				});
				
				var tes = "";
				let elementsx2 = await driver.findElements(By.xpath("//*[@id='divSec']/div[2]/div/table[2]/tbody/tr[position()>1]"));
				elementsx2.forEach(async function(elementa2, index) {
					elementa2.getText().then(function(textoPreguntaxd) {
						tes = tes + " - " +textoPreguntaxd;
					}, console.log);
				});
				setTimeout(function(){
					console.log('_'+tes);
				},700);
				setTimeout(function(){
					driver.quit();
				},2000);
				
			},2000);
		}
	}
	start();

  } finally {  
	//await driver.quit();  
  }
})();
