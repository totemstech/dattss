/******************************/
/*   GAUGES GRAPH CELL        */
/******************************/
var g_graph_c = function(spec, my) {
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
      $('#dattss-graph-' + my.idx + ' svg').remove();

      var today = [];
      json.data.today.forEach(function(d) {
        if(d) today.push(d.lst);
        else today.push(0);
      });
      var past = [];
      json.data.past.forEach(function(d) {
        if(d) past.push(d.lst);
        else past.push(0);
      });

      var mrg = 16;
      var y = d3.scale.linear().domain([d3.min([0].concat(today, past)), 
                                        d3.max([].concat(today, past))]).range([0 + mrg, 150 - mrg]);
      var x = d3.scale.linear().domain([0, past.length]).range([0 + 2*mrg, 460 - mrg]);

      var vis = d3.select('#dattss-graph-' + my.idx)
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

      g.append('svg:path').attr('d', line(past)).classed('past line', true);
      g.append('svg:path').attr('d', line(today)).classed('today line', true);


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
          if(Math.abs(v) >= 1000000000) { return Math.floor(v / 1000000000) + 'b' }
          if(Math.abs(v) >= 1000000) { return Math.floor(v / 1000000) + 'm' }
          if(Math.abs(v) >= 1000) { return Math.floor(v / 1000) + 'k' }
          return v;
        })
        .attr('x', 4)
        .attr('y', function(d) { return -1 * y(d); })
        .attr('dy', 2);
    }

    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};


