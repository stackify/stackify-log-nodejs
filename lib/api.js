var os      = require('os'),
    path    = require('path'),
    fs      = require('fs'),
    sender  = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    exc     = require('./exception'),
    helpers = require('./helpers'),
    debug   = require('./debug'),
    unix_socket = require('./unix_socket'),
    LogGroupModel = require(path.join(__dirname, '../proto/stackify-agent_pb')),
    logGroup = require(path.join(__dirname, '../proto/LogGroup')),
    lastApiError;

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
        
        if (settings.transport != 'agent_socket') {
            if (!settings.apiKey || (settings.apiKey && typeof (settings.apiKey) !== 'string')) {
                debug.write('You have to pass API key to initialize Stackify Logger');
                throw new TypeError('You have to pass API key');
            }
        }

        if (!settings.appName || (settings.appName && typeof (settings.appName) !== 'string')) {
            debug.write('Application Name is not specified or not a string type.');
            throw new TypeError('You have to pass an Application Name (Must be a string)');
        }

        CONFIG.APIKEY = settings.apiKey;
        CONFIG.APPNAME = appname;

        if (settings.env) {
            body.ConfiguredEnvironmentName = settings.env;
        }

        options = helpers.getOptions(CONFIG.IDENTIFY_PATH, body, settings ? settings.proxy : undefined);

        debug.write('Identifying the app');
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
        if (CONFIG.TRANSPORT == 'agent_socket') {
            module.exports.methods.sendToSocket(messages); // send to unix socket
        } else {
            var options = {
                url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + CONFIG.LOG_SAVE_PATH,
                headers : helpers.getHeaders(),
                data: helpers.getPostBody(messages)
            };
            sender.sendSync(options);
        }
    },

    transportType: function transportType(settings) {
        var type = settings.transport || CONFIG.TRANSPORT;
        var socket_path = settings.socket_path || CONFIG.SOCKET_PATH;
        var socket_url = settings.socket_url || CONFIG.SOCKET_URL;
        if (type == 'agent_socket') {
            if (!settings) {
                debug.write('[Stackify Log API Error] Settings are not provided');
                throw new TypeError('[Stackify Node Log API] Error: Settings are not provided');
            }

            if (!settings.appName || (settings.appName && typeof (settings.appName) !== 'string')) {
                debug.write('[Stackify Log API Error] Application Name is not specified or not a string type.');
                throw new TypeError('[Stackify Node Log API Error] You have to pass an Application Name (Must be a string)');
            }

            if (!fs.existsSync(socket_path)) {
                err_message = '[Stackify Log API Error] /usr/local/stackify/stackify.sock does not exist!'
                debug.write(err_message);
                throw new Error(err_message);
            }

            var appname = settings.appName || helpers.getAppName();
            var env = settings.env;
            var data = {
                AppName: appname,
                ENV: env
            }
            CONFIG.APPNAME = appname;
            CONFIG.APP_DETAILS = data;
            CONFIG.TRANSPORT = 'agent_socket';
            CONFIG.SOCKET_PATH = socket_path;
            CONFIG.SOCKET_URL = socket_url;
            logger.methods.start();
        } else {
            module.exports.methods.identifyApp(settings);
        }
    },

    sendToSocket: function sendToSocket(messages, cb) {
        var delay = 0; // scheduled delay when call failed
        var length = messages.length;
        var opt = Object.assign({}, helpers.getPostBody(messages));
        try {
            var log_group = new LogGroupModel.LogGroup();
            log_group = logGroup.setLogGroup(log_group, opt);
            var logAry = [];
            for(i=0; i<length; i++) {
                var log = new LogGroupModel.LogGroup.Log();
                    log = logGroup.setLogGroupLog(log, messages[i]);

                if (messages[i]['Ex']) {
                    var ex = messages[i]['Ex'];
                    var log_error = new LogGroupModel.LogGroup.Log.Error();
                        log_error = logGroup.setLogError(log_error, ex);
                    if (ex['EnvironmentDetail']) {
                        var env = ex['EnvironmentDetail'];
                        var env_detail = new LogGroupModel.LogGroup.Log.Error.EnvironmentDetail();
                            env_detail = logGroup.setEnvironmentDetail(env_detail, env);

                        log_error.setEnvironmentDetail(env_detail);
                    }

                    if (ex['Error']) {
                        var error = ex['Error'];
                        var error_item = new LogGroupModel.LogGroup.Log.Error.ErrorItem();
                            error_item = logGroup.setErrorItem(error_item, error);
                        var trace_frameAry = [];
                        if (error['StackTrace']) {
                            var stack = error['StackTrace'];
                            var stack_trace_length = stack.length;
                            for(j=0; j<stack_trace_length; j++) {
                                var trace_frame = new LogGroupModel.LogGroup.Log.Error.ErrorItem.TraceFrame();
                                    trace_frame = logGroup.setTraceFrame(trace_frame, stack[j]);
                                    trace_frameAry.push(trace_frame);
                            }
                        }
                        error_item.setStacktraceList(trace_frameAry); // Repeated
                        if (error['InnerError']) {
                            error_item.setInnerError(error['InnerError']); // Optional
                        }
                        log_error.setErrorItem(error_item);
                    }

                    if (ex['WebRequestDetail']) {
                        var req_details = ex['WebRequestDetail'];
                        var web_request = new LogGroupModel.LogGroup.Log.Error.WebRequestDetail();
                            web_request = logGroup.setWebRequestDetail(web_request, req_details);
                        log_error.setWebRequestDetail(web_request);
                    }
                    log.setError(log_error);
                }
                logAry.push(log);
            }
            log_group.setLogsList(logAry); // Repeated
            // Serializes to a UInt8Array.
            var data = log_group.serializeBinary();
            unix_socket.send(data, cb);
        } catch (error) {
            debug.writeSync('\nSending failed. error stack:' + JSON.stringify(error));
        }
    }
}
