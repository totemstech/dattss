'use strict';

function LandingCtrl($scope, $location) {
  $scope.demo = function() {

  };

  $scope.signin = function() {
    $location.path('/auth/signin');
  };
};
