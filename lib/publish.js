module.exports = function(_, async_timed_cargo, kafka) {

  var Publish = {

    generate: function(producer, options) {

      var cargo_timeout = 500;
      var cargo_payload = 1;
      if (options.batch && options.batch.enabled) {
        cargo_timeout = options.batch.timeout || cargo_timeout;
        cargo_payload = options.batch.payload || 1000;
      }

      var cargo = async_timed_cargo(function(tasks, callback) {
        var payload = {
          topic: options.topic,
        };
        if (options.partition) {
          payload.partition = options.partition;
        }
        if (options.attributes) {
          payload.attributes = options.attributes;
        }

        messages = tasks.map(function(task) {

          var key = task.key,
              message = task.message;

          if (options.parse_to_json != false && !_.isString(message)) {
            message = JSON.stringify(message)
          }

          if (task.key) {

            if (options.parse_to_json != false && !_.isString(key)) {
              key = JSON.stringify(key)
            }

            return new kafka.KeyedMessage(key, message);
          } else {
            return message;
          }

        });

        if (!(options.batch && options.batch.enabled) && messages.length == 1) {
          payload.messages = messages[0];
        } else {
          payload.messages = messages;
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
      }, cargo_payload, cargo_timeout);

      // this will allow batching to be handled inside middleware
      var publisher = function(message, key, callback) {

        cargo.push({
          key: key,
          message: message
        });

        if (callback) {
          callback();
        }

      }
      return publisher;
    }
  }

  return Publish;
}
