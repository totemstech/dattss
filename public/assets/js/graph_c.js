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

    var title = $('<div/>').addClass('title');
    title.append($('<span/>').addClass('type pictos').html(my.type[0]));
    title.append($('<span/>').addClass('process').html(my.process.toUpperCase()));
    title.append($('<span/>').addClass('stat').html(my.stat));
    title.append($('<span/>').addClass('close pictos').html('d'));

    var cont = $('<div/>').addClass('container');

    my.element.append(title);
    my.element.append(cont);

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
