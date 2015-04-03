var _       = require('lodash'),
    chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    kafka = require('kafka-node'),
    async = require('async');



describe('Middleware', function() {

  var noop = function() {};

  var middleware, kafkaStub, MessageStub, PublishStub;

  var options;
  var req;
  var res;

  beforeEach(function() {
    kafkaStub = kafka;
    MessageStub = {
      generate: function(options, req, res, cb) {cb()}
    };
    PublishStub = {
      generate: function(producer, options) {
        return function(message, key, cb) {cb()};
      }
    };

    middleware = require('../lib/middleware')(kafkaStub, async, _, MessageStub, PublishStub);

    options = {
      producer: {
        topic: 'test',
        settings: {
          requireAcks: 1
        }
      },
      client: {
        url: '1.2.3.4',
        client_id: 'client-id'
      }
    };

    req = {};

    res = {};

  });

  describe('Kafka settings', function() {

    it('should raise exception it producer settings are not provided', function(done) {

      assert.throws(middleware, /producer/);

      done();

    });

    it('should connect to provided server url', function(done) {

      kafkaStub.Client = function(url, cid, options) {
        assert.equal(url, '1.2.3.4', 'url should be 1.2.3.4');
        assert.equal(cid, 'client-id', 'cid should be client-id');
        done();
      };

      kafkaStub.HighLevelProducer = noop;

      middleware(options);

    });

    it('should create producer with proper settings', function(done) {

      kafkaStub.Client = noop;

      kafkaStub.HighLevelProducer = function(client, params) {
        assert.equal(params, options.producer.settings, 'settings sent to producer are invalid');
        done();
      }

      middleware(options);

    });

  });

  describe('Message generations', function() {

    it('should use options method to generate message if provided', function(done) {

      kafkaStub.Client = noop;
      kafkaStub.HighLevelProducer = noop;

      options = _.defaults({
        message: function(request, response, callback) {
          assert.equal(req, request, 'req object is the same as sent');
          assert.equal(res, response, 'res object is the same as sent');
          done();
        }
      }, options);

      middleware(options)(req, res, noop);

    });

    it('should use Message module to generate message if options function is not provided', function(done) {

      kafkaStub.Client = noop;
      kafkaStub.HighLevelProducer = noop;

      MessageStub.generate = function(options, request, response, callback) {
        assert.equal(req, request, 'req object is the same as sent');
        assert.equal(res, response, 'res object is the same as sent');
        done();
      };

      middleware(options)(req, res, noop);

    });

  });

  describe('Message key', function() {

    it('should use key function generator if provided', function(done) {

      options = _.defaults({
        key: function(request, response, callback) {
          assert.equal(req, request, 'req object is the same as sent');
          assert.equal(res, response, 'res object is the same as sent');
          done();
        }
      }, options);

      middleware(options)(req, res, noop);

    });

    it('should continue execution if error happens generating key', function(done) {

      options = _.defaults({
        key: function(request, response, callback) {
          callback('error');
        }
      }, options);

      middleware(options)(req, res, function() {
        done()
      });

    });


    it('should send message with key, if key function is provided', function(done) {

      var mykey = '1234'
      options = _.defaults({
        key: function(request, response, callback) {
          callback(null, mykey)
        }
      }, options);

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          assert.equal(key, mykey);
          done();
        };
      }

      middleware(options)(req, res, noop);

    });

    it('should NOT send message with key, if key function is NOT provided', function(done) {

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          assert.isTrue(!key);
          assert.isNotString(key);
          done();
        };
      }

      middleware(options)(req, res, noop);

    });

  });

});
