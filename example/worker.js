var kafka = require('kafka-node'),
    client = new kafka.Client(process.env.KAFKA_URL || '192.168.59.103:2181/', process.env.KAFKA_CONSUMER_ID || 'kafka-node-consumer', {
      sessionTimeout: 1000 // this is just to enable multiple restarts in debug and avoid https://github.com/SOHU-Co/kafka-node/issues/90 - should be removed in PRD
    }),
    HighLevelConsumer = kafka.HighLevelConsumer;


var consumer = new HighLevelConsumer(
    client,
    [
        { topic: 'my-node-topic'}
    ],
    {
      groupId: 'worker.js' // this identifies consumer and make the offset consumption scoped to this key
    }
);

consumer.on('ready', function() {
  console.log('KAFKA consumer ready');
});

consumer.on('message', function (message) {

      console.log('KAFKA message:' + JSON.stringify(message));
});

consumer.on('error', function (err) {
  console.log('KAFKA consumer error:' + err);
});

process.on('beforeExit', function(code) {
  //force offset commit
  consumer.close(true, function(err, data) {
    console.log('KAFKA consumer commit ok :)');
  });
});
