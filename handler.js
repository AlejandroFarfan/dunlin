'use strict';

const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const getChrome = require("./getChrome");

module.exports.takeScreenshot = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
 console.log('Received event:', JSON.stringify(event, null, 2));
  const eventurl = event.url;
  const eventbody = event.body;
  var urlPostApi;
  if(eventbody){
	  const body = JSON.parse(eventbody);
	  urlPostApi = body.url;
  }
   
   var targetUrl;
   if(eventurl){
	   targetUrl=eventurl;
	}else if(urlPostApi){
		targetUrl=urlPostApi;
	}else{
		return {
			statusCode: 422,
			body: JSON.stringify({
			  message: 'Error: Url is not valid',
			  url: `${targetUrl}`
			}),
		};	
	}	
  const chrome = await getChrome();  
  const  browser = await puppeteer.connect({
		  browserWSEndpoint: chrome.endpoint,
		  defaultViewport: { height: 1080, width: 1920 ,isMobile:true},
		  args: ['--no-sandbox', '--disable-setuid-sandbox']
	  });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl , {
		waitUntil: ["domcontentloaded", "networkidle2"]
	});
	
	var today = await new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + "" + today.getMinutes() + "" + today.getSeconds();
    var dateTime = date+'_'+time;
	
	//await page.screenshot({path: `screenshot-${dateTime}.png`});
	
	const buffer = await page.screenshot();
	var params = {
		Bucket: process.env.BUCKET,
		Key: `screenshot-${dateTime}.png`,
		Body: buffer,
		ContentType: 'image/png',
		ACL: 'public-read'
	};
	var putObjectPromise = await s3.upload(params).promise();
	var datalocation = putObjectPromise.Location;
	console.log(`${datalocation}`);
	await browser.disconnect();
	return {
		statusCode: 200,
		body: JSON.stringify({
		  url: `${datalocation}`
		}),
	};
  }catch (error) {
	  console.warn(error);
	  await browser.disconnect();
	  return {
		statusCode: 421,
		body: JSON.stringify({
		  message: 'Error: Url can not be rendered',
		  error: `${error}`
		})
	  };	  
   }
   return {
		statusCode: 210
	}
};

