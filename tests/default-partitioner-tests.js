var chai    = require('chai'),
    expect  = chai.expect,
    assert  = chai.assert,
    _       = require('lodash'),
    DefaultPartitioner = require('../lib/default-partitioner')();

describe('Default Partitioner', function() {

  describe('no key provided', function() {
    it('should create random key', function() {

      var originalMathRandom = Math.random;
      Math.random = function() {
        return 0.1;
      }
      var part = DefaultPartitioner.partition(null, 10);
      assert.equal(part, 1);

      Math.random = originalMathRandom;

    })
  })

  describe('key was provided', function() {

    describe('Hash function', function() {
      it('should return number for any given random string', function() {
        assert.isNumber(DefaultPartitioner.hashCode('some key'));
        assert.isNumber(DefaultPartitioner.hashCode('another key'));
        assert.isNumber(DefaultPartitioner.hashCode('string:with_random|chars!'));
        assert.isNumber(DefaultPartitioner.hashCode('12345'));
      });
    });


    describe('key function', function() {

      it('should use key to get partition', function() {

        var key = "my:random:key";
        var numberOfPartitions = 10;
        var partition = DefaultPartitioner.partition(key, numberOfPartitions);

        assert.isNumber(partition);
        assert.isBelow(partition, numberOfPartitions);

      });

      it('should return0 if 0 partitions are available', function() {

        var key = "my:random:key";
        var numberOfPartitions = 0;
        var partition = DefaultPartitioner.partition(key, numberOfPartitions);

        assert.isNumber(partition);
        assert.equal(partition, 0)

      });

    });


  })

});
