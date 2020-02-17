var messages = [{
  Msg: 'This is info message',
  Level: 'INFO',
  EpochMs: 1579797828178,
  SrcMethod: 'push',
  SrcLine: 117,
  TransID: undefined,
  id: undefined
}, {
  Msg: 'This is debug message',
  Level: 'DEBUG',
  EpochMs: 1579797828214,
  SrcMethod: 'push',
  SrcLine: 118,
  TransID: undefined,
  id: undefined
}, {
  Msg: 'This is warn message',
  Level: 'WARN',
  EpochMs: 1579797828214,
  SrcMethod: 'push',
  SrcLine: 119,
  TransID: undefined,
  id: undefined
}]

var info = { CDID: undefined,
  CDAppID: undefined,
  AppNameID: undefined,
  AppEnvID: undefined,
  EnvID: undefined,
  Env: 'Test',
  ServerName: 'kubeslave-node',
  AppName: 'Express',
  AppLoc: '/home/armano/express3',
  Logger: 'Node.js Stackify v.1.0',
  Platform: 'nodejs',
  Msgs: messages
}

exports.getMessages = messages;
exports.getInfo = info;
