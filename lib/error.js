var url        = require('url'),
    os         = require('os'),

    helpers    = require('./helpers'),
    exc        = require('./exception'),
    CONFIG     = require('../config/config'),

    // object that contains all the errors and their numbers logged during the current minute
    errorStorage = {};

module.exports = {
    /**
    * Check for duplicate error messages. If the same error message logged more than configured limit in one minute
    * don't push it to the queue
    */
    checkErrorLimitMessage : function checkErrorLimitMessage(ex) {
        var d = new Date(),
            min = d.getFullYear().toString() + d.getMonth().toString() + d.getDate().toString()
                + d.getHours().toString() + d.getMinutes().toString(),
            key;

        if (!ex) {
            return true;
        }

        key = ex.Error.Message + ex.Error.ErrorType + ex.Error.SourceMethod;

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

        return errorStorage[min][key] <= CONFIG.MSG.MAX_DUP_ERROR_PER_MINUTE;
    },

    // getting source method and source method line of code, not_direct is a flag indicating if the message was sent via direct logger
    getStackTraceItem: function getStackTraceItem(err, not_direct) {
        var trace = helpers.getTrace(err),
            result = {},
            lastElement = trace[trace.length - 1];

        if (not_direct) {
            if (lastElement) {
                if (lastElement.CodeFileName === 'module.js') {
                    result.SrcMethod = trace[trace.length - 2].Method;
                    result.SrcLine = trace[trace.length - 2].LineNum;
                } else {
                    result.SrcMethod = lastElement.Method;
                    result.SrcLine = lastElement.LineNum;
                }
            }
        } else {
            result.SrcMethod = trace[0].Method;
            result.SrcLine = trace[0].LineNum;
        }

        return result;
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
                    ConfiguredEnvironmentName: CONFIG.APP_DETAILS ? CONFIG.APP_DETAILS.ENV : null
                },
                OccurredEpochMillis: Date.now(),
                Error: {
                    Message: msg || err.message,
                    ErrorType: msg ? 'StringException' : err.name,
                    ErrorTypeCode: null,
                    SourceMethod: (trace && trace[0] && trace[0].Method) ? trace[0].Method : '',
                    StackTrace: trace,
                    InnerError: null
                },
                ServerVariables: CONFIG.LOG_SERVER_VARIABLES ? process.env : null
            },
            href;
        // add web request details if req object is passed
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

            // mask certain headers so data is not sent to Stackify
            ["cookie", "authorization"].forEach(function(elm){
                if (req.headers[elm]) {
                    ex.WebRequestDetail.Headers[elm] = CONFIG.COOKIE_MASK;
                }
            });
        }

        return ex;
    }
};