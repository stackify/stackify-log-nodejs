var os      = require('os'),
    url     = require('url'),
    util    = require('util'),

    send    = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),

    pkginfo = require('pkginfo')(module, 'name'),

    appname = module.exports.name, // name of the app from package.json
    fail_delay = 0, // scheduled delay when postLogs call failed
    last_api_error, 

    //getting all the headers for requests
    options = function options(path, body, proxy) {
        var result =  {
            url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + path,
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Stackify-Key': CONFIG.APIKEY,
                'X-Stackify-PV': 'V1'
            },
            body: body
        };

        if (proxy) {
            result.proxy = proxy;
            CONFIG.PROXY = CONFIG.PROXY || proxy;
        }

        return result;

    };
module.exports.last_api_error = last_api_error;
module.exports.methods = {

    identifyApp: function identifyApp(settings) {
        var body = {
                DeviceName: os.hostname(),
                AppName: appname,
                ConfiguredAppName: appname,
                AppLocaton: process.env.PWD
            },
            opt = options(CONFIG.IDENTIFY_PATH, body, settings ? settings.proxy : undefined),
            callback = function (data) {
                console.log('successfully identified');

                CONFIG.APP_DETAILS = data;
                CONFIG.APIKEY = settings.apiKey;

                logger.methods.send();

            },
            fail = function () {
                setTimeout(function () {
                    send(opt, callback, fail);
                }, CONFIG.IDENTIFY_DELAY);
            };

        console.log('Identifying...');

        // check that settings object is correct
        if (!settings) {
            throw new TypeError('Settings are not provided');
        }

        if (settings.apiKey && typeof (settings.apiKey) === 'string') {
            opt.headers['X-Stackify-Key'] = settings.apiKey;
            CONFIG.APPNAME = appname;
            CONFIG.ENV = settings.env || null;
            send(opt, callback, fail);
        } else {
            throw new TypeError('You have to pass API key');
        }

    },

    postLogs: function postLogs(messages, cb) {
        var body = {
                CDID: CONFIG.APP_DETAILS.DeviceID,
                CDAppID: CONFIG.APP_DETAILS.DeviceAppID,
                AppNameID: CONFIG.APP_DETAILS.AppNameID,
                AppEnvID: CONFIG.APP_DETAILS.AppEnvID,
                EnvID: CONFIG.APP_DETAILS.EnvID,
                Env: CONFIG.APP_DETAILS.Env,
                ServerName: os.hostname(),
                AppName: appname,
                AppLoc: process.env.PWD,
                Logger: 'Node.js Stackify Logger ver. 1.0',
                Platform: 'Node.js',
                Msgs : messages
            },
            opt = options(CONFIG.LOG_SAVE_PATH, body, CONFIG.PROXY),

            //retry the request if it failed
            fail = function(code) {
                var sinceFirstError;

                if (code === 401) {
                    fail_delay = CONFIG.DELAY.FIVE_MINUTES;
                    last_api_error = new Date().getTime();
                } else {
                    last_api_error = last_api_error || new Date().getTime();
                    sinceFirstError = new Date().getTime() - last_api_error;
                    fail_delay = Math.min(Math.max(sinceFirstError, CONFIG.DELAY.ONE_SECOND), CONFIG.DELAY.ONE_MINUTE);
                }

                setTimeout(function () {
                    send(opt, cb, fail);
                }, fail_delay);
  
            };

        send(opt, cb, fail);
    }
};