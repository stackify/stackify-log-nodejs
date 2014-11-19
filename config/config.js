module.exports = {
    'PROTOCOL' : 'https',
    'HOST': 'dev.stackify.com',
    'PORT': 443,
    'IDENTIFY_PATH': '/API/Metrics/IdentifyApp',
    'LOG_SAVE_PATH': '/API/Log/Save',
    'MSG_LIMIT': 100, // number of messages per batch
    'MSG_CAP': 10000, // overall messages cap in the queue
    'SCAN_TIMER': 30 * 1000,
    'REQUEST_TIMER': 5 * 1000,
    'REQUEST_ATTEMPTS': 5, // number of attempts if API call isn't succesful
    /**
     * Number of instances of a unique error that are allowed to be sent in one minute 
     */
    'MAX_DUP_ERROR_PER_MINUTE': 5,
    /**
     * Cookie value 
     */
    'COOKIE_MASK': 'X-MASKED-X'
};