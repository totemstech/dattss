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
      .addClass('dattss-process')
      .attr('id', 'process-' + my.name);

    return my.element;
  };

  /****************************/
  /*   REFRESH                */
  /****************************/
  /**
   * @expects { }
   */
  refresh = function(json) {
    console.log('PROCESS: ' + my.name);
    console.log(json);
    my.element.empty();

    var row = 0;
    ['c', 'g', 'ms'].forEach(function(typ) {
      var first = true;
      json.sts[typ].forEach(function(st) {
        var row_html = '';

        if(row === 0) {
          row_html += '<tr>';
          row_html += '  <td class="name">' + my.name + '</td>';
          row_html += '  <td class="status">on</td>';
          row_html += '  <td class="mem">' + (json.mem / (1024 * 1024)).toFixed(0) + 'm' + '</td>';
          row_html += '</tr>';

          row_html += '<tr>';
          row_html += '  <td/>'
          row_html += '  <td class="st-type">e</td>';
          row_html += '  <td class="st-name">errors</td>';
          row_html += '  <td class="st-err">671</td>';
          row_html += '  <td class="st-err-avg">[0.03]</td>';
          row_html += '  <td class="st-more">&raquo;</td>';
          row_html += '</tr>';

          row_html += '<tr>';
          row_html += '  <td/>'
          row_html += '  <td class="st-type">w</td>';
          row_html += '  <td class="st-name">warns</td>';
          row_html += '  <td class="st-warn">543</td>';
          row_html += '  <td class="st-warn-avg">[0.13]</td>';
          row_html += '  <td class="st-more">&raquo;</td>';
          row_html += '</tr>';
        }
          
        row_html +=   '<tr><td/>';


        // MAIN STATS

        // STATS
        if(first) {
          row_html += '  <td class="st-type">' + typ + '</td>';
          first = false;
        }
        else {
          row_html += '  <td/>';
        }
        row_html += '    <td class="st-name">' + st.nam + '</td>';

        if(typ === 'c') {
          row_html += '  <td class="c st-sum">' + st.sum + '</td>';
          row_html += '  <td class="c st-avg">[' + st.avg + ']</td>';
        }
        if(typ === 'g') {
          row_html += '  <td class="g st-lst">' + st.lst + '</td>';
          row_html += '  <td class="g st-dlt">[' + st.dlt + ']</td>';
        }
        if(typ === 'ms') {
          row_html += '  <td class="ms st-avg">' + st.avg + '</td>';
          row_html += '  <td class="ms st-minmax">[' + st.min + ', ' + st.max + ']</td>';
        }
        row_html += '  <td class="st-more">&raquo;</td>';

        row_html +=   '</tr>';
        row ++;

        my.element.append($(row_html));
      });
    });
    _super.refresh(json);
  };

  
  CELL.method(that, 'build', build, _super);
  CELL.method(that, 'refresh', refresh, _super);

  return that;
};

