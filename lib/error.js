var url        = require('url'),
    os         = require('os'),

    helpers    = require('./helpers'),
    CONFIG     = require('../config/config'),

    // hash that contains all the errors and their number logged during the current minute
    errorStorage = {};

module.exports = {
    /**
    * Check for duplicated error messages. If the same error message logged more than configurated limit in one minute
    * don't push it to the queue
    */
    checkErrorLimitMessage : function checkErrorLimitMessage(ex) {
        var d = new Date(),
            min = d.getFullYear().toString() + d.getMonth().toString() + d.getDate().toString()
                + d.getHours().toString() + d.getMinutes().toString(),
            key = ex.Error.Message + ex.Error.ErrorType + ex.Error.SourceMethod;

        if (!ex) {
            return true;
        }

        if (errorStorage[min]) {
            if (errorStorage[min][key]) {
                errorStorage[min][key] += 1;
            } else {
                errorStorage[min][key] = 1;
            }
        } else {
            errorStorage = {};
            errorStorage[min] = {};
            errorStorage[min][key] = 1;
        }

        return errorStorage[min][key] < CONFIG.MSG.MAX_DUP_ERROR_PER_MINUTE;
    },

    // getting source method and source method line of code 
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