var util   = require('util'),
    access = require('./lib/access'),
    logger = require('./lib/logger'),
    api    = require('./lib/api'),
    CONFIG = require('./lib/config'),
    sender = require('./sender');

module.exports = {
    CONFIG: CONFIG,

    start: function () {
        
    },

    log: logger.methods.log,
    debug: logger.methods.debug,
    info: logger.methods.info,
    warn: logger.methods.warn,
    error: logger.methods.error,
    postLogs: api.postLogs
}