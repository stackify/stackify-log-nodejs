/* ### function sender (options, data, [cb], [fail])
###### @options {Object} request options (hostname, headers, path, post data etc).
###### @cb {Function} **Optional** callback function to be executed if request was succesful
###### @fail {Function} **Optional** function to be executed if request wasn't succesful
Low level function for sending http/https requests
*/
var http         = require('http'),

    request      = require('request'),
    requestSync  = require('sync-request'),

    logger       = require('./logger'),
    CONFIG       = require('../config/config.js');

module.exports.send = function send(options, cb, fail) {

    var callback = function (error, response, body) {
        if (!error) {
            if (response.statusCode === 200) {
                if (cb) {
                    cb(body);
                }
            } else {
                if (fail) {
                    fail(response.statusCode);
                }
            }
        } else {
            logger.methods.push('error', error.message, [{error: error}]);
        }
    };
    request(options, callback);
};

module.exports.sendSync = function sendSync(options) {

    var res = requestSync('POST', options.url, {
        json: options.data,
        headers: options.headers
    });

};