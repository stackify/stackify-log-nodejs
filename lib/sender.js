var https = require('https');

module.exports = function sender(options, data, cb, fail) {
    var callback = function (response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            if (response.statusCode === 200) {
                if (cb) {
                    cb(str);
                }
            } else {
                console.log('fail');
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