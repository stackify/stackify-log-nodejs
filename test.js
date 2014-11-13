var http = require('http');
var util = require('util');
var stackify = require('./index')({license_key: 'sdfsdf'});
var stack = require('stack-trace');
var pkginfo = require('pkginfo')(module, 'name');

var stret = function stret() {
    foo();
};
var hty = function hty() {
    stret();
};
var tr = {
    af: hty
}
var foo = function foo () {
    stackify.log('error', 'sdfsdf', {err: new Error('rttdfgdfg'), fert: 45});
    stackify.log('error', 'sdfsdf');
    stackify.warn('sdfg', {dfgh: 45, gh: 67});
};
foo();

http.createServer(function (req, res) {
    stackify.excHandler(req,res);
    df;
    var json = JSON.stringify(stackify.storage);
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(json);
}).listen(6777);

console.log('server.running')

/*stackify.log('debug', 'dfg');
stackify.debuge('dfgdfgfg');
*/