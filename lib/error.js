var url        = require('url'),
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
    };

module.exports = {
    formatEx : function formatEx(err, req) {
        var trace = this.parseError(err),
            ex = {
                OccuredEpochMillis: Date.now(),
                Error: {
                    Message: err.method,
                    ErrorType: err.name,
                    SourceMethod: trace[0],
                    StackTrace: trace,
                    InnerError: null
                },
                EnvironmentDetail: {
                    AppName: CONFIG.APP_DETAILS.AppName,
                    AppNameID: CONFIG.APP_DETAILS.AppNameID,
                    EnvID: CONFIG.APP_DETAILS.EnvID,
                    AppEnvID: CONFIG.APP_DETAILS.AppEnvID,
                    AppLocation: process.env.PWD,
                },
                ServerVariables: process.env
            },
            headers = req.headers,
            qs,
            key;

        if (req) {
            qs = url.parse(req.url, true);

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
                HttpMethod: req.protocol,
                RequestProtocol: req.method,
                RequestUrl: req.url,
                RequestUrlRoot: qs.pathname,
                ReferralUrl: req.headers.referer,
                Headers: headers,
                Cookies: getCookies(req),
                QueryString: qs.query,
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