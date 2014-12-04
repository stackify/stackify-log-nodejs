var api     = require('./api'),
    CONFIG  = require('../config/config'),
    helpers = require('./helpers'),
    error   = require('./error'),

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

    /* handler for sending logs, accepts callback function and boolean variable
       indicating if we should run process.exit() after the callback
    */
    sendLogs = function (cb, shutdown) {
        var length = storage.length, // number of the messages in the iteration
            chunk  = Math.min(length, CONFIG.MSG.MAX_BATCH_SIZE),
            data   = storage.slice(0, chunk),

            /* if request is succesful remove messages from the queue,
               send another batch (if there are enough messages in the queue)
            */
            success = function (response) {
                if (response.success) {
                    storage = storage.slice(chunk); // remove this chunk from the queue
                    length -= chunk;
                    api.lastApiError = 0; // reset the last HTTP error

                    if (length) {
                        chunk  = Math.min(length, CONFIG.MSG.MAX_BATCH_SIZE);
                        data   = storage.slice(0, chunk);
                        api.methods.postLogs(data, success, shutdown);
                    } else {
                        // full batch is sent, set timeout for the next request
                        if (cb) {
                            // if exception is caught run next middleware or check if we need to shutdown the server
                            cb();
                        } else {
                            sendingLogsInProgress = false;
                            timeout = setTimeout(sendLogs, delay);
                        }
                    }
                }
            };
        // re-count the delay
        if (length >= CONFIG.MSG.MAX_BATCH_SIZE) {
            delay = Math.max(Math.round(delay / 2.0), CONFIG.DELAY.ONE_SECOND_DELAY);
        } else if (length < CONFIG.MSG.MIN_BATCH_SIZE) {
            delay = Math.min(Math.round(1.25 * delay), CONFIG.DELAY.FIVE_SECONDS_DELAY);
        }

        if (data.length && CONFIG.APP_DETAILS) {
            // queue has messages and the app is authorized - set the flag, post data
            api.methods.postLogs(data, success, shutdown);
            sendingLogsInProgress = true;
        } else {
            // queue is empty or app is not authorized, set timeout for the next request, switch the flag
            timeout = setTimeout(sendLogs, delay);
            sendingLogsInProgress = false;
        }
    };

module.exports.storage = storage;

module.exports.methods = {
    // create the message object, push it to the queue if the queue cap isn't exceeded
    push : function push(level, msg, meta, req) {
        var err = new Error(),
            getStack = error.getStackTraceItem(err),
            messageObject = {
                Msg: msg,
                Level: level.toUpperCase(),
                EpochMs: Date.now(),
                SrcMethod: getStack.SrcMethod,
                SrcLine: getStack.SrcLine
            },
            data;

        // handle properly metadata object and create exception object if needed
        if (meta.length) {
            if (level.toLowerCase() === 'error') {
                data = helpers.parseMeta(meta, true);
                // if duplicate errors cap per minute isn't exceeded and error object is passed, create an exception
                if (data.ex && error.checkErrorLimitMessage(data.ex)) {
                    messageObject.Ex = error.formatEx(data.ex, req);
                }
            } else {
                data = helpers.parseMeta(meta);
            }

            if (data.result) {
                messageObject.Data = data.result;
            }
        }

        // if error object isn't passed with message & duplicate errors cap per minute isn't exceeded, create a string exception
        if (level.toLowerCase() === 'error' && !messageObject.Ex && error.checkErrorLimitMessage(data.ex)) {
            messageObject.Ex = error.formatEx(err, null, msg);
        }

        storage.push(messageObject);

        // remove the earliest message from the queue if message cap is exceeded
        if (storage.length === CONFIG.MSG.QUEUE_CAP) {
            storage.shift();
        }
    },

    // start sending logs after IdentifyApp call is done
    start: function start() {
        timeout = setTimeout(sendLogs, delay);
    },

    // reset current delay schedule, push exception to the queue, send data and run the callback
    sendException: function sendException(err, req, cb) {
        // check if messages are being sent right now
        var check = function check() {

            if (sendingLogsInProgress) {
                setTimeout(check, 500);
            } else {
                sendLogs(cb, true);
            }
        };

        clearTimeout(timeout);
        this.push('error', err.message, [err], req);
        check();
    },
    // drain the queue and send the messages before server closes
    drain : function drain() {
        if (storage.length) {
            api.methods.postLogsSync(storage);
        }
    },

    // basic logging method
    log: function log(level, msg) {
        var meta = Array.prototype.slice.call(arguments, 2);
        var levels = ['error', 'debug', 'warn', 'info', 'trace'];

        // check the message level
        if (levels.indexOf(level.toLowerCase()) < 0) {
            throw new TypeError(level + ' level doesn\'t exist');
        }
        // check the message itself
        if (typeof msg !== 'string') {
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
    }
};