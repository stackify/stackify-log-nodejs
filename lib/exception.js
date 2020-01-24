var error   = require('./error'),
    logger  = require('./logger'),
    CONFIG  = require('../config/config');

module.exports = {
    // flag used to prevent catching the same exception twice (inside and outside of the createServer method)
    excCaught : false,

    // General exception handler
    catchException : function catchException(exit) {
        var self = this;

        CONFIG.EXIT_ON_ERROR = exit;

        return (function () {
            process.on('uncaughtException', function (err) {
                if (!self.excCaught) {
                    self.excCaught = true;
                    logger.methods.sendException(err, null, function () {
                        process.stderr.write((err.stack || err) + '\n', exitProcess);
                    });
                }

                function exitProcess() {
                    if (exit === true) {
                        process.exit(1);
                    }
                }
            });
        }());
    },
    // Express error handling middleware
    expressExceptionHandler : function expressExceptionHandler(err, req, res, next) {
        var cb = function () {
            if (CONFIG.EXIT_ON_ERROR === true) {
                process.exit(1);
            } else {
                next(err);
            }
        };

        if (!err) {
            return next();
        }

        logger.methods.sendException(err, req, cb);
    },
    // drain the queue and send the messages before server closes
    gracefulExitHandler : function gracefulExitHandler() {

        return (function () {
            // if any signal has been caught
            var exit = false,
                shutdown = function () {
                    logger.methods.drain();
                    exit = true;
                    process.exit(1);
                };

            // Start reading from stdin so we don't exit instantly, ISSNode does not bind to stdin 
            if (!process.env.IISNODE_VERSION) {
              process.stdin.resume();
            }

            process.on('exit', function () {
                if (!exit && !process.env.STACKIFY_TEST) {
                    logger.methods.drain();
                }
            });

            // catch some signal events too
            process.on('SIGINT', function () {
                shutdown();
            });

            process.on('SIGTERM', function () {
                shutdown();
            });

            process.on('SIGHUP', function () {
                shutdown();
            });
        }());
    }

};
