var os      = require('os'),

    sender  = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    exc     = require('./exception'),
    helpers = require('./helpers'),
    debug   = require('./debug'),

    lastApiError;

module.exports.lastApiError = lastApiError;
module.exports.methods = {

    identifyApp: function identifyApp(settings) {
        var options = {},
            appname = helpers.getAppName(),
            body = {
                DeviceName: os.hostname(),
                AppName: appname,
                ConfiguredAppName: appname,
                AppLocation: process.env.PWD
            },
            callback = function (data) {
                debug.write('Successfully identified');

                CONFIG.APP_DETAILS = data;

                logger.methods.start();

            },
            fail = function () {
                debug.write('Identification failed');
                setTimeout(function () {
                    sender.send(options, callback, fail);
                }, CONFIG.IDENTIFY_DELAY);
            };

        // check that settings object is correct

        if (!settings) {
            debug.write('Settings are not provided');
            throw new TypeError('Settings are not provided');
        }

        if (settings.apiKey && typeof (settings.apiKey) === 'string') {
            CONFIG.APIKEY = settings.apiKey;
            CONFIG.APPNAME = appname;

            if (settings.env) {
                body.ConfiguredEnvironmentName = settings.env;
            }

            options = helpers.getOptions(CONFIG.IDENTIFY_PATH, body, settings ? settings.proxy : undefined);

            debug.write('Identifying the app');
            sender.send(options, callback, fail);
        } else {
            debug.write('You have to pass API key to initialize Stackify Logger');
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
            options = helpers.getOptions(CONFIG.LOG_SAVE_PATH, helpers.getPostBody(messages), CONFIG.PROXY),

            //retry the request if it failed
            fail = function (code) {
                var sinceFirstError;
                debug.write('Sending logs failed');
                if (code === 401) {
                    delay = CONFIG.DELAY.FIVE_MINUTES_DELAY;
                    lastApiError = new Date().getTime();
                } else {
                    lastApiError = lastApiError || new Date().getTime();
                    sinceFirstError = new Date().getTime() - lastApiError;
                    delay = Math.min(Math.max(sinceFirstError, CONFIG.DELAY.ONE_SECOND_DELAY), CONFIG.DELAY.ONE_MINUTE_DELAY);
                }

                setTimeout(function () {
                    sender.send(options, cb, fail);
                }, delay);
            };
        debug.write('Sending logs: batch size: ' + messages.length + ' messages');
        sender.send(options, cb, shutdown ? null : fail);
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
        sender.sendSync(options);
    }
};