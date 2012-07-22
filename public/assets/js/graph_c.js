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

  // protected
  var ticks;   /* ticks(scale, count); */

  // private
  var load;    /* load(); */


  var that = CELL.cell(spec, my);

  /****************************/
  /*   BUILD                  */
  /****************************/
  build = function() {
    my.element = $('<div/>')
      .attr('id', 'dattss-graph-' + my.container.idxtoi(my.idx))
      .addClass('dattss-graph');

    var title = $('<div/>').addClass('title');
    title.append($('<span/>').addClass('type pictos').html(my.type[0]));
    title.append($('<span/>').addClass('process').html(my.process.toUpperCase()));
    title.append($('<span/>').addClass('stat').html(my.stat));
    title.append($('<span/>').addClass('close pictos').html('d').click(function() {
        that.emit('close', my.process, my.type, my.stat);
        my.element.remove();
      }));

    my.element.append(title);

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


  /**
   * Calculates normalized count ticks on the domain provided
   * @param scale the scale
   * @param count the number of ticks
   */
  ticks = function(scale, count) {
    var d = scale.domain();
    var data = [];
    for(var i = 0; i < count; i++) {
      data.push((d[1] - d[0]) * i / (count-1) + d[0]);
    }
    return data;
  };


  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);
  CELL.method(that, 'ticks', ticks, _super);

  return that;
};
