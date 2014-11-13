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
                        api.postLogs(logger.storage, null, fail);
                    }, CONFIG.REQUEST_TIMER);
                }
            };

        logger.storage.push(rec);
        console.log(util.inspect(rec, {depth: null}));

/*        if (CONFIG.APP_DETAILS) {
            logger.storage.push(rec);
            api.postLogs(logger.storage, cb, fail);
        }*/
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
                    console.log('body: ', body);
                });
            }

            process.on('uncaughtException', function (err) {
                if (!excCaught) {
                    excCaught = true;
                    handler(err, req);
                    if (res) {
                        res.end(JSON.stringify(logger.storage));                        
                    }
                }
            });
        }());
    },

    expressExc : function expressExc(err, req, res, next) {
        var cb = function () {
            next(err);
        };

        if (!err) {
            return next();
        }

        if (!excCaught) {
            excCaught = true;
            handler(err, req, cb);
        }

        next(err);
    }
};