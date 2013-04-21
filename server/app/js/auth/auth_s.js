'use strict';

angular.module('dattss.services').
  factory('_auth', function(_req, _bind) {
    var _auth = {
      user: function(force) {
        return _req.get('/auth/user', {
          cache: force ? false : true
        });
      },
      signin: function(email, password) {
        return _req.post('/auth/signin', {
          email: email,
          password: password
        });
      },
      signup: function(email) {
        return _req.post('/auth/signup', {
          email: email
        });
      },
      set_password: function(code, password) {
        return _req.post('/auth/password', {
          code: code,
          password: password
        });
      },
      reset_password: function(email) {
        return _req.post('/auth/reset', {
          email: email
        });
      }
    };

    return _auth;
  });
