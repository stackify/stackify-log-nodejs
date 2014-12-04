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
Start sending logs:
```js
// this should be executed only once in the app
stackify.start(options);
```
The following options could be passed. 'apiKey' is the only one that required:
* __apiKey:__ client license key
* __env:__ environment name
* __exitOnError:__ boolean flag indicating whether to shutdown the server after logging an uncaught exception, defaults to false
* __proxy:__ proxy server if you want to send requests via proxy.
*Notice:* stackify-logger sends synchronous requests before any `process.exit()` calls in your code. Sending via proxy wouldn't be possible in this case.

#### Using with Winston

```bash
$ npm install winston
$ npm install winston-stackify
```

If you are already using Winston you should add the stackify transport module to your instance of Winston:
```js
require('winston-stackify').Stackify;
winston.add(winston.transports.Stackify(options));
```

All the details could be found here - [Winston Transport for Stackify](https://github.com/stackify/stackify-log-winston)

#### Using direct logger

If you are not using Winston logger you can use default Stackify logger. It has 5 levels of messages: `trace`, `debug`, `info`, `warn` and `error`. To send the message to Stackify API you should run one of the following methods in any place of your code where you want to track some information:
```js
stackify.log(level, message [, meta1, ... , metaN])
stackify.trace(message [, meta1, ... , metaN])
stackify.debug(message [, meta1, ... , metaN])
stackify.info(message [, meta1, ... , metaN])
stackify.warn(message [, meta1, ... , metaN])
stackify.error(message [, meta1, ... , metaN])
```

Message must be a string.

meta1 ... metaN - a list of additional parameters of any type.

The timestamp will be added to every message by default.

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
By executing `stackify.start()` you set handler for uncaught exceptions.
Be sure to run it before any methods that set exception handlers.

##### Using with pure NodeJS app
If you want to get web details of an exception to be sent with it you should run `stackify.exceptionHandler(req)` first line inside of native `createServer` method :

```js
var http = require('http');
var stackify = require('stackify-logger');
http.createServer(function (req, res) {
    stackify.exceptionHandler(req);
    res.setHeader('content-type', 'text/plain');
    res.end('hello');
  });
});
```
where req is request object, an instance of native NodeJS `http.IncomingMessage` object

You can use it also with any framework that doesn’t modify native createServer method.


##### Using with Express
Global handler doesn't work inside Express route methods.
You should use error-handling middleware function `stackify.expressExceptionHandler`. Since middleware is executed serially, it's order of inclusion is important. Be sure to add it before any other error-handling middleware.

```js
var express = require('express');
var app = express();

/* 
*** block of route handlers ***
*** *** **** **** **** **** ***
*/

app.use(stackify.expressExceptionHandler);
```

To handle exceptions correctly put this right after all route handlers.

#### Troubleshooting
When request to Stackify fails for some reason, an error message is being printed to your `process.stderr` stream 

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
