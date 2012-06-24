var fwk = require('fwk');
var crypto = require('crypto');

/**
 * Access checker
 * asynchronous access checker
 *
 * @inherits events.EventEmitter
 *
 * @param spec {cfg, mongo}
 */
var access = function(spec, my) {
  my = my || {};
  var _super = {};        

  my.cfg = spec.cfg;  
  my.mongo = spec.mongo;
  my.redis = spec.redis;
  my.engine = spec.engine;

  // public
  var verify;       /* verify(req, res, cb); */

  //private
  var check_key;    /* check_key(req) */

  
  var that = {};  
  
  /**
   * Asynchronous verifier for user access
   * @param req http request
   * @param res http response
   * @param next(err) whether check ok or not
   */    
  verify = function(req, res, next) {
    var email = req.session.email;
    
    /**
     * We pass mongo & cfg
     * for routes
     */
    req.store = { mongo: my.mongo,
                  redis: my.redis,
                  engine: my.engine,
                  cfg: my.cfg };

    if(my.cfg['DEBUG']) {
      console.log('EVAL: ' + req.url + ' (' + req.method + ') ' + email);
    }

    // public
    if(my.cfg['DATTSS_PUBLIC_ENDPTS'].indexOf(req.url) !== -1) {
      console.log('PUBLIC: ' + req.url);
      next();
      return;
    }

    // password
    var passwd_r = /^\/password\/[a-zA-Z0-9\+\_\-\.]+@[a-zA-Z0-9\_\-\.]+\/?[a-zA-Z0-9]?/.exec(req.url);
    if(passwd_r) {
      next();
      return;
    }

    // signup
    var signup_r = /^\/signup/.exec(req.url);
    if(signup_r) {
      next();
      return;
    }

    // /agg
    var agg_r = /^\/agg/.exec(req.url);
    if(agg_r) {
      if(check_key(req)) {
        next();
        return;
      }
      else {
        res.send('Forbidden', 503);
        return;
      }
    }
    
    // logged in
    if(email) {
      var user = require('./user.js').user({ email: email,
                                             cfg: my.cfg,
                                             mongo: my.mongo });
      user.exist(function(err, ex) {
        if(err)
          next(err);
        else if(ex)
          next();
        else {
          req.session.email = null;
          res.redirect('/login');
        }
      });

      return;
    }
    
    res.redirect('/login');
  };
 


  /**
   * Checks whether the provided request is authenticated by an API key
   * Keys have this format: INCR_HMAC(SECRET, EMAIL, INCR)
   * @param req the incoming request
   */
  check_key = function(req) {
    var email = req.param('email');
    var key = req.param('key');

    var incr = parseInt(key.split('_')[0], 10);
    var hash = key.split('_')[1];

    var hmac = require('crypto').createHash('sha512');
    hmac.update(my.cfg['DATTSS_SECRET'] + ' ' + incr + ' ' + email);
    
    return (hmac.digest('hex').substr(32) === hash);
  };



  fwk.method(that, 'verify', verify, _super);

  return that;
};

exports.access = access;
