var kafka = require('kafka-node');

module.exports = function(producer, options) {

  // this will allow batching to be handled inside middleware
  var publisher = function(message, key, callback) {

    var payload = {
      topic: options.topic,
    };
    if (options.partition) {
      payload.partition = options.partition;
    }
    if (options.attributes) {
      payload.attributes = options.attributes;
    }

    if (key) {
      payload.messages = new kafka.KeyedMessage(key, message);
    } else {
      payload.messages = message;
    }

    producer.send([payload], function (err, data) {
      if (options.verbose) {
        if (err) {
          console.log("> KAFKA MIDDLEWARE PUBLISH - Error Sending Message: " + err);
        } else {
          console.log("> KAFKA MIDDLEWARE PUBLISH - Message Sent Successfully: " + JSON.stringify(data));
        }
      }
      return callback(err, data);
    });
  }
  return publisher;
}
