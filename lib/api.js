var os      = require('os'),
    util    = require('util'),
    send    = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    pkginfo = require('pkginfo')(module, 'name'),

    appname = module.exports.name,

    options = {
        hostname: CONFIG.HOST,
        port: CONFIG.PORT,
        method: 'POST',
        secureProtocol: 'SSLv3_method',
        headers: {
            'Content-Type': 'application/json',
            'X-Stackify-Key': CONFIG.APIKEY,
            'X-Stackify-PV': 'V1'
        }
    };

module.exports.methods = {

    identifyApp: function identifyApp(settings) {
        var opt = options,
            fail_counter = 0,
            data = {
                DeviceName: os.hostname(),
                AppName: appname,
                ConfiguredAppName: appname,
                AppLocaton: process.env.PWD
            },
            callback = function (data) {
                console.log('successfully identified');

                CONFIG.APP_DETAILS = JSON.parse(data);
                CONFIG.APP_DETAILS.ENV = settings.env;
                CONFIG.APIKEY = settings.apiKey;

                logger.methods.init();

            },
            fail = function () {
                fail_counter += 1;
                if (fail_counter <= CONFIG.REQUEST_ATTEMPTS) {
                    setTimeout(function () {
                        send(opt, data, callback, fail);
                    }, CONFIG.REQUEST_TIMER);
                }
            };

        opt.path = CONFIG.IDENTIFY_PATH;

        console.log('Identifying...');

        if (typeof (settings.apiKey) === 'string' && typeof (settings.env) === 'string') {
            opt.headers['X-Stackify-Key'] = settings.apiKey;
            CONFIG.APPNAME = appname;
            send(opt, data, callback, fail);
        } else {
            throw new TypeError('You have to pass apiKey and env parameters');
        }

    },

    postLogs: function postLogs(messages, cb, fail) {
        var opt = options,
            data = {
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
            };

        opt.path = CONFIG.LOG_SAVE_PATH;
        send(options, data, cb, fail);
    }
};