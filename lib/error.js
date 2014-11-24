var url        = require('url'),
    util       = require('util'),
    os         = require('os'),

    stackTrace = require('stack-trace'),

    helpers    = require('./helpers'),
    CONFIG     = require('../config/config'),

module.exports = {
    /* getting source method and source method line of code*/
    getStackTraceItem: function getStackTraceItem(err) {
        var trace = helpers.getTrace(err);
        return {
            SrcMethod: trace[0].Method,
            SrcLine: trace[0].LineNum
        };
    },

    // create the exception details object
    formatEx : function formatEx(err, req, msg) {
        var trace = helpers.getTrace(err),
            ex = {
                OccuredEpochMillis: Date.now(),
                Error: {
                    Message: msg || err.message,
                    ErrorType: msg ? 'StringException' : err.name,
                    ErrorTypeCode: null,
                    SourceMethod: trace[0].Method,
                    StackTrace: trace,
                    InnerError: null
                },
                EnvironmentDetail: {
                    DeviceName: os.hostname(),
                    AppName: CONFIG.APPNAME,
                    AppLocation: process.env.PWD,
                    ConfiguredAppName: CONFIG.APPNAME,
                    ConfiguredEnvironmentName: CONFIG.ENV
                },
                ServerVariables: process.env
            },
            headers = req ? req.headers : {},
            href,
            key;

        if (req) {
            href = url.parse(helpers.getURL(req), true);

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
                RequestUrl: (req.connection.encrypted ? 'https://' : 'http://') + href.hostname + href.pathname,
                RequestUrlRoot: href.hostname,
                ReferralUrl: req.headers.referer,
                Headers: headers,
                Cookies: helpers.getCookies(req),
                QueryString: href.query,
                PostData: helpers.getPostData(req)
            };
        }

        return ex;
    }
};