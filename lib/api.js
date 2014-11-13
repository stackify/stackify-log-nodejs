var os      = require('os'),
    util    = require('util'),
    send    = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    pkginfo = require('pkginfo')(module, 'name', 'version'),

    appname    = module.exports.name,

    options = {
        hostname: CONFIG.HOST,
        port: CONFIG.PORT,
        method: 'POST',
        secureProtocol: 'SSLv3_method',
        headers: {
            'Content-Type': 'application/json',
            'X-Stackify-Key': CONFIG.LICENSE_KEY,
            'X-Stackify-PV': 'V1'
        }
    };

module.exports = {

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
                CONFIG.APP_DETAILS = data.toJSON();
                CONFIG.LICENSE_KEY = settings.license_key;
            },
            fail = function () {
                fail_counter += 1;
                if (fail_counter <= CONFIG.REQUEST_ATTEMPTS) {
                    setTimeout(function () {
                        send(options, data, callback, fail);
                    }, CONFIG.REQUEST_TIMER);
                }
            };

        opt.path = CONFIG.IDENTIFY_PATH;

        if (typeof (settings.license_key) === 'string') {
            opt.headers['X-Stackify-Key'] = settings.license_key;
            CONFIG.APPNAME = appname;
            send(options, data, callback, fail);
        } else {
            throw new TypeError('License key is not defined or has a wrong format');
        }

    },

    postLogs: function postLogs(messages, cb, fail) {
        var opt = options,
            data = {
                CDID: CONFIG.APP_DETAILS.CDID,
                CDAppID: CONFIG.APP_DETAILS.CDAppID,
                AppNameID: CONFIG.APP_DETAILS.AppNameID,
                AppEnvID: CONFIG.APP_DETAILS.AppEnvID,
                EnvID: CONFIG.APP_DETAILS.EnvID,
                Env: CONFIG.APP_DETAILS.Env,
                ServerName: os.hostname(),
                AppName: appname,
                AppLoc: process.env.PWD,
                Logger: appname + app,
                Platform: 'Node.js',
                Msgs : messages
            };


        opt.path = CONFIG.LOG_SAVE_PATH;

        send(options, data, cb, fail);
    }
};