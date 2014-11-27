var qs      = require('querystring'),

    error   = require('./error'),
    logger  = require('./logger');

module.exports = {
    // flag used to prevent catching the same exception twice (inside and outside of the createServer method)
    excCaught : false,
    // Pure Node apps exception catching
    exceptionHandler : function exceptionHandler(req, exit) {
        var self = this;
        CONFIG.EXIT_ON_ERROR = CONFIG.EXIT_ON_ERROR || exit;
        return (function () {
            var body = '';
            if (req) {
                req.on('data', function (chunk) {
                    body += chunk;
                });
                req.on('end', function () {
                    var json = qs.parse(body);
                    req.body = json;
                });
            }

            process.on('uncaughtException', function (err) {
                if (!self.excCaught) {
                    self.excCaught = true;
                    logger.methods.sendException(err, req, function () {
                        if (CONFIG.EXIT_ON_ERROR === true) {
                            process.exit(1);
                        }
                    });
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

            if (!this.excCaught) {
                this.excCaught = true;
                logger.methods.sendException(err, req, cb);
            }

        };
    }
};