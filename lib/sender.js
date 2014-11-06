module.exports = function sender(options, data, cb, fail) {

    callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            if (response.statusCode === 200) {
                cb(str);
            } else {
                if (fail) {
                    fail();
                }
            }
        });
    },

    req = http.request(options, callback);

    req.write(data);
    req.end();
};