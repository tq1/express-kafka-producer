var _       = require('lodash'),
    chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    kafka = require('kafka-node');



describe('Middleware', function() {

  var noop = function() {};

  var middleware, kafkaStub, MessageStub, PublishStub, DefaultPartitionerStub, kafkaStubClientReturn;

  var options;
  var req;
  var res;

  beforeEach(function() {

    kafkaStub = _.defaults(kafka);
    MessageStub = {
      generate: function(options, req, res, cb) {cb()}
    };
    PublishStub = {
      generate: function(producer, options) {
        return function(message, key, cb) {cb()};
      }
    };
    DefaultPartitionerStub = {
      partition: function(key, numberOfPartitions) {
        return 1234;
      }
    };
    kafkaStubClientReturn = {
      topicPartitions: {},
      on: function(ev, cb) {
        return cb();
      },
      refreshMetadata: function(topics, cb) {
        return cb();
      }
    };

    middleware = require('../lib/middleware')(kafkaStub, MessageStub, PublishStub, DefaultPartitionerStub, _);

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

        return kafkaStubClientReturn;
      };

      kafkaStub.HighLevelProducer = noop;

      middleware(options);

    });

    it('should create producer with proper settings', function(done) {

      kafkaStub.Client = function() {
        return kafkaStubClientReturn;
      };

      kafkaStub.HighLevelProducer = function(client, params) {
        assert.equal(params, options.producer.settings, 'settings sent to producer are invalid');
        done();
      }

      middleware(options);

    });

    it('should use provided kafka client', function(done) {

      var called = false;
      kafkaStub.Client = function(connectionString) {
        var self = this;
        this.connectionString = 'fake-' + connectionString;
        this.on = function(ev, callback) {
          if (ev === 'ready' && !called) {
            assert.equal(self.connectionString, 'fake-127.0.0.1:9999');
            called = true;
            // multiple calls to event 'ready' should not fail in this case
            done();
          }
        };
        this.refreshMetadata = kafkaStubClientReturn.refreshMetadata;
      }
      kafkaStub.HighLevelProducer = noop;

      options.client = new kafkaStub.Client('127.0.0.1:9999');

      middleware(options);
    });

  });

  describe('Message generations', function() {

    it('should use options method to generate message if provided', function(done) {

      kafkaStub.Client = function() {
        return kafkaStubClientReturn;
      };
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

      kafkaStub.Client = function() {
        return kafkaStubClientReturn;
      };
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

    it('should send message with key, if key function is provided', function(done) {

      var mykey = '1234'
      options = _.defaults({
        key: function(request, response, callback) {
          callback(null, mykey)
        }
      }, options);

      kafkaStub.Client = function() {
        return kafkaStubClientReturn;
      };
      kafkaStub.HighLevelProducer = noop;

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          assert.equal(key, mykey);
          done();
        };
      }
      // setTimeout(function() {
        middleware(options)(req, res, noop);
      // }, 100);

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

    it('should send message with key using default partitioner', function(done) {
      var mykey = 'my_key'
      options = _.defaults({
        key: function(request, response, callback) {
          callback(null, mykey)
        }
      }, options);



      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          assert.equal(options.partitioner, DefaultPartitionerStub);
          done();
        };
      }

      middleware(options)(req, res, noop);
    });

    it('should send message with key using custom partitioner if provided', function(done) {
      var mykey = 'my_key'
      options = _.defaults({
        key: function(request, response, callback) {
          callback(null, mykey)
        },
        partitioner: function(key, numberOfPartitions) {
          return 10;
        }
      }, options);

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          assert.equal(options.partitioner, options.partitioner);
          done();
        };
      }

      middleware(options)(req, res, noop);
    });


  });

  describe('Error handler', function() {

    it('should call error handler if error is raised when publishing message', function(done) {

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          cb("error");
        };
      }

      options = _.defaults({
        error: function(err, req, res, next) {
          assert.isFalse(!err);
          next();
        }
      }, options);

      var next = function() {
        done();
      }

      middleware(options)(req, res, next);

    });

    it('should continue if error is raised when publishing message and no error handler is provided', function(done) {

      PublishStub.generate = function(producer, options) {
        return function(message, key, cb) {
          cb("error");
        };
      }

      middleware(options)(req, res, function() {
        done();
      });

    });

    it('should call error handler if error is raised by message creation', function(done) {

      MessageStub.generate = function(options, request, response, callback) {
        callback('error');
      };

      options = _.defaults({
        error: function(err, req, res, next) {
          assert.isFalse(!err);
          next();
        }
      }, options);

      var next = function() {
        done();
      }

      middleware(options)(req, res, next);

    });

    it('should continue if error is raised by message creation and no error handler is provided', function(done) {

      MessageStub.generate = function(options, request, response, callback) {
        callback('error');
      };

      middleware(options)(req, res, function() {
        done();
      });

    });

    it('should call error handler if error is raised by custom message creation', function(done) {

      options = _.defaults({
        message: function(req, res, cb) {
          cb('error');
        },
        error: function(err, req, res, next) {
          assert.isFalse(!err);
          next();
        }
      }, options);

      var next = function() {
        done();
      }

      middleware(options)(req, res, next);

    });

    it('should continue if error is raised by custom message creation and no error handler is provided', function(done) {

      options = _.defaults({
        message: function(req, res, cb) {
          cb('error');
        }
      }, options);

      middleware(options)(req, res, function() {
        done();
      });

    });

    it('should call error handler if error is raised by custom key creation', function(done) {

      options = _.defaults({
        key: function(req, res, cb) {
          cb('error');
        },
        error: function(err, req, res, next) {
          assert.isFalse(!err);
          next();
        }
      }, options);

      var next = function() {
        done();
      }

      middleware(options)(req, res, next);

    });

    it('should continue if error is raised by custom key creation and no error handler is provided', function(done) {

      options = _.defaults({
        key: function(req, res, cb) {
          cb('error');
        }
      }, options);

      middleware(options)(req, res, function() {
        done();
      });

    });

  });

});
