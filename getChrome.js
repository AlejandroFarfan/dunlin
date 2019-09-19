const launchChrome = require("@serverless-chrome/lambda");
const request = require("superagent");

const getChrome = () => {
    const chrome = launchChrome();

    const response = request
        .get(`${chrome.url}/json/version`)
        .set("Content-Type", "application/json");

    const endpoint = response.body.webSocketDebuggerUrl;

    return {
        endpoint,
        instance: chrome
    };
};

module.exports = getChrome;