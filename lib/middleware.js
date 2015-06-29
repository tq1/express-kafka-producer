module.exports = function(kafka, Message, Publish, DefaultPartitioner, _) {

  var Middleware = function(options) {

    var use_options = options || {},
        client      = null;

    if (!use_options.producer) throw new Error('producer options must be set');
    if (!use_options.client) {
      use_options.client = {
        url: '127.0.0.1:2181',
        client_id: 'kafka-node-producer'
      }
    }

    if (use_options.client instanceof kafka.Client) {
      client = use_options.client;
    }
    else {
      if (use_options.verbose) {
        console.log('> KAFKA MIDDLEWARE - Will conncet to ' + use_options.client.url)
      }
      client = new kafka.Client(use_options.client.url, use_options.client.client_id, {});
    }

    use_options.messages = _.defaults({verbose: use_options.verbose}, use_options.messages || {});

    if (use_options.key && !_.isFunction(use_options.key)) {
      use_options.key = null;
    }
    if (use_options.message && !_.isFunction(use_options.message)) {
      use_options.message = null;
    }
    if (use_options.error && !_.isFunction(use_options.error)) {
      use_options.error = null;
    }
    // settings: https://github.com/SOHU-Co/kafka-node/blob/7101c4e1818987f4b6f8cf52c7fd5565c11768db/lib/highLevelProducer.js#L37-L38
    var producer  = new kafka.HighLevelProducer(client, use_options.producer.settings || {}),
        publisher = Publish.generate(producer, _.defaults({verbose: use_options.verbose, parse_to_json: true, batch: use_options.batch, partitioner: DefaultPartitioner}, use_options.producer), (client.topicPartitions[use_options.producer.topic] || []).length);

    if (use_options.verbose) {
      producer.on('ready', function () {
        console.log('> KAFKA MIDDLEWARE - Producer Ready');
      });
    }

    var middleware = function(req, res, next) {

      var sent = function(err, message) {
        if(err) {
          if (use_options.verbose) {
            console.log("> KAFKA MIDDLEWARE - Error sending message: " + err);
          }
          if (use_options.error) {
            return use_options.error(err, req, res, next);
          }
          else {
            return next();
          }
        }
        else {
          return next();
        }
      }

      var send = function(err, message) {

        if (err) {
          if (use_options.error) {
            return use_options.error(err, req, res, next);
          }
          else {
            return next();
          }
        }

        if (use_options.verbose) {
          console.log("> KAFKA MIDDLEWARE - MESSAGE: " + message);
        }

        if (use_options.key) {
          use_options.key(req, res, function(err, key) {
            if(err) {
              if (use_options.verbose) {
                console.log("> KAFKA MIDDLEWARE - Error Generating Key: " + err);
              }
              if (use_options.error) {
                return use_options.error(err, req, res, next);
              }
              else {
                return next();
              }
            }
            else {

              if (use_options.verbose) {
                console.log("> KAFKA MIDDLEWARE - KEY: " + key);
              }

              publisher(message, key, sent);
            }
          });
        } else {
          publisher(message, null, sent);
        }
      };

      if (use_options.message) {
        return use_options.message(req, res, send);
      } else {
        return Message.generate(use_options.messages, req, res, send);
      }
    }

    return middleware;
  }

  return Middleware;
}
