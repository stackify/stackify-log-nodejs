var stackTrace = require('stack-trace'),

    path       = require('path'),
    os         = require('os'),
    qs         = require('querystring'),

    CONFIG     = require('../config/config');

/*
*** Function for parsing meta objects attached to the message
*/

module.exports.parseMeta = function parseMeta(meta, err) {
    var result = {
            'arguments': []
        },
        ex;

    meta.forEach(function (elem) {
        var prop;
        if (Object.prototype.toString.call(elem) === '[object Object]') {
            for (prop in elem) {
                if (elem.hasOwnProperty(prop)) {
                    if (elem[prop] instanceof Error && err && !ex) {
                        ex = elem[prop];
                        delete elem[prop];
                    }
                }
            }
            if (Object.keys(elem).length) {
                result['arguments'].push(elem);
            }
        } else if (elem instanceof Error && err && !ex) {
            ex = elem;
        } else {
            result['arguments'].push(elem);
        }
    });


    result = result['arguments'].length ? JSON.stringify(result) : null;

    return {
        result: result,
        ex: ex
    };

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
    trace.forEach(function (val) {
        var method = val.methodName || (val.functionName || val.typeName) + '.<anonymous>';

        if (val.fileName ? (val.fileName.search('lib/logger.js') < 0 || val.fileName.search('stackify') < 0) : true) {
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

/*
*** Function for getting the name of the app from package.json file ***
*/

module.exports.getAppName = function getAppName() {
    var pjsonPath = path.join(process.cwd(), 'package.json'),
        pjson;
    try {
        pjson = require(pjsonPath);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return 'Unknown';
        }
    }
    return pjson.name;
};

/*
*** Function for getting the post data for the request ***
*/

module.exports.getPostBody = function getPostBody(messages) {
    return {
        CDID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.DeviceID : null,
        CDAppID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.DeviceAppID : null,
        AppNameID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppNameID : null,
        AppEnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppEnvID : null,
        EnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.EnvID : null,
        Env: CONFIG.ENV,
        ServerName: os.hostname(),
        AppName: CONFIG.APPNAME,
        AppLoc: process.env.PWD,
        Logger: CONFIG.LOGGER_VERSION,
        Platform: 'Node.js',
        Msgs : messages
    };
};

/*
*** Function for getting the request options ***
*/

module.exports.getOptions = function getOptions(path, body, proxy) {
    var result =  {
        url: CONFIG.PROTOCOL + '://' + CONFIG.HOST + path,
        method: 'POST',
        json: true,
        headers: this.getHeaders(),
        body: body
    };

    if (proxy) {
        result.proxy = (proxy.slice(0, 4) === 'http') ? proxy : 'http://' + proxy;
        CONFIG.PROXY = CONFIG.PROXY || proxy;
    }

    return result;

};

/*
*** Function for getting request headers ***
*/

module.exports.getHeaders = function getHeaders() {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Stackify-Key': CONFIG.APIKEY,
        'X-Stackify-PV': CONFIG.X_STACKIFY_PV
    };
};
/*
*** Function for getting post data from the request
*/
module.exports.getPostData = function getPostData (req) {
    return (function() {
        if (request.method == 'POST') {
            var body = '';
            request.on('data', function (data) {
                body += data;

                // Too much POST data, kill the connection!
                if (body.length > 1e6)
                    request.connection.destroy();
            });
            request.on('end', function () {
                var json = qs.parse(body);
                req.body = json;
            });
        }
    }());
};