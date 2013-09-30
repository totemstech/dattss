/*
 * DaTtSs: alert_s.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-09-12 n1t0    Creation
 */

'use strict';

angular.module('dattss.services').factory('_alert', function(_req) {
  var _alert = {
    retrieve: function() {
      return _req.get('/s/alert');
    },
    create: function(type, path, key, operator, value) {
      return _req.put('/s/alert/' + type + '/' + path, {
        key: key,
        operator: operator,
        value: value
      });
    },
    remove: function(alert_id) {
      return _req.del('/s/alert/' + alert_id);
    }
  };

  return _alert;
});
