/*
 * DaTtSs: engine.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-22  n1t0    Creation
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;

//
// ### @PUT /agg
// Aggregates value
//
exports.put_agg = function(req, res, next) {
  var auth = req.param('auth');
  var uid = auth.split('.')[0];

  if(factory.engine().agg(uid, req.body)) {
    /* DaTtSs */ factory.dattss().agg('routes.put_agg.ok', '1c');
    return res.ok();
  }
  else {
    /* DaTtSs */ factory.dattss().agg('routes.put_agg.error', '1c');
    return res.error(new Error('Malformed request'));
  }
};

//
// ### @GET /status
// Get the current status
//
exports.get_status = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_status.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  factory.engine().current(req.user.uid, function(err, current) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_status.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_status.ok', '1c');
      return res.data(current);
    }
  });
};
