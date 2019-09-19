'use strict';

const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const getChrome = require("./getChrome");


module.exports.takeScreenshot = function(event, context, callback) {
   context.callbackWaitsForEmptyEventLoop = false;
  const targetUrl = event.url;
	
	if(( targetUrl )){
		console.log("ok", targetUrl);
		
	}else{
		callback(null, {
		statusCode: 422,
		body: JSON.stringify({
		  message: 'Error: Url is not valid',
		  url: `${targetUrl}`
		}),
	  });
	  return false;
	}	
	console.log("ok1");
  const chrome = getChrome();
  if(!chrome){
	  console.log("ok7");
	  return false;
	}  
  const browser = puppeteer.connect({
	  browserWSEndpoint: chrome.endpoint,
    defaultViewport: { height: 1080, width: 1920 ,isMobile:true}
  });
  console.log("ok2");

  try {
    const page = browser.newPage();
		page.goto(targetUrl , {
		waitUntil: ["domcontentloaded", "networkidle2"]
	});
	console.log("ok3");
	var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + "" + today.getMinutes() + "" + today.getSeconds();
    var dateTime = date+'_'+time;
	
	//await page.screenshot({path: `screenshot-${dateTime}.png`});
	const buffer = page.screenshot();
	console.log("ok4");
	var params = {
		Bucket: process.env.BUCKET,
		Key: `screenshot-${dateTime}.png`,
		Body: buffer,
		ContentType: 'image/png',
		ACL: 'public-read'
	};
	console.log("ok5");
	s3.upload( params,  function (err, data) {
		if(err) {			
			console.warn(err);
			callback(err);			
			return false;
		}
		console.log(`${data.Location}`);
		callback(null, {
			statusCode: 200,
			body: JSON.stringify({
			  url: `${data.Location}`
			}),
		});
		browser.close();
		return true;
	});
		console.log("ok6");
  }catch (error) {
	  console.warn(error);
	  callback(null, {
		statusCode: 421,
		body: JSON.stringify({
		  message: 'Error: Url can not be rendered',
		  error: `${error}`
		}),
	  });
	  browser.close();
	  return false;
  } 
};

