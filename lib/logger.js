var api     = require('./api'),
    schedule = require('node-schedule'),
    CONFIG  = require('../config/config'),
    helpers = require('./helpers'),
    error   = require('./error'),
    debug   = require('./debug'),

    storage = [],

    // get shortcut function for a certain level
    getShortcut = function getShortcutFunction(args, level) {
        var params = Array.prototype.slice.call(args);
        params.unshift(level);
        return this.log.apply(this, params);
    },
    // Determine whether or not an API key has been specified. If not, then APP_DETAILS will not exist.
    appDetailsExist,
    hasAppDetails = function () {
        if (appDetailsExist === undefined) {
            appDetailsExist = undefined !== CONFIG.APP_DETAILS;

            if (!appDetailsExist) {
                debug.write('*** A valid Stackify API key has not been specified ***');
            }
        }

        return appDetailsExist;
    },

    /**
     * This function will handle the selection of the transport
     */
    transportSelector = function (transport, data, cb, shutdown) {
        if (transport === 'agent_socket') {
            api.methods.sendToSocket(data, cb); // send to unix domain socket
        } else if (transport === 'agent_http') {
            api.methods.sendToHttpClient(data, cb); // send to http request
        } else {
            api.methods.postLogs(data, cb, shutdown); // send directly to stackify-api server
        }
    },
    /* handler for sending logs, accepts callback function and boolean variable
       indicating if we should run process.exit() after the callback
    */
    sendLogs = function (cb, shutdown) {
        var transport = CONFIG && CONFIG.TRANSPORT ? CONFIG.TRANSPORT.trim().toLowerCase() : null
        try {
            // If Stackify Application details have not been received, skip logging.
            if (!hasAppDetails()) {
                cb && cb();
                return;
            }

            var length = storage.length, // number of the messages in the iteration
                chunk  = Math.min(length, CONFIG.MSG.MAX_BATCH_SIZE),
                data   = storage.slice(0, chunk);

                /* if request is successful remove messages from the queue,
                   send another batch (if there are enough messages in the queue)
                */
                success = function (response) {
                    if (response && response.success) {
                        storage = storage.slice(chunk); // remove this chunk from the queue
                        length -= chunk;
                        api.lastApiError = 0; // reset the last HTTP error
                        if (length) {
                            chunk  = Math.min(length, CONFIG.MSG.MAX_BATCH_SIZE);
                            data   = storage.slice(0, chunk);
                            transportSelector(transport, data, success, shutdown)
                        }
                    }
                };
            debug.write('Checking the queue: ' + data.length + ' messages');

            if (data.length && CONFIG.APP_DETAILS) {
                // queue has messages and the app is authorized - set the flag, post data
                transportSelector(transport, data, success, shutdown)
            }
        } catch (error) {
            debug.writeSync('\nSending failed. error stack:' + JSON.stringify(error));
        }

        if (cb) {
            cb();
        }
    };

module.exports = {

    size: function() {
        return storage ? storage.length : 0;
    },

    get: function(index) {
        if (index >= 0 && storage && storage.length) {
            return storage[index];
        }

        return null;
    },

    hasAppDetails: hasAppDetails,

    /**
     * A function to clear the logs.
     */
    flushLogs: function () {
        if (storage && storage.length) {
            storage.length = 0;
        }
    },

    methods: {
        // create the message object, push it to the queue if the queue cap isn't exceeded
        push: function push(level, msg, meta, req, err, logId, transactionId) {
            var stackError = err || new Error(),
                getStack = error.getStackTraceItem(stackError, err),
                messageObject = {
                    Msg: msg,
                    Level: level.toUpperCase(),
                    EpochMs: Date.now(),
                    SrcMethod: getStack.SrcMethod,
                    SrcLine: getStack.SrcLine,
                    TransID: transactionId,
                    id: logId
                },
                data;

            // handle properly metadata object and create exception object if needed
            if (meta.length) {
                if (level.toLowerCase() === 'error') {
                    data = helpers.parseMeta(meta, true);
                    // if duplicate errors cap per minute isn't exceeded and error object is passed, create an exception
                    if (data.ex) {
                        messageObject.Ex = error.formatEx(data.ex, req);
                        if (!error.checkErrorLimitMessage(messageObject.Ex)) {
                            delete messageObject.Ex;
                        }
                    }
                } else {
                    data = helpers.parseMeta(meta);
                }

                if (data.result) {
                    messageObject.Data = data.result;
                }
            }

            // if error object isn't passed with message & duplicate errors cap per minute isn't exceeded, create a string exception
            if (level.toLowerCase() === 'error' && !messageObject.Ex) {
                messageObject.Ex = error.formatEx(stackError, null, msg);

                if (!error.checkErrorLimitMessage(messageObject.Ex)) {
                    delete messageObject.Ex;
                }
            }

            storage.push(messageObject);
            // remove the earliest message from the queue if message cap is exceeded
            if (storage.length === CONFIG.MSG.QUEUE_CAP) {
                storage.shift();
            }
        },

        // start sending logs after IdentifyApp call is done
        start: function start() {
            appDetailsExist = undefined; // Reset to allow for logging after receiving successful application details.

            let is_running = false;

            // Schedule to run every 5 seconds
            schedule.scheduleJob('*/5 * * * * *', () => {

                debug.write('Running Logger Job');

                let cb = function() {
                    is_running = false;
                }

                // Only execute if there is no running job
                if (!is_running) {
                    // Update the status
                    is_running = true;
                    sendLogs(cb);
                    is_running = false;
                } else {
                    debug.write('Logger Job Already Running');
                }

            })

        },

        //  push exception to the queue, send data and run the callback
        sendException: function sendException(err, req, cb) {

            debug.write('Exception caught err: ' + err);

            this.push('error', err.message, [err], req, err);

            if (cb) {
                // if exception is caught run next middleware or check if we need to shutdown the server
                cb();
            }
        },
        // drain the queue and send the messages before server closes
        drain: function drain() {
            if (storage.length) {
                api.methods.postLogsSync(storage);
            } else {
                debug.close();
            }
        },

        // basic logging method
        log: function log(level, msg) {
            var meta = Array.prototype.slice.call(arguments, 2);
            var levels = ['fatal', 'error', 'debug', 'warn', 'info', 'trace'];

            // check the message level
            if (levels.indexOf(level.toLowerCase()) < 0) {
                debug.write(level + ' level doesn\'t exist');
                throw new TypeError(level + ' level doesn\'t exist');
            }
            // check the message itself
            if (typeof msg !== 'string') {
                debug.write('Message must be a string');
                throw new TypeError('Message must be a string');
            }
            this.push(level, msg, meta);
        },

        /*
         Shortcut functions for logging message of certain level. Every function takes the same params as log function except the level.
         */

        trace: function trace() {
            getShortcut.call(this, arguments, 'trace');
        },
        debug: function debug() {
            getShortcut.call(this, arguments, 'debug');
        },
        info: function info() {
            getShortcut.call(this, arguments, 'info');
        },
        warn: function warn() {
            getShortcut.call(this, arguments, 'warn');
        },
        error: function error() {
            getShortcut.call(this, arguments, 'error');
        },
        fatal: function fatal() {
            getShortcut.call(this, arguments, 'fatal');
        }
    }
};
