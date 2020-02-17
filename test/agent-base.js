'use strict'

process.env['STACKIFY_TEST'] = true

var expect = require('chai').expect;
var rewire = require('rewire');
var fs     = require('fs');
var root_path = '../';

var agentBase = rewire(root_path + 'lib/transport/agent-base');
var agentBasePb = rewire(root_path + 'proto/stackify-agent_pb');
var logGroup = rewire(root_path + 'proto/LogGroup');
var logMessage = require(root_path + 'test/fixtures/log-message')

var messages = logMessage.getMessages;
var info = logMessage.getInfo;
var msg1 = messages[0].Msg;
var msg2 = messages[1].Msg;

describe('Agent Base', function() {
  it('Test the LogGroup object', function(done) {
    var log_group = new agentBasePb.LogGroup();
    var log_group = logGroup.setLogGroup(log_group, info);
    var bytes = log_group.serializeBinary();

    // Deserialization
    var msg = agentBasePb.LogGroup.deserializeBinary(bytes)
    expect(msg.getApplicationName()).to.eq(info.AppName)
    expect(msg.getServerName()).to.eq(info.ServerName)
    expect(msg.getApplicationLocation()).to.eq(info.AppLoc)
    expect(msg.getLogger()).to.eq(info.Logger)
    expect(msg.getPlatform()).to.eq(info.Platform)

    var logAry = [];
    for(var i=0; i<messages.length; i++) {
      logAry.push(agentBase.prototype.build_protobuf(messages[i]))
    }
    log_group.setLogsList(logAry);
    expect(log_group.getLogsList().length).to.eq(messages.length)
    done()
  })

  it('Protobuf message must be valid', function(done) {
    var result = agentBase.prototype.build_message(messages);
    var data = result.serializeBinary();

    expect(msg1).to.eq(result['wrappers_']['7'][0].array[0])
    expect(msg2).to.eq(result['wrappers_']['7'][1].array[0])

    // deserialization
    var deserialized = agentBasePb.LogGroup.deserializeBinary(Array.from(data));
    expect(msg1).to.eq(deserialized['wrappers_']['7'][0].array[0])
    expect(msg2).to.eq(deserialized['wrappers_']['7'][1].array[0])
    done()
  })

  it('Size of the protobuf message must be 7', function(done) {
    var result = agentBase.prototype.build_message(messages);
    expect(result['array'].length).to.eq(7)
    done()
  })
});
