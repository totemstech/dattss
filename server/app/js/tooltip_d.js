/*
 * DaTtSs: tooltip_d.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-06-12 n1t0    File creation
 */

'use strict';

angular.module('dattss.directives').directive('tooltip',
  function($parse) {
    return {
      restrict: 'A',
      scope: true,
      link: function($scope, $element, $attrs) {
        /* Initialize message to immediately display it */
        var message = $parse($attrs.tooltip)($scope) || $attrs.tooltip;

        /* Watch changes to update message */
        $scope.$watch($attrs.tooltip, function(newMessage, oldMessage) {
          if(newMessage !== oldMessage) {
            message = newMessage;
          }
        });

        /* Hide other tooltips when this one shows up */
        $element.on('show', function(event) {
          jQuery('.tooltip.in').each(function() {
            var t = $(this);
            var tooltip = t.data('tooltip');
            if(tooltip && !tooltip.$element.is($element)) {
              t.tooltip('hide');
            }
          });
        });

        /* Initialize tooltip */
        $element.tooltip({
          title: function() {
            return (typeof message === 'function') ?
              message.apply(null, arguments) : message;
          },
          html: true
        });
      }
    };
  });
