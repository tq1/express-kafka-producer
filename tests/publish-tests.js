var chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    kafka = require('kafka-node'),
    Publish = require('../lib/publish')(kafka);

describe('Publish', function() {

  var producer = {};

  beforeEach(function() {
    delete producer.send;
  });

  it('should create payload accordingly', function(done) {

    producer.send = function(payloads, cb) {
      assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
      assert.equal(payloads[0].messages, 'test', 'message is \'test\'');
      assert.equal(payloads[0].topic, 'my-topic', 'topic is \'my-topic\'');
      done();
    };
    var publisher = Publish.generate(producer, {topic: 'my-topic'});

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

  it('should create kafka.KeyedMessage if key is provided', function(done) {

    producer.send = function(payloads, cb) {
      assert.lengthOf(payloads, 1, 'payloads`s value has a length of 1');
      assert.equal(payloads[0].messages.key, 'key', 'message is \'key\'');
      assert.equal(payloads[0].messages.value, 'test', 'message value is \'test\'');
      done();
    };
    var publisher = Publish.generate(producer, {topic: 'my-topic', partition: 2, attributes: 1});

    publisher('test', 'key');
  });
});
