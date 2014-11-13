var api     = require('./lib/api'), // wrappers for API calls
    CONFIG  = require('./config/config'), // configuration settings file
    error   = require('./lib/error'), // error parser module
    exc     = require('./lib/exception'),  // exception handler module
    helpers = require('./lib/helpers'), // different helpers functions
    logger  = require('./lib/logger'), // logging methods module
    sender  = require('./lib/sender'); // wrapper for http/https requests

module.exports = function (options) {

    api.identifyApp(options);
    /*exc.exc();
*/
    return {
        storage: logger.storage,
        CONFIG: CONFIG,

        log: logger.methods.log,
        trace: logger.methods.trace,
        debug: logger.methods.debug,
        info: logger.methods.info,
        warn: logger.methods.warn,
        error: logger.methods.error,

        postLogs: api.postLogs,

        checkError: error.checkError,

        excHandler: exc.exc,
        expressExcHandler: exc.expressExc
    };
};