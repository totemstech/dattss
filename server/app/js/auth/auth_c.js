'use strict';

function AuthCtrl($scope, $routeParams, $location, _auth) {
  $scope.type = $routeParams.type;
  $scope.processing = false;

  /* Verify if the user is already logged in */
  _auth.user(true).then(function(data) {
    if(data.logged_in &&
       ($scope.type === 'signup' ||
        $scope.type === 'signin')) {
      $location.path('/dashboard');
    }
    if(data.logged_in &&
       $scope.type === 'reset') {
      $scope.email = data.email;
    }
  });

  /* Get verification code if passed as parameters */
  $scope.$watch(function() { return $location.search() }, function(search) {
    if(typeof search.code === 'string' &&
       search.code !== '') {
      $scope.verification_code = search.code;
    }
  });

  /****************************************************************************/
  /*                              HELPER METHODS                              */
  /****************************************************************************/
  $scope.go = function(where) {
    $location.path('/auth/' + where);
  }

  $scope.signin = function() {
    $scope.processing = true;
    _auth.signin($scope.email, $scope.password).
      then(function(data) {
        $location.path('/dashboard');
      }, function(reason) {
        $scope.processing = false;
      });
  };

  $scope.signup = function() {
    $scope.processing = true;
    _auth.signup($scope.email).
      then(function(data) {
        $scope.processing = false;
        $scope.signup_ok = true;
      }, function(reason) {
        $scope.processing = false;
      });
  };

  $scope.set_password = function() {
    $scope.processing = true;
    _auth.set_password($scope.verification_code, $scope.password).
      then(function(data) {
        $location.path('/dashboard');
      }, function(reason) {
        $scope.processing = false;
      });
  };

  $scope.reset_password = function() {
    $scope.processing = true;
    _auth.reset_password($scope.email).
      then(function(data) {
        $scope.processing = false;
        $scope.reset_ok = true;
      }, function(reason) {
        $scope.processing = false;
      });
  }
};
