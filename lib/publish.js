module.exports = function(_, kafka) {

  var Publish = {

    generate: function(producer, options) {

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
        if (options.parse_to_json != false && !_.isString(message)) {
          message = JSON.stringify(message)
        }

        if (key) {

          if (options.parse_to_json != false && !_.isString(key)) {
            key = JSON.stringify(key)
          }

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
  }

  return Publish;
}
