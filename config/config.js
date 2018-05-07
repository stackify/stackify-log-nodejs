module.exports = {
    PROTOCOL               : 'https',
    HOST                   : 'api.stackify.com',
    PORT                   : 443,
    IDENTIFY_PATH          : '/Metrics/IdentifyApp',
    LOG_SAVE_PATH          : '/Log/Save',
    DELAY: { // possible delay values in millis
        ONE_SECOND_DELAY   : 1000,
        FIVE_SECONDS_DELAY : 5000,
        ONE_MINUTE_DELAY   : 60000,
        FIVE_MINUTES_DELAY : 300000,
    },
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
    // determines if server variables should be logged, defaults to true
    LOG_SERVER_VARIABLES: true
};