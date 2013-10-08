'use strict';

//
// ### AlertCreatorController
// Alert creator directive's controller
//
angular.module('dattss.directives').controller('AlertCreatorController',
  function($scope, _alert) {
    $scope.selected_key = '';
    $scope.selected_operator = '>';
    $scope.selected_value = 0;
    $scope.last_type = '';

    /**************************************************************************/
    /*                             POSSIBLE VALUES                            */
    /**************************************************************************/
    /* List of keys */
    $scope.keys = [ /* {
      label: 'Total',
      value: 'sum',
      available_for: 'c'
    },*/ {
      label: 'Average',
      value: 'avg',
      available_for: 'c-g-ms'
    }, {
      label: 'Last value',
      value: 'lst',
      available_for: 'g'
    }, {
      label: 'Maximum',
      value: 'max',
      available_for: 'ms'
    }, {
      label: 'Minimum',
      value: 'min',
      available_for: 'ms'
    } ];

    /* List of operators */
    $scope.operators = [ {
      label: 'is greater than',
      value: '>'
    }, {
      label: 'is smaller than',
      value: '<'
    }, {
      label: 'equals to',
      value: '='
    } ];

    /**************************************************************************/
    /*                                  HELPERS                               */
    /**************************************************************************/
    /* Return keys according to the given type */
    $scope.get_keys = function(type) {
      var keys = [];

      $scope.keys.forEach(function(key) {
        if(key.available_for.indexOf(type) !== -1)
          keys.push(key);
      });

      if(keys.length > 0 && $scope.last_type !== type) {
        $scope.selected_key = keys[0].value;
        $scope.last_type = type;
      }

      return keys;
    };

    $scope.is_valid = function() {
      return (typeof $scope.selected_key === 'string' &&
              $scope.selected_key.trim() !== '' &&
              typeof $scope.selected_operator === 'string' &&
              $scope.selected_operator.trim() !== '' &&
              typeof $scope.selected_value === 'number');
    };

    $scope.create_alert = function() {
      if($scope.status && $scope.is_valid()) {
        _alert.create($scope.status.typ,
                      $scope.status.pth,
                      $scope.selected_key,
                      $scope.selected_operator,
                      $scope.selected_value).then(function(data) {
                        $scope.status = null;
                      });
      }
    };

    /**************************************************************************/
    /*                                  UPDATE                                */
    /**************************************************************************/
    /* Show modal when status is changed */
    $scope.$watch('status', function(status) {
      if(status)
        $scope.show_modal = true;
      else
        $scope.show_modal = false;
    }, true);

    /* Just to make sure everything get disabled when modal is being hide */
    $scope.$watch('show_modal', function(val) {
      if(!val)
        $scope.status = null;
    });
  });

//
// ### `alert-creator` directive
// Allow to create a new alert for a given status
// ```
// @status {=object} the status linked to the alert
// ```
//
angular.module('dattss.directives').directive('alertCreator', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      status: '='
    },
    templateUrl: '/partials/dashboard/alert_creator_d.html',
    controller: 'AlertCreatorController'
  };
});
