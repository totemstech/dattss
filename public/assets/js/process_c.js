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
    //console.log('PROCESS: ' + my.name);
    //console.log(json);
    my.element.empty();

    var row = 0;
    var block = 0;
    ['c', 'g', 'ms'].forEach(function(typ) {
      var first = true;
      json.sts[typ].forEach(function(st) {
        var row_html = '';

        // TITLE
        if(row === 0) {
          row_html += '<tr><td>&nbsp;</td></td><tr class="top">';
          row_html += '  <td class="name">' + my.name.toUpperCase() + '</td>';
          if(json.lst <= 10000) {
            row_html += '  <td class="status on">on</td>';
          }
          else {
            row_html += '  <td class="status off">off</td>';
          }
          row_html += '  <td class="uptime">' + json.upt + 's </td>';
          row_html += '  <td colspan="3"/>';
          row_html += '</tr>';
        }
          
        // STATS
        if(first) { block++; }
        row_html +=   '<tr class="' + ((block % 2) !== 0 ? 'highlight' : '') +'">';
        row_html +=   '  <td/>';
        
        // type
        if(first) {
          row_html += '  <td class="st-type">' + typ + '</td>';
          first = false;
        }
        else {
          row_html += '  <td/>';
        }

        // name
        row_html += '    <td class="st-name">' + st.nam + '</td>';
        // value
        if(typ === 'c') {
          row_html += '  <td class="st-val">' + st.sum + '</td>';
          row_html += '  <td class="st-dyn">[' + st.avg + ']</td>';
        }
        if(typ === 'g') {
          row_html += '  <td class="st-val">' + st.lst + '</td>';
          row_html += '  <td class="st-dyn">[' + ((st.dlt > 0) ? '+' : '') + st.dlt + ']</td>';
        }
        if(typ === 'ms') {
          row_html += '  <td class="st-val">' + st.avg + '</td>';
          row_html += '  <td class="st-dyn">[' + st.min + ', ' + st.max + ']</td>';
        }
        // show
        row_html += '  <td class="st-more"><a href="#">&raquo;</a></td>';

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

