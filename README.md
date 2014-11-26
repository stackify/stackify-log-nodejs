#Stackify Log API for Node.js

Errors and Logs Overview:

http://docs.stackify.com/m/7787/l/189767

Sign Up for a Trial:

http://www.stackify.com/sign-up/

## Installation
```bash
$ npm install stackify-logger
```

## Usage

```js
var stackify = require(‘stackify-logger’);
```
Start sending the logs:
```js
// this should be executed only once in the app
stackify.start(options);
```
The following options could be passed. 'apiKey' is the only one that required:
* __apiKey:__ client license key.
* __env:__ environment name.
* __proxy:__ proxy server if you want to send requests via proxy.
* __exitOnError:__ Boolean flag indicating whether to shutdown the server after logging an uncaughtException.

#### Using with Winston

```bash
$ npm install stackify-logger
```

If you are already using Winston you should add the stackify transport module to your instance of Winston:
```js
require('winston-stackify');
winston.add(winston.transports.Stackify(options));
```

All the details could be found here - [Winston Transport for Stackify](https://github.com/stackify/stackify-log-winston)

#### Using direct logger

If you are not using Winston logger you can use default Stackify logger. It has 5 levels of messages: `trace`, `debug`, `info`, `warn` and `error`. To send the message to Stackify API you should run one of the following methods in any place of your code where you want to track some information:
```js
stackify.log(level, message, meta)
stackify.trace(message, meta)
stackify.debug(message, meta)
stackify.info(message, meta)
stackify.warn(message, meta)
stackify.error(message, meta)
```
The timestamp will be added to every message by default.

Meta parameter should be a valid JSON object.

Examples of usage:
```js
// Add the module to all the script files where you want to log any messages.
var stackify = require('stackify-logger');

stackify.log('info', 'hey!');
stackify.debug('any message');
stackify.info('any message', {anything: 'this is metadata'});
stackify.warn('attention');
stackify.log('error', {error : new Error()});
```
When logging an error message you could pass an Error object in metadata like in the last case so the exception details would be available.

#### Exception handling
Supported frameworks
Express (ver 4.x) and all express-based frameworks only (e.g. SailsJS, Connect, LocomotiveJS) will be supported. This means all of the frameworks that support the format of the middleware functions used in Express.JS.
function (req, res, next) {
      //some code
      next();
}

##### Using with pure NodeJS app
If you are not using any of the frameworks and all requests are handled inside  native createServer method you should run stackify.exceptionHandler() first line inside of this method :

```js
var http = require('http');
var stackify = require('stackify-logger');
http.createServer(function (req, res) {
    stackify.stats(req, res);
    res.setHeader('content-type', 'text/plain');
    res.end('hello');
  });
});
```

You can use it also with any framework that doesn’t modify native createServer method.


##### Using with Express
It acts as middleware when running on express-based apps. Since middleware are execute serially, their order of inclusion is important.

You can activate it with the app.use() command in the appropriate place of your code, e.g.:

```js
var express = require('express');
var app = express();
app.use(stackify.expressExceptionHandler());
```

To handle exceptions correctly put this right after all route handlers and before all the other error middleware.

## License

Copyright 2014 Stackify, LLC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
