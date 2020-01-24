'use strict'

var should = require('should'),
    request = require('supertest'),
    http = require('http'),
    express = require('express'),
    sinon = require('sinon'),
    stackify = require('../'),
    logger = require('../lib/logger'),
    sender = require('../lib/sender'),
    exception = require('../lib/exception'),
    config = require('../config/config.js');

process.env['STACKIFY_TEST'] = true

/**
 * Setup basic Express middle ware for tests
 * @param app
 */
function setupBasicExpressMiddleware(app) {

    app.get('/', function(req,res, next) {
        var testError = new Error("Test GET Error");
        stackify.info('info message')
        next(testError);
    });

    app.use(stackify.expressExceptionHandler);

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send(err.message);
    });
}

/**
 * Stub out the "send" method of the "sender" module. This way we don't have to worry about outgoing requests.
 *
 * @param options
 * @param cb
 * @param fail
 */
function senderStubFunc(options, cb, fail) {
    var urlFullPath = options.url,
        testIdenitfyAppPath = config.PROTOCOL + '://' + config.HOST + config.IDENTIFY_PATH,
        testLogSavePath = config.PROTOCOL + '://' + config.HOST + config.LOG_SAVE_PATH,
        responseObj;

    if (urlFullPath == testIdenitfyAppPath) {
        responseObj = {
            "DeviceID":null,
            "DeviceAppID":null,
            "AppNameID":"unique-app-name-id",
            "EnvID":9,
            "Env":"Local",
            "AppName":"stackify-node-testapp",
            "AppEnvID":"unique-app-env-id",
            "DeviceAlias":null
        };
    } else if (urlFullPath == testLogSavePath) {
        responseObj = {
            "success": true,
            "took": 500
        };
    }

    cb(responseObj);
}

describe('Logger', function() {

    context('Express middleware with no API key specified', function(){
        var app;

        before(function(){
            app = express();
            setupBasicExpressMiddleware(app);
        });

        it('sets a proper state when no API key has been specified', function(done){
            request(app)
                .get('/')
                .end(function (err, res){
                    if (err) throw err;

                    logger.hasAppDetails().should.equal(false);
                    logger.flushLogs(); // Flush for the next tests.

                    done();
                });
        });
    });

    context('Express middleware with valid API key setup', function () {
        var app, agent, senderStub;

        before(function(){
            app = express();
            setupBasicExpressMiddleware(app);

            agent = request.agent(app);

            senderStub = sinon.stub(sender, "send", senderStubFunc);
            sinon.stub(exception, "catchException"); // Disable the uncaught exception handler to prevent handling of failed tests.

            stackify.start({appName:'Test App', apiKey: 'test API Key', env: 'Local'});
        });

        after(function(){
            sinon.restore();
        });

        it('should successfully return and have sent logs to Stackify', function (done) {
            agent
                .get("/")
                .end(function(err, res){
                    if (err) throw err;
                    logger.flushLogs();
                    logger.size().should.be.exactly(0);
                    done();
                });

        });

        it('should process a second request and return successfully without timing out and have sent logs to Stackify', function (done) {
            agent
                .get('/')
                .end(function(err, res){
                    if (err) throw err;
                    logger.flushLogs();
                    logger.size().should.be.exactly(0);
                    done();
                });

        });
    });
})
