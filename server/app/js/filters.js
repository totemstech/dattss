/*
 * DaTtSs: filters.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-26  n1t0    Creation
 */
'use strict';

//
// ### iconStatus
// Return the pictos characther according to the status type
// ```
// @type {string} the status type
// ```
//
angular.module('dattss.filters').
  filter('iconStatus', function() {
    return function(type) {
      switch(type) {
        case 'c': {
          return 'c';
          break;
        }
        case 'g': {
          return 'g';
          break;
        }
        case 'ms': {
          return 'm';
          break;
        }
      }
    };
  });
