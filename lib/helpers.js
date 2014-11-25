/* ### function parseMeta (meta, [err])
###### @meta {Object} any meta data added to the message.
###### @err {Boolean} **Optional** if true we should look for an error object and exclude it to separate parameter
Function for parsing meta objects attached to the message
*/

var stackTrace = require('stack-trace');

module.exports.parseMeta = function parseMeta(meta, err) {
    var result,
        ex,
        key;
    if (Object.prototype.toString.call(meta) === '[object Object]') {
        for (key in meta) {
            if (meta[key] instanceof Error && err && !ex) {
                ex = meta[key];
                delete meta[key];
            }
        }
        try {
            result = JSON.stringify(meta);

            return {
                result: result,
                ex: ex
            };
        } catch (e) {
            throw new TypeError('Metadata should be valid JSON Object');
        }
    } else {
        throw new TypeError('Metadata should be valid JSON Object');
    }

};

/* 
*** Function for extracting cookies from request object ***
*/
module.exports.getCookies = function getCookies(req) {
    var key,
        keys,
        cookies = req.cookies,
        result = {};
    if (cookies) {
        if (Object.keys(cookies).length) {
            for (key in cookies) {
                if (cookies.hasOwnProperty(key)) {
                    result[key] = CONFIG.COOKIE_MASK;
                }
            }
        }
    } else if (req.headers.cookie) {
        keys = req.headers.cookie.split('; ');
        keys.forEach(function (elem) {
            var parts = elem.split('=');
            result[parts[0]] = CONFIG.COOKIE_MASK;
        });
    }

    return result;
};

/* 
*** Function for extracting post data from request object ***
*/

module.exports.getPostData = function getPostData(req) {
    var result = {};
    if (req.body instanceof Object) {
        result = req.body;
    }
    return result;
};

/* 
*** Function for getting the trace of an exception object ***
*/

module.exports.getTrace = function getTrace(err) {
    var trace = stackTrace.parse(err),
        result = [];
    /* remove methods of logger itself from the stack trace */
    trace.forEach(function (val, index, arr) {
        var method = val.methodName || (val.functionName || val.typeName) + '.<anonymous>';

        if (val.fileName.search('lib/logger.js') < 0 || val.fileName.search('stackify') < 0) {
            result.push({
                CodeFileName: val.fileName,
                LineNum: val.lineNumber,
                Method: method
            });
        }
    });
    return result;
};

/* 
*** Function for correctly parsing the URL ***
*/

module.exports.getURL = function getURL(req) {
    var href = (req.connection.encrypted ? "https://" : "http://") + req.headers.host + req.url;
    return href;
};