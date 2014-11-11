module.exports = {
    'HOST': 'dev.stackify.com',
    'PORT': 443,
    'IDENTIFY_PATH': '/API/Metrics/IdentifyApp',
    'LOG_SAVE_PATH': '/API/Log/Save',
    'LICENSE_KEY': '0Zw8Fj4Hr3Aa1Sf2Gw4Cb3Gk7Fp6Zn6Sc0Gw2Cr',
    'MSG_LIMIT': 20, // number of messages
    'SCAN_TIMER': 30, // sec
    'REQUEST_TIMER': 30 * 1000, // sec
    'REQUEST_ATTEMPTS': 20, // number of attempts if API call isn't succesful
    'ERROR_FLOOD_LIMIT': 100, // limit of the same error message per minute
    'COOKIE_MASK': 'X-MASKED-X'
};