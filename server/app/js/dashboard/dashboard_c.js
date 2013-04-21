'use strict';

function DashboardCtrl($scope, $location, _auth) {
  $scope.landing = true;

  $scope.user = _auth.user(true).then(function(data) {
    if(!data.logged_in) {
      $location.path('/auth/signin');
    }
    else {
      $scope.landing = false;
      return data;
    }
  });
};
