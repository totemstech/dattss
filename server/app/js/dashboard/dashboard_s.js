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
        return _req.get('/s/status');
      },
      get_processes: function() {
        return _req.get('/s/processes');
      },
      get_stats: function(path, type, step) {
        return _req.get('/s/stats/' + path + '/' + type + '/' +
                        new Date().getTimezoneOffset() + '/' +
                        step);
      },
      get_favorite: function() {
        return _req.get('/s/favorite');
      },
      add_favorite: function(favorite) {
        return _req.put('/s/favorite/' + favorite);
      },
      del_favorite: function(favorite) {
        return _req.del('/s/favorite/' + favorite);
      }
    };

    return _dashboard;
  });
