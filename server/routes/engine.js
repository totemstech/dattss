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

  /* If this code is executed, it means that the auth has been verified. */
  console.log(req.body);
  return res.ok();
};
