var crypto = require('crypto');

/**
 * @path GET /login
 */
exports.get_login = function(req, res, next) {
  var email = req.session.email || null;

  if(email) {
    res.redirect('/home');
  }
  else {
    res.render('login');
  }
};

/**
 * @path POST /login
 */
exports.post_login = function(req, res, next) {
  var email = req.param('email') || null;
  var pass = req.param('pass') || null;

  var user = require('../lib/user.js').user({ email: email,
                                              mongo: req.store.mongo,
                                              redis: req.store.redis,
                                              cfg: req.store.cfg });
  user.login(pass, function(err) {
    if(err) {
      res.render('login', {locals: { fail: true, email: email } });
    }
    else {
      req.session.email = email;
      res.redirect('/home');
    }
  });
};

/**
 * @path GET /signup
 */
exports.get_signup = function(req, res, next) {
  var user = req.session.email || null;
  var email = req.param('email') || null;
  
  if(user) {
    res.redirect('/home');
  }
  else {
    res.render('signup', { locals: { email: email } });
  }
};

/**
 * @path POST /signup
 */
exports.post_signup = function(req, res, next) {
  var email = req.param('email');
  var email_r = /^[a-zA-Z0-9\._\-\+]+@[a-z0-9\._\-]{2,}\.[a-z]{2,4}$/;

  if(email_r.exec(email)) {
    console.log('EMAIL SIGNUP: ' + email);
    
    var user = require('../lib/user.js').user({ email: email,
                                                mongo: req.store.mongo,
                                                redis: req.store.redis,
                                                cfg: req.store.cfg });
    user.get(function(err, usr) {
      if(err) {
        res.send(err.message, 500);
      }
      else if(usr && usr.pwd) {      
        res.render('signup', { locals: { exists: true } });
      }
      else {
        user.create(function(err) {
          if(err) {
            res.render('signup', { locals: { fail: true } });
          }
          else {
            res.render('signup', { locals: { success: true } });
          }
        });
      }
    });
  }
  else {
    res.render('signup', { locals: { emailuse: true } });
  }
};

/**
 * @path GET /password
 */
exports.get_password = function(req, res, next) {
  var key = req.param('key');
  var email = req.param('email');

  res.render('password', {locals: { password: true,
                                    key: key,
                                    email: email } });
};

/**
 * @path POST /password
 */
exports.post_password = function(req, res, next) {
  var email = req.param('email') || null;
  var key = req.param('key') || null;
  var pass = req.param('pass') || null;
  
  var user = require('../lib/user.js').user({email: email,
                                             mongo: req.store.mongo,
                                             redis: req.store.redis,
                                             cfg: req.store.cfg });
  user.finalize(key, pass, function(err) {
    if(err) {
      res.render('password', {locals: { fail: true } });
    }
    else {
      req.session.email = user.email();
      res.redirect('/home');
    }
  });
};

/**
 * @path GET /signout
 */
exports.get_signout = function(req, res, next) {
  var email = req.session.email || null;
  if(email) {
    req.session.destroy(function(err) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        res.redirect('/');
      }
    });
  }
};

/**
 * @path GET /reset
 */
exports.get_reset = function(req, res, next) {
  var email = req.session.email || null;

  if(email) {
    res.render('reset', {locals: { login: { email: email } } });
  }
  else {
    res.render('reset');
  }
};

/**
 * @path POST /reset
 */
exports.post_reset = function(req, res, next) {
  var email = req.param('email');
  console.log('EMAIL RESET: ' + email);
  
  var user = require('../lib/user.js').user({ email: email,
                                              mongo: req.store.mongo,
                                              redis: req.store.redis,
                                              cfg: req.store.cfg });
  user.reset(function(err) {
    if(err) {
      res.render('reset', {locals: { fail: true } });
    }
    else {
      res.render('reset', {locals: { success: true } });
    }
  });
};
