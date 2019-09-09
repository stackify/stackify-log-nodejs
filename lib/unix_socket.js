"use strict";

var http    = require('http'),
    debug   = require('./debug'),
    CONFIG  = require('../config/config');

var exports = module.exports = {};

exports.send = function send(data, cb) {
  try {
    var options = {
      socketPath: CONFIG.SOCKET_PATH,
      path: CONFIG.SOCKET_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf'
      }
    };

    var callback = function callback(res) {
      if (res.statusCode == 200) {
        return cb({'success': true, 'statusCode': 200});
      } else {
        // If status_code is not 200, attempt to retry every 5 min. delay
        setTimeout(function () {
          exports.send(data, cb);
        }, CONFIG.DELAY.FIVE_MINUTES_DELAY);
      }
      res.on('error', function (error) {
        format_error_message(error);
      });
    };

    var client = http.request(options, callback);
        client.on('error', function(error) {
          error = format_error_message(error);
          setTimeout(function () {
            exports.send(data, cb);
          }, CONFIG.DELAY.FIVE_MINUTES_DELAY);
        });

    // Convert data into binary Buffer and send it to unix socket
    data = Buffer.from(data, 'utf8');
    client.write(data);
    client.end();
  } catch (error) {
    format_error_message(error);
    setTimeout(function () {
      exports.send(data, cb);
    }, CONFIG.DELAY.FIVE_MINUTES_DELAY);
  }
}

function format_error_message(error) {
  var err_message = '[Stackify Log API Error] Sending failed:' + JSON.stringify(error, null, 2);
  debug.writeSync(err_message);
  console.error(err_message);
  return err_message;
}
