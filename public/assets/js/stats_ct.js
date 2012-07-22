
/******************************/
/*   STATS CONTAINER          */
/******************************/
var stats_ct = function(spec, my) {
  var _super = {};
  my = my || {};
  
  my.path = spec.demo ? '/demo' : '/s';
  my.json = { current: {},
              board: { stack: [] } };

  my.idxs = {};
  my.i = 0;

  // public
  var load;      /* load(); */
  var refresh;   /* refresh(); */
  var init;      /* init(); */
  var idxtoi;    /* idxtoi(); */

  // private
  var error;     /* error(err); */


  var that = CELL.container({ name: 'stats' }, my);


  /**
   * Loads the envi env within the DOM. A full-scren
   * editor is opened at the begining
   */
  load = function() {
    var top = $('#dattss-stats-top');

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
        my.json.board.stack.unshift(idx);
        my.json.current[process].open[idx] = true;
        that.refresh();
      }
    });
    my.children['board'].on('close', function(process, type, stat) {
      var idx = process + '_' + type + '_' + stat;
      for(var i = 0; i < my.json.board.stack.length; i ++) {
        if(my.json.board.stack[i] === idx) {
          my.json.board.stack.splice(i, 1);
          break;
        }
      }
      delete my.json.board[idx]; 
      delete my.json.current[process].open[idx];
      that.refresh();
    });
    my.children['current'].on('close', function(process, type, stat) {
      var graph = that.find('board/' + process + '_' + type + '_' + stat);
      graph.emit('close', process, type, stat);
      graph.element().remove();
    });
    my.children['current'].on('destroy', function(process) {
      $.getJSON(my.path + '/destroy?process=' + process)
        .success(function(data) {
          // nothing to do
        })
        .error(function(err) {
          // ignore errors here (eg: already removed)
        });
      delete my.json.current[process];
      that.refresh();
    });
  };

 
  /**
   * Loads the initial data and register the update handlers
   */
  init = function() {
    // handy for CSS modification
    var DO_REFRESH = true;
    //var DO_REFRESH = false;

    // INITIAL VALUES
    $.getJSON(my.path + '/current')
      .success(function(data) {
        if(data.ok) {
          my.json.current = data.current;
          for(var p in my.json.current) {
            // convert to absolute date
            my.json.current[p].lst = Date.now() - my.json.current[p].lst;
            my.json.current[p].open = {};
          }
          //console.log(my.json);
          that.refresh();
        }
      })
      .error(function(err) {
        error(err);
      });
    
    // IO UPDATES
    my.socket = io.connect(my.path);
    my.socket.on('update', function (data) {
      //console.log(data);
      if(my.json.current[data.cur.nam])
        data.cur.open = my.json.current[data.cur.nam].open || {};
      else
        data.cur.open = {};
      // convert to absolute date
      data.cur.lst = Date.now() - data.cur.lst;
      my.json.current[data.cur.nam] = data.cur;
      if(DO_REFRESH)
        that.refresh();
    });

    // OFFLINE DETECTION
    setInterval(function() {
      if(DO_REFRESH)
        that.refresh();
    }, 2000);
  };


  /**
   * Refresh stats data if necessary and call super refresh
   */
  refresh = function() {
    var now = Date.now();

    my.json.board.stack.forEach(function(idx) {
      var st = my.json.board[idx];
      if((now - st.recv) > 1 * 60 * 1000) {
        (function(st) {
          $.getJSON(my.path + '/stat?' + 
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

  /**
   * Transforms an idx string into an integer for id and class name
   * compatibility
   * @param idx string value (just about any string)
   * @return i an integer
   */
  idxtoi = function(idx) {
    if(typeof my.idxs[idx] === 'undefined') {
      my.idxs[idx] = ++my.i;
    }
    return my.idxs[idx];
  };

  CELL.method(that, 'load', load, _super);
  CELL.method(that, 'refresh', refresh, _super);
  CELL.method(that, 'init', init, _super);

  CELL.method(that, 'idxtoi', idxtoi, _super);

  return that;
};
