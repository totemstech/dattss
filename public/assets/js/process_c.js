/******************************/
/*   PROCESS CELL               */
/******************************/
var process_c = function(spec, my) {
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
    my.element = $('<tbody/>')
      .addClass('dattss-process expanded')
      .attr('id', 'process-' + my.container.idxtoi(my.name));

    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { }
   */
  refresh = function(json) {
    //console.log('PROCESS: ' + my.name);
    //console.log(json);
    my.element.empty();

    var row_cnt = 0;
    var block = 0;
    ['c', 'g', 'ms'].forEach(function(typ) {
      var first = true;
      json.sts[typ].forEach(function(st) {
        
        var row;

        // TITLE
        if(row_cnt === 0) {
          row = $('<tr/>').addClass('jump');
          row.append($('<td/>').html('&nbsp;'));
          my.element.append(row);

          row = $('<tr/>').addClass('top');
          row.append($('<td/>').addClass('name')
            .append($('<span/>').html(my.name.toUpperCase()).click(function() {
              $('#process-' + my.container.idxtoi(my.name)).toggleClass('expanded');
            })));
          row.append($('<td/>').addClass('status').addClass(json.lst <= 10000 ? 'on' : 'off')
            .append($('<span/>').addClass('pictos').html('r'))
          );
          row.append($('<td/>').addClass('uptime').html(DATTSS.format_duration(Math.floor(json.upt))));
          row.append($('<td/>').attr('colspan', 3));
          my.element.append(row);
        }
          
        // STATS
        if(first) { block++; }
        row = $('<tr/>');
        row.addClass(((block % 2) !== 0 ? 'highlight' : ''));
        row.addClass(st.emp ? 'emphasis' : '');
        row.addClass((st.nam === 'error') ? 'error' : '');
        row.append($('<td/>'));

        // type
        if(first) {
          first = false;
          row.append($('<td/>').addClass('st-type')
            .append($('<span/>').addClass('pictos').html(typ[0]))
          );
        }
        else {
          row.append($('<td/>'));
        }

        // name
        row.append($('<td/>').addClass('st-name').html(st.nam));

        // value
        if(typ === 'c') {
          row.append($('<td/>').addClass('st-val').html(st.sum === null ? ' ' : st.sum));
          row.append($('<td/>').addClass('st-dyn').html('[' + (st.avg === null ? ' ' : st.avg) + ']'));
        }
        if(typ === 'g') {
          row.append($('<td/>').addClass('st-val').html(st.lst === null ? ' ' : st.lst));
          row.append($('<td/>').addClass('st-dyn').html('[' + (st.avg === null ? ' ' : st.avg) + ']'));
        }
        if(typ === 'ms') {
          row.append($('<td/>').addClass('st-val').html(st.avg === null ? ' ' : st.avg));
          row.append($('<td/>').addClass('st-dyn').html('[' + (st.min === null ? ' ' : st.min) + ', ' + 
                                                              (st.max === null ? ' ' : st.max) + ']'));
        }

        // show
        if(json.open[my.name + '_' + typ + '_' + st.nam]) {
          row.append($('<td/>').addClass('st-graph open')
             .append($('<a/>').addClass('pictos').html('p').click(function() {
                that.emit('destroy', my.name, typ, st.nam);
              }))
          );
        }
        else {
          row.append($('<td/>').addClass('st-graph')
             .append($('<a/>').addClass('pictos').html('p').click(function() {
                that.emit('graph', my.name, typ, st.nam);
              }))
          );
        }

        //row_html +=   '</tr>';

        row_cnt ++;
        my.element.append(row);
      });
    });
    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

