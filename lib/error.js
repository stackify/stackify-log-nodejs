var url        = require('url'),
    util       = require('util'),
    stackTrace = require('stack-trace'),
    helpers    = require('./helpers'),
    CONFIG     = require('../config/config'),
    
    getCookies = function getCookies(req) {
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
    },

    getPostData = function getPostData(req) {
        var result = {};
        if (req.body instanceof Object) {
            result = req.body;
        }
        return result;
    },
    getTrace = function getTrace(err) {
        var trace = stackTrace.parse(err),
            result = [];

        trace.forEach(function (val, index, arr) {
            result.push({
                CodeFileName: val.fileName,
                LineNum: val.lineNumber,
                Method: val.methodName || (val.functionName || val.typeName) + '.<anonymous>'
            });
        });
        return result;
    },
    checkTrace = function CheckTrace(trace) {
        if (trace[1].CodeFileName.search('lib/logger.js') >= 0) {
            trace.splice(1, 1);
        }
        return trace;
    },
    getURL = function getURL(req) {
        var href = (req.connection.encrypted ? "https://" : "http://") + req.headers.host + req.url;
        return href;
    };

module.exports = {
    getStackTraceItem: function getStackTraceItem(err) {
        var trace = getTrace(err);
        trace = checkTrace(trace);
        return {
            SrcMethod: trace[1].Method,
            SrcLine: trace[1].LineNum
        }
    },
    formatEx : function formatEx(err, req, msg) {
        var trace = getTrace(err),
            newTrace = checkTrace(trace),
            ex = {
                OccuredEpochMillis: Date.now(),
                Error: {
                    Message: msg || err.message,
                    ErrorType: err.name || 'StringException',
                    ErrorTypeCode: null,
                    SourceMethod: msg ? newTrace[1].Method : trace[1].Method,
                    StackTrace: msg ? newTrace : trace,
                    InnerError: null
                },
                EnvironmentDetail: {
                    AppName: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppName : CONFIG.APPNAME,
                    AppNameID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppNameID : '',
                    EnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.EnvID : '',
                    AppEnvID: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.AppEnvID : '',
                    AppLocation: process.env.PWD
                },
                ServerVariables: process.env
            },
            headers = req ? req.headers : {},
            href,
            key;

        if (req) {
            href = url.parse(getURL(req), true);

            if (req.headers.cookie) {
                headers = {};
                for (key in req.headers) {
                    if (req.headers.hasOwnProperty(key)) {
                        headers[key] = req.headers[key];
                    }
                }
                delete headers.cookie;
            }
            ex.WebRequestDetail = {
                UserIPAddress : req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||
                                req.connection.socket.remoteAddress,
                HttpMethod: req.method,
                RequestProtocol: req.connection.encrypted ? 'HTTPS' : 'HTTP',
                RequestUrl: href.hostname + href.pathname,
                RequestUrlRoot: href.hostname,
                ReferralUrl: req.headers.referer,
                Headers: headers,
                Cookies: getCookies(req),
                QueryString: href.query,
                PostData: getPostData(req)
            };
        }

        return ex;
    },

    checkError : function checkError(obj) {
        var meta = obj.meta,
            metaIsValid = helpers.checkMeta(meta),
            err;

        if (metaIsValid && metaIsValid[1] instanceof Error) {
            err = metaIsValid[1];
            obj.Ex = this.formatEx(err);
            delete obj.meta;
        }

        return obj;
    }
};