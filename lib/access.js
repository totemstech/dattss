var fwk = require('fwk');

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

  // public
  var verify;       /* verify(req, res, cb); */
  
  var that = {};  
  
  /**
   * Asynchronous verifier for user access
   * @param req http request
   * @param res http response
   * @param next(err) whether check ok or not
   */    
  verify = function(req, res, next) {
    var email = req.session.email || null;
    
    /**
     * We pass mongo & cfg
     * for routes
     */
    req.store = { mongo: my.mongo,
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
    var passwd_r = /\/password\/[a-zA-Z0-9\+\_\-\.]+@[a-zA-Z0-9\_\-\.]+\/?[a-zA-Z0-9]?/.exec(req.url);
    if(passwd_r) {
      next();
      return;
    }

    // signup
    var signup_r = /\/signup(.+)/.exec(req.url);
    if(signup_r) {
      next();
      return;
    }

    var agg_r = /\/agg(.+)/.exec(req.url);
    if(agg_r) {
      next();
      return;
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
 
  fwk.method(that, 'verify', verify, _super);

  return that;
};

exports.access = access;
