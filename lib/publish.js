module.exports = function(kafka, async) {

  var Publish = {

    generate: function(producer, options) {

      console.log('bs:' + options.batch_size);

      var cargo = async.cargo(function(payloads, callback) {
        console.log('publish process length: ' + payloads.length);
        producer.send(payloads, function (err, data) {
          if (options.verbose) {
            if (err) {
              console.log("> KAFKA MIDDLEWARE PUBLISH - Error Sending Message: " + err);
            } else {
              console.log("> KAFKA MIDDLEWARE PUBLISH - Message Sent Successfully: " + JSON.stringify(data));
            }
          }
          return callback(err);
        });
      }, options.batch_size || 1000);

      // cargo.drain = function() {
      //   console.log('drain');
      // }

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

        cargo.push(payload, callback);

      }
      return publisher;
    }
  }

  return Publish;
}
