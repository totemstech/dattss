/*
 * DaTtSs: socket_s.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-24  n1t0    Creation
 */

'use strict';

angular.module('dattss.services').
  factory('_socket', function($rootScope) {
    var socket = io.connect();
    return {
      on: function (name, cb_) {
        socket.on(name, function () {
          var args = arguments;
          $rootScope.$apply(function() {
            return cb_.apply(socket, args);
          });
        });
      },
      emit: function (name, data, cb_) {
        socket.emit(name, data, function () {
          if(typeof cb_ === 'function') {
            var args = arguments;
            $rootScope.$apply(function() {
              return cb_.apply(socket, args);
            });
          }
        });
      }
    };
  });
