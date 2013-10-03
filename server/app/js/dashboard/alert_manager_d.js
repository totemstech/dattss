'use strict';

//
// ### AlertManagerController
// Alert manager directive's controller
//
angular.module('dattss.directives').controller('AlertManagerController',
  function($scope, _alert) {
    $scope.update = function() {
      _alert.retrieve().then(function(data) {
        $scope.alerts = data;
      });
    };

    $scope.remove = function(id) {
      _alert.remove(id).then(function() {
        $scope.update();
      });
    };

    $scope.$watch('show_manager', function(show) {
      if(show)
        $scope.update();
    });

    $scope.update();
  });

//
// ### `alert-manager` directive
// Allow to see and manage all alerts
// ```
// @show {=object} whether to show the alert manager or not
// ```
//
angular.module('dattss.directives').directive('alertManager', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      show_manager: '=show'
    },
    templateUrl: '/partials/dashboard/alert_manager_d.html',
    controller: 'AlertManagerController'
  };
});
