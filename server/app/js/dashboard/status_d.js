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
    $scope.hide = [];

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
        /* Find current value matching the updated one */
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
          console.log($scope.status);
          $scope.status = $scope.update($scope.status || [], data);
        }
      }
    }, true);

    /**************************************************************************/
    /*                               VIEW HELPERS                             */
    /**************************************************************************/
    $scope.toggle_view = function(status) {
      if(status) {
        var deleted = false;
        $scope.show.forEach(function(s, idx) {
          if(status.pth === s.pth &&
             status.typ === s.typ) {
            $scope.show.splice(idx, 1);
            $scope.hide.push(status.typ + '-' + status.pth);
            deleted = true;
          }
        });
        if(!deleted) {
          $scope.show.push(status);
          var idx = $scope.hide.indexOf(status.typ + '-' + status.pth);
          if(idx !== -1) {
            $scope.hide.splice(idx, 1);
          }
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

    /**************************************************************************/
    /*                            FAVORITES HELPERS                           */
    /**************************************************************************/
    $scope.toggle_favorite = function(status) {
      if(status) {
        var idx = $scope.favorites.indexOf(status.typ + '-' + status.pth);
        var deleted = false;
        if(idx !== -1) {
          $scope.favorites.splice(idx, 1);
          deleted = true;
        }
        else {
          $scope.favorites.push(status.typ + '-' + status.pth);
        }
        $scope.$emit('favorite', status, !deleted);
      }
    };

    $scope.is_favorite = function(status) {
      if(status && $scope.favorites) {
        var is_fav = ($scope.favorites.indexOf(status.typ + '-' + status.pth) !== -1);
        /* Automatically show the associated graph if user doesn't want to    */
        /* hide it                                                            */
        if(!$scope.is_shown(status) && is_fav &&
           $scope.hide.indexOf(status.typ + '-' + status.pth) === -1) {
          $scope.toggle_view(status);
        }
        return is_fav;
      }
      return false;
    }
  });

//
// ### `status` directive
// The status directive build the tree menu containing all current status
// ```
// @data {=object} the current status to build
// @show {=array} an array containing all status to show
// @favorites {=array} an array of favorite paths
// ```
//
angular.module('dattss.directives').directive('status', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '=',
      show: '=',
      favorites: '='
    },
    templateUrl: '/partials/dashboard/status_d.html',
    controller: 'StatusController'
  }
});
