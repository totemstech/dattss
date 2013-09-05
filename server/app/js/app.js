'use strict';

angular.module('dattss', ['dattss.services', 'dattss.directives', 'dattss.filters']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/home',
           { templateUrl: 'partials/landing.html',
             controller: LandingCtrl }).
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
          if(data.error && data.error.name !== 'AuthenticationError') {
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

angular.module('dattss.directives').
  directive('gist', function() {
    return function(scope, elm, attrs) {
      var gistId = attrs.gist;

      var iframe = document.createElement('iframe');
      iframe.setAttribute('width', '100%');
      iframe.setAttribute('frameborder', '0');
      iframe.id = "gist-" + gistId;
      elm[0].appendChild(iframe);

      var iframeHtml = '<html><head><base target="_parent"><style>table{font-size:12px;}</style></head><body onload="parent.document.getElementById(\'' + iframe.id + '\').style.height=document.body.scrollHeight + \'px\'"><scr' + 'ipt type="text/javascript" src="https://gist.github.com/' + gistId + '.js"></sc'+'ript></body></html>';

      var doc = iframe.document;
      if (iframe.contentDocument) doc = iframe.contentDocument;
      else if (iframe.contentWindow) doc = iframe.contentWindow.document;

      doc.open();
      doc.writeln(iframeHtml);
      doc.close();
    };
  });
