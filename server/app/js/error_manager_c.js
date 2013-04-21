'use strict';

function ErrorManager($scope, $timeout) {
  $scope.$on('error', function(scope, err) {
    if(err && err.message) {
      $scope.errors.push({
        reason: err.message,
        created: Date.now(),
        show: false
      });
    }

    /* Show */
    $timeout(function() {
      $scope.process();
    }, 100);
    /* Hide */
    $timeout(function() {
      $scope.process();
    }, 5100);
  });

  $scope.process = function() {
    var to_hide = [];

    $scope.errors.forEach(function(err, index) {
      if(err.created + 5000 < Date.now()) {
        err.show = false;
        to_hide.push(index);
      }
      else {
        err.show = true;
      }
    });

    if(to_hide.length > 0) {
      $timeout(function() {
        to_hide.forEach(function(index, n) {
          $scope.errors.splice(index + n, 1);
        });
      }, 500);
    }
  }

  $scope.errors = [];
};
