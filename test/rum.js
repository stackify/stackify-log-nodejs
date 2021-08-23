'use strict'

var should = require('should'),
    sinon = require('sinon'),
    stackify = require('..'),
    rum = require('../lib/rum'),
    config = require('../config/config');

process.env['STACKIFY_TEST'] = true

describe('Logger - Rum - With Config', function() {
    context('With reporting url and transaction id', function () {
        it('should successfully return a rum script', function (done) {
            config.APPNAME = 'appname'
            config.ENV = 'env'
            config.RUM_KEY = 'asd'

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', 'asd', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('env').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            rumScript.should.equal(stackify.injectRumContent());

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should successfully return a rum script using ENV', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';
            process.env['RETRACE_RUM_KEY'] = 'asd1';
            config._setupConfig()

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-1231');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-1231');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', 'asd1', {
                'ID': 'test-1231',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('env').toString('base64'),
                'Trans': Buffer.from('test-reporting-1231').toString('base64')
            });

            rumScript.should.equal(stackify.injectRumContent());

            config.ENV = ''
            config.APPNAME = ''
            process.env['RETRACE_RUM_KEY'] = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should successfully return a rum script USING custom rum script url', function (done) {
            config.APPNAME = 'appname'
            config.ENV = 'env'
            config.RUM_KEY = 'asd'
            config.RUM_SCRIPT_URL = 'https://test.com/test.js'

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://test.com/test.js', 'asd', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('env').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            rumScript.should.equal(stackify.injectRumContent());

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''
            config.RUM_SCRIPT_URL = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should successfully return a rum script using ENV and custom rum script url', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';
            process.env['RETRACE_RUM_KEY'] = 'asd1';
            process.env['RETRACE_RUM_SCRIPT_URL'] = 'https://test.com/test1.js';
            config._setupConfig()

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-1231');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-1231');

            let rumScript = getRumScript('https://test.com/test1.js', 'asd1', {
                'ID': 'test-1231',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('env').toString('base64'),
                'Trans': Buffer.from('test-reporting-1231').toString('base64')
            });

            rumScript.should.equal(stackify.injectRumContent());

            config.ENV = ''
            config.APPNAME = ''
            process.env['RETRACE_RUM_KEY'] = ''
            process.env['RETRACE_RUM_SCRIPT_URL'] = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });
    });

    context('With invalid settings', function () {
        it('should throw an exception if invalid RUM key', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';

            should(function () {
                config._setupConfig({
                    'rumKey': 'asd1`'
                })
            }).throw('[Stackify Node Log API Error] RUM Key is in invalid format.')

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''
            done();
        });

        it('should throw an exception if invalid RUM key using ENV', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';
            process.env['RETRACE_RUM_KEY'] = 'asd1`';

            should(function () {
                config._setupConfig()
            }).throw('[Stackify Node Log API Error] RUM Key is in invalid format.')

            config.ENV = ''
            config.APPNAME = ''
            process.env['RETRACE_RUM_KEY'] = ''
            done();
        });

        it('should throw an exception if invalid RUM Script URL', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';
            config.RUM_KEY = 'asd'

            should(function () {
                config._setupConfig({
                    'rumScriptUrl': 'asd1`'
                })
            }).throw('[Stackify Node Log API Error] RUM Script URL is in invalid format.')

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''
            config.RUM_SCRIPT_URL = ''
            done();
        });

        it('should throw an exception if invalid RUM Script URL using ENV', function (done) {
            config.APPNAME = 'appname';
            config.ENV = 'env';
            process.env['RETRACE_RUM_KEY'] = 'asd1`';
            process.env['RETRACE_RUM_SCRIPT_URL'] = 'asd1`';

            should(function () {
                config._setupConfig()
            }).throw('[Stackify Node Log API Error] RUM Script URL is in invalid format.')

            config.ENV = ''
            config.APPNAME = ''
            process.env['RETRACE_RUM_KEY'] = ''
            process.env['RETRACE_RUM_SCRIPT_URL'] = ''
            done();
        });
    });

    context('With invalid main settings', function () {
        it('should not return a rum script with invalid/empty app name', function (done) {
            config.APPNAME = ''
            config.ENV = 'env'
            config.RUM_KEY = 'asd'

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', '', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('env').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            let rumContent = stackify.injectRumContent();

            rumContent.should.not.equal(rumScript);
            rumContent.should.be.empty()

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should not return a rum script with invalid/empty environment', function (done) {
            config.APPNAME = 'asd'
            config.ENV = ''
            config.RUM_KEY = 'asd'

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', 'asd', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            let rumContent = stackify.injectRumContent();

            rumContent.should.not.equal(rumScript);
            rumContent.should.be.empty()

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should not return a rum script with empty RUM key', function (done) {
            config.APPNAME = 'asd'
            config.ENV = 'environment'
            config.RUM_KEY = ''

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', '', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            let rumContent = stackify.injectRumContent();

            rumContent.should.not.equal(rumScript);
            rumContent.should.be.empty()

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });

        it('should not return a rum script with empty RUM script URL', function (done) {
            config.APPNAME = 'asd'
            config.ENV = 'environment'
            config.RUM_KEY = 'asd'
            config.RUM_SCRIPT_URL = ''

            let mockTrans = sinon.stub(rum, "getTransactionId").returns('test-123');
            let mockReporting = sinon.stub(rum, "getReportingUrl").returns('test-reporting-123');

            let rumScript = getRumScript('https://stckjs.stackify.com/stckjs.js', '', {
                'ID': 'test-123',
                'Name': Buffer.from('appname').toString('base64'),
                'Env': Buffer.from('').toString('base64'),
                'Trans': Buffer.from('test-reporting-123').toString('base64')
            });

            let rumContent = stackify.injectRumContent();

            rumContent.should.not.equal(rumScript);
            rumContent.should.be.empty()

            config.ENV = ''
            config.APPNAME = ''
            config.RUM_KEY = ''
            config.RUM_SCRIPT_URL = ''

            mockTrans.restore();
            mockReporting.restore();
            done();
        });
    });
})


function getRumScript(rumScriptUrl, rumKey, settings) {
    return '<script type="text/javascript">(window.StackifySettings || (window.StackifySettings = ' + JSON.stringify(settings) + '))</script><script src="' + rumScriptUrl + '" data-key="' + rumKey + '" async></script>';
}