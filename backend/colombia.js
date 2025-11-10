//node colombia3.js "19210513" "chrome"
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
		'args': [ '--headless','--remote-debugging-port=9222', 'no-sandbox']
	};
}else{
	var chromeOptions = {
		'args': ['--headless', '--remote-debugging-port=9222', 'no-sandbox'],
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
	
	await driver.get('http://www.datajuridica.com/');
	await driver.findElement(By.xpath("//input[@name='optradio' and @value='3']")).click();
	await driver.findElement(By.id("iDocumento")).sendKeys(numero,Key.ENTER)
	var nomb_completo = await driver.findElement(By.xpath("//table[@class='table']/tbody/tr[1]/td[1]")).getText();
	console.log(nomb_completo+"_No_");
  } finally {  
	//await driver.quit();  
  }
})();