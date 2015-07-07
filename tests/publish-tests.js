var chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    kafka = require('kafka-node'),
    _ = require('lodash'),
    async_timed_cargo = require('async-timed-cargo'),
    Publish = require('../lib/publish')(_, async_timed_cargo, kafka);

describe('Publish', function() {

  var producer = {};

  beforeEach(function() {
    delete producer.send;
  });


  describe('single messages', function() {

    it('should create payload accordingly', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].messages, 'test', 'message is \'test\'');
        assert.equal(payloads[0].topic, 'my-topic', 'topic is \'my-topic\'');
        assert.isUndefined(payloads[0].partition, 'partition should not be provided with no key')
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic'});

      publisher('test', null);
    });

    it('should create payload with  partition if default partition was provided and no key was provided with message', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].messages, 'test', 'message is \'test\'');
        assert.equal(payloads[0].topic, 'my-topic', 'topic is \'my-topic\'');
        assert.equal(payloads[0].partition, 1, 'partition should be equal one provided in options');
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 1});

      publisher('test', null);
    });

    it('should use producer options', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].partition, 2, 'partition is \'2\'');
        assert.equal(payloads[0].attributes, 1, 'attributes is \'1\'');
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1});

      publisher('test', null);
    });

    it('should use parse object message to string before sending', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].partition, 2);
        assert.isString(payloads[0].messages);
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1});

      publisher({"message key": "message value"}, null);
    });

    it('should not parse object message to string before sending if options says so', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.isNotString(payloads[0].messages);
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1, parse_to_json: false});

      publisher({"message key": "message value"}, null);
    });

    it('should create kafka.KeyedMessage if key is provided', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].messages.key, 'key', 'message is \'key\'');
        assert.equal(payloads[0].messages.value, 'test', 'message value is \'test\'');
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1, parse_to_json:false});

      publisher('test', 'key');
    });

    it('should use parse object key to string before sending', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.isString(payloads[0].messages.key);
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1});

      publisher({"message key": "message value"}, {'key key': 'key value'});
    });

    it('should not parse object key to string before sending if settings says so', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.isNotString(payloads[0].messages.key);
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1, parse_to_json:false});

      publisher({"message key": "message value"}, {'key key': 'key value'});
    });

    it('should use partitioner if provided', function(done) {

      var partition = 123;

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.equal(payloads[0].partition, partition);
        done();
      };

      var partitioner = {
        partition:function(key, numberOfPartitions) {
          assert.equal(key, 'xyz');
          return partition;
        }
      }

      var publisher = Publish.generate(producer, {topic: 'my-topic', partitioner: partitioner});

      publisher('test', 'xyz');
    });

  });

  describe('batching messages', function() {

    it('should create batch payload accordingly', function(done) {

      producer.send = function(payloads, cb) {
        assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
        assert.isArray(payloads[0].messages);
        assert.lengthOf(payloads[0].messages, 2, 'payload message`s value has a length of 2');
        assert.equal(payloads[0].messages[0], 'test', 'message[0] is \'test\'');
        assert.equal(payloads[0].messages[1], 'test 2', 'message[1] is \'test 2\'');
        assert.equal(payloads[0].topic, 'my-topic', 'topic is \'my-topic\'');
        done();
      };
      var publisher = Publish.generate(producer, {topic: 'my-topic', batch: {enabled: true, payload: 2}});

      publisher('test', null);
      publisher('test 2', null);
    });

  });

});
