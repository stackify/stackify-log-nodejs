var os      = require('os'),
    path    = require('path'),
    sender  = require('./sender'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config'),
    exc     = require('./exception'),
    helpers = require('./helpers'),
    debug   = require('./debug'),
    unix_socket = require('./unix_socket'),
    protobufData = require(path.join(__dirname, '../proto/stackify-agent_pb')),
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
        
        if (!settings.apiKey || (settings.apiKey && typeof (settings.apiKey) !== 'string')) {
            debug.write('You have to pass API key to initialize Stackify Logger');
            throw new TypeError('You have to pass API key');
        }

        if (!settings.appName || (settings.appName && typeof (settings.apiKey) !== 'string')) {
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
        var options = {
            url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + CONFIG.LOG_SAVE_PATH,
            headers : helpers.getHeaders(),
            data: helpers.getPostBody(messages)
        };
        sender.sendSync(options);
    },

    transportType: function transportType(settings) {
        var type = settings.transport;
        if (type == 'agent_socket') {
            var appname = settings.appName || helpers.getAppName();
            var env = settings.env;
            var data = {
                AppName: appname,
                Env: env
            }
            CONFIG.APP_DETAILS = data;
            CONFIG.TRANSPORT = 'agent_socket';
            logger.methods.start();
        } else {
            module.exports.methods.identifyApp(settings);
        }
    },

    sendToSocket: function sendToSocket(messages, cb) {
        console.log('sendToSocket:');
        console.log(JSON.stringify(messages, true));
        var delay = 0; // scheduled delay when postLogs call failed
        var length = messages.length;
        var opt = Object.assign({}, helpers.getPostBody(messages));
        var log_group = new protobufData.LogGroup();
        log_group.setEnvironment(opt.Env);
        log_group.setServerName(opt.ServerName);
        log_group.setApplicationName(opt.AppName);
        log_group.setApplicationLocation(opt.AppLoc);
        log_group.setLogger(opt.Logger);
        log_group.setPlatform(opt.Platform);

        for(i=0; i<length; i++) {
            var log = new protobufData.LogGroup.Log();
            log.setMessage(messages[i]['Msg']);
            log.setData(messages[i]['Data']);
            log.setThreadName(messages[i]['Th']);
            log.setDateMillis(messages[i]['EpochMs']);
            log.setLevel(messages[i]['Level']);
            log.setTransactionId(messages[i]['TransID']);
            log.setSourceMethod(messages[i]['SrcMethod']);
            log.setSourceLine(messages[i]['SrcLine']);
            log.setId(messages[i]['id']);

            if (messages[i]['Ex']) {
                var ex = messages[i]['Ex'];
                // console.log('OccurredEpochMillis:', ex['OccurredEpochMillis']);
                var error = new protobufData.LogGroup.Log.Error();
                    error.setDateMillis(ex['OccurredEpochMillis']);

                    if (ex[i]['Error']) {
                        var error = ex[i]['Error'];
                        var error_item = new protobufData.LogGroup.Log.Error.ErrorItem();
                        error_item.setMessage(error['Message']);
                        error_item.setErrorType(error['ErrorType']);
                        error_item.setErrorTypeCode(error['ErrorTypeCode']);
                        error_item.setSourceMethod(error['SourceMethod']);

                        if (error['StackTrace']) {
                            var stack = error['StackTrace'];
                            var stack_trace_length = stack.length;
                            for(j=0; j<stack_trace_length; j++) {
                                var trace_frame = new protobufData.LogGroup.Log.Error.ErrorItem.TraceFrame();
                                trace_frame.setCodeFilename();
                                trace_frame.setLineNumber();
                                trace_frame.setMethod();
                            }

                            // error_item.setStacktraceList();
                        }

                        
                        error_item.setInnerError();
                        error.setErrorItem();
                        // error.setCustomerName(); // Optional
                        // error.setUsername(); // Optional
                    }
                    


                if (ex['EnvironmentDetail']) {
                    var env = ex['EnvironmentDetail'];
                    var device_name = env['DeviceName'];
                    var app_loc = env['AppLocation'];
                    var app_name = env['AppName'];
                    var conf_app_name = env['ConfiguredAppName'];
                    var conf_env_name = env['ConfiguredEnvironmentName'];

                    var env_detail = new protobufData.LogGroup.Log.Error.EnvironmentDetail();
                    env_detail.setDeviceName(device_name);
                    env_detail.setApplicationName(app_name);
                    env_detail.setApplicationLocation(app_loc);
                    env_detail.setConfiguredApplicationName(conf_app_name);
                    env_detail.setConfiguredEnvironmentName(conf_env_name);
                }

                    // error.setEnvironmentDetail(ex['EnvironmentDetail']);
                    // log_group.setError();
                
            }


                    // log.setTagsList();

            // log_group.setLogsList.push(log);
            console.log('typeof:',typeof(log_group))
        }

        // Serializes to a UInt8Array.
        // var bytes = log_group.serializeBinary();

        // console.log('\n\nlog_group:',log_group)
        // console.log('bytes:',bytes)
        // console.log('getEnvironment:',log_group.getEnvironment() )

        // unix_socket.send(options, cb);
    }
}