var url        = require('url'),
    util       = require('util'),
    os         = require('os'),

    helpers    = require('./helpers'),
    CONFIG     = require('../config/config');

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
                EnvironmentDetail: {
                    DeviceName: os.hostname(),
                    AppName: CONFIG.APPNAME,
                    AppLocation: process.env.PWD,
                    ConfiguredAppName: CONFIG.APPNAME,
                    ConfiguredEnvironmentName: CONFIG.ENV
                },
                OccurredEpochMillis: Date.now(),
                Error: {
                    Message: msg || err.message,
                    ErrorType: msg ? 'StringException' : err.name,
                    ErrorTypeCode: null,
                    SourceMethod: trace[0].Method,
                    StackTrace: trace,
                    InnerError: null
                },
                ServerVariables: process.env
            },
            href;

        if (req) {
            href = url.parse(helpers.getURL(req), true);
            ex.WebRequestDetail = {
                UserIPAddress : req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||
                                req.connection.socket.remoteAddress,
                HttpMethod: req.method,
                RequestProtocol: req.connection.encrypted ? 'HTTPS' : 'HTTP',
                RequestUrl: (req.connection.encrypted ? 'https://' : 'http://') + href.hostname + href.pathname,
                RequestUrlRoot: href.hostname,
                ReferralUrl: req.headers.referer,
                Headers: req.headers,
                Cookies: helpers.getCookies(req),
                QueryString: href.query,
                PostData: helpers.getPostData(req)
            };

            if (req.headers.cookie) {
                ex.WebRequestDetail.Headers.cookie = CONFIG.COOKIE_MASK;
            }
        }

        return ex;
    }
};