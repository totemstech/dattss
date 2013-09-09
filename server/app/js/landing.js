'use strict';

function LandingCtrl($scope, $location) {
  $scope.demo = function() {
    window.location.href = '/demo/#/dashboard';
  };

  $scope.signin = function() {
    $location.path('/auth/signin');
  };
};
