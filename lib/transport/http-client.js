'use strict'

var https   = require('https'),
    debug   = require('../debug'),
    CONFIG  = require('../../config/config')

var exports = module.exports = {}

/*
 *** post(data, cb) Function to send http request
 *** @data {Object} protobuf message
 *** @cb {Function} callback function to be executed after the http request result
 */
exports.post = function post (data, cb) {
  try {
    debug.write('Calling HTTPClient.post()');
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

    var callback = function callback (res) {
      if (res.statusCode === 200) {
        debug.write('HTTPClient.post() - Successfully sent via http request.')
        return cb({success: true, statusCode: 200, message: res.statusMessage})
      } else {
        let error = {'success': false, 'statusCode': res.statusCode, 'message': res.statusMessage}
        debug.write('HTTPClient.post() - Failure sending via http request.')
        return cb({error: true, message: error}, null);
      }
    }

    /**
     *** http.request(options, callback) Send message via http request
     *** @options {Object} options object contains variables such as transport http endpoint
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
      var errMsg = 'HTTPClient.post() error: ' + JSON.stringify(error)
      debug.writeSync(errMsg);
      cb({message: errMsg}, null)
    })

    // Convert data into binary Buffer and send it to unix socket
    var data = Buffer.from(data, 'utf8')

    client.write(data)
    client.end()
  } catch (error) {
    var errMsg = 'HTTPClient.post() error: ' + JSON.stringify(error)
    debug.writeSync(errMsg);
    cb({message: errMsg}, null)
  }
}
