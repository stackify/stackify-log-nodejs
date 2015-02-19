var api       = require('./lib/api'), // wrappers for API calls
    exception = require('./lib/exception'),  // exception handler module
    logger    = require('./lib/logger'); // logging methods module

module.exports = {
    // start sending logs
    start: function (options) {
        api.methods.identifyApp(options);
        exception.catchException(options.exitOnError || false);
        exception.gracefulExitHandler();
    },

    log: logger.methods.log,
    trace: logger.methods.trace,
    debug: logger.methods.debug,
    info: logger.methods.info,
    warn: logger.methods.warn,
    error: logger.methods.error,
    
    //common method for handling logged messages
    push: logger.methods.push,

    expressExceptionHandler: exception.expressExceptionHandler
};