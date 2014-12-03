var os      = require('os'),

    sender  = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    exc     = require('./exception'),
    helpers = require('./helpers'),

    lastApiError;

module.exports.lastApiError = lastApiError;
module.exports.methods = {

    identifyApp: function identifyApp(settings) {
        var appname = helpers.getAppName(),
            body = {
                DeviceName: os.hostname(),
                AppName: appname,
                ConfiguredAppName: appname,
                AppLocaton: process.env.PWD,
                ConfiguredEnvName: settings ? settings.env : (process.env.NODE_ENV || null)
            },
            opt = helpers.getOptions(CONFIG.IDENTIFY_PATH, body, settings ? settings.proxy : undefined),
            callback = function (data) {
                console.log('successfully identified');

                CONFIG.APP_DETAILS = data;

                //start sending logs unless it's not already being sent because of exception

                if (!exc.excCaught) {
                    logger.methods.start();
                }

            },
            fail = function () {
                setTimeout(function () {
                    sender.send(opt, callback, fail);
                }, CONFIG.IDENTIFY_DELAY);
            };

        // check that settings object is correct

        if (!settings) {
            throw new TypeError('Settings are not provided');
        }

        if (settings.apiKey && typeof (settings.apiKey) === 'string') {
            CONFIG.APIKEY = settings.apiKey;
            opt.headers['X-Stackify-Key'] = settings.apiKey;
            CONFIG.APPNAME = appname;
            CONFIG.ENV = settings.env || process.env.NODE_ENV || null;
            sender.send(opt, callback, fail);
        } else {
            throw new TypeError('You have to pass API key');
        }

    },

    /*
    *** posting logs to API ***
    *** messages - array of messages ***
    *** cb - callback function ***
    *** shutdown - optional parameter, indicating if we should retry request attempts when API is down ***
    */
    postLogs: function postLogs(messages, cb, shutdown) {
        var delay = 0, // scheduled delay when postLogs call failed
            opt = helpers.getOptions(CONFIG.LOG_SAVE_PATH, helpers.getPostBody(messages), CONFIG.PROXY),

            //retry the request if it failed
            fail = function (code) {
                var sinceFirstError;

                if (code === 401) {
                    delay = CONFIG.DELAY.FIVE_MINUTES;
                    lastApiError = new Date().getTime();
                } else {
                    lastApiError = lastApiError || new Date().getTime();
                    sinceFirstError = new Date().getTime() - lastApiError;
                    delay = Math.min(Math.max(sinceFirstError, CONFIG.DELAY.ONE_SECOND), CONFIG.DELAY.ONE_MINUTE);
                }

                setTimeout(function () {
                    sender.send(opt, cb, fail);
                }, delay);
            };

        sender.send(opt, cb, shutdown ? null : fail);
    },
    /* 
    *** posting logs synchronously in case if server is about to close *** 
    */
    postLogsSync: function postLogsSync(messages) {
        var options = {
            url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + CONFIG.LOG_SAVE_PATH,
            headers : helpers.getHeaders(),
            data: helpers.getPostBody(messages)
        };
        console.log(options);
        sender.sendSync(options);
    }
};