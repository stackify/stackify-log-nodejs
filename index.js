var api     = require('./lib/api'),
    CONFIG  = require('./config/config'),
    error   = require('./lib/error'),
    exc     = require('./lib/exception'),
    helpers = require('./lib/helpers'),
    logger  = require('./lib/logger'),
    sender  = require('./lib/sender');

module.exports = function (options) {

    api.identifyApp(options);
    exc.exc();

    return {
        storage: logger.storage,
        CONFIG: CONFIG,

        log: logger.methods.log,
        debug: logger.methods.debug,
        info: logger.methods.info,
        warn: logger.methods.warn,
        error: logger.methods.error,

        postLogs: api.postLogs,

        checkError: error.checkError,

        excCaught: exc.excCaught,
        excHandler: exc.exc,
        expressExcHandler: exc.expressExc
    };
};