/* ### function sender (options, data, [cb], [fail])
###### @options {Object} request options (hostname, headers, path, etc).
###### @data {Object} data to be sent
###### @cb {Function} **Optional** callback function to be executed if request was succesful
###### @fail {Function} **Optional** function to be executed if request wasn't succesful
Low level function for sending http/https requests
*/
var https = require('https'),
    util  = require('util');

module.exports = function sender(options, data, cb, fail) {
    var callback = function (response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved
        response.on('end', function () {
            if (response.statusCode === 200) {
                if (cb) {
                    cb(str);
                }
            } else {
                if (fail) {
                    fail();
                }
            }
        });
    },
        req = https.request(options, callback);

    req.on('error', function (e) {
        console.log('err: ' + e);
    });

    req.write(JSON.stringify(data));
    req.end();
};