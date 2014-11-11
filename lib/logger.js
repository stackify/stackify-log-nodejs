var api = require('./api'),
    CONFIG = require('../config/config'),
    helpers = require('./helpers'),
    error = require('./error'),
    storage = [],
    flag = true,
    timeout = 0,
    fail_counter = 0,

    checkLogs = function () {
        var length = storage.length;
        if (flag) {
            sendLogs(length);
        }
    },

    sendLogs = function (len) {
        var self = this,
            length = len || CONFIG.MSG_LIMIT,
            data = storage.slice(0, length),
            success = function () {
                self.fail_counter = 0;
                self.flag = false;

                storage = storage.slice(length);

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
                    api.postLogs(data, success, fail);
                }, CONFIG.REQUEST_TIMER);
            };

        if (fail_counter <= CONFIG.REQUEST_ATTEMPTS) {
            api.postLogs(data, success, fail);
        }
    };

module.exports.storage = storage;

module.exports.methods = {

    log: function log(level, msg, meta) {
        var rec = {
                Msg: msg,
                Level: level.toUpperCase(),
                EpochMs: new Date().toUTCString()
            },
            metaIsValid = helpers.checkMeta(meta);


        if (metaIsValid) {
            if (level === 'error') {
                storage.push(error.checkError(rec));
            } else {
                rec[metaIsValid[0]] = metaIsValid[1];
            }
        }

        storage.push(rec);

        if (flag && storage.length >= CONFIG.MSG_LIMIT && CONFIG.APP_DETAILS) {
            sendLogs();
        }

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