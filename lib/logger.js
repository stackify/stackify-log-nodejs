var util    = require('util'),
    api     = require('./api'),
    CONFIG  = require('../config/config'),
    helpers = require('./helpers'),
    error   = require('./error'),
    exc     = require('./exception'),

    storage = [],

    // flag that indicates if logs are being sent right now. if false then new batches of messages won't be sent.
    flag = false,
    // deferred checking of logs
    timeout = 0,
    //number of failed attempts of sending logs
    fail_counter = 0,
    // hash that contains all the errors and their number logged during the current minute
    error_storage = {},

    // automatically send all the messages from the queue after some timeout
    checkLogs = function () {
        var length = Math.min(storage.length, CONFIG.MSG_LIMIT);
        if (flag && length) {
            sendLogs(length);
        }
        console.log('logs checked');
    },
    // handler for sending logs
    sendLogs = function (length) {
        var self = this,
            data = storage.slice(0, length || CONFIG.MSG_LIMIT),

            /* if request is succesful remove messages from the queue, change the timeout for the next checkLogs call,
               switch the flag, send another batch (if there are enough messages in the queue)
            */
            success = function (response) {
                fail_counter = 0;

                storage = storage.slice(length);
                console.log('logs sent');

                // if there are enough messages for the batch, send another request

                if (storage.length >= CONFIG.MSG_LIMIT) {
                    sendLogs();
                } else {
                    flag = true;

                    // reset previous timeout, define the new one
                    if (timeout) {
                        clearTimeout(timeout);
                    }

                    timeout = setTimeout(checkLogs, CONFIG.SCAN_TIMER);
                }
            },

            // retry the attempt after some timeout
            fail = function () {
                flag = false;
                fail_counter += 1;

                setTimeout(function () {
                    api.methods.postLogs(data, success, fail);
                }, CONFIG.REQUEST_TIMER);
            };

        if (fail_counter <= CONFIG.REQUEST_ATTEMPTS) {
            api.methods.postLogs(data, success, fail);
            flag = false;
        }
    },
    /**
    Check for duplicate error messages. If the same error message logged more than configurated limit in one minute
    don't push it to the queue
    */
    checkErrorLimitMessage = function checkErrorLimitMessage(ex) {
        var min = new Date().getMinutes(),
            key = ex.Error.Message + ex.Error.ErrorType + ex.Error.SourceMethod;

        if (!ex) {
            return true;
        }

        if (error_storage[min]) {
            if (error_storage[min][key]) {
                error_storage[min][key] += 1;
            } else {
                error_storage[min][key] = 1;
            }
        } else {
            error_storage = {};
            error_storage[min] = {};
            error_storage[min][key] = 1;
        }

        return (error_storage[min][key] < CONFIG.MAX_DUP_ERROR_PER_MINUTE) ? true : false;
    };

module.exports.storage = storage;

module.exports.methods = {
    // create the message object, push it to the queue and execute sendLogs call if messages cap is exceeded
    push : function push(level, msg, meta) {
        var err = new Error(),
            getStack = error.getStackTraceItem(err),
            rec = {
                Msg: msg,
                Level: level.toUpperCase(),
                EpochMs: Date.now(),
                SrcMethod: getStack.SrcMethod,
                SrcLine: getStack.SrcLine
            },
            data;

        // handle properly metadata object and create exception object if needed
        if (meta) {
            if (level.toLowerCase() === 'error') {
                data = helpers.parseMeta(meta, true);
                if (data.ex) {
                    rec.Ex = error.formatEx(data.ex);
                }
            } else {
                data = helpers.parseMeta(meta);
            }

            if (data.result !== '{}') {
                rec.Data = data.result;
            }
        }

        if (level.toLowerCase() === 'error' && !rec.Ex) {
            rec.Ex = error.formatEx(err, null, msg);
        }

        if ((level.toLowerCase() === 'error' && checkErrorLimitMessage(rec.Ex)) || level.toLowerCase() !== 'error') {
            storage.push(rec);
            console.log('logged', storage.length);

            // remove the earliest message from the queue if message cap is exceeded    
            if (storage.length === CONFIG.MSG_CAP) {
                storage.shift();
            }
        }
        
        if (flag && storage.length >= CONFIG.MSG_LIMIT && CONFIG.APIKEY) {
            sendLogs();
        }
    },

    /* check the queue after IdentifyApp call is done, switch the flag, set the timeout for the next checking the queue,
       set environment details for already logged messages
    */
    init: function init() {
        flag = true;

        timeout = setTimeout(checkLogs, CONFIG.SCAN_TIMER);

        if (storage.length >= CONFIG.MSG_LIMIT) {
            sendLogs(exc.excCaught ? storage.length : null);
        }
    },

    log: function log(level, msg, meta) {
        var levels = ['error', 'debug', 'warn', 'info', 'trace'];

        // check the message level    
        if (levels.indexOf(level.toLowerCase()) < 0) {
            throw new TypeError(level + ' level doesn\'t exist');
        }

        this.push(level, msg, meta);
    },

    /*
    Shortcut functions for logging message of certain level. Every function takes the same params as log function except the level.
    */

    trace: function trace(msg, meta) {
        this.log('trace', msg, meta);
    },
    debug: function debug(msg, meta) {
        this.log('debug', msg, meta);
    },
    info: function info(msg, meta) {
        this.log('info', msg, meta);
    },
    warn: function warn(msg, meta) {
        this.log('warn', msg, meta);
    },
    error: function error(msg, meta) {
        this.log('error', msg, meta);
    }
};