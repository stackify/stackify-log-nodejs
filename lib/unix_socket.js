"use strict";

var http    = require('http'),
    debug   = require('./debug'),
    CONFIG  = require('../config/config');

var exports = module.exports = {};

/*
 *** send(data, cb) Function to send http request via unix domain socket
 *** @data {Object} protobuf message
 *** @cb {Function} callback function to be executed after the http request result
 */
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
        cb(null, {'success': true, 'statusCode': 200});
      } else {
        error = {'success': false, 'statusCode': res.statusCode, 'message': res.statusMessage};
        cb({message: error}, null);
      }
    };

    /**
     *** http.request(options, callback) Send http request via unix domain socket
     *** @options {Object} options object contains variables such as socketPath,
     ***                   path, method & headers
     *** callback {Function} callback function to be executed if the request is successful/failed.
     */
    var client = http.request(options, callback);
        client.on('error', function(error) {
          cb({message: error}, null);
        });

    // Convert data into binary Buffer and send it to unix socket
    data = Buffer.from(data, 'utf8');
    client.write(data);
    client.end();
  } catch (error) {
    cb({message: error}, null);
  }
}
