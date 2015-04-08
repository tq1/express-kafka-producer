module.exports = function(_) {

  var Message = {
    generate: function(options, req, res, cb) {

      var use_options = options || {};

      // http://expressjs.com/4x/api.html#req
      var req_params = [
        'body',
        'cookies',
        'fresh',
        'hostname',
        'ip',
        'ips',
        'originalUrl',
        'params',
        'path',
        'protocol',
        'query',
        'secure',
        'stale',
        'signedCookies',
        'subdomains',
        'xhr'
      ];

      if(use_options.whitelist && use_options.whitelist.length > 0) {
        req_params = _.union(req_params, use_options.whitelist);
      }

      if(use_options.blacklist && use_options.blacklist.length > 0) {
        req_params = _.difference(req_params, use_options.blacklist);
      }

      var request = _.pick(req, req_params);

      try {
        var parsed = JSON.stringify(request);

        cb(null, parsed);

      } catch (ex) {

        if (use_options.verbose) {
          console.log("> KAFKA MIDDLEWARE - MESSAGE ERROR: " + ex);
        }

        cb(ex);
      }

    }
  }

  return Message;
}
