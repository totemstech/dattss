angular.module('dattss.directives')
  .directive('modal', ['$timeout', function($timeout) {
    return {
      restrict: 'EA',
      require: 'ngModel',
      link: function(scope, elm, attrs, model) {
        var last_value = false;

        elm.addClass('modal hide');
        elm.on('shown', function() {
          elm.find("[autofocus]").focus();
        });
        scope.$watch(attrs.ngModel, function(value) {
          last_value = value;
          var data = elm.data('modal');

          if(value && data && data.$backdrop) {
            data.options.backdrop = value;
            data.removeBackdrop();
            data.backdrop(function(){});
            elm.data('modal', data);
          }

          if(value === 'static') {
            data.options.backdrop = 'static';
            elm.data('modal', data);
            elm.modal('show');
          }
          else {
            elm.modal(value && 'show' || 'hide');
          }
        });

        elm.on(jQuery.support.transition && 'shown' || 'show', function() {
          $timeout(function() {
            model.$setViewValue(last_value);
          });
        });
        elm.on(jQuery.support.transition && 'hidden' || 'hide', function() {
          $timeout(function() {
            model.$setViewValue(false);
          });
        });
      }
    };
  }]);
