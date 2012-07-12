/******************************/
/*   TIMER GRAPH CELL         */
/******************************/
var ms_graph_c = function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var build;   /* build(); */
  var refresh; /* refresh(); */

  // private

  var that = graph_c(spec, my);

  /****************************/
  /*   BUILD                  */
  /****************************/
  build = function() {
    return _super.build();
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { recv: RECV_TIME,
   *            data: STAT_DATA }
   */
  refresh = function(json) {
    if(my.last_recv !== json.recv) {
      my.last_recv = json.recv;
      $('#dattss-graph-' + my.container.idxtoi(my.idx) + ' svg').remove();

      var today = { avg: [],
                    max: [],
                    min: [],
                    bot: [],
                    top: [] };
      json.data.today.forEach(function(d) {
        if(d) { 
          today.avg.push(d.sum / d.cnt);
          today.max.push(d.max);
          today.min.push(d.min);
          today.bot.push(d.bot);
          today.top.push(d.top);
        }
        else {
          today.avg.push(0);
          today.max.push(0);
          today.min.push(0);
          today.bot.push(0);
          today.top.push(0);
        }
      });

      var past = { avg: [],
                   max: [],
                   min: [],
                   bot: [],
                   top: [] };
      json.data.past.forEach(function(d) {
        if(d) { 
          past.avg.push(d.sum / d.cnt);
          past.max.push(d.max);
          past.min.push(d.min);
          past.bot.push(d.bot);
          past.top.push(d.top);
        }
        else {
          past.avg.push(0);
          past.max.push(0);
          past.min.push(0);
          past.bot.push(0);
          past.top.push(0);
        }
      });

      var mrg = 16;
      var y = d3.scale.linear().domain([d3.min([0].concat(today.min, past.min)), 
                                        d3.max([].concat(today.max, past.max))]).range([0 + mrg, 150 - mrg]);
      var x = d3.scale.linear().domain([0, past.avg.length]).range([0 + 2*mrg, 460 - mrg]);

      var vis = d3.select('#dattss-graph-' + my.container.idxtoi(my.idx))
        .append('svg:svg')
        .attr('width', 460)
        .attr('height', 150);

      var g = vis.append('svg:g')
        .attr('transform', 'translate(0, 150)');

      var line = d3.svg.line()
        .x(function(d, i) { return x(i); })
        .y(function(d) { return -1 * y(d); });
      var area = d3.svg.area()
        .x(function(d, i) { return x(i); })
        .y0(1-mrg)
        .y1(function(d, i) { return -1 * y(d); });

      g.append('svg:path').attr('d', line(past.avg)).classed('past avg line', true);
      g.append('svg:path').attr('d', area(past.avg)).classed('past avg area', true);

      g.append('svg:path').attr('d', line(today.max)).classed('today max line', true);
      g.append('svg:path').attr('d', line(today.top)).classed('today top line', true);
      g.append('svg:path').attr('d', line(today.min)).classed('today min line', true);
      g.append('svg:path').attr('d', line(today.bot)).classed('today bot line', true);

      g.append('svg:path').attr('d', line(today.avg)).classed('today avg line', true);
      g.append('svg:path').attr('d', area(today.avg)).classed('today avg area', true);

      // DATE LABEL
      g.selectAll('.xlabel')
        .data(that.ticks(x, 5))
        .enter().append('svg:text')
        .attr('class', 'xlabel')
        .text(function(v) {
          var h = Math.floor(24 / x.domain()[1] * v);
          return h + 'h';
        })
        .attr('x', function(d) { return x(d) })
        .attr('y', 0)
        .attr('text-anchor', 'middle');

      // VALUE LABEL
      g.selectAll('.ylabel')
        .data(y.ticks(3))
        .enter().append('svg:text')
        .attr('class', 'ylabel')
        .text(function(v) {
          if(v >= 3600000) { return Math.floor(v / 3600000) + 'h' }
          if(v >= 60000) { return Math.floor(v / 60000) + 'm' }
          if(v >= 1000) { return Math.floor(v / 1000) + 's' }
          if(v === 0) return '0';
          return v;
        })
        .attr('x', 4)
        .attr('y', function(d) { 
          if(d >= 3600000) { d =  Math.floor(d / 3600000) * 3600000 }
          else if(d >= 60000) { d = Math.floor(d / 60000) * 60000 }
          else if(d >= 1000) { d = Math.floor(d / 1000) * 1000 }
          return -1 * y(d); 
        })
        .attr('dy', 2);
    }

    _super.refresh(json);
  };


  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};


