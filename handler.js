'use strict';

const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.hello = async (event, context) => {
  const htmlPage = `
    <!DOCTYPE html>
    <head>
      <style>
        html {
          background: linear-gradient(#FF8126, #FF117E) fixed;
          background-size: cover;
          height: 100%;
        }
        body {
          font-family: "SF Compact Display";
          font-weight: 300;
          font-size: 25px;
          background: url("https://example.com/phone.png") no-repeat top;
          height: 100%;
          width: 900px;
        }
        .container {
          background-color: white;
          padding: 0 20px 20px;
          margin-bottom: 6px;
          border-radius: 0 0 15px 15px;
          font-size: 1em;
          position: absolute;
          left: 172px;
          width: 540px;
          top: 550px;
          min-height: 100px;
        }
        .heading {
          font-family: "SF Compact Text";
          font-size: 1em;
          font-weight: bold;
          margin: 0 0 3px 0;
        }
        .content {
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h3 class="heading">🍍 Hayy 🍍</h3>
        <div class="content">
          Be a pineapple. Stand tall, wear a crown, and be a little sweet on the inside.
        </div>
      </div>
    </body>
  `;

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { height: 900, width: 900 }
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlPage);
    const buffer = await page.screenshot();
    await s3.putObject({
      Bucket: process.env.BUCKET,
      Key: "screenshot.png",
      Body: buffer,
      ContentType: 'image/png'
    }).promise();
  } finally {
    await browser.close();
  }


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };
};

