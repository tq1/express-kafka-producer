var kafka = require('kafka-node'),
    client = new kafka.Client(process.env.KAFKA_URL || '192.168.59.103:2181/', process.env.KAFKA_CONSUMER_ID || 'kafka-node-consumer', {
      sessionTimeout: 1000 // this is just to enable multiple restarts in debug and avoid https://github.com/SOHU-Co/kafka-node/issues/90 - should be removed in PRD
    }),
    HighLevelConsumer = kafka.HighLevelConsumer;

var _ = require('lodash');


var consumer = new HighLevelConsumer(
    client,
    [
        { topic: 'my-node-topic' }
    ],
    {
      groupId: 'worker.js', // this identifies consumer and make the offset consumption scoped to this key
      maxTickMessages: 1,
    }
);

consumer.on('ready', function() {
  console.log('KAFKA consumer ready');
});

var _interval = _.throttle(function() {
  console.log('Interval...');
}, 500);

// // example message: {"topic":"my-node-topic","value":"{\"timestamp\":1425599538}","offset":0,"partition":0,"key":{"type":"Buffer","data":[]}}

consumer.on('message', function (message) {
  console.log('Receiving: ' + message.offset);

  _interval();

});


consumer.on('error', function (err) {
  console.log('KAFKA consumer error:' + err);
});
