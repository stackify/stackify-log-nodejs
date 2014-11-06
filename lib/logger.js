var api = require('./api'),
    CONFIG = require('./config'),
    checkMeta = function(meta) {
        if (Object.prototype.toString.call(meta) === '[object Object]') {
            if (Object.keys(meta).length === 1) {
                try {
                    JSON.stringify(meta);
                } catch(e) {
                    return false;
                }
                return [Object.keys(meta)[0], meta[Object.keys(meta)[0]]];
            }
        }
        return false;
    }

module.exports.storage = storage = [];
module.exports.flag = flag = true;
module.exports.lastSent = lastSent = Date.now();
module.exports.timeout = timeout = undefined;
module.exports.methods = {

    log: function log (level, msg, meta) {
        var rec = {
                level: level,
                msg: msg,
                timestamp: new Date().toUTCString()
            },
            metaIsValid = checkMeta(meta),
            msgs;

        if (meta && metaIsValid) {
            rec[metaIsValid[0]] = metaIsValid[1];
        }    

        storage.push(rec);

        if (storage.length >= CONFIG.MSG_LIMIT && CONFIG.APP_DETAILS) {
            msgs = storage.slice(0, CONFIG.MSG_LIMIT);
            api.postLogs(msgs);
        }
    },
    debug: function debug (msg) {
        this.log.call(this, 'debug', msg, meta);
    },
    info: function info(msg) {
        this.log.call(this, 'info', msg, meta);
    },
    warn: function warn (msg) {
        this.log.call(this, 'warn', msg, meta);       
    },
    error: function error (msg) {
        this.log.call(this, 'error', msg, meta);
    }
}