// Copyright (c) 2024 BMC Software, Inc.
// Copyright (c) 2021-2024 Netreo
// Copyright (c) 2019 Stackify

var api       = require('./lib/api'), // wrappers for API calls
    debug     = require('./lib/debug'), // debug mode module
    exception = require('./lib/exception'),  // exception handler module
    logger    = require('./lib/logger'), // logging methods module
    CONFIG    = require('./config/config'), // config
    event     = require('./lib/event'), // event emitter module
    RUM       = require('./lib/rum'); // Rum

event.on(CONFIG.EVENT_ERROR, logger.methods.push);

module.exports = {
    // start sending logs
    start: function (options) {
        CONFIG.SELECTED_LOGGER = CONFIG.LOGGER_VERSION;
        CONFIG.LOG_SERVER_VARIABLES = ((typeof(options) !== undefined) && options.logServerVariables !== undefined) ? !!options.logServerVariables : CONFIG.LOG_SERVER_VARIABLES
        var callback = function() {
            exception.catchException(options.exitOnError || false);
            exception.gracefulExitHandler();
            api.initialize(options);
        }
        if (typeof(options) !== undefined && (options.debug !== undefined)) {
            debug.set({
                debug: JSON.parse(options.debug),
                debug_log_path: typeof options.debug_log_path === 'string' ? options.debug_log_path : CONFIG.DEBUG_LOG_PATH
            }, callback);
        } else {
            debug.set({
                debug: CONFIG.DEBUG,
                debug_log_path: CONFIG.DEBUG_LOG_PATH
            }, callback);
        }
    },

    log: logger.methods.log,
    trace: logger.methods.trace,
    debug: logger.methods.debug,
    info: logger.methods.info,
    warn: logger.methods.warn,
    error: logger.methods.error,
    fatal: logger.methods.fatal,

    //common method for handling logged messages
    push: logger.methods.push,
    // setting logger name to Winston logger if it's used
    setLoggerName: function (name) {
        if (name === 'Winston') {
            CONFIG.SELECTED_LOGGER = CONFIG.WINSTON_LOGGER_VERSION;
            debug.write('Winston Stackify Transport added');
        }
    },

    expressExceptionHandler: exception.expressExceptionHandler,
    injectRumContent: function () {
        return RUM.injectRumContent();
    }
};
