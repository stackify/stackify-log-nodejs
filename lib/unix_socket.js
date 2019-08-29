"use strict";

var http = require('http');
var path = require('path');

var exports = module.exports = {};

exports.send = function send(opt, cb) {
  console.log('\nstackify-unixsocket module:')
  console.log(opt)
  var options = {
    socketPath: '/usr/local/stackify/stackify.sock',
    path: 'http://log',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-protobuf'
    }
  };

  var callback = function callback(res) {
    res.setEncoding('utf8');
    if (res.statusCode == 200) {
      console.log('200 SUCCESS!')
    } else {
      console.log(res.statusCode)
    }
    res.on('data', function (data) {
      // return console.log(data);
    });
    res.on('error', function (data) {
      return console.error(data);
    });
  };

  const clientRequest = http.request(options, callback);
  // clientRequest.write(log_group);
  clientRequest.end();
}
