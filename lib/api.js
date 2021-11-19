var os              = require('os'),
    sender          = require('./sender'),
    logger          = require('./logger'),
    CONFIG          = require('../config/config'),
    helpers         = require('./helpers'),
    debug           = require('./debug');

module.exports.initialize = function (settings) {
    CONFIG._setupConfig(settings)
    CONFIG._validateConfig(settings)
    this.methods.transportType(settings)
}

module.exports.methods = {
    identifyApp: function identifyApp(settings) {
        var options = {},
            appname = settings.appName || helpers.getAppName(),
            body = {
                DeviceName: os.hostname(),
                AppName: appname,
                ConfiguredAppName: appname,
                AppLocation: process.env.PWD
            },
            callback = function (data) {
                debug.write('[Log] Successfully identified');
                CONFIG.APP_DETAILS = data.appData;
                logger.methods.start();
            },
            fail = function () {
                debug.write('[Log] Identification failed');
                setTimeout(function () {
                    sender.send(options, callback, fail);
                }, CONFIG.IDENTIFY_DELAY);
            };

        CONFIG.APIKEY = settings.apiKey;
        CONFIG.APPNAME = appname;

        if (settings.env) {
            body.ConfiguredEnvironmentName = settings.env;
        }

        options = helpers.getOptions(CONFIG.IDENTIFY_PATH, body, settings ? settings.proxy : undefined);

        debug.write('[Log] Identifying the app');
        sender.send(options, callback, fail);
    },
    /*
     *** Function that will select what transport type to use
     *** @settings {Object} contains key-value pairs data such as transport, appName, apiKey, etc.
     */
    transportType: function transportType(settings) {
        var type = settings.transport || CONFIG.TRANSPORT;
        var appname = settings.appName || helpers.getAppName();
        var env = settings.env;
        var data = {
            AppName: appname,
            AppLocation: process.env.PWD,
            Env: env,
            ConfiguredAppName: appname,
            ConfiguredEnvironmentName: env,
            DeviceName: os.hostname()
        }
        CONFIG.APPNAME = appname;
        CONFIG.APP_DETAILS = data;
        switch(type) {
            case 'agent_socket':
                CONFIG.TRANSPORT = 'agent_socket';
                logger.methods.start()
                break;
            case 'agent_http':
                CONFIG.TRANSPORT = 'agent_http';
                logger.methods.start()
                break;
            case 'log':
                module.exports.methods.identifyApp(settings);
                break;
        }
    }
}
