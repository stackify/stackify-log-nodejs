/* ### function sender (options, data, [cb], [fail])
###### @options {Object} request options (hostname, headers, path, post data etc).
###### @cb {Function} **Optional** callback function to be executed if request was succesful
###### @fail {Function} **Optional** function to be executed if request wasn't succesful
Low level function for sending http/https requests
*/
var http    = require('http'),
    util    = require('util'),

    request = require('request');

module.exports = function sender(options, cb, fail) {

    var callback = function (error, response, body) {
        if (!error) {
            if (response.statusCode === 200) {
                if (cb) {
                    cb(body);                }
            } else {
                if (fail) {
                    fail();
                }
            }
        } else {
            console.log(error);
        }
    };

    request(options, callback);
};