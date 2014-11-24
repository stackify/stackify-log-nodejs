var qs      = require('querystring'),
    util    = require('util'),

    error   = require('./error'),
    logger  = require('./logger'),
    api     = require('./api'),
    CONFIG  = require('../config/config'),


    // function that sends all the messages in the queue to Stackify when exception is caught
    handler = function handler(err, req, cb) {
        logger.methods.push('error', err.message, {error: error}, req);
        api.methods.postLogs(logger.storage, cb);
    };

// flag used to prevent catching the same exception twice (inside and outside of the createServer method) 
module.exports.excCaught = excCaught = false;

module.exports = {
    // Pure Node apps exception catching
    exc : function exc(req, res) {
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
                if (!excCaught) {
                    excCaught = true;
                    handler(err, req);
                }
            });
        }());
    },
    // Express error handling middleware
    expressExc : function expressExc(err, req, res, next) {

        var cb = function () {
            next(err);
        };

        if (!err) {
            return next();
        }

        handler(err, req, cb);
    }
};