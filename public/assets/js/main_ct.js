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

  my.json = { current: {},
              board: { stack: [] } };

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

    my.children['current'] = current_c({ path: '/' + my.name + '/current', container: that });
    top.append(my.children['current'].build().addClass('span6'));
    my.children['board'] = board_c({ path: '/' + my.name + '/board', container: that });
    top.append(my.children['board'].build().addClass('span6'));

    // HANDLERS
    my.children['current'].on('graph', function(process, type, stat) {
      var idx = process + '_' + type + '_' + stat;
      if(!my.json.board[idx]) {
        my.json.board[idx] = { process: process,
                               type: type,
                               stat: stat,
                               recv: 0 };
        my.json.board.stack.push(idx);
        that.refresh();
      }
    });
    my.children['board'].on('destroy', function(process, type, stat) {
      var idx = process + '_' + type + '_' + stat;
      for(var i = 0; i < my.json.board.stack.length; i ++) {
        if(my.json.board.stack[i] === idx) {
          my.json.board.stack.splice(i, 1);
          break;
        }
      }
      delete my.json.board[idx]; 
    });
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
        error(err);
      });
    
    my.socket = io.connect('/');
    my.socket.on('update', function (data) {
      //console.log(data);
      my.json.current[data.cur.nam] = data.cur;
      //that.refresh();
    });
  };

  /**
   * Refresh stats data if necessary and call super refresh
   */
  refresh = function() {
    var now = Date.now();

    my.json.board.stack.forEach(function(idx) {
      var st = my.json.board[idx];
      if((now - st.recv) > 5 * 60 * 1000) {
        (function(st) {
          $.getJSON('/stat?' + 
                    'process=' + st.process + '&' +
                    'type=' + st.type + '&' +
                    'name=' + st.stat)
            .success(function(data) {
              if(data.ok && data.stat) {
                st.recv = Date.now();
                st.data = data.stat;
                that.refresh();
              }
            })
            .error(function(err) {
              error(err);
            });
        })(st);
      }
    });

    _super.refresh();
  };

  /**
   * General error handler to notify the user
   * @param err the error
   */
  error = function(err) {
    alert('ERROR: ' + err.message);
  };


  CELL.method(that, 'load', load, _super);
  CELL.method(that, 'refresh', refresh, _super);
  CELL.method(that, 'init', init, _super);

  return that;
};
