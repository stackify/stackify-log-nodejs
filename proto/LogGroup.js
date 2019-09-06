"use strict";

var exports = module.exports = {};

exports.setLogGroup = function(log_group, opt) {
  log_group.setEnvironment(opt.Env);
  log_group.setServerName(opt.ServerName);
  log_group.setApplicationName(opt.AppName);
  log_group.setApplicationLocation(opt.AppLoc);
  log_group.setLogger(opt.Logger);
  log_group.setPlatform(opt.Platform);

  return log_group;
};

exports.setLogGroupLog = function(log, messages) {
  log.setMessage(messages['Msg']);
  log.setData(messages['Data']);
  log.setThreadName(messages['Th']);
  log.setDateMillis(messages['EpochMs']);
  log.setLevel(messages['Level']);
  log.setTransactionId(messages['TransID']);
  log.setSourceMethod(messages['SrcMethod']);
  log.setSourceLine(messages['SrcLine']);
  log.setId(messages['id']);
  // log.setTagsList(); // Optional
  return log;
}

exports.setLogError = function(log_error, ex) {
  log_error.setDateMillis(ex['OccurredEpochMillis']);
  // log_error.setWebRequestDetail(); // Optional
  // log_error.setCustomerName(); // Optional
  // log_error.setUsername(); // Optional

  return log_error;
}

exports.setEnvironmentDetail = function(env_detail, env) {
  env_detail.setDeviceName(env['DeviceName']);
  env_detail.setApplicationName(env['AppName']);
  env_detail.setApplicationLocation(env['AppLocation']);
  env_detail.setConfiguredApplicationName(env['ConfiguredAppName']);
  env_detail.setConfiguredEnvironmentName(env['ConfiguredEnvironmentName']);

  return env_detail;
}

exports.setErrorItem = function(error_item, error) {
  error_item.setMessage(error['Message']);
  error_item.setErrorType(error['ErrorType']);
  error_item.setErrorTypeCode(error['ErrorTypeCode']);
  // error_item.getDataMap // Optional
  error_item.setSourceMethod(error['SourceMethod']);

  return error_item;
}

exports.setWebRequestDetail = function(web_request, req_details) {
  web_request.setUserIpAddress(req_details['UserIPAddress']);
  web_request.setHttpMethod(req_details['HttpMethod']);
  web_request.setRequestProtocol(req_details['RequestProtocol']);
  web_request.setRequestUrl(req_details['RequestUrl']);
  web_request.setRequestUrlRoot(req_details['RequestUrlRoot']);
  web_request.setPostDataRaw(req_details['PostData']);
  web_request.setRequestUrl(req_details['RequestUrl']);

  return web_request;
}

exports.setTraceFrame = function(trace_frame, stack) {
  trace_frame.setCodeFilename(stack['CodeFileName']);
  trace_frame.setLineNumber(stack['LineNum']);
  trace_frame.setMethod(stack['Method']);

  return trace_frame;
}
