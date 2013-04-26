/*
 * DaTtSs: top_bar_d.js
 *
 * (c) Copyright Teleportd Labs 2013
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-25  n1t0    Creation
 */
'use strict';

//
// ### TopbarController
// Top bar controller used by `topbar` directive
//
angular.module('dattss.directives').controller('TopbarController',
  function($scope) {

  });

//
// ### `topbar` directive
// The topbar directive
//
angular.module('dattss.directives').directive('topbar', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: '/partials/dashboard/top_bar_d.html',
    controller: 'TopbarController'
  }
});
