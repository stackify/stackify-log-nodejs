var CONFIG = require('../config/config.js');

module.exports = {
    getTransactionId: function () {
        return '';
    },
    getReportingUrl: function () {
        return '';
    },
    injectRumContent: function () {
        let applicationName = CONFIG.APPNAME;
        let environment = CONFIG.ENV;
        let rumScriptUrl = CONFIG.RUM_SCRIPT_URL;
        let rumKey = CONFIG.RUM_KEY;

        if (!applicationName || !environment || !rumScriptUrl || !rumKey) {
            return '';
        }

        let reportingUrl = this.getReportingUrl();
        let transactionId = this.getTransactionId();

        if (!reportingUrl || !transactionId) {
            return '';
        }

        let settings = {
            'ID': transactionId,
            'Name': Buffer.from(applicationName).toString('base64'),
            'Env': Buffer.from(environment).toString('base64'),
            'Trans': Buffer.from(reportingUrl).toString('base64')
        }

        return '<script type="text/javascript">(window.StackifySettings || (window.StackifySettings = ' + JSON.stringify(settings) + '))</script><script src="' + rumScriptUrl + '" data-key="' + rumKey + '" async></script>';
    }
};