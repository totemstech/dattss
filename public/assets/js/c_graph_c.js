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
  my.last_load = 0;

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
    my.element = $('<li/>')
      .attr('id', 'dattss-graph-' + idx);

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
    var now = Date.now();
    if((now - my.last_load) > 1 * 60 * 1000) {
      my.last_load = now;
      that.load();
    }
    _super.refresh(json);
  };


  /**
   * Loads / Refresh the data from the server and build the graph
   * TODO: evaluate if this should be done here or passed through
   * the refresh infrastructure
   */
  load = function() {
    $.getJSON('/stat?' + 
              'process=' + my.process + '&' +
              'type=' + my.type + '&' +
              'name=' + my.stat)
      .success(function(data) {
        console.log(data);
      });
  };
  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

