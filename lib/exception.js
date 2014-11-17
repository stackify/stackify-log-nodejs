var qs      = require('querystring'),
    util    = require('util'),
    error   = require('./error'),
    logger  = require('./logger'),
    api     = require('./api'),
    CONFIG  = require('../config/config'),
    handler = function handler(err, req, cb) {
        var rec = {
                Msg: err.name + ': ' + err.message,
                Level: 'ERROR',
                EpochMs: Date.now(),
                Ex: error.formatEx(err, req)
            },
            fail_counter = 0,
            fail = function () {
                fail_counter += 1;
                if (fail_counter < CONFIG.REQUEST_ATTEMPTS) {
                    setTimeout(function () {
                        api.methods.postLogs(logger.storage, null, fail);
                    }, CONFIG.REQUEST_TIMER);
                }
            };

        if (CONFIG.APP_DETAILS) {
            console.log('handled');
            logger.storage.push(rec);
            api.methods.postLogs(logger.storage, cb, fail);
        } else {
            console.log('not identified yet');
        }
    },
    excCaught = false;

module.exports = {
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

    expressExc : function expressExc(err, req, res, next) {
        console.log('err');

        var cb = function () {
            next(err);
        };

        if (!err) {
            return next();
        }

        handler(err, req, cb);
    }
};