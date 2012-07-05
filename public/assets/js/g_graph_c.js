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
      $('#dattss-graph-' + my.idx).empty();

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

      var y = d3.scale.linear().domain([d3.min([0].concat(today, past)), 
                                        d3.max([].concat(today, past))]).range([0 + 10, 150 - 10]);
      var x = d3.scale.linear().domain([0, past.length]).range([0 + 10, 460 - 10]);

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
        .y0(-9)
        .y1(function(d, i) { return -1 * y(d); });

      g.append('svg:path').attr('d', line(past)).classed('past line', true);
      g.append('svg:path').attr('d', line(today)).classed('today line', true);
    }

    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};


