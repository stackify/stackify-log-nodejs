/* ### function sender (options, data, [cb], [fail])
###### @options {Object} request options (hostname, headers, path, post data etc).
###### @cb {Function} **Optional** callback function to be executed if request was succesful
###### @fail {Function} **Optional** function to be executed if request wasn't succesful
Low level function for sending http/https requests
*/
var http         = require('http'),
    util         = require('util'),

    request      = require('request'),
    requestSync  = require('sync-request'),

    api          = require('./api'),
    debug        = require('./debug'),
    exc          = require('./exception'),
    logger       = require('./logger'),
    CONFIG       = require('../config/config.js');

module.exports.send = function send(options, cb, fail) {

    var callback = function (error, response, body) {
        if (!error) {
            debug.writeResponse(response);
            if (response.statusCode === 200) {
                if (cb) {
                    return cb({success: true})
                }
            } else {
                if (fail) {
                    fail(response.statusCode);
                }
            }
        } else {
            debug.write('Request failed\n', util.inspect(error.stack));
            logger.methods.push('error', error.message, [{error: error}]);
        }
    };

    request(options, callback);
    debug.writeRequest(options);
};

module.exports.sendSync = function sendSync(options) {
    try {
        var res = requestSync('POST', options.url, {
            json: options.data,
            headers: options.headers
        });
        options.data.Msgs = options.data.Msgs.length + ' messages';
        debug.close('Sending logs synchronously before exiting the app\n' + JSON.stringify(options, null, 4));
    } catch (err) {
        debug.writeSync('Sending failed. Error stack: \n' + JSON.stringify(err.stack, null, 4));
        process.exit(1);
    }
};