/**
 * DaTtSs: Access verifier middleware
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-15  n1t0    Creation
 */

var fwk = require('fwk');
var crypto = require('crypto');
var url = require('url');
var factory = require('../factory.js').factory;

//
// ## Access verifier middleware
// Define basic middlewares (access/error)
// ```
// @spec {}
// ```
//
var access = function(spec, my) {
  my = my || {};
  var _super = {};

  //
  // #### _public methods_
  //
  var verify;       /* verify(req, res, next); */
  var error;        /* error(err, req, res, next); */

  //
  // #### _private methods_
  //

  //
  // #### _that_
  //
  var that = {};

  //
  // ### verify
  // Simple middleware used to check access for every endpoints
  // and set basic response helpers
  // ```
  // @req {object} http request
  // @res {object} http response
  // @next {function(err)}
  // ```
  //
  verify = function(req, res, next) {
    var uid = (req.session ? req.session.uid : null);
    var auth = req.param('auth');
    var url_p = url.parse(req.url);

    factory.log().debug('EVAL: ' + req.url + ' (' + req.method + ')');

    /**
     * JSON helpers
     */
    res.error = function(err) {
      return next(err);
    };

    res.data = function(data) {
      if(req.param('callback'))
        return res.jsonp(data);
      else
        return res.json(data);
    };

    res.ok = function() {
      var json = {
        ok: true,
      };
      return res.json(json);
    };

    /* Helper function to return typed auth errors */
    var auth_error = function() {
      var error = new Error('Authentication Error');
      error.name = 'AuthenticationError';
      return next(error);
    };

    if(auth && /^\/agg/.exec(req.url)) {
      var c_users = factory.data().collection('dts_users');

      var hash = /^([^.]+).(.*)$/.exec(auth);
      if(hash && hash[2] === factory.hash([ hash[1] ])) {
        c_users.findOne({
          uid: hash[1]
        }, function(err, user) {
          if(err) {
            return auth_error();
          }
          else {
            req.user = user;
            return next();
          }
        });
      }
      else {
        return auth_error();
      }

      return;
    }

    if(uid) {
      var c_users = factory.data().collection('dts_users');

      c_users.findOne({
        uid: uid,
        slt: factory.slt(uid)
      }, function(err, user) {
        if(err) {
          return auth_error();
        }
        if(!user) {
          req.session.uid = null;
          return res.redirect('/#/auth/signin');
        }
        else {
          req.user = user;
          return next();
        }
      });

      return;
    }

    /**************************************************************************/
    /*                            PUBLIC ENDPOINTS                            */
    /**************************************************************************/
    for(var i in factory.config()['DATTSS_PUBLIC_ENDPOINTS']) {
      if(factory.config()['DATTSS_PUBLIC_ENDPOINTS'][i].test(req.url)) {
        return next();
      }
    }

    return auth_error();
  };

  //
  // ### error
  // Errors middleware
  // ```
  // @err {object} the error to handle
  // @req {object} http request
  // @res {object} http response
  // @next {function(err)}
  // ```
  //
  error = function(err, req, res, next) {
    factory.log().error(err);
    return res.send(500, {
      error: {
        name: err.name,
        message: err.message
      }
    });
  };


  fwk.method(that, 'verify', verify, _super);
  fwk.method(that, 'error', error, _super);

  return that;
};

exports.access = access;
