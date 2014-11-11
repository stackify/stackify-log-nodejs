var os = require('os'),
    send = require('./sender'),
    logger = require('./logger'),
    CONFIG = require('../config/config'),
    pkginfo = require('pkginfo')(module, 'name'),

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
            data = {
                "DeviceName": os.hostname(),
                "AppName": module.exports.name
            },
            callback = function (data) {
                CONFIG.APP_DETAILS = data.toJSON();
                CONFIG.LICENSE_KEY = settings.license_key;
            },
            fail = function () {
                setTimeout(function () {
                    send(options, data, callback, fail);
                }, CONFIG.REQUEST_TIMER);
            };
            opt.path = CONFIG.IDENTIFY_PATH;
            
        if (typeof (settings.license_key) === 'string') {
            opt.headers['X-Stackify-Key'] = settings.license_key;
            send(options, data, callback, fail);
        } else {
            throw new TypeError('License key is not defined or has a wrong format');
        }

    },

    postLogs: function postLogs(messages, cb, fail) {
        var opt = options,
            data = CONFIG.APP_DETAILS;

        data.Msgs = messages;
        opt.path = CONFIG.LOG_SAVE_PATH;

        send(options, data, cb, fail);
    }
};