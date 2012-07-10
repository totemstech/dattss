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
  var accessVerifier;       /* verify(req, res, cb); */

  //private
  var check_key;            /* check_key(req) */

  
  var that = {};  
  
  /**
   * Asynchronous verifier for user access
   * @param req http request
   * @param res http response
   * @param next(err) whether check ok or not
   */    
  accessVerifier = function(req, res, next) {
    var email = (req.session ? req.session.email : null);
    
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
      if(my.cfg['DEBUG']) {
        console.log('PUBLIC: ' + req.url);
      }
      next();
      return;
    }

    // password
    var passwd_r = /^\/s\/password\/[a-zA-Z0-9\+\_\-\.]+@[a-zA-Z0-9\_\-\.]+\/?[a-zA-Z0-9]?/.exec(req.url);
    if(passwd_r) {
      next();
      return;
    }

    // signup
    var signup_r = /^\/s\/signup/.exec(req.url);
    if(signup_r) {
      next();
      return;
    }

    // /agg
    var agg_r = /^\/agg/.exec(req.url);
    if(agg_r) {
      if(check_auth(req)) {
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
          res.redirect('/s/login');
        }
      });

      return;
    }
    
    res.redirect('/s/login');
  };
 


  /**
   * Checks whether the provided request is authenticated by an auth parameter
   * AUTH have this format: INCR_HMAC(SECRET, EMAIL, INCR)
   * @param req the incoming request
   */
  check_auth = function(req) {
    var auth = req.param('auth');

    if(typeof auth !== 'string')
      return false;

    var split = auth.split('_');
    var id = split[0];
    var hash = split[1];
    
    var hmac = require('crypto').createHmac('sha', my.cfg['DATTSS_SECRET']);
    hmac.update(id);
    var dig = hmac.digest('hex');

    return (dig === hash);
  };



  fwk.method(that, 'accessVerifier', accessVerifier, _super);

  return that;
};

exports.access = access;
