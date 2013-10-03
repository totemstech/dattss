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
  function($scope, $location, _auth) {
    $scope.user = _auth.user(true).then(function(data) {
      return data;
    });
    $scope.is_demo = /\/demo\/#\//.test($location.absUrl());

    /* The menu is defined like that and not simply in the view   */
    /* with ng-hide/ng-show to handle different cases, because    */
    /* of CSS properties on last child, since there is no way to  */
    /* select the last `visible` child                            */
    if(!$scope.is_demo) {
      $scope.menu = [ /*{
        click: $scope.settings,
        icon: 'L',
        text: 'Settings'
      }, */ {
        click: function() {
          window.location.href = '/s/auth/signout';
        },
        icon: 'O',
        text: 'Sign Out'
      } ];
    }
    else {
      $scope.menu = [ {
        click: function() {
          window.location.href = '/#/auth/signup';
        },
        icon: 'u',
        text: 'Sign Up'
      } ];
    }

    $scope.show_alerts = function() {
      $scope.$emit('show_alerts');
    }
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
