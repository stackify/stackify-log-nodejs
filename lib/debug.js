// Copyright (c) 2024 BMC Software, Inc.
// Copyright (c) 2021-2024 Netreo
// Copyright (c) 2019 Stackify

var fs        = require('fs'),
    util      = require('util'),
    debug     = false,
    stream    = false,
    makeMsg   = function (msg) {
        return new Date().toString() + ' ' + msg + '\n';
    },
    // create writable stream if debug mode is turned on
    init      = function (callback, log_path) {
        fs.access(log_path, fs.constants.F_OK | fs.constants.W_OK, function (err) {
            var writeFailed = false;
            if (err) {
                // If error then we use the stdout for debugging purposes
                stream = fs.createWriteStream(null, { fd: process.stdout.fd });
                writeFailed = true;
            }
            else {
                stream = fs.createWriteStream(log_path, {flags: 'a'});
            }
            
            stream.write(makeMsg('-------------------'));
            if (writeFailed) {
                stream.write(makeMsg('Fail to write on ' + log_path));
            }
            stream.write(makeMsg('Debugging started'));
            stream.on('error', function (err) {
                console.error('Error occurred during writing to the log file ', util.inspect(err));
            });
            callback();
        });

    };

module.exports = {

    set: function (option, callback) {
        debug = (option.debug === true) ? true :  false;
        if (debug) {
            // Just to make sure we get the latest path
            init(callback, option.debug_log_path);
        }
        else
        {
            callback();
        }
    },

    write: function (msg) {
        if (debug) {
            stream.write(makeMsg(msg));
        }
    },

    writeResponse: function (response) {
        var body = response ? response.body : null,
            msgBody = (body && typeof body === 'object') ? JSON.stringify(response.body) : body,
            msg = response ? ('url: ' + response.request.uri.href + ':' + response.request.uri.port + ', method: '
                          + response.req.method + ', status: ' + response.statusCode + '\nresponse: ' + msgBody) : 'no data available';

        this.write('Response received\n' + msg);
    },

    writeRequest: function (request, close) {
        if (close) {
            this.close('Request sent\n' + JSON.stringify(request));
        } else {
            this.write('Request sent\n' + JSON.stringify(request));
        }
    },

    // special case - write synchronously to file if synchronous request before exit failed
    writeSync: function (msg) {
        try {
            fs.appendFileSync(log_path, makeMsg(msg));
        } catch (err) {
            console.error('Error occured during writing to the log file ', util.inspect(err));
        }
    },

    close: function (msg) {
        var exit_msg = 'Exiting the app',
            message  = msg || exit_msg;

        if (stream) {
            stream.end(makeMsg(message) + (msg ? makeMsg(exit_msg) : ''));
        }
    }
};