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
    exceptionHandler : function exceptionHandler(req, res) {
        return (function () {
            var body = '';
            if (req) {
                req.on('data', function (chunk) {
                    console.log('here');
                    body += chunk;
                });
                req.on('end', function () {
                    var json = qs.parse(body);
                    req.body = json;
                });
            }

            process.on('uncaughtException', function (err) {
                console.log('exc');
                if (!this.excCaught) {
                    this.excCaught = true;
                    logger.methods.stop(err, req, function () {return true; });
                }
            });
        }());
    },
    // Express error handling middleware
    expressExceptionHandler : function expressExceptionHandler(err, req, res, next) {
        var cb = function () {
            next(err);
        };

        if (!err) {
            return next();
        }

        if (!this.excCaught) {
            this.excCaught = true;
            logger.methods.stop(err, req, cb);
        }

    }
};