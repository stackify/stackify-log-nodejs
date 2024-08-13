// Copyright (c) 2024 BMC Software, Inc.

'use strict'

var expect = require('chai').expect,
    sinon = require('sinon'),
    debug = require('../lib/debug'),
    config = require('../config/config'),
    path = require('path'),
    fs = require('fs'),
    api       = require('../lib/api'), // wrappers for API calls
    exception = require('../lib/exception'),  // exception handler module
    logger = require('../index'),  // exception handler module
    currentDebugLogPath = path.join(process.cwd(), 'stackify-debug.log');

process.env['STACKIFY_TEST'] = true

describe('Config Debug', function() {
    context('With Debug Disabled', function () {
        it('should not call fs.access', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            debug.set({
                debug: false,
                debug_log_path: config.DEBUG_LOG_PATH
            }, function callback() {
                expect(accessSpy.calledOnce).to.be.false;
                expect(accessSpy.calledWith(currentDebugLogPath, fs.constants.F_OK | fs.constants.W_OK)).to.be.false;
                accessSpy.restore();
                config.DEBUG_LOG_PATH = currentDebugLogPath;
                config.DEBUG = false;
                done();
            });
        });
    });
    context('With Debug Enabled', function () {
        it('should call fs.access and createWriteStream with default setting', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            const writeStreamSpy = sinon.spy(fs, 'createWriteStream');
            debug.set({
                debug: true,
                debug_log_path: config.DEBUG_LOG_PATH
            }, function callback() {
                expect(accessSpy.calledOnce).to.be.true;
                expect(accessSpy.calledWith(currentDebugLogPath, fs.constants.F_OK | fs.constants.W_OK)).to.be.true;
                expect(writeStreamSpy.calledWith(currentDebugLogPath, {flags: 'a'})).to.be.true;
                accessSpy.restore();
                writeStreamSpy.restore();
                config.DEBUG_LOG_PATH = currentDebugLogPath;
                config.DEBUG = false;
                done();
            });
        });
    });
    context('With Debug Enabled but non existing directory', function () {
        it('should call fs.access and createWriteStream with stdout setting', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            const writeStreamSpy = sinon.spy(fs, 'createWriteStream');
            config._setupConfig({
                debug_log_path: '/path/to/none',
                debug: true
            });
            console.log(config.DEBUG_LOG_PATH);
            debug.set({
                debug: true,
                debug_log_path: config.DEBUG_LOG_PATH
            }, function callback() {
                expect(accessSpy.calledOnce).to.be.true;
                expect(accessSpy.calledWith('/path/to/none', fs.constants.F_OK | fs.constants.W_OK)).to.be.true;
                expect(writeStreamSpy.calledWith(null, { fd: process.stdout.fd })).to.be.true;
                accessSpy.restore();
                writeStreamSpy.restore();
                config.DEBUG_LOG_PATH = currentDebugLogPath;
                config.DEBUG = false;
                done();
            });
        });
    });
});

describe('Config Debug Integration', function() {
    context('With Debug Disabled', function () {
        it('should not call fs.access', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            const apiStub = sinon.stub(api, 'initialize', (options) => {
                expect(accessSpy.calledOnce).to.be.false;
                expect(accessSpy.calledWith(currentDebugLogPath, fs.constants.F_OK | fs.constants.W_OK)).to.be.false;
                accessSpy.restore();
                apiStub.restore();
                exceptionExitStub.restore();
                exceptionExceptionStub.restore();
                done();
            });
            const exceptionExitStub = sinon.stub(exception, 'gracefulExitHandler');
            const exceptionExceptionStub = sinon.stub(exception, 'catchException');

            logger.start({
                debug: false,
                debug_log_path: config.DEBUG_LOG_PATH
            });
        });
    });
    context('With Debug Enabled', function () {
        it('should call fs.access and createWriteStream with default setting', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            const writeStreamSpy = sinon.spy(fs, 'createWriteStream');

            const apiStub = sinon.stub(api, 'initialize', (options) => {
                expect(accessSpy.calledOnce).to.be.true;
                expect(accessSpy.calledWith(currentDebugLogPath, fs.constants.F_OK | fs.constants.W_OK)).to.be.true;
                expect(writeStreamSpy.calledWith(currentDebugLogPath, {flags: 'a'})).to.be.true;
                accessSpy.restore();
                writeStreamSpy.restore();
                apiStub.restore();
                exceptionExitStub.restore();
                exceptionExceptionStub.restore();
                done();
            });
            const exceptionExitStub = sinon.stub(exception, 'gracefulExitHandler');
            const exceptionExceptionStub = sinon.stub(exception, 'catchException');

            logger.start({
                debug: true,
                debug_log_path: config.DEBUG_LOG_PATH
            });
        });
    });
    context('With Debug Enabled but non existing directory', function () {
        it('should call fs.access and createWriteStream with stdout setting', function (done) {
            const accessSpy = sinon.spy(fs, 'access');
            const writeStreamSpy = sinon.spy(fs, 'createWriteStream');

            const apiStub = sinon.stub(api, 'initialize', (options) => {
                expect(accessSpy.calledOnce).to.be.true;
                console.log('args', accessSpy.args);
                expect(accessSpy.calledWith('/path/to/none', fs.constants.F_OK | fs.constants.W_OK)).to.be.true;
                expect(writeStreamSpy.calledWith(null, { fd: process.stdout.fd })).to.be.true;
                accessSpy.restore();
                writeStreamSpy.restore();
                apiStub.restore();
                exceptionExitStub.restore();
                exceptionExceptionStub.restore();
                done();
            });

            const exceptionExitStub = sinon.stub(exception, 'gracefulExitHandler');
            const exceptionExceptionStub = sinon.stub(exception, 'catchException');

            logger.start({
                debug: true,
                debug_log_path: '/path/to/none'
            });
        });
    });
});