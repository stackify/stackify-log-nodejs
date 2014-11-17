var api = require('./api'),
    util = require('util'),
    CONFIG = require('../config/config'),
    helpers = require('./helpers'),
    error = require('./error'),

    storage = [],

    // flag that indicates if logs are being sent properly. if false then new batches of messages won't be sent.
    flag = false,
    // deferred checking of logs
    timeout = 0,
    //number of failed attempts of sending logs
    fail_counter = 0,

    checkLogs = function () {
        var length = storage.length;
        if (flag && length) {
            sendLogs(length);
        }
        console.log('logs checked');
    },

    sendLogs = function (len) {
        var self = this,
            length = len || CONFIG.MSG_LIMIT,
            data = storage.slice(0, length),
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
    };

module.exports.storage = storage;

module.exports.methods = {
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

        storage.push(rec);
        console.log('logged');
        console.log(storage.length);

        if (flag && storage.length >= CONFIG.MSG_LIMIT && CONFIG.APIKEY) {
            sendLogs();
        }
    },

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