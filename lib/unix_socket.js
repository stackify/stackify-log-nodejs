"use strict";

var http    = require('http'),
    debug   = require('./debug'),
    CONFIG  = require('../config/config');

var exports = module.exports = {};

exports.send = function send(data, success, shutdown) {
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
        success({'success': true, 'statusCode': 200});
      } else {
        success({'success': false, 'statusCode': res.statusCode});
      }
      res.on('error', function (error) {
        format_error_message(error);
      });
    };

    var client = http.request(options, callback);
        client.on('error', function(error) {
          error = format_error_message(error);
          success({ message: error}, null);
        });
    data = Buffer.from(data, 'utf8');
    client.write(data);
    client.end();
  } catch (error) {
    format_error_message(error);
  }
}

function format_error_message(error) {
  var err_message = '[Stackify Node Log API] Sending failed:' + JSON.stringify(error, null, 2);
  debug.writeSync(err_message);
  console.error(err_message);
  return err_message;
}
