//Nota: tipo1="Cedula"; y tipo2="Nit";

//node simple.js "8702925" "1234" "1"
//node simple.js "1234587425" "1234" "2"
var path = require('chromedriver').path,
	cedula = process.argv[2],
	passw = process.argv[3].split(""),
	tipol = process.argv[4],
	click1 = passw[0],
	click2 = passw[1],
	click3 = passw[2],
	click4 = passw[3];
	
var chrome = require('selenium-webdriver/chrome');

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver'); 
require('chromedriver');
var chromeCapabilities = Capabilities.chrome();

if(process.platform=="win32") {
	
	var fs = require('fs'),dir = 'C:\\home',dir2 = 'C:\\home\\simple';
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
		if (!fs.existsSync(dir2)){
			fs.mkdirSync(dir2);
		}
	}
	
	var chromeOptions = {
		'args': ['--remote-debugging-port=9222', 'no-sandbox'],
		'prefs': {  
			'download.default_directory': 'C:\\home\\simple',
			'download.prompt_for_download': false,
			'profile.default_content_settings.popups': 0,
			'download.directory_upgrade': true
        }  
	};
}else{
	/*var fs = require('fs'),dir = '/home',dir2 = '/home/simple';
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
		if (!fs.existsSync(dir2)){
			fs.mkdirSync(dir2);
		}
	}*/
	
	var chromeOptions = {
		'args': ['--remote-debugging-port=9222', 'no-sandbox'],
		'binary': '/usr/bin/google-chrome-stable',
		'prefs': {  
			'download.default_directory': '/home/simple',
			'download.prompt_for_download': false,
			'profile.default_content_settings.popups': 0,
			'download.directory_upgrade': true
        }
	};
}

chromeCapabilities.set('chromeOptions');  

function lectura(){
	
	function procesar(filex){
		var XLSX = require('xlsx'),workbook = XLSX.readFile(filex),sheet_name_list = workbook.SheetNames;
		
		var outr = [];
		var initi = 9;
		for(x = initi; x < 100; x++){
			var les = "I"+x;
			try{
				outr.push({"fecha1":workbook.Sheets['Estructura reporte']["E"+x].v,"fecha2":workbook.Sheets['Estructura reporte']["F"+x].v,"periodo":workbook.Sheets['Estructura reporte']["H"+x].v,"situacion":workbook.Sheets['Estructura reporte']["I"+x].v,"precio":workbook.Sheets['Estructura reporte']["K"+x].v,"codigo":workbook.Sheets['Estructura reporte']["A"+x].v});
			}catch(e){
				x = 100;
			}
		}
		setTimeout(function(){
			var dar = JSON.stringify(outr);
			console.log(dar);
			var fs = require('fs');
			fs.unlink(filex, function (err) {}); 
		},8000);
	}
	
	if(process.platform=="win32") {
		
		var fs = require('fs'),path = require('path'),dir = 'C:\\home\\simple';
		fs.readdir(dir, (err, files) => {
			files.forEach((file) => {
				if(file.indexOf("~")==-1 && file.indexOf(".xlsx")>-1){
					procesar(dir+"\\"+file);
				}
			});
		});
		
	}else{
		
		var fs = require('fs'),path = require('path'),dir = '/home/moneyengeneering/Descargas/';
		fs.readdir(dir, (err, files) => {
			files.forEach((file) => {
				if(file.indexOf("~")==-1 && file.indexOf(".xlsx")>-1){
					procesar(dir+"/"+file);
				}
			});
		});
		
	}
	

}

(async function example() {
  var driver = await new Builder().forBrowser('chrome')  
	.withCapabilities(chromeCapabilities)
	.build();

	await driver.getCapabilities();
	
	try{  

		await driver.get('https://www.simple.co/sso/#/login');
		if(tipol=="1"){
			await driver.findElement(By.id('doc-types')).sendKeys("Cédula de ciudadanía",Key.ENTER);
		}else{
			await driver.findElement(By.id('doc-types')).sendKeys("Permiso especial de permanencia",Key.ENTER);
		}
		await driver.findElement(By.id('nro-doc-login')).sendKeys(cedula);
		await driver.findElement(By.id('login-continue')).sendKeys(Key.ENTER);
		
		setTimeout(async function(){
			
			await driver.findElement(By.id(click1)).click();
			await driver.findElement(By.id(click2)).click();
			await driver.findElement(By.id(click3)).click();
			await driver.findElement(By.id(click4)).click();
			await driver.findElement(By.id('login')).click();
			
			var encon = false;
			function volvere(){ 
				driver.findElement(By.linkText("Autoliquidación de aportes")).then(function(webElement) {
					
					setTimeout(async function(){
						driver.findElement(By.linkText("Autoliquidación de aportes")).click();
						setTimeout(async function(){
							driver.findElement(By.linkText("Planillas en línea")).click();
							setTimeout(async function(){
								
								driver.switchTo().frame(0);
								driver.findElement(By.xpath("//a[@id='btn_consultar']/img")).click();
								setTimeout(async function(){
									
									driver.findElement(By.xpath("//a[@id='btnExcelConsultaPlanillas']/div")).click();
									setTimeout(async function(){
										lectura();
									},5000);
									
								},5000);
							},5000);
						},5000);
					},5000);
					
				}, function(err) {
					if (err.state && err.state === 'no such element') {
						volvere();
					} else {
						volvere();
					}
				});
			}
			
			volvere();
			
		},3000);

		
	} finally {  
		//await driver.quit();  
	}
})();

