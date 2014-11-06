var os = require('os'),
    send = require('./sender'),
    access = require('.access'),
    logger = require('./logger'),
    CONFIG = require('./config'),
    pkginfo = require('pkginfo')(module, 'name'),

    options = {
        host: CONFIG.HOST,
        port: CONFIG.PORT,
        method: 'POST',
        headers: {
            Content-Type: 'application/json',
            X-Stackify-Key: CONFIG.LICENSE_KEY,
            X-Stackify-PV: 'V1'
        }
    }

module.exports = {

    identifyApp: function identifyApp (licenseKey) {
        var options = options,
            data = {
                "DeviceName": os.hostname(),
                "AppName": module.exports.name
            },
            callback = function(data) {
                CONFIG.APP_DETAILS = data.toJSON();
            },
            fail = function() {
                setTimeout(function() {
                    identifyApp(licenseKey)
                }, CONFIG.REQUEST_TIMER)
            }

        options.path = CONFIG.IDENTIFY_PATH;    

        send(options, data, callback, fail);
    };

    postLogs: function postLogs(messages, cb, fail) {
        var options = options,
            callback = cb || function(data) {
                logger.storage = logger.storage.slice(CONFIG.MSG_LIMIT)
            },
            fail = function() {
                setTimeout(function() {
                    postLogs(messages, callback, fail)
                }, CONFIG.REQUEST_TIMER)
            },
            data = CONFIG.APP_DETAILS;

        data.Msgs = messages;
        options.path = CONFIG.LOG_SAVE_PATH;

        send(options, data, callback, fail);
    };
}