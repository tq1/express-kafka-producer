var kafka = require('kafka-node'),
    _ = require('lodash'),

    Message = require('./message'),
    Publish = require('./publish');

var Middleware = function(options) {

  var use_options = options || {};

  if (!use_options.producer) throw new Error('producer options must be set');
  if (!use_options.client) {
    use_options.client = {
      url: '127.0.0.1:2181',
      client_id: 'kafka-node-producer'
    }
  }

  use_options.messages = _.defaults({verbose: use_options.verbose}, use_options.messages || {});

  if (use_options.verbose) {
    console.log('> KAFKA MIDDLEWARE - Will conncet to ' + use_options.client.url)
  }

  var client    = new kafka.Client(use_options.client.url, use_options.client.client_id, {}),
      // settings: https://github.com/SOHU-Co/kafka-node/blob/7101c4e1818987f4b6f8cf52c7fd5565c11768db/lib/highLevelProducer.js#L37-L38
      producer  = new kafka.HighLevelProducer(client, use_options.producer.settings || {}),
      publisher = Publish(producer, _.defaults({verbose: use_options.verbose}, use_options.producer));

  if (use_options.verbose) {
    producer.on('ready', function () {
      console.log('> KAFKA MIDDLEWARE - Producer Ready');
    });
  }

  var middleware = function(req, res, next) {

    var send = function(err, message) {

      if (use_options.key && _.isFunction(use_options.key)) {
        use_options.key(req, res, function(err, key) {
          if(err) {
            if (use_options.verbose) {
              console.log("> KAFKA MIDDLEWARE - Error Generating Key: " + err);
            }
            return next();
          }
          else {
            publisher(message, key, next);
          }
        });
      } else {
        publisher(message, null, next);
      }
    };

    if (use_options.message && _.isFunction(use_options.message)) {
      use_options.message(req, res, send);
    } else {
      Message(use_options.messages, req, res, send);
    }
  }

  return middleware;
}

module.exports = Middleware;
