var kafka = require('kafka-node'),
    _ = require('lodash'),
    async = require('async'),

    Message = require('./lib//message')(_),
    Publish = require('./lib/publish')(kafka, async);

var middleware = require('./lib/middleware')(kafka, async, _, Message, Publish);

module.exports = middleware;
