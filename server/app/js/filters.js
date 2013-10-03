/*
 * DaTtSs: filters.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-26  n1t0    Creation
 */
'use strict';

//
// ### iconStatus
// Return the pictos characther according to the status type
// ```
// @type {string} the status type
// ```
//
angular.module('dattss.filters').
  filter('iconStatus', function() {
    return function(type) {
      switch(type) {
        case 'c': {
          return 'c';
          break;
        }
        case 'g': {
          return 'g';
          break;
        }
        case 'ms': {
          return 'm';
          break;
        }
      }
    };
  });

//
// ### bignumber
// Return a pretty string computed from the number
// ```
// @number {number} big number to format
// ```
//
angular.module('dattss.filters').
  filter('bignumber', function() {
  return function(number) {
    if(typeof number !== 'number' && number >= 1000) {
      number = parseInt(number, 10);
    }
    var sign = (number < 0) ? -1 : 1;
    number = sign * number;

    if(number > 1000 * 1000) {
      return (sign * (number / (1000 * 1000))).toFixed(1) + 'm';
    }
    if(number > 100 * 1000) {
      return (sign * (number / (1000))).toFixed(1) + 'k';
    }
    if(number >= 1000) {
      number = Math.floor(number);
      var n = number.toString();
      var m = Math.floor(number / 1000).toString();
      var u = Math.floor(number - m * 1000).toString();
      var z = '';
      while(n.length > m.length + u.length + z.length)
        z += '0';
      return (((sign > 0) ? '' : '-') +
              m + ',' + z + u);
    }
    return (((sign > 0) ? '' : '-') +
            (number.toString()));
  };
});

//
// ### pathify
// Return a beautifull path string
// ```
// @path {string} the path to pathify
// ```
//
angular.module('dattss.filters').
  filter('pathify', function() {
    return function(path) {
      if(typeof path !== 'string')
        path = '';

      return path.replace(/\./g, ' > ');
    };
  });

//
// ### truncate
// Truncate the given string if too long
// ```
// @string {string} the string to truncate
// @length {number} the length to truncate at
// ```
//
angular.module('dattss.filters').
  filter('truncate', function() {
    return function(string, length) {
      if(typeof string !== 'string')
        string = '';
      length = length || 50;

      if(string.length > length) {
        return string.substring(0, length) + '...';
      }
      return string;
    };
  });

//
// ### keyName
// Return the key name
// ```
// @key {string} the key to name
// ```
//
angular.module('dattss.filters').
  filter('keyName', function() {
    return function(key) {
      switch(key) {
      case 'sum': return 'Total';
      case 'avg': return 'Average';
      case 'lst': return 'Last value';
      case 'max': return 'Maximum';
      case 'min': return 'Minimum';
      };
    };
  });

//
// ### operatorName
// Return the operator name
// ```
// @operator {string} the operator to name
// ```
//
angular.module('dattss.filters').
  filter('operatorName', function() {
    return function(operator) {
      switch(operator) {
      case '<': return 'is smaller than';
      case '>': return 'is greater than';
      case '=': return 'equals to';
      };
    };
  });
