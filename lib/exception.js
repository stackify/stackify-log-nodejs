var qs      = require('querystring'),
    util    = require('util'),

    error   = require('./error'),
    logger  = require('./logger'),
    api     = require('./api'),
    CONFIG  = require('../config/config');

module.exports = {
    // flag used to prevent catching the same exception twice (inside and outside of the createServer method)
    excCaught : false,
    // Pure Node apps exception catching
    exceptionHandler : function exceptionHandler(req, exit) {
        var self = this;
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
                    logger.methods.stop(err, req, function () {return true; });
                    if (exit === true) {
                        process.exit(1);
                    }
                }
            });
        }());
    },
    // Express error handling middleware
    expressExceptionHandler : function expressExceptionHandler(options) {
        var self = this;
        return function expressExceptionHandler(err, req, res, next) {
            var cb = function () {
                if (options.exitOnError === true) {
                    process.exit(1);
                } else {
                    next(err);
                }
            };

            if (!err) {
                return next();
            }

            if (!self.excCaught) {
                self.excCaught = true;
                logger.methods.stop(err, req, cb);
            }

        };
    }
};