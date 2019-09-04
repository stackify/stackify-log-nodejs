"use strict";

var http = require('http');
var debug = require('./debug');
var path = require('path');

var exports = module.exports = {};

exports.send = function send(opt, data, success, shutdown) {
  try {
    var options = {
      socketPath: '/usr/local/stackify/stackify.sock',
      path: 'http://log',
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
      res.on('data', function (data) {
        return data;
      });
      res.on('error', function (data) {
        return console.error(data);
      });
    };

    var client = http.request(options, callback);

    data = Buffer.from(data, 'utf8');
    client.write(data);
    client.end();
  } catch (error) {
    debug.writeSync('\nSending failed. error stack: \n' + JSON.stringify(error, null, 4));
  }
}
