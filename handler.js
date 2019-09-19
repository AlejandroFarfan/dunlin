'use strict';

const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const getChrome = require("./getChrome");

module.exports.takeScreenshot = async (event, context, callback) => {
    
  const targetUrl = event.url;
	
	if(( targetUrl )){
		console.log("ok", targetUrl);
	}else{
		console.log("Not ok");
	}	
  const chrome = await getChrome();
  const browser = await puppeteer.connect({
	  browserWSEndpoint: chrome.endpoint,
    defaultViewport: { height: 1080, width: 1920 ,isMobile:true}
  });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl , {
		waitUntil: ["domcontentloaded", "networkidle2"]
	});
	
	var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+'_'+time;
	
	await page.screenshot({path: `screenshot-${dateTime}.png`});
	
	const buffer = await page.screenshot();
    await s3.putObject({
		Bucket: process.env.BUCKET,
		Key: `screenshot-${dateTime}.png`,
		Body: buffer,
		ContentType: 'image/png',
		ACL: 'public-read'
	}, (err) => {
		if(err) {
			console.log(err);
		}
	});
		
//    }).promise();
  }catch (error) {
	  console.log(error);
  } finally {
    await browser.close();
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  });
};

