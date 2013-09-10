'use strict';

//
// ### g_complete
// ```
// @data {object} Object containing past & current value to complete
// @length {number} the length to complete to
// @step {number} the step to use
// ```
//
angular.module('dattss.filters').
  filter('g_complete', function() {
    return function(data, length, step) {
      var max_points = 24 * 60;
      if(!data || !Array.isArray(data.current) ||
         !Array.isArray(data.past)) return data;
      if(typeof length !== 'number')
        length = max_points;
      if(typeof step !== 'number')
        step = 1;

      var points = {
        current: [],
        past: []
      };

      ['current', 'past'].forEach(function(type) {
        var pts = {};
        var aggs = {};

        data[type].forEach(function(point) {
          var date_r = /[0-9]{4}-[0-9]{2}-[0-9]{2}-(.*)/;
          var date = (date_r.exec(point.dte) || [, point.dte])[1];
          pts[date] = point;
        });
        for(var i = 0; i <= (type === 'current' ? length : max_points); i++) {
          var pad = function(n) {
            if(n < 10)
              return '0' + n;
            return n;
          };

          var dte = pad(Math.floor(i / 60)) + '-' + pad(i % 60 - i % step);
          var pt = pts[dte] || {
            sum: 0,
            cnt: 0,
            dte: dte,
            fst: 0,
            lst: 0,
            bot: 0,
            top: 0,
            max: 0,
            min: 0
          };
          pt.x = i;
          aggs[dte] = pt;
        }

        for(var date in aggs) {
          if(aggs.hasOwnProperty(date)) {
            points[type].push(aggs[date]);
          }
        }
        points[type].sort(function(a, b) {
          if(a.dte > b.dte) return 1;
          if(a.dte < b.dte) return -1;
          return 0;
        });
      });

      return points;
    };
  });

//
// ### g_value
// ```
// @data {object} the object from which to return the value
// @type {string} the type of graph we want to draw
// @max {boolean} whether to return the max value
// ```
//
angular.module('dattss.filters').
  filter('g_value', function() {
    return function(data, type, max) {
      if(typeof data !== 'object' ||
         typeof type !== 'string') return 0;

      if(type === 'ms' && max) {
        return data.max;
      }

      if(type === 'c') {
        return data.sum;
      }
      else if(type === 'g' || type === 'ms') {
        if(data.cnt) {
          return data.sum / data.cnt;
        }
        else {
          return 0;
        }
      }

      return 0;
    };
  });

//
// ### g_xtodate
// ```
// @x {number} the x value
// ```
//
angular.module('dattss.filters').
  filter('g_xtodate', function() {
    return function(x) {
      if(typeof x !== 'number') return '';
      var pad = function(n) {
        if(n < 10)
          return '0' + n;
        return n;
      };
      return pad(Math.floor(x / 60)) + 'h' + pad(x % 60);
    };
  });
