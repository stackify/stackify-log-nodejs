'use strict'

var should = require('should'),
    request = require('supertest'),
    http = require('http'),
    stackify = require('../'),
    logger = require('../lib/logger'),
    config = require('../config/config.js');

process.env['STACKIFY_TEST'] = true

var server = http.createServer(function (req, res) {
    try {
        throw new Error("Test Error");
    } catch (err) {
        stackify.push('error', err.message, [err], req, err);
    }

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Test\n');
});

describe('Error', function() {

    context('Web Request Details', function (){

        it('should have masked values for authorization and cookie headers', function (done) {

            request(server)
                .get("/")
                .set('Authorization', 'x-unmasked-value')
                .set('Cookie', 'x-unmasked-value')
                .expect(200)
                .end(function(err, res){
                    if (err) throw err;

                    logger.size().should.be.exactly(1);

                    var entry = logger.get(0);

                    // Test to make sure a log entry was recorded.
                    should.exist(entry);
                    should.exist(entry.Ex);
                    should.exist(entry.Ex.WebRequestDetail, "Web Request Details do not exist");

                    // Test to make sure the web request details exist on the log entry
                    var requestDetail = entry.Ex.WebRequestDetail;
                    should.exist(requestDetail.Headers, "Headers do not exist on Web Request Details");
                    requestDetail.Headers.Array;

                    // Test the values of the headers for a configured masked value
                    var headers = requestDetail.Headers;
                    headers.should.containDeep({'cookie': config.COOKIE_MASK, 'authorization': config.COOKIE_MASK});

                    done();
                });

        });

    });
});
