'use strict';

angular.module('dattss', ['dattss.services', 'dattss.directives', 'dattss.filters']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/dashboard',
           { templateUrl: 'partials/dashboard/dashboard.html',
             controller: DashboardCtrl }).
      when('/auth/:type',
           { templateUrl: 'partials/auth/auth.html',
             controller: AuthCtrl }).

    otherwise({ redirectTo: '/dashboard' });
  }]);

angular.module('dattss.directives', []);
angular.module('dattss.filters', []);
angular.module('dattss.services', []);

angular.module('dattss.services').
  factory('_bind', function() {
    return function(host, attr, promise) {
      promise.then(function(data) {
        host[attr] = data;
      });
    };
  });

angular.module('dattss.services').
  factory('_req', function($http, $q, $rootScope) {
    function go(httpPromise) {
      var d = $q.defer();
      httpPromise
        .success(function(data, status, headers, config) {
          return d.resolve(data);
        })
        .error(function(data, status, headers, config) {
          if(data.error) {
            $rootScope.$broadcast('error', data.error);
          }
          return d.reject(data);
        });
      return d.promise;
    };

    return {
      get: function(url, config) {
        return go($http.get(url, config));
      },
      post: function(url, data, config) {
        return go($http.post(url, data, config));
      },
      put: function(url, data, config) {
        return go($http.put(url, data, config));
      },
      del: function(url, config) {
        return go($http.delete(url, config));
      }
    };
  });
