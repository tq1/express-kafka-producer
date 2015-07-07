var express = require('express'),
    app = express(),
    expressProducer = require('express-kafka-producer')
    _ = require('lodash');


var kafka = {
  verbose: true,
  client: {
    url: process.env.KAFKA_URL || '192.168.59.103:2181/',
    client_id: process.env.KAFKA_PRODUCER_ID || 'kafka-node-producer'
  },
  producer: {
    topic: 'my-node-topic',
    attributes: 1,
    // partition: 1,
    settings: { // https://github.com/SOHU-Co/kafka-node/blob/7101c4e1818987f4b6f8cf52c7fd5565c11768db/lib/highLevelProducer.js#L37-L38
      requireAcks: 1
    }
  }
};

// Express setup
app.listen(process.env.PORT || 3001);

// uses no key and default message creation
app.get('/', expressProducer(kafka), function(req, res) {
  var msg = 'called after kafka publishing to topic \'' + kafka.producer.topic;
  console.log(msg);
  res.json(200, {message: msg});
});

// creates custom message and key to send to kafka and default error handler
app.get('/key/:key', expressProducer(_.defaults({
  key: function(req, res, cb) {
    //raises error if key is 'abc'
    if (req.params.key === 'abc') {
      cb('key error, can not be \'abc\'');
    } else {
      cb(null, req.params.key);
    }
  },
  message: function(req, res, cb) {
    cb(null, {
      url: req.originalUrl,
      date: new Date(),
      rnd: Math.random()
    });
  },
  error: function(err, req, res, next) {
    res.send(500, "error sending to kafka: " + err);
  }
}, kafka)), function(req, res) {
  var msg = 'called after kafka publishing to topic \'' + kafka.producer.topic + '\' with key: ' + req.params.key;
  console.log(msg);
  res.json(200, {message: msg});
});

// uses batch opions to send messages to kafka
app.get('/batch/:key', expressProducer(_.defaults({
  batch: {
    enabled: true,
    payload: 100,
    timeout: 500
  }
}, kafka)), function(req, res) {
  var msg = 'called after kafka publishing to topic \'' + kafka.producer.topic + '\' with key: ' + req.params.key;
  console.log(msg);
  res.json(200, {message: msg});
});
