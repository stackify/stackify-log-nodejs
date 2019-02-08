var api     = require('./api'),
    CONFIG  = require('../config/config'),
    helpers = require('./helpers'),
    error   = require('./error'),
    debug   = require('./debug'),

    storage = [],

    // current delay, starting with one sec
    delay   = CONFIG.DELAY.ONE_SECOND_DELAY,
    sendingLogsInProgress = false,
    // delayed sendLogs call
    timeout,
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

    /* handler for sending logs, accepts callback function and boolean variable
       indicating if we should run process.exit() after the callback
    */
    sendLogs = function (cb, shutdown) {

        // If Stackify Application details have not been received, skip logging.
        if (!hasAppDetails()) {
            cb && cb();

            return;
        }

        var length = storage.length, // number of the messages in the iteration
            chunk  = Math.min(length, CONFIG.MSG.MAX_BATCH_SIZE),
            data   = storage.slice(0, chunk),

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
                        api.methods.postLogs(data, success, shutdown);
                    } else {
                        // full batch is sent, set timeout for the next request
                        sendingLogsInProgress = false;
                        if (cb) {
                            // if exception is caught run next middleware or check if we need to shutdown the server
                            cb();
                        } else {
                            timeout = setTimeout(sendLogs, delay);
                        }
                    }
                }
            };
        debug.write('Checking the queue: ' + data.length + ' messages');
        // re-count the delay
        if (length >= CONFIG.MSG.MAX_BATCH_SIZE) {
            delay = Math.max(Math.round(delay / 2.0), CONFIG.DELAY.ONE_SECOND_DELAY);
        } else if (length < CONFIG.MSG.MIN_BATCH_SIZE) {
            delay = Math.min(Math.round(1.25 * delay), CONFIG.DELAY.FIVE_SECONDS_DELAY);
        }

        if (data.length && CONFIG.APP_DETAILS) {
            // queue has messages and the app is authorized - set the flag, post data
            sendingLogsInProgress = true;
            api.methods.postLogs(data, success, shutdown);
        } else {
            // queue is empty or app is not authorized, set timeout for the next request, switch the flag
            sendingLogsInProgress = false;
            timeout = setTimeout(sendLogs, delay);
        }
    };

//module.exports.storage = storage;

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
            timeout = setTimeout(sendLogs, delay);
        },

        // reset current delay schedule, push exception to the queue, send data and run the callback
        sendException: function sendException(err, req, cb) {
            // check if messages are being sent right now
            var check = function check() {

                if (sendingLogsInProgress) {
                    setTimeout(check, CONFIG.DELAY.ONE_SECOND_DELAY);
                } else {
                    sendLogs(cb, true);
                }
            };

            debug.write('Exception caught');

            clearTimeout(timeout);
            this.push('error', err.message, [err], req, err);
            check();
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
