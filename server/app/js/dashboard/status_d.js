/*
 * DaTtSs: status_d.js
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
// ### StatusController
// Status controller used by `status` directive
//
angular.module('dattss.directives').controller('StatusController',
  function($scope) {
    $scope.show = [];

    /**************************************************************************/
    /*                                 HELPERS                                */
    /**************************************************************************/
    $scope.box_style = function(obj) {
      return {
        'margin-left': ((obj.depth) * -20) + 'px',
        'z-index': 1000 - (obj.depth * 10)
      };
    };

    $scope.align_left = function(obj) {
      return {
        'left': (obj.depth * -20) + 'px',
      }
    }

    $scope.z_index = function(obj) {
      return {
        'z-index': 1000 - (obj.depth * 10)
      }
    }

    /**************************************************************************/
    /*                               DATA UPDATE                              */
    /**************************************************************************/
    /* Recursively update the data and return the updated array               */
    $scope.update = function(current, update) {
      var future = [];
      update.forEach(function(value_upd) {
        var value_cur = {};
        /* Find current value matching the update one */
        current.forEach(function(c) {
          if(c.label === value_upd.label) {
            value_cur = c;
          }
        });
        /* Update value with new status and keep model properties */
        var f = {
          status: value_upd.status,
          depth: value_upd.depth,
          label: value_upd.label,
          open: value_cur.open ? true : false,
          viewed: value_cur.viewed,
          child: $scope.update(value_cur.child, value_upd.child)
        };
        future.push(f);
      });
      return future;
    };

    $scope.$watch('data', function(data) {
      if(Array.isArray(data) && data.length > 0) {
        if(!$scope.status) {
          $scope.status = data;
        }
        else {
          /* Recursively update the data */
          $scope.status = $scope.update($scope.status, data);
        }
      }
    }, true);

    $scope.toggle = function(status) {
      if(status) {
        var deleted = false;
        $scope.show.forEach(function(s, idx) {
          if(status.pth === s.pth &&
             status.typ === s.typ) {
            $scope.show.splice(idx, 1);
            deleted = true;
          }
        });
        if(!deleted) {
          $scope.show.push(status);
        }
        $scope.$emit('show', status, !deleted);
      }
    };

    $scope.is_shown = function(status) {
      var shown = false;
      $scope.show.forEach(function(s) {
        if(s.typ === status.typ &&
           s.pth === status.pth) {
          shown = true;
        }
      });
      return shown;
    };
  });

//
// ### `status` directive
// The status directive build the tree menu containing all current status
// ```
// @data {=object} the current status to build
// @show {=array} an array containing all status to show
// ```
//
angular.module('dattss.directives').directive('status', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '=',
      show: '='
    },
    templateUrl: '/partials/dashboard/status_d.html',
    controller: 'StatusController'
  }
});
