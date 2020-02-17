var os              = require('os'),
    async           = require('async'),
    sender          = require('./sender'),
    logger          = require('./logger'),
    CONFIG          = require('../config/config'),
    helpers         = require('./helpers'),
    debug           = require('./debug'),
    unix_socket     = require('./transport/unix-socket'),
    http_client     = require('../lib/transport/http-client'),
    AgentBase       = require('../lib/transport/agent-base'),
    lastApiError;

module.exports.initialize = function (settings) {
    CONFIG._setupConfig(settings)
    CONFIG._validateConfig(settings)
    this.methods.transportType(settings)
}
module.exports.lastApiError = lastApiError;
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

                CONFIG.APP_DETAILS = data;

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
                debug.write('[Log] Sending logs failed');
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
        debug.write('[Log] Sending logs: batch size: ' + messages.length + ' messages');
        sender.send(options, cb, shutdown ? null : fail);
    },
    /*
    *** posting logs synchronously in case if server is about to close ***
    */
    postLogsSync: function postLogsSync(messages) {
        var cb = function (response) {
            debug.write('postLogsSync response: ' + response)
        }
        switch(CONFIG.TRANSPORT) {
            case 'agent_socket':
                module.exports.methods.sendToSocket(messages, cb); // send to unix socket
                break;
            case 'agent_http':
                module.exports.methods.sendToHttpClient(messages, cb); // send to http
                break;
            case 'log':
                var options = {
                    url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + CONFIG.LOG_SAVE_PATH,
                    headers : helpers.getHeaders(),
                    data: helpers.getPostBody(messages)
                };
                sender.sendSync(options);
                break;
        }
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
    },

    /**
     *** Send log messages to Linux agent via unix domain socket
     *** messages - array of messages
     *** cb - callback function
     */
    sendToSocket: function sendToSocket(messages, cb) {
        try {
            if (!messages) {
                cb({error: true, message: 'No messages found.'}, null);
                return;
            }
            var log_group = AgentBase.prototype.build_message(messages);
            // Serializes to a UInt8Array.
            var data = log_group.serializeBinary();
            async.retry({
                times: CONFIG.MAX_RETRIES,
                interval: CONFIG.DELAY.SOCKET_DELAY
            }, function (callback) { return unix_socket.send(data, cb) },
                function(err, result) {
                    if (err) {
                        var err_message = '[Stackify Node Log API] sendToSocket() - Sending failed:' + JSON.stringify(err, null, 2);
                        debug.writeSync(err_message);
                        throw new Error(err); // Error still thrown after retrying N times, so rethrow.
                    }
              });
        } catch (error) {
            debug.writeSync('\n[Stackify Node Log API] sendToSocket() - Sending failed. error stack:' + JSON.stringify(error));
        }
    },

    /**
     *** Send log messages(protobuf) via http request
     *** messages - array of messages
     *** cb - callback function
     */
    sendToHttpClient: function sendToHttpClient(messages, cb) {
        try {
            if (!messages) {
                cb({error: true, message: 'No messages found.'}, null);
                return;
            }
            var log_group = AgentBase.prototype.build_message(messages);
            // Serializes to a UInt8Array.
            var data = log_group.serializeBinary();
            async.retry({
                times: CONFIG.MAX_RETRIES,
                interval: CONFIG.DELAY.SOCKET_DELAY
            }, function (callback) { return http_client.post(data, cb) },
                function(err, result) {
                    if (err) {
                        var err_message = '[Stackify Node Log API] sendToHttpClient() - Sending failed:' + JSON.stringify(err, null, 2);
                        debug.writeSync(err_message);
                        throw new Error(err); // Error still thrown after retrying N times, so rethrow.
                    }
              });
        } catch (error) {
            debug.writeSync('\n[Stackify Node Log API] sendToHttpClient() - Sending failed. error stack:' + JSON.stringify(error));
        }
    }
}
