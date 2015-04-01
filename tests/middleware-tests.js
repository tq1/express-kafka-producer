var _       = require('lodash'),
    chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    proxyquire =  require('proxyquire');



describe('Middleware', function() {

  var noop = function() {};

  var middleware, kafkaStub;

  var options;
  var req;
  var res;

  beforeEach(function() {
    kafkaStub = {};
    middleware = proxyquire('../lib/middleware', { 'kafka-node': kafkaStub});//, './message': messageStub, './publish': publishStub });

    options = {
      producer: {
        topic: 'test',
        settings: {
          requireAcks: 1
        }
      },
      client: {
        url: '1.2.3.4',
        producer_id: 'producer-id'
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

      kafkaStub.Client = function(url, pid, options) {
        assert.equal(url, '1.2.3.4', 'url should be 1.2.3.4');
        assert.equal(pid, 'producer-id', 'pid should be producer-id');
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

      options = _.defaults({
        message: function(request, response, callback) {
          assert.equal(req, request, 'req object is the same as sent');
          assert.equal(res, response, 'res object is the same as sent');
          done();
        }
      }, options);

      middleware(options)(req, res, noop);

    });

    // How to properly mock Message module?
    // it('should use Message module to generate message if options function is not provided', function(done) {
    //
    //   middleware(options)(req, res, noop);
    //
    // });

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


    // How to properly mock Publish module?
    // it('should send message with key, if key function is provided', function(done) {
    //
    //   middleware(options)(req, res, noop);
    //
    // });

    // it('should NOT send message with key, if key function is provided', function(done) {
    //
    //   middleware(options)(req, res, noop);
    //
    // });

  });

});
