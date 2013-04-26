/*
 * DaTtSs: dashboard_s.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-24  n1t0    Creation
 */

'use strict';

angular.module('dattss.services').
  factory('_dashboard', function(_req) {
    var _dashboard = {
      get_status: function() {
        return _req.get('/status');
      },
      get_stats: function(path) {
        return _req.get('/stat/' + path + '/' + new Date().getTimezoneOffset());
      }
    };

    return _dashboard;
  });
