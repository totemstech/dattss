/*
 * DaTtSs: favorites_d.js
 *
 * (c) Copyright Teleportd Labs 2013
 *
 * @author: n1t0
 *
 * @log:
 * 2013-06-19  n1t0    Creation
 */
'use strict';

//
// ### FavoritesController
// Favorites controller used by `favorites` directive
//
angular.module('dattss.directives').controller('FavoritesController',
  function($scope, $filter) {
    $scope.type = function(fav) {
      if(typeof fav === 'string' && fav.indexOf('-') < 3 &&
         fav.indexOf('-') !== -1) {
        return fav.split('-')[0];
      }
      return '';
    };

    $scope.path = function(fav) {
      if(typeof fav === 'string' && fav.indexOf('-') < 3 &&
         fav.indexOf('-') !== -1) {
        return fav.split('-')[1];
      }
      return '';
    };

    $scope.value = function(fav, tooltip) {
      var type = $scope.type(fav);
      var path = $scope.path(fav);
      var filter = tooltip ? 'number' : 'bignumber';

      if($scope.data && Array.isArray($scope.data[type])) {
        for(var i = 0; i < $scope.data[type].length; i++) {
          var status = $scope.data[type][i];
          if(status.typ === type &&
             status.pth === path) {
            if(type === 'c') {
              return $filter(filter)(status.sum);
            }
            if(type === 'g') {
              return $filter(filter)(status.lst);
            }
            if(type === 'ms') {
              return $filter(filter)(status.avg);
            }
          }
        };
      }
      return 'N/A';
    };

    $scope.average = function(fav, tooltip) {
      var type = $scope.type(fav);
      var path = $scope.path(fav);
      var filter = tooltip ? 'number' : 'bignumber';

      if($scope.data && Array.isArray($scope.data[type])) {
        for(var i = 0; i < $scope.data[type].length; i++) {
          var status = $scope.data[type][i];
          if(status.typ === type &&
             status.pth === path) {
            if(type === 'ms') {
              return '[ ' + $filter(filter)(status.min) +
                ' / ' + $filter(filter)(status.max) + ' ]';
            }
            else {
              return '[ ' + $filter(filter)(status.avg) + ' ]';
            }
          }
        };
      }
      return 'N/A';
    };
  });

//
// ### `favorites` directive
// The favorites directive shows favorites status
// ```
// @data {=object} the current statuses
// @favorites {=array} an array of favorite paths
// ```
//
angular.module('dattss.directives').directive('favorites', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '=',
      show: '=',
      favorites: '='
    },
    templateUrl: '/partials/dashboard/favorites_d.html',
    controller: 'FavoritesController'
  }
});
