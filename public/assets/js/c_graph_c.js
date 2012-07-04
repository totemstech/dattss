/******************************/
/*   COUNTER GRAPH CELL       */
/******************************/
var c_graph_c = function(spec, my) {
  var _super = {};
  my = my || {};

  my.process = spec.process;
  my.type = spec.type;
  my.stat = spec.stat;

  my.idx = my.process + '_' +
           my.type + '_' +
           my.stat; // small collision risk
  my.last_recv = 0;

  // public
  var build;   /* build(); */
  var refresh; /* refresh(); */

  // private
  var load;    /* load(); */


  var that = CELL.cell(spec, my);

  /****************************/
  /*   BUILD                  */
  /****************************/
  build = function() {
    my.element = $('<div/>')
      .attr('id', 'dattss-graph-' + my.idx)
      .addClass('dattss-graph');

    if(my.type === 'c') {
      //my.children[my.type] = 
    }
    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { }
   */
  refresh = function(json) {
    if(my.last_recv !== json.recv) {
      my.last_recv = json.recv;
      $('#dattss-graph-' + my.idx).empty();

      var today = [];
      json.data.today.forEach(function(d) {
        if(d) today.push(d.sum);
        else today.push(0);
      });
      var past = [];
      json.data.past.forEach(function(d) {
        if(d) past.push(d.sum);
        else past.push(0);
      });

      var y = d3.scale.linear().domain([0, d3.max(past)]).range([0 + 10, 150 - 10]);
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

      g.append('svg:path').attr('d', line(today)).attr('class', 'today');
      g.append('svg:path').attr('d', line(past)).attr('class', 'past');
    }

    _super.refresh(json);
  };


  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

