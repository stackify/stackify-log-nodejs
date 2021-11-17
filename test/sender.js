'use strict'

process.env['STACKIFY_TEST'] = true

var expect = require('chai').expect;
var rewire = require('rewire');

var root_path = '../';
var debug = require(root_path + 'lib/debug');
var sender = rewire(root_path + 'lib/sender');
var event = require(root_path + 'lib/event');
var config = require(root_path + 'config/config');

var sinon = require('sinon');
var logs = [];

describe('Sender', function() {
  let stub;
  let body = {
    'message': 'test'
  };
  let response = {
    statusCode: 200,
    body: body
  };

  let errorResponse = {
    statusCode: 401,
    body: body
  };

  before(function(){
    stub = sinon.stub(sender, 'request')
    event.on(config.EVENT_ERROR, function () {
      logs.push(arguments)
    })

    sinon.stub(debug, 'writeResponse')
    sinon.stub(debug, 'writeRequest')
  });

  after(function(){
    sinon.restore();
  });

  it('Error should be logged', function(done) {
    let error = new Error('some error');
    stub.callsArgWith(1, error, {}, {})
    sender.send({}, function (){}, function (){});
    setTimeout(function () {
      expect(logs.length).to.be.equal(1)
      expect(logs[0][0]).to.be.equal('error')
      expect(logs[0][1]).to.be.equal('some error')
      expect(logs[0][2]).to.eql([{'error':error}])
      done();
    }, 1);
  })

  it('Success response', function(done) {
    let error = new Error('some error');
    stub.callsArgWith(1, null, response, response.body)
    sender.send({}, function callback(cbResponse) {
      expect(cbResponse.success).to.be.equal(true)
      expect(cbResponse.appData).to.be.eql(response.body)
    }, function fail() {

    });
    done();
  })

  it('Error response', function(done) {
    let error = new Error('some error');
    stub.callsArgWith(1, null, errorResponse, errorResponse.body)
    sender.send({}, function callback(cbResponse) {
    }, function fail(code) {
      expect(code).to.be.equal(401)
    });
    done();
  })
});