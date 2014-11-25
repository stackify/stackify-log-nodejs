var api       = require('./lib/api'), // wrappers for API calls
    CONFIG    = require('./config/config'), // configuration settings file
    error     = require('./lib/error'), // error parser module
    exception = require('./lib/exception'),  // exception handler module
    helpers   = require('./lib/helpers'), // different helpers functions
    logger    = require('./lib/logger'), // logging methods module
    sender    = require('./lib/sender'); // wrapper for http/https requests

module.exports = {
    // start sending logs
    start: function(options) {
        api.methods.identifyApp(options);
        exc.exc();
    },

    log: logger.methods.log,
    trace: logger.methods.trace,
    debug: logger.methods.debug,
    info: logger.methods.info,
    warn: logger.methods.warn,
    error: logger.methods.error,

    push: logger.methods.push,

    exceptionHandler: exception.exceptionHandler,
    expressExceptionHandler: exception.expressExceptionHandler
};