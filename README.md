# Middleware to send Node.js + Express requests direct to Kafka

[![Build Status](https://img.shields.io/travis/felipesabino/express-kafka-producer.svg?style=flat-square)](https://travis-ci.org/felipesabino/express-kafka-producer)

[![NPM](https://nodei.co/npm/express-kafka-producer.png)](https://nodei.co/npm/express-kafka-producer/)

## Install

add `express-kafka-producer` to you `package.json`


## Example

Check the [example app](example/index.js) for a working example on how to use the middleware

## Running kafka

There is a [docker-compose](./DOCKER.md) configured to make tests easier

## Usage

Use as a middleware in your express app

```
expressProducer = require('express-kafka-producer');

var kafka = {
  producer: {
    topic: 'my-node-topic'
  }
};

app.get('/', expressProducer(kafka), function(req, res) { });

```


## Options

The options available are

- `verbose` (`boolean`): Enables log to the kafka client, messages being publish and errors, all logs will start with the `> KAFKA MIDDLEWARE` string. Needless to say that it should be `false` in production
- `client` (`object` or `kafka-node.Client`): Settings that deal with kafka server connection. If a [`kafka-node.Client`](https://github.com/SOHU-Co/kafka-node/blob/master/kafka.js#L5) object is provided, it will used it instead of creating a new connection.

key             | Type         | Description
--------------- | -----------  | ---
`url`           | `string`     | Kafka server URL. Default value `127.0.0.1:2181`
`client_id`     | `string`     | Kafka [`client_id`](https://github.com/SOHU-Co/kafka-node/#clientconnectionstring-clientid-zkoptions). Default value `kafka-node-produce`

- `producer` (`object`): Producer options

key                 | Type      | Description
------------------- | --------- | ---
`topic` (required)  | `string`      | Topic to send messages to
`attributes`        | `string`      | Compression attribute. Check [kafka-node docs](https://github.com/SOHU-Co/kafka-node/#sendpayloads-cb-1) for possible values
`settings`          | `object`      | Values used to handle producer acks and publish timeouts. Check [kafka node' HighLevelProducer](https://github.com/SOHU-Co/kafka-node/blob/7101c4e1818987f4b6f8cf52c7fd5565c11768db/lib/highLevelProducer.js#L37-L38) for possible values
`partition`         | `string`      | Partition to send message to
`partitioner`       | `Partitioner` | `Partioner` object to be used (description bellow). Default for keyed messages will be [lib/lib/default-partitioner.js](lib/default-partitioner.js) which get a fixed partition number for key if partition number never changes, making [log compaction](https://cwiki.apache.org/confluence/display/KAFKA/Log+Compaction) easier to use.

`Partitioner` (object):

key                 | Type                                             | Description
------------------- | ---------                                        | ---
`partition`         | `function(key, numberOfPartitions)` -> `Number`  | Object function called before publishing message and should return an absolute `Number` that will be used as the partition number (so it should NOT be greater than the param `numberOfPartitions` received)


- `key` (`function`): If provided, it is the function (`function(req, res, callback) {}`) that is called to generate a key for the message before being sent to kafka topic. `callback` expected to be called in the format `callback(error, key)`, where `key` is expected to be a `string`


- `message` (`function`): If provided, it is the function (`function(req, res, callback) {}`) that is called to generate a custom message payload to be sent to kafka topic. `callback` expected to be called in the format `callback(error, message)`, where `message` is expected to be an `object` or `string`.
If not provided, the message will have just [some keys](./lib/message.js#L7-L25) from express request object

- `messages` (`object`): Options to be used to handle automatic message generated from express request object

key             | Type                  | Description
--------------- | --------------------  | ---
`whitelist`     | `array of string`     | keys to be added to the message before being sent to kafka. Possible vales available at [express docs](http://expressjs.com/4x/api.html#req)
`blacklist`     | `array of string`     | keys to be excluded to the message before being sent to kafka. Possible vales available at [express docs](http://expressjs.com/4x/api.html#req)

- `error` (`function`): If provided, it is the function (`function(err, req, res, callback) {}`) that is called when any error happens inside the middleware while sending message to kafka, generating message object or after custom callbacks call the callback with an error object. If not provided, any error will be ignored and the next middlewares in the stack will be called normally.

- `parse_to_json` (`boolean`): Kafka client needs messages (and key, if provided) to be sent as string. Add this options to use `JSON.stringify` for automatic key and messages parsing

- `batch` (`object`): Batching message options. If enabled, each payload sent to kafka will contain an array of messages sent to kafka

key                 | Type      | Description
------------------- | --------- | ---
`enabled`           | `boolean` | If batching messages is enabled
`payload`           | `number`  | Maximum number of messager that will be pilled up before sending it to kafka. Default value is `1000`.
`timeout`           | `number`  | Time (in ms) between message flushes to kafka. This ensures that messages are sent to kafka after a certain period of time even if the number of messages received is smaller than the `payload`. Default value is `500`ms


## Test

```
$ npm install
$ node run test
```

## TODO

Middleware:

- [ ] Add [Zookeeper options](https://github.com/SOHU-Co/kafka-node/#clientconnectionstring-clientid-zkoptions)
- [x] Finish tests
- [x] Add Travis-CI
- [x] Publish to npm

Example App:

- [ ] Add example app docs
- [ ] Use node-foreman
- [ ] Add example of a worker consuming data from kafka to show data properly being added
- [ ] Some kind of performance test
