/******************************/
/*   COUNTER GRAPH CELL       */
/******************************/
var c_graph_c = function(spec, my) {
  var _super = {};
  my = my || {};

  my.name = spec.name;

  // public
  var build;   /* build(); */
  var refresh; /* refresh(); */

  // private
  var that = CELL.cell(spec, my);

  /****************************/
  /*   BUILD                  */
  /****************************/
  build = function() {
    my.element = $('<li/>')
      .attr('id', 'dattss-c_graph-' + my.name);

    if(my.type === 'c') {
      my.children[my.type] = 
    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { }
   */
  refresh = function(json) {

    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

