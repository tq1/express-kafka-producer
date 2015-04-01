var chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    Message = require('../lib/message');

describe('Message', function() {

  var req;
  var res;

  beforeEach(function() {
    req = {
      'body': 'body',
      'cookies': 'cookies',
      'fresh': 'fresh',
      'hostname': 'hostname',
      'ip': 'ip',
      'ips': 'ips',
      'originalUrl': 'originalUrl',
      'params': 'params',
      'path': 'path',
      'protocol': 'protocol',
      'query': 'query',
      'secure': 'secure',
      'stale': 'stale',
      'signedCookies': 'signedCookies',
      'subdomains': 'subdomains',
      'xhr': 'xhr',
      'extra-param': 'extra-param'
    };

    res = {};
  });

  it('should create messages accordingly', function(done) {

    var msg = {
      'body': 'body',
      'cookies': 'cookies',
      'fresh': 'fresh',
      'hostname': 'hostname',
      'ip': 'ip',
      'ips': 'ips',
      'originalUrl': 'originalUrl',
      'params': 'params',
      'path': 'path',
      'protocol': 'protocol',
      'query': 'query',
      'secure': 'secure',
      'stale': 'stale',
      'signedCookies': 'signedCookies',
      'subdomains': 'subdomains',
      'xhr': 'xhr'
    };

    Message(null, req, res, function(err, message) {
      assert.equal(JSON.stringify(msg), message, 'All param from req should have been used');
      done();
    })
  });

  it('should not include values from blacklist', function(done) {
    Message({blacklist: ['protocol']}, req, res, function(err, message) {

      var msg = JSON.parse(message);

      assert.property(msg, 'body');
      assert.notProperty(msg, 'protocol');

      done();
    })
  });

  it('should include values from whitelist', function(done) {
    Message({whitelist: ['extra-param']}, req, res, function(err, message) {

      var msg = JSON.parse(message);

      assert.property(msg, 'body');
      assert.property(msg, 'extra-param');

      done();
    })
  });

  it('should not include values from blacklist AND include values from whitelist', function(done) {
    Message({whitelist: ['extra-param'], blacklist: ['protocol']}, req, res, function(err, message) {

      var msg = JSON.parse(message);

      assert.property(msg, 'body');
      assert.property(msg, 'extra-param');
      assert.notProperty(msg, 'protocol');

      done();
    })
  });

});
