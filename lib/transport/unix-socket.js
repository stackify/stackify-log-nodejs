'use strict'

var http    = require('http'),
    fs      = require('fs'),
    debug   = require('../debug'),
    CONFIG  = require('../../config/config')

var exports = module.exports = {}

/*
 *** send(data, cb) Function to send http request via unix domain socket
 *** @data {Object} protobuf message
 *** @cb {Function} callback function to be executed after the http request result
 */
exports.send = function send (data, cb) {
  try {
    debug.write("Calling UnixSocket.send()");
    // check if socket exists
    if (!fs.existsSync(CONFIG.SOCKET_PATH)) {
      let msg = 'Domain Socket Not Found: ' + CONFIG.SOCKET_PATH;
      debug.write(msg);
      let error = {'success': false, 'statusCode': 500, 'message': msg}
      cb({message: error}, null)
      return
    }

    var options = {
      socketPath: CONFIG.SOCKET_PATH,
      path: CONFIG.SOCKET_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf'
      }
    }

    var callback = function callback (res) {
      if (res.statusCode === 200) {
        debug.write('UnixSocket.send() - Successfully sent via unix domain socket.')
        return cb({success: true, statusCode: 200, message: res.statusMessage})
      } else {
        let error = {'success': false, 'statusCode': res.statusCode, 'message': res.statusMessage}
        debug.write('UnixSocket.send() - Failure sending via unix domain socket.')
        return cb({error: true, message: error}, null);
      }
    }

    /**
     *** http.request(options, callback) Send http request via unix domain socket
     *** @options {Object} options object contains variables such as socketPath,
     ***                   path, method & headers
     *** callback {Function} callback function to be executed if the request is successful/failed.
     */
    var client = http.request(options, callback)

    // set timeout of 5 seconds on request
    client.on('socket', function (socket) {
      socket.setTimeout(5000);
      socket.on('timeout', function() {
        client.abort();
      });
    });

    client.on('error', function (error) {
      cb({message: error}, null)
    })

    // Convert data into binary Buffer and send it to unix socket
    data = Buffer.from(data, 'utf8')

    client.write(data)
    client.end()
  } catch (error) {
    debug.writeSync("UnixSocket.send() Error: " + JSON.stringify(error));
    cb({message: error}, null)
  }
}
