[![npm version](https://badge.fury.io/js/stackify-logger.svg)](http://badge.fury.io/js/stackify-logger)

# Stackify Log API for Node.js

* **Errors and Logs Overview:** - http://support.stackify.com/errors-and-logs-overview/
* **Sign Up for a Trial:** http://www.stackify.com/sign-up/

## Installation
```bash
$ npm install stackify-logger
```

## Usage

```js
var stackify = require('stackify-logger');

// this should be executed only once in the app
stackify.start({apiKey: '***', appName: 'Node Application', env: 'dev'});
```
The following options could be passed to the start method:
* __apiKey (Required):__ Stackify API key
* __appName (Required):__ Application name
* __env (Required):__ Environment name. If a Stackify agent is installed, this does not need to be set. If a Stackify agent is not installed, this should be set to the environment name.
* __proxy:__ HTTP proxy
* __debug:__ Enables internal debug logging for troubleshooting. Defaults to false.
* __logServerVariables:__ Enables adding server variables to error logs. Defaults to true.

*Notice:* When calling `process.exit()`, the stackify-logger will synchronously send log messages that have been queued but not transmitted. Sending via proxy wouldn't be possible in this case.

#### Using direct logger

If you are not using Winston logger you can use default Stackify logger. It has 6 levels of messages: `trace`, `debug`, `info`, `warn`, `error`, and `fatal`. To send the message to Stackify API you should run one of the following methods in any place of your code where you want to track some information:
```js
stackify.log(level, message [, meta])
stackify.trace(message [, meta])
stackify.debug(message [, meta])
stackify.info(message [, meta])
stackify.warn(message [, meta])
stackify.error(message [, meta])
stackify.fatal(message [, meta])
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
When logging an error or fatal message you can pass an Error object in metadata like in the last example, so the exception details would be available.

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

If logging isn't working, enable internal debug logging for Stackify by setting the debug flag in the Stackify options.

```js
stackify.start({apiKey: '***', appName: 'Node Application', env: 'dev', debug: true});
```

You will see `stackify-debug.log` in your application's directory.

## License

Copyright 2019 Stackify, LLC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
