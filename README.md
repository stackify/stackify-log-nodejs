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
var stackify = require('stackify-logger');
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

*Notice:* stackify-logger sends synchronous requests if you call `process.exit()`. Sending via proxy wouldn't be possible in this case.

#### Using direct logger

If you are not using Winston logger you can use default Stackify logger. It has 5 levels of messages: `trace`, `debug`, `info`, `warn` and `error`. To send the message to Stackify API you should run one of the following methods in any place of your code where you want to track some information:
```js
stackify.log(level, message [, meta])
stackify.trace(message [, meta])
stackify.debug(message [, meta])
stackify.info(message [, meta])
stackify.warn(message [, meta])
stackify.error(message [, meta])
```

**Message** must be a string.

**meta** - an additional parameter of any type.

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
When logging an error message you can pass an Error object in metadata like in the last example, so the exception details would be available.

#### Exception handling
By executing `stackify.start()` you set a handler for uncaught exceptions.
Make sure you run it before any methods that set exception handlers.

##### Using with Express
Global handler doesn't work inside Express route methods.
You should use error-handling middleware function `stackify.expressExceptionHandler`. Since middleware is executed serially, it's order of inclusion is important. Make sure you add it before any other error-handling middleware.

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

## Troubleshooting
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
