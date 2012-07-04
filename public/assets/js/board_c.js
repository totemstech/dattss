/******************************/
/*   BOARD CELL                 */
/******************************/
var board_c = function(spec, my) {
  var _super = {};
  my = my || {};

  my.graph = {};

  // public
  var build;   /* build(); */
  var refresh; /* refresh(); */

  // private
  var graph;   /* graph(type, name); */
  
  var that = CELL.cell(spec, my);

  /**
   * Retrieves a graph cell from the local object cache or construct
   * it if not found
   * @param type the stat type
   * @param name the stat name
   * @return graph the graph cell
   */
  graph = function(type, name) {
    var idx = type + '_' + name; // small risk of collision
    if(!my.graph[idx]) {
      if(type === 'c') {
        my.graph[idx] = c_graph_c({ path: my.path + '/' + idx,
                                    container: my.container,
                                    name: name });
      }
      if(type === 'g') {
        my.graph[idx] = g_graph_c({ path: my.path + '/' + idx,
                                    container: my.container,
                                    name: name });
      }
      if(type === 'ms') {
        my.graph[idx] = ms_graph_c({ path: my.path + '/' + idx,
                                     container: my.container,
                                     name: name });
      }
      my.children[idx] = my.graph[idx];
      my.graph[idx].on('destroy', function() {
        delete my.graph[idx];
        delete my.children[idx];
      });
      my.graph[idx].build();
    }
    return my.graph[idx];
  };


  /****************************/
  /*   BUILD                  */
  /****************************/
  build = function() {
    my.element = $('<div/>').addClass('dattss-board');

    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { }
   */
  refresh = function(json) {
    my.element.empty();

    json.forEach(function(g) {
      var gr = graph(g.type, g.name);
      my.element.append(gr.element());
    });

    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

