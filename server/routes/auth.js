/**
 * DaTtSs: Authentication routes
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-15  n1t0    Authentication endpoints
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;


//
// ### @GET /auth/user
// Retrieves the user object
//
exports.get_user = function(req, res, next) {
  /* DaTtSs */ factory.dattss().agg('routes.get_user', '1c');

  if(!req.user) {
    return res.data({
      logged_in: false
    });
  }

  return res.data({
    date: req.user.dte,
    uid: req.user.uid,
    email: req.user.eml,
    auth: req.user.uid + '.' + factory.hash([ req.user.uid ]),
    logged_in: true
  });
};

//
// ### @POST /auth/signup
// Create a new user with the given email and send an email
// to finalize the signup
//
exports.post_signup = function(req, res, next) {
  if(req.user) {
    res.error(new Error('Already signed up'));
  }

  var email = req.param('email');
  var email_r = /^[a-zA-Z0-9\._\-\+]+@[a-z0-9\._\-]{2,}\.[a-z]{2,4}$/;

  if(!email_r.test(email)) {
    return res.error(new Error('Wrong email'));
  }

  var c_users = factory.data().collection('dts_users');
  c_users.findOne({
    eml: email
  }, function(err, user) {
    if(err) {
      return res.error(err);
    }
    else if(user) {
      return res.error(new Error('Email already in use'));
    }
    else {
      var uid = factory.hash([ email, Date.now().toString() ]);
      var key = factory.hash([ uid, Date.now().toString() ]);

      var user = {
        uid: uid,
        slt: factory.slt(uid),
        eml: email,
        key: key,
        dte: new Date()
      };
      console.log(user);

      fwk.async.parallel({
        email: function(cb_) {
          var url = 'http://' + factory.config()['DATTSS_DOMAIN'] +
            '/#/auth/password?code=' + key;

          var html = '';
          html += '<div>';
          html += 'Hi!<br/><br/>';
          html += 'Welcome on DaTtSs, we just created your account!<br/><br/>';
          html += 'Please follow this <a href="' + url + '">link</a> to ';
          html += 'activate it and set your password.<br/><br/>';
          html += 'You can also manually enter the following code: <strong>';
          html += key + '</strong><br/><br/>';
          html += 'The Opensource SDK is available on our github: ';
          html += '<a href="https://github.com/teleportd/dattss">';
          html += 'https://github.com/teleportd/dattss</a><br/><br/>';
          html += 'For any problem or suggestion, please feel free to contact ';
          html += 'us at <a href="mailto:team@dattss.com">team@dattss.com</a> ';
          html += 'or join us at #dattss on irc.freenode.net<br/><br/>';
          html += 'Best,<br/><br/>DaTtSs';
          html += '</div>';

          factory.email().send({
            to: email,
            from: factory.config()['DATTSS_SENDGRID_FROM'],
            fromname: factory.config()['DATTSS_SENDGRID_FROMNAME'],
            subject: 'Confirm your account!',
            html: html
          }, function(success, message) {
            if(!success) {
              return cb_(new Error(message));
            }
            else {
              return cb_();
            }
          });
        },
        insert: function(cb_) {
          c_users.insert(user, function(err) {
            if(err) {
              return cb_(err);
            }
            else {
              return cb_();
            }
          });
        }
      }, function(err) {
        if(err) {
          return res.error(err);
        }
        else {
          return res.data({
            uid: uid
          });
        }
      });
    }
  });
};

//
// ### @POST /auth/signin
// Sign the user in
//
exports.post_signin = function(req, res, next) {
  var email = req.param('email');
  var password = req.param('password');

  var c_users = factory.data().collection('dts_users');
  c_users.findOne({
    eml: email
  }, function(err, user) {
    if(err) {
      return res.error(err);
    }
    else if(!user) {
      return res.error(new Error('Wrong email or password'));
    }
    else {
      if(user.pwd !== factory.hash([password])) {
        return res.error(new Error('Wrong email or password'));
      }

      req.session.uid = user.uid;
      return res.ok();
    }
  });
};

//
// ### @POST /auth/password
// Changes the password of the user matching the verification
// code
//
exports.post_password = function(req, res, next) {
  var code = req.param('code');
  var password = req.param('password');

  if(typeof password !== 'string' ||
     password === '') {
    return res.error(new Error('Wrong password'));
  }

  var c_users = factory.data().collection('dts_users');
  c_users.findOne({
    key: code
  }, function(err, user) {
    if(err) {
      return res.error(err);
    }
    else if(!user) {
      return res.error(new Error('Wrong verification code'));
    }
    else {
      c_users.update({
        slt: factory.slt(user.uid),
        uid: user.uid
      }, {
        $unset: {
          key: 1
        },
        $set: {
          pwd: factory.hash([ password ])
        }
      }, function(err) {
        if(err) {
          return res.error(err);
        }
        else {
          req.session.uid = user.uid;
          res.ok();
        }
      });
    }
  });
};

//
// ### @GET /auth/signout
// Removes all sessions
//
exports.get_signout = function(req, res, next) {
  req.session.destroy();
  res.redirect('/#/auth/signin');
};

//
// ### @POST /auth/reset
// Send an email with a verification code used to
// reset the password
//
exports.post_reset = function(req, res, next) {
  var email = req.param('email');
  var email_r = /^[a-zA-Z0-9\._\-\+]+@[a-z0-9\._\-]{2,}\.[a-z]{2,4}$/;

  if(!email_r.test(email)) {
    return res.error(new Error('Wrong email'));
  }

  var c_users = factory.data().collection('dts_users');
  c_users.findOne({
    eml: email
  }, function(err, user) {
    if(err) {
      return res.error(err);
    }
    else if(!user) {
      res.ok();
    }
    else {
      var key = factory.hash([ user.uid, Date.now().toString() ]);

      fwk.async.parallel({
        email: function(cb_) {
          var url = 'http://' + factory.config()['DATTSS_DOMAIN'] +
            '/#/auth/password?code=' + key;

          var html = '';
          html += '<div>';
          html += 'Hi!<br/><br/>';
          html += 'Please follow this <a href="' + url + '">link</a> to ';
          html += 'reset your password.<br/><br/>';
          html += 'You can also manually enter the following code: <strong>';
          html += key + '</strong><br/><br/>';
          html += 'If you haven\'t requested a password reset, you can ignore ';
          html += 'this email. You current password is still valid and safe.';
          html += '<br/><br/>';
          html += 'For any problem or suggestion, please feel free to contact ';
          html += 'us at <a href="mailto:team@dattss.com">team@dattss.com</a> ';
          html += 'or join us at #dattss on irc.freenode.net<br/><br/>';
          html += 'Best,<br/><br/>DaTtSs';
          html += '</div>';

          factory.email().send({
            to: email,
            from: factory.config()['DATTSS_SENDGRID_FROM'],
            fromname: factory.config()['DATTSS_SENDGRID_FROMNAME'],
            subject: 'Reset your password!',
            html: html
          }, function(success, message) {
            if(!success) {
              return cb_(new Error(message));
            }
            else {
              return cb_();
            }
          });
        },
        user: function(cb_) {
          c_users.update({
            uid: user.uid,
            slt: factory.slt(user.uid)
          }, {
            $set: {
              key: key
            }
          }, function(err) {
            if(err) {
              return cb_(err);
            }
            else {
              return cb_();
            }
          });
        }
      }, function(err) {
        if(err) {
          return res.error(err);
        }
        else {
          return res.ok();
        }
      });
    }
  });
};
