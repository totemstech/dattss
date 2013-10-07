/*
 * DaTtSs: processes_d.js
 *
 * (c) Copyright Teleportd Ltd 2013
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-25 n1t0    Creation
 */
'use strict';

//
// ### ProcessesController
// Processes controller used by 'processes' directive
//
angular.module('dattss.directives').controller('ProcessesController',
  function($scope, $rootScope, $location, _dashboard) {
    $scope.is_demo = /\/demo\/#\//.test($location.absUrl());

    $scope.$watch('data', function(data) {
      if(data && Array.isArray(data) && data.length > 0) {
        $scope.no_data = false;
      }
      else {
        $scope.no_data = true;
      }
    });

    $scope.kill = function(name) {
      if($scope.is_demo)
        return;

      var input = window.prompt('Type the process name in order to kill it:');
      if(typeof input === 'string') {
        if(input === name) {
          _dashboard.kill_process(name);
        }
        else {
          $rootScope.$broadcast('error', new Error('Bad name, won\'t kill...'));
        }
      }
    }
  });

//
// ### 'processes' directive
// The processes directive shows all currently running processes with their
// status: `up` or `down` and the ability to kill them
// ```
// @data {=object} the current processes
// ```
//
angular.module('dattss.directives').directive('processes', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '='
    },
    templateUrl: '/partials/dashboard/processes_d.html',
    controller: 'ProcessesController'
  };
});
