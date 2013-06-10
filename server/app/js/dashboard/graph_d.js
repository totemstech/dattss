/*
 * DaTtSs: graph_d.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-05-09 n1t0    Creation
 */
'use strict'

//
// ### GraphController
// `graph` directive controller.
//
angular.module('dattss.directives').controller('GraphController',
  function($scope, $element, $window, $filter, $rootScope) {
    /**************************************************************************/
    /*                                 SETUP                                  */
    /**************************************************************************/
    /* Constants */
    var margin = {
      top: 25,
      right: 2,
      bottom: 20,
      left: 2
    };

    var width = 760 - margin.left - margin.right;
    var height = 150 - margin.top - margin.bottom;

    /* Loading */
    $scope.show_loading = true;

    /* Ranges */
    var x = d3.scale.linear()
              .range([0, width]);
    var y = d3.scale.linear()
              .range([height, 0]);

    /* Set up initial svg object */
    var svg = d3.select(jQuery($element).find('.plot')[0])
                .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                    .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");

    /* Datas */
    var points = {
      current: [],
      past: []
    };

    /**************************************************************************/
    /*                               DATA WATCH                               */
    /**************************************************************************/
    $scope.$watch('data', function(data) {
      /* Clear the elements inside of the directive */
      svg.selectAll('*').remove();
      jQuery($element).find('.inner').unbind('.cursor');

      /* Check & prepare Data*/
      if(!data || !Array.isArray(data.current) ||
         !Array.isArray(data.past)) return;

      var now = new Date();
      var length = now.getHours() * 60 + now.getMinutes();
      points = $filter('g_complete')(data, length);

      /* Domains */
      x.domain([0, 1440]);
      y.domain([0, d3.max(points.current, function(d, i) {
        return Math.max($filter('g_value')(points.current[i], $scope.type),
                        $filter('g_value')(points.past[i], $scope.type));
      })]);

      drawAxis();
      drawPlot();
      setupBubbleCursor();

      $scope.show_loading = false;
    });

    /**************************************************************************/
    /*                                 AXIS                                   */
    /**************************************************************************/
    var drawAxis = function() {
      /* X Axis */
      var X_TICKS = 5;

      var d = x.domain();
      var x_masters = [];
      var x_normals = [];
      for(var i = 0; i <= X_TICKS; i++) {
        var t = Math.floor(d[1] / X_TICKS * i);
        x_masters.push({
          current: points.current[t],
          past: points.past[t]
        });
      }
      for(var i = 0; i < d[1]; i++) {
        if(x_masters.indexOf(i) === -1) {
          x_normals.push({
            current: points.current[i],
            past: points.past[i]
          });
        }
      }

      svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0, -" + height + ")")
         .selectAll(".tick")
         .data(x_masters)
         .enter().append("svg:line")
           .attr("class", "line")
           .attr("x1", function(d) { return x(d.past.x); })
           .attr("x2", function(d) { return x(d.past.x); })
           .attr("y1", 0)
           .attr("y2", 2 * height);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + y.range()[0] + ")")
        .append("svg:line")
          .attr("x1", x.range()[0])
          .attr("y1", 0)
          .attr("x2", x.range()[1])
          .attr("y2", 0);

      /* X Axis Values */
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + y.range()[0] + ")")
        .selectAll(".tick")
        .data(x_masters)
        .enter().append("svg:line")
          .attr("class", "master tick")
          .attr("x1", function(d) { return x(d.past.x); })
          .attr("x2", function(d) { return x(d.past.x); })
          .attr("y1", 0)
          .attr("y2", 18);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + y.range()[0] + ")")
        .selectAll(".value")
        .data(x_masters)
        .enter().append("svg:text")
          .attr("class", "value")
          .attr("x", function(d) { return x(d.past.x) + 5; })
          .attr("y", 15)
          .text(function(d) {
            var h = Math.floor(24 / x.domain()[1] * d.past.x);
            return h + 'h';
          });

      /* Y Axis */
      var g_yaxis = svg.append("g")
        .attr("class", "y axis");

      var Y_TICKS = 3;
      var y_ticks = [];
      for(var i = 1; i <= Y_TICKS; i ++) {
        y_ticks.push(y.range()[1] + Math.floor(y.domain()[1] / Y_TICKS) * i);
      }

      g_yaxis.selectAll(".tick")
        .data(y_ticks)
        .enter().append("svg:line")
          .attr("class", "line")
          .attr("x1", -2)
          .attr("x2", width)
          .attr("y1", function(d) { return y(d) })
          .attr("y2", function(d) { return y(d) });

      /* Y Axis Values */
      g_yaxis.selectAll(".tick")
        .data(y_ticks)
        .enter().append("svg:line")
          .attr("class", "tick")
          .attr("x1", -2)
          .attr("x2", 15)
          .attr("y1", function(d) { return y(d); })
          .attr("y2", function(d) { return y(d); });

      g_yaxis.selectAll(".value")
        .data(y_ticks)
        .enter().append("svg:text")
          .attr("class", "value")
          .attr("x", 1)
          .attr("y", function(d) { return y(d) + 10; })
          .text(function(d) {
            return $filter('bignumber')(d);
          });
    };

    /**************************************************************************/
    /*                                 PLOT                                   */
    /**************************************************************************/
    var drawPlot = function() {
      /* Line */
      var line = d3.svg.line()
                   .x(function(d) {
                     return x(d.x);
                   })
                   .y(function(d) {
                     return y($filter('g_value')(d, $scope.type));
                   });
      /* Area */
      var area = d3.svg.area()
                   .x(function(d) {
                     return x(d.x);
                   })
                   .y0(y.range()[0])
                   .y1(function(d) {
                     return y($filter('g_value')(d, $scope.type));
                   });
      /* Past */
      var past = d3.svg.area()
                   .x(function(d) { return x(d.x); })
                   .y0(y.range()[0])
                   .y1(function(d) {
                     return y($filter('g_value')(d, $scope.type));
                   });

      /* Past */
      var g_past = svg.append('svg:g');
      g_past.append('svg:path')
            .attr('d', past(points.past))
            .classed('past', true);

      if($scope.type === 'ms') {
        var param = '';
        var custom_line = d3.svg.line()
          .x(function(d) {
            return x(d.x);
          })
          .y(function(d) {
            return y(d[param]);
          });

        var g_ms = svg.append('svg:g');
        /* Max */
        param = 'max';
        g_ms.append('svg:path')
          .attr('d', custom_line(points.current))
          .classed('line max', true);
        /* Top */
        param = 'top';
        g_ms.append('svg:path')
          .attr('d', custom_line(points.current))
          .classed('line top', true);
        /* Min */
        param = 'min';
        g_ms.append('svg:path')
          .attr('d', custom_line(points.current))
          .classed('line min', true);
        /* Bottom */
        param = 'bot';
        g_ms.append('svg:path')
          .attr('d', custom_line(points.current))
          .classed('line bot', true);
      }

      /* Done */
      var g_all = svg.append('svg:g');
      g_all.append('svg:path')
           .attr('d', line(points.current))
           .classed('line', true);
      g_all.append('svg:path')
           .attr('d', area(points.current))
           .classed('area', true);
    };

    /**************************************************************************/
    /*                         SETUP BUBBLE & CURSOR                          */
    /**************************************************************************/
    var setupBubbleCursor = function() {
      var g_cursor = svg.append("g");
      var cursor = g_cursor
        .append('svg:line')
          .attr("class", "cursor")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", -height)
          .attr("y2", 2 * height)
          .style("visibility", "hidden");

      /* We define handlers so that we can synchronize */
      /* the different graph with events               */
      var c_over = function() {
        cursor.style("visibility", "visible");
        d3.select(jQuery($element).find('.bubble')[0])
        .style("visibility", "visible");
      };

      var c_out = function() {
        cursor.style("visibility", "hidden");
        d3.select(jQuery($element).find('.bubble')[0])
          .style("visibility", "hidden");
      };

      var c_move = function(xpos) {
        var t = x.invert(xpos);
        /* find closest point */
        var min = t;
        var dst = 0;
          points.past.forEach(function(p, i) {
          if(min > Math.abs(t - p.x)) {
            min = Math.abs(t - p.x);
            dst = i;
          }
        });
        var top = $filter('g_value')(points.current[dst], $scope.type);
        d3.select(jQuery($element).find('.bubble')[0])
          .style("top", (y(top) + 15) + "px")
          .style("left", (x(points.past[dst].x) + 11) + 'px');

        var html =
          '<div class="date">' +
          $filter('g_xtodate')(points.past[dst].x) +
          '</div>' + ' &nbsp; ' +
          '<div class="current value">' +
          (points.current.length > dst ?
           ($filter('bignumber')(Math.floor($filter('g_value')(points.current[dst], $scope.type)))) :
           'n/a') +
          '</div>' +
          '<div class="past value">&nbsp;[' +
          $filter('bignumber')(Math.floor($filter('g_value')(points.past[dst], $scope.type))) +
          ']</div>';

        d3.select(jQuery($element).find('.bubble .content')[0])
          .html(html);
        cursor.attr("x1", x(points.past[dst].x))
              .attr("x2", x(points.past[dst].x));
      };

      /* Mouse mouvement */
      var inner = jQuery($element).find('.inner');

      inner.bind("mouseover.cursor", function() {
        $rootScope.$broadcast('graph:c_over', $scope);
        c_over();
      });

      inner.bind("mousemove.cursor", function(evt) {
        var xpos = evt.clientX - inner.offset().left - 4;
        $rootScope.$broadcast('graph:c_move', $scope, xpos);
        c_move(xpos);
      });

      inner.bind("mouseout.cursor", function() {
        $rootScope.$broadcast('graph:c_out', $scope);
        c_out();
      });

      $scope.$on('graph:c_over', function(evt, origin) {
        if(origin !== $scope) {
          c_over();
        }
      });
      $scope.$on('graph:c_move', function(evt, origin, xpos) {
        if(origin !== $scope) {
          c_move(xpos);
        }
      });
      $scope.$on('graph:c_out', function(evt, origin) {
        if(origin !== $scope) {
          c_out();
        }
      });
    };

    /**************************************************************************/
    /*                             LOADING WATCH                              */
    /**************************************************************************/
    $scope.$watch('loading', function(value, old_value) {
      if(value !== old_value) {
        $scope.show_loading = value;
      }
    });
});

//
// ## graph
//
// Nitrogram Graph Directive
// ```
// @data    {=object} object of arrays (current & past) to be diplayed using
// @caption {@string} graph caption
// @type {=string} the graph type
// @loading {=boolean} whether the graph data is being loaded or not
// ```
//
angular.module('dattss.directives').directive('graph', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '=data',
      caption: '@caption',
      type: '=type',
      loading: '=loading'
    },
    templateUrl: 'partials/dashboard/graph_d.html',
    controller: 'GraphController'
  };
});
