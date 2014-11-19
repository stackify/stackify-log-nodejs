var api = require('./api'),
    util = require('util'),
    CONFIG = require('../config/config'),
    helpers = require('./helpers'),
    error = require('./error'),

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
        var length = storage.length;
        if (flag && length) {
            sendLogs(length);
        }
        console.log('logs checked');
    },
    // handler for sending logs
    sendLogs = function (len) {
        var self = this,
            length = len || CONFIG.MSG_LIMIT,
            data = storage.slice(0, length),

            /* if request is succesful remove messages from the queue, change the timeout for the next checkLogs call,
               switch the flag, send another batch (if there are enough messages in the queue)
            */
            success = function (response) {
                fail_counter = 0;

                storage = storage.slice(length);
                console.log('logs sent');

                if (storage.length >= CONFIG.MSG_LIMIT) {
                    sendLogs();
                } else {
                    flag = true;

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
    Check for duplicated error messages
    */
    checkErrorLimitMessage = function checkErrorLimitMessage (ex) {
        var min = new Date().getMinutes(),
            key = ex.Error.Message + ex.Error.ErrorType + ex.Error.SourceMethod;

        if (!ex) {
            return true;
        }

        if (error_storage[min]) {
            if (error_storage[min][key]) {
                error_storage[min][key] += 1
            } else {
                error_storage[min][key] = 1;
            }
        } else {
            errorStorage = {};
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
            console.log('logged');

            if (storage.length === CONFIG.MSG_CAP) {
                storage.shift();
            }
        }

        if (flag && storage.length >= CONFIG.MSG_LIMIT && CONFIG.APIKEY) {
            sendLogs();
        }
    },

    /* check the queue after IdentifyApp call is done, switch the flag, set the timeout for checking the queue,
       set environment details for already logged messages
    */
    init: function init() {
        console.log('flag switched');
        flag = true;

        timeout = setTimeout(checkLogs, CONFIG.SCAN_TIMER);

        storage.forEach(function(elem, index, arr) {
            if (elem.ex) {
                elem.ex.EnvironmentDetail =  {
                    AppName: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppName : CONFIG.APPNAME,
                    AppNameID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppNameID : '',
                    EnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.EnvID : '',
                    AppEnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppEnvID : '',
                    AppLocation: process.env.PWD
                };
            }
        });

        if (storage.length >= CONFIG.MSG_LIMIT) {
            sendLogs();
        }
    },
  
    log: function log(level, msg, meta) {
        var levels = ['error', 'debug', 'warn', 'info', 'trace'];

        if (levels.indexOf(level.toLowerCase()) < 0) {
            throw new TypeError(level + 'doesn\'t exist');
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