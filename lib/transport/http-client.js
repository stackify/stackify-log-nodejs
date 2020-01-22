'use strict'

var https = require('https'),
  fs = require('fs'),
  debug = require('../debug'),
  CONFIG = require('../../config/config')

var exports = module.exports = {}

/*
 *** post(data, cb) Function to send http request
 *** @data {Object} protobuf message
 *** @cb {Function} callback function to be executed after the http request result
 */
exports.send = function send (data, cb) {
  try {
    debug.write('Calling HTTPClient.post()');
    console.log('HTTPClient.post()')
    var options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf'
      },
      host: CONFIG.TRANSPORT_HTTP.HOSTNAME,
      port: CONFIG.TRANSPORT_HTTP.PORT,
      path: CONFIG.SOCKET_URL,
      rejectUnauthorized: false
    }

    // console.log('http-client.js opt:', options)
    var callback = function callback (res) {
      // console.log('http-client.js res:', res)
      if (res.statusCode === 200) {
        debug.write('Successfully sent via http request.')
        cb({'success': true, 'statusCode': 200})
      } else {
        let error = {'success': false, 'statusCode': res.statusCode, 'message': res.statusMessage}
        debug.write('Failure sending via http request.')
        cb({message: error}, null)
      }
    }

    /**
     *** http.request(options, callback) Send http request via http request
     *** @options {Object} options object contains variables such as socketPath,
     ***                   path, method & headers
     *** callback {Function} callback function to be executed if the request is successful/failed.
     */
    var client = https.request(options, callback)

    // set timeout of 5 seconds on request
    client.on('socket', function (socket) {
      socket.setTimeout(5000);
      socket.on('timeout', function() {
        client.abort();
      });
    });

    client.on('error', function (error) {
      console.log('HTTPClient error:', error)
      cb({message: error}, null)
    })

    // Convert data into binary Buffer and send it to unix socket
    data = Buffer.from(data, 'utf8')

    client.write(data)
    client.end()
  } catch (error) {
    debug.writeSync("Error in HTTP request: " + error);
    console.log('Error in HTTP request: ', error)
    cb({message: error}, null)
  }
}
