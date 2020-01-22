var URL = require('url').URL
var debug = require('../lib/debug')

module.exports = {
    PROTOCOL               : 'https',
    HOST                   : 'api.stackify.com',
    PORT                   : 443,
    IDENTIFY_PATH          : '/Metrics/IdentifyApp',
    LOG_SAVE_PATH          : '/Log/Save',
    SOCKET_PATH            : '/usr/local/stackify/stackify.sock',
    SOCKET_URL             : '/log',
    TRANSPORT              : 'default',
    TRANSPORT_HTTP_URL     : 'https://localhost:10601',
    TRANSPORT_HTTP         : {
        HOSTNAME           : 'localhost',
        PORT               : 10601
    },
    DELAY: { // possible delay values in millis
        ONE_SECOND_DELAY   : 1000,
        FIVE_SECONDS_DELAY : 5000,
        ONE_MINUTE_DELAY   : 60000,
        FIVE_MINUTES_DELAY : 300000,
        SOCKET_DELAY       : 10000
    },
    MAX_RETRIES            : 6,
    MSG: {
        QUEUE_CAP          : 10000,
        MIN_BATCH_SIZE     : 10,
        MAX_BATCH_SIZE     : 100,
        MAX_DUP_ERROR_PER_MINUTE: 100, // number of instances of a unique error that are allowed to be sent in one minute
    },
    IDENTIFY_DELAY: 300000, // 5 minutes delay if identifyApp call failed
    COOKIE_MASK: 'X-MASKED-X', // cookie headers and values mask
    LOGGER_VERSION: 'Node.js Stackify v.1.0',
    WINSTON_LOGGER_VERSION: 'Node.js Winston-Stackify v.1.0',
    X_STACKIFY_PV: 'V1',
    LOG_SERVER_VARIABLES: true, // determines if server variables should be logged, defaults to true
    _setupConfig: function (settings) {
        var transport_http_endpoint = settings && settings.transport_http_endpoint ? settings.transport_http_endpoint : this.TRANSPORT_HTTP_URL
        var transport = settings && settings.transport ? settings.transport : this.TRANSPORT
        console.log('_setupConfig transport_http_endpoint:', transport_http_endpoint)
        this.TRANSPORT = transport
        console.log('_setupConfig transport:', transport)
        if (transport_http_endpoint) {
            var httpEndpoint = new URL(transport_http_endpoint)
            this.TRANSPORT_HTTP.HOSTNAME = httpEndpoint.hostname
            this.TRANSPORT_HTTP.PORT = httpEndpoint.port
        }
        debug.write('Transport: ' + transport)
        debug.write('Transport HTTP Endpoint: ' + transport_http_endpoint)
    },
    _validateConfig: function (settings) {
        console.log('_validateConfig')
        var type = settings.transport || this.TRANSPORT;
        this.TRANSPORT = type && type.trim();
        var socket_path = settings.socket_path || this.SOCKET_PATH;
        this.SOCKET_PATH = socket_path && socket_path.trim();
        if (!settings) {
            debug.write('[Stackify Log API Error] Settings are not provided');
            throw new TypeError('[Stackify Node Log API] Error: Settings are not provided');
        }
        // Required: appName
        if (!settings.appName || (settings.appName && typeof (settings.appName) !== 'string')) {
            debug.write('Application Name is not specified or not a string type.');
            throw new TypeError('You have to pass an Application Name (Must be a string)');
        }
        // Required: env
        if (!settings.env || (settings.env && typeof (settings.env) !== 'string')) {
            debug.write('[Stackify Log API Error] Environment is not specified or not a string type.');
            throw new TypeError('[Stackify Log API Error] You have to pass an Environment (Must be a string)');
        }
        if ( type === 'agent_socket') {
            if (!fs.existsSync(socket_path)) {
                err_message = '[Stackify Log API Error] /usr/local/stackify/stackify.sock does not exist!'
                debug.write(err_message);
            }
        } else if (type === 'agent_http') {
            if (!settings.transport_http_endpoint || (settings.transport_http_endpoint && typeof (settings.transport_http_endpoint) !== 'string')) {
                debug.write('[Stackify Log API Error] HTTP Endpoint is not specified or not a string type.');
                throw new TypeError('[Stackify Log API Error] You have to pass an HTTP Endpoint (Must be a string)');
            }
        } else {
            if (!settings.apiKey || (settings.apiKey && typeof (settings.apiKey) !== 'string')) {
                debug.write('You have to pass API key to initialize Stackify Logger');
                throw new TypeError('You have to pass API key');
            }
        }
    }
};
