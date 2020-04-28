var URL   = require('url'),
    fs    = require('fs'),
    debug = require('../lib/debug'),
    semver = require('semver')

module.exports = {
    PROTOCOL               : 'https',
    HOST                   : 'api.stackify.com',
    PORT                   : 443,
    IDENTIFY_PATH          : '/Metrics/IdentifyApp',
    LOG_SAVE_PATH          : '/Log/Save',
    SOCKET_PATH            : '/usr/local/stackify/stackify.sock',
    SOCKET_URL             : '/log',
    TRANSPORT              : 'log',
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
    LOG_SERVER_VARIABLES: true, // determines if server variables should be logged, defaults to true,
    DEBUG: false,
    _setupConfig: function (settings) {
        var transport_http_endpoint = settings && settings.transport_http_endpoint ? settings.transport_http_endpoint : this.TRANSPORT_HTTP_URL
        var transport = settings && settings.transport ? settings.transport : this.TRANSPORT
        this.TRANSPORT = transport.trim().toLowerCase()
        if (transport_http_endpoint) {
            if (semver.satisfies(process.version, '^8.0')) {
                var MyUrl = URL.URL
                httpEndpoint = new MyUrl(transport_http_endpoint)
            } else {
                httpEndpoint = URL.parse(transport_http_endpoint)
            }
            this.TRANSPORT_HTTP.HOSTNAME = httpEndpoint.hostname
            this.TRANSPORT_HTTP.PORT = httpEndpoint.port
        }
        debug.write('Node version: ' + process.versions.node)
        debug.write('AppName: ' + settings.appName)
        debug.write('Transport: ' + transport)
        debug.write('Transport HTTP Endpoint: ' + transport_http_endpoint)
    },
    _validateConfig: function (settings) {
        // check that settings object is correct
        var type = (typeof(settings) !== 'undefined') && settings.transport || this.TRANSPORT;
        this.TRANSPORT = type && type.trim();
        var socket_path = (typeof(settings) !== 'undefined') && settings.socket_path || this.SOCKET_PATH;
        this.SOCKET_PATH = socket_path && socket_path.trim();
        if (!settings) {
            debug.write('[Stackify Node Log API Error] Settings are not provided');
            throw new TypeError('[Stackify Node Log API] Error: Settings are not provided');
        }
        // Required: appName
        if (!settings.appName || (settings.appName && typeof (settings.appName) !== 'string')) {
            debug.write('[Stackify Node Log API Error] Application Name is not specified or not a string type.');
            throw new TypeError('[Stackify Node Log API Error] You have to pass an Application Name (Must be a string)');
        }
        // Required: env
        if (!settings.env || (settings.env && typeof (settings.env) !== 'string')) {
            debug.write('[Stackify Node Log API Error] Environment is not specified or not a string type.');
            throw new TypeError('[Stackify Node Log API Error] You have to pass an Environment (Must be a string)');
        }
        // Validate the transport type
        if (!(['agent_http', 'agent_socket', 'log'].includes(this.TRANSPORT))) {
            throw new TypeError('[Stackify Node Log API Error] Transport should be one of these values: agent_http, agent_socket, log.');
        }
        if ( type === 'agent_socket') {
            if (!fs.existsSync(socket_path)) {
                err_message = '[Stackify Node Log API Error] Socket Transport - /usr/local/stackify/stackify.sock does not exist!'
                debug.write(err_message);
            }
        } else if (type === 'agent_http') {
            if ((settings.transport_http_endpoint && typeof (settings.transport_http_endpoint) !== 'string')) {
                debug.write('[Stackify Node Log API Error] HTTP Transport - HTTP Endpoint is not specified or not a string type.');
                throw new TypeError('[Stackify Node Log API Error] HTTP Transport - You have to pass an HTTP Endpoint (Must be a string)');
            }
        } else if (type === 'log') {
            if (!settings.apiKey || (settings.apiKey && typeof (settings.apiKey) !== 'string')) {
                debug.write('[Stackify Node Log API Error] Log Transport - You have to pass API key to initialize Stackify Logger.');
                throw new TypeError('[Stackify Node Log API Error] Log Transport - You have to pass API key to initialize Stackify Logger.');
            }
        }
    }
};
