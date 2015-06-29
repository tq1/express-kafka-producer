module.exports = function(_, async_timed_cargo, kafka) {

  var Publish = {

    generate: function(producer, options, numberOfPartitions) {

      if (!numberOfPartitions) numberOfPartitions = 0;

      var cargo_timeout = 500;
      var cargo_payload = 1;
      if (options.batch && options.batch.enabled) {
        cargo_timeout = options.batch.timeout || cargo_timeout;
        cargo_payload = options.batch.payload || 1000;
      }

      var cargo = async_timed_cargo(function(tasks, callback) {

        var partition = 0;

        if (options.partition) {
          partition = options.partition;
        }

        var messages = tasks.map(function(task) {

          var key = task.key,
              message = task.message,
              message_partition = partition;

          if (options.parse_to_json != false && !_.isString(message)) {
            message = JSON.stringify(message)
          }

          if (task.key) {

            if (options.parse_to_json != false && !_.isString(key)) {
              key = JSON.stringify(key)
            }

            if (_.isObject(options.partitioner) && _.isFunction(options.partitioner.partition)) {
              message_partition = options.partitioner.partition(key, numberOfPartitions);
            }

            return {
              partition: message_partition,
              message: new kafka.KeyedMessage(key, message)
            }
          }
          else {
            return {
              partition: message_partition,
              message: message
            }
          }
        });

        // transforming [{partition: 1, message: "aaa"}, {partition: 2, message: ["bbb"]}]
        //  to {1: ["aaa"], 2: ["bbb"]}
        messages = _.chain(messages)
          .groupBy('partition') // returns {1: [{partition: 1, message: "aaa"}], 2: [{partition: 2, message: "bbb"}]}
          .mapValues(function(value, key, object) {
            return _.pluck(value, 'message')
          }) // returns {1: "aaa", 2: ["bbb"]}
          .value()

        var partitions = Object.keys(messages);

        var payloads = partitions.map(function(partition) {
          var payload = {
            topic: options.topic,
          };

          if (options.attributes) {
            payload.attributes = options.attributes;
          }

          var partition_messages = messages[partition];

          var isMessageIsArrayWithSingleElement = _.isArray(partition_messages) && partition_messages.length == 1;
          var isUsingBatch = options.batch && options.batch.enabled;
          var isParsingMessagesToString = options.parse_to_json != false && isMessageIsArrayWithSingleElement && !_.isString(partition_messages[0]);
          var shouldUseOnlyFirstMessageInCollection = isMessageIsArrayWithSingleElement && (!isUsingBatch || isParsingMessagesToString);

          if (shouldUseOnlyFirstMessageInCollection) {
            payload.messages = partition_messages[0];
          }
          else {
            payload.messages = partition_messages;
          }

          payload.partition = partition;

          return payload;
        });

        producer.send(payloads, function (err, data) {
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
