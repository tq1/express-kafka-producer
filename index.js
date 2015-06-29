var kafka = require('kafka-node'),
    _ = require('lodash'),
    async_timed_cargo = require('async-timed-cargo'),

    Message = require('./lib//message')(_),
    Publish = require('./lib/publish')(_, async_timed_cargo, kafka);
    DefaultPartitioner = require('./lib/default-partitioner')();

var middleware = require('./lib/middleware')(kafka, Message, Publish, DefaultPartitioner, _);

module.exports = middleware;
