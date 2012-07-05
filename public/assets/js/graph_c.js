/******************************/
/*   BASE GRAPH CELL          */
/******************************/
var graph_c = function(spec, my) {
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
    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects {}
   */
  refresh = function(json) {
    _super.refresh(json);
  };

  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};
