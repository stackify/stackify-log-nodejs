'use strict'

var LogGroupModel    = require('../../proto/stackify-agent_pb'),
    logGroup         = require('../../proto/LogGroup'),
    debug            = require('../debug'),
    helpers          = require('../helpers');

/**
 * Base class that will create a Protobuf messages.
 * @constructor
 */
function AgentBase () {}

/**
 * This method will build log messages into Stackify::LogGroup object.
 * It will accept Array of log messages. Return Stackify::LogGroup
 * @return {!proto.stackify.LogGroup}
 */
AgentBase.prototype.build_message = function (messages) {
  try {
    var length = messages.length;
    var info = Object.assign({}, helpers.getPostBody(messages));
    var log_group = new LogGroupModel.LogGroup();
    log_group = logGroup.setLogGroup(log_group, info);
    var logAry = [];
    for(var i=0; i<length; i++) {
      var log = AgentBase.prototype.build_protobuf(messages[i])
      logAry.push(log);
    }
    log_group.setLogsList(logAry); // Repeated

    return log_group
  } catch (error) {
    debug.write('AgentBase.build_message() error: ' + JSON.stringify(error));
  }
}

/**
 * This method will build a Log protobuf object.
 * It will accept log message. Return Stackify::Log
 * @return {!proto.stackify.Log}
 */
AgentBase.prototype.build_protobuf = function (msg) {
  try {
    var log = new LogGroupModel.LogGroup.Log();
    log = logGroup.setLogGroupLog(log, msg);
    if (msg['Ex']) {
        var ex = msg['Ex'];
        var log_error = new LogGroupModel.LogGroup.Log.Error();
            log_error = logGroup.setLogError(log_error, ex);
        if (ex['EnvironmentDetail']) {
            var env = ex['EnvironmentDetail'];
            var env_detail = new LogGroupModel.LogGroup.Log.Error.EnvironmentDetail();
                env_detail = logGroup.setEnvironmentDetail(env_detail, env);

            log_error.setEnvironmentDetail(env_detail);
        }

        if (ex['Error']) {
            var error = ex['Error'];
            var error_item = new LogGroupModel.LogGroup.Log.Error.ErrorItem();
                error_item = logGroup.setErrorItem(error_item, error);
            var trace_frameAry = [];
            if (error['StackTrace']) {
                var stack = error['StackTrace'];
                var stack_trace_length = stack.length;
                for(var j=0; j<stack_trace_length; j++) {
                    var trace_frame = new LogGroupModel.LogGroup.Log.Error.ErrorItem.TraceFrame();
                        trace_frame = logGroup.setTraceFrame(trace_frame, stack[j]);
                        trace_frameAry.push(trace_frame);
                }
            }
            error_item.setStacktraceList(trace_frameAry); // Repeated
            if (error['InnerError']) {
                error_item.setInnerError(error['InnerError']); // Optional
            }
            log_error.setErrorItem(error_item);
        }

        if (ex['WebRequestDetail']) {
            var req_details = ex['WebRequestDetail'];
            var web_request = new LogGroupModel.LogGroup.Log.Error.WebRequestDetail();
                web_request = logGroup.setWebRequestDetail(web_request, req_details);
            log_error.setWebRequestDetail(web_request);
        }
        log.setError(log_error);
    }
    return log

  } catch (error) {
    debug.write('AgentBase.build_protobuf() error: ' + JSON.stringify(error));
  }
}

/** @class AgentBase */
module.exports = AgentBase
