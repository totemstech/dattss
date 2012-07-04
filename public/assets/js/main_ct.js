/******************************/
/*   INITIALIZATION           */
/******************************/

var DATTSS = {};

$(document).ready(function() {
  DATTSS.main = main_ct({});
  DATTSS.main.load();
  DATTSS.main.init();
});

/******************************/
/*   MAIN  CONTAINER          */
/******************************/
var main_ct = function(spec, my) {
  var _super = {};
  my = my || {};

  my.json = {};
  my.current = {};

  // public
  var load;      /* load(); */
  var refresh;   /* refresh(); */

  // private
  var error;     /* error(err); */


  var that = CELL.container({ name: 'main' }, my);

  /**
   * Loads the envi env within the DOM. A full-scren
   * editor is opened at the begining
   */
  load = function() {
    var top = $('#dattss-top');

    my.children['current'] = current_c({ path: '/' + my.name + '/cli', container: that });
    top.append(my.children['current'].build());
  };

  /**
   * Loads the initial data and register the update handlers
   */
  init = function() {
    $.getJSON('/current')
      .success(function(data) {
        if(data.ok) {
          my.json.current = data.current;
          //console.log(my.json);
          that.refresh();
        }
      })
      .error(function(err) {
        that.error(err);
      });
    
    my.socket = io.connect('/');
    my.socket.on('update', function (data) {
      //console.log(data);
      my.json.current[data.cur.nam] = data.cur;
      that.refresh();
    });
  };

  /**
   * General error handler to notify the user
   * @param err the error
   */
  error = function(err) {
    alert('ERROR: ' + err.message);
  };

  /**
   * Refreshes the UI with new layout
   */
  refresh = function() {
    _super.refresh();
  };

  CELL.method(that, 'load', load, _super);
  CELL.method(that, 'refresh', refresh, _super);
  CELL.method(that, 'init', init, _super);

  return that;
};
