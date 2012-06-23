var crypto = require('crypto');
var fwk = require('fwk');
var email = require('mailer');

/**
 * User object
 *
 * Manage user access, and data
 *
 * @inherits object
 *
 * @param {email, cfg, mongo}
 */
var user = function(spec, my) {
  my = my || {};
  var _super = {};

  my.collection = 'users';
  my.email = spec.email;
  my.cfg = spec.cfg; 

  // public
  var login;                  /* login(pass, cb);                    */
  var create;                 /* create(cb);                         */
  var finalize;               /* finalize(key, pass, cb);            */
  var reset;                  /* reset(cb);                          */
  var list_set;               /* list_ct(cb);                        */
  var retrieve;               /* retrieve(cb);                       */
  var add_oauth;              /* add_oauth(type, handle, creds, cb); */
  var del_oauth;              /* del_oauth(type, handle, cb);        */

  // private
  var mailer;                 /* mailer(type, data);       */

  var that = require('./object.js').object({ collection: my.collection,
                                             uid: my.email,
                                             cfg: spec.cfg,
                                             mongo: spec.mongo });

  /**
   * Send a mail when a user sign up or other action
   * @param type defines wich type of email
   *             we need to send :
   *              - 'signup'   { user_key, user_email }
   *              - 'reset'    { user_key, user_email }
   */
  mailer = function(type, data) {
    var options = { host: my.cfg['DATTSS_MAIL_HOST'],
                    port: my.cfg['DATTSS_MAIL_PORT'],
                    domain: my.cfg['DATTSS_MAIL_DOMAIN'],
                    authentication: "login",
                    to: my.email,
                    from: 'teleportd:firstcontact <'+my.cfg['DATTSS_MAIL_FROM']+'>',
                    subject: my.cfg['DATTSS_MAIL_SUBJECT'][type],
                    template : "./mail/user-" + type + ".mustache",
                    username: my.cfg['DATTSS_MAIL_USER'],
                    password: my.cfg['DATTSS_MAIL_PASS'],
                    data: data
                  };
    
    email.send(options, function(err, result) {
      if(err) { 
        console.log('=========================================');
        console.log('ERROR: email.send')
        console.log(err);
        console.log('=========================================');
      }
      else {
        console.log('RESULT : ' + util.inspect(result));
      } 
    });
  };


  /**
   * Try to login
   * @param pass the user password
   * @param cb callback function(err)
   */
  login = function(pass, cb) {
    if(typeof my.email === 'string' && my.email !== 'none') {
      if(typeof pass !== 'string')
        cb(new Error('USR-LOGIN: Wrong password'));
      else {
        var hmac = crypto.createHmac(my.cfg['HMAC_ALGO'], my.cfg['DATTSS_SECRET']);
        hmac.update(pass);
        that.get(function(err, usr) {
          if(err) cb(err);
          else if(!usr) {
            cb(new Error('USER-LOGIN: Wrong email'));
          }
          else {
            if(usr.pwd !== hmac.digest('hex')) {
              cb(new Error('USER-LOGIN: Wrong password'));
            }
            else 
              cb();
          }
        });
      } 
    }
    else {
      cb(new Error('USR-LOGIN : Mail not defined'));
    }
  };


  /**
   * Create a new user
   * with current email
   * @param pass the password to use
   * @param cb callback function(err)
   */
  create = function(cb) {
    if(typeof my.email === 'string' && my.email !== 'none') {
      var hmac = crypto.createHmac(my.cfg['HMAC_ALGO'], my.cfg['DATTSS_SECRET']);
      hmac.update(my.email + '-' + Date.now().toString());
      var key = hmac.digest('hex');
      var usr = { eml: my.email,
                  key: key };
      that.save(usr, function(err) {
        if(err) cb(err);
        else {
          mailer('signup', { user_key: usr.key, user_email: escape(my.email) });
          cb();
        }
      });
    }
    else {
      cb(new Error('USR-CREATE : Mail not defined'));
    }
  };

  
  /**
   * Modify the user password
   * We can use it to redefine a pass too
   * @param key the key that was generated
   *            for the user
   * @param pass the pass user gives
   * @param cb callback function(err)
   */
  finalize = function(key, pass, cb) {
    if(typeof pass !== 'string')
      cb(new Error('USR-FINALIZE: Wrong password'));
    else {
      var hmac = crypto.createHmac(my.cfg['HMAC_ALGO'], my.cfg['DATTSS_SECRET']);
      hmac.update(pass);
      var pwd = hmac.digest('hex');
      that.get(function(err, usr) {
        if(err) cb(err);
        else if(!usr) {
          cb(new Error('USER-FINALIZE: Unknown user'));
        }
        else {
          if(usr.key !== key) {
            cb(new Error('USER-FINALIZE: Wrong Key'));
          }
          else {
            delete usr.key;
            usr.pwd = pwd;
            that.save(usr, function(err) {
              if(err) cb(err);
              else {
                cb();
              }
            });
          }
        }
      });
    } 
  };

  /**
   * Send email to reset password
   */
  reset = function(cb) {
    if(typeof my.email === 'string' && my.email !== 'none') {
      that.get(function(err, usr) {
        if(err) cb(err);
        else if(!usr) {
          console.log('RESET USR');
          console.log(usr);
          cb(new Error('USER-RESET: Wrong email'));
        }
        else {
          console.log('RESET USR');
          console.log(usr);
          var hmac = crypto.createHmac(my.cfg['HMAC_ALGO'], my.cfg['DATTSS_SECRET']);
          hmac.update(my.email + '-' + Date.now().toString());
          usr.key = hmac.digest('hex');
          that.save(usr, function(err) {
            if(err) cb(err);
            else {
              mailer('reset', { user_key: usr.key, user_email: escape(my.email) });
              cb();
            }
          });
        }           
      });
    }
  };

  /**
   * List all sets which belong to
   * the current user
   * @param cb the callback function(err, ids)
   */
  list_set = function(cb) {
    if(typeof my.email === 'string') {
      that.db_find('sets', {usr: my.email}, function(err, sets) {
        if(err) cb(err);
        else if(!sets) {
          cb(new Error('No sets'));
        }
        else {
          cb(null, sets);
        }
      });
    }
  };

  /**
   * Get current usr
   * @param cb the callback function(err, usr)
   */
  retrieve = function(cb) {
    if(typeof my.email === 'string') {
      that.get(function(err, usr) {
        if(err) cb(err);
        else if(!usr) {
          cb(new Error('Unknown user'));
        }
        else {
          cb(null, usr);
        }
      });
    }
    else {
      cb(new Error('Wrong email'));
    }
  };


  /**
   * Adds an oauth account information to the user
   * @param type the oauth account type
   * @param handle the handle of the account
   * @param creds credential information for that account 
   *              (OAuth 1.0a: acces_token and access_token_secret)
   * @param cb(err)
   */
  add_oauth = function(type, handle, creds, cb) {
    that.get(function(err, usr) {
      if(err) cb(err);
      else {
        usr.acc = usr.acc || {};
        usr.acc[type] = usr.acc[type] || {};
        usr.acc[type][handle] = creds;
        
        that.save(usr, function(err) {
          if(err) cb(err);
          else {
            cb();
          }
        });
      }
    });
  };

  /**
   * Removes and oauth account information from this user
   * @param type the oauth account type
   * @param handle the handle of the account to remove
   * @param cb(err)
   */
  del_oauth = function(type, handle, cb) {
    that.get(function(err, usr) {
      if(err) cb(err);
      else {
        usr.acc = usr.acc || {};
        usr.acc[type] = usr.acc[type] || {};
        delete usr.acc[type][handle];
        
        that.save(usr, function(err) {
          if(err) cb(err);
          else {
            cb();
          }
        });
      }
    });
  };


  fwk.getter(that, 'email', my, 'email');
  
  fwk.method(that, 'login', login, _super);
  fwk.method(that, 'create', create, _super);
  fwk.method(that, 'finalize', finalize, _super);
  fwk.method(that, 'reset', reset, _super);
  fwk.method(that, 'list_set', list_set, _super);
  fwk.method(that, 'retrieve', retrieve, _super);
  fwk.method(that, 'add_oauth', add_oauth, _super);
  fwk.method(that, 'del_oauth', del_oauth, _super);

  return that;
};

exports.user = user;
