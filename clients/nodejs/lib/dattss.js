/*
 * DaTtSs: dattss.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * @2013-04-22  n1t0    Creation
 */

var fwk = require('fwk');
var http = require('http');

exports.CONFIG = fwk.populateConfig(require('../config.js').config);

//
// ## DaTtSs client library
//
// The client library requires the auth key and if required the server and port
// These informations can be passed directly at construction or by configuration
// either on the command line (--XX=yyy) or using environment variables:
//     DATTSS_AUTH_KEY:          the auth key
//     DATTSS_SERVER_HTTP_HOST   the DaTtSs server http host
//     DATTSS_SERVER_HTTP_PORT   the DaTtSs server http port
//     DATTSS_PERCENTILE         the percentile value (0.1 default)
//
// ```
// @spec { auth, [http_host], [http_port], [pct] }
// ```
//
var dattss = function(spec, my) {
  my = my || {};
  var _super = {};

  my.auth      = spec.auth      || exports.CONFIG['DATTSS_AUTH_KEY'];
  my.http_host = spec.http_host || exports.CONFIG['DATTSS_SERVER_HTTP_HOST'];
  my.http_port = spec.http_port || exports.CONFIG['DATTSS_SERVER_HTTP_PORT'];
  my.pct       = spec.pct       || parseFloat(exports.CONFIG['DATTSS_PERCENTILE']);

  my.stopped = true;

  /* accumulators */
  my.acc = {
    'c': {},
    'ms': {},
    'g': {}
  };

  //
  // #### _public methods_
  //
  var agg;           /* agg(path, value); */

  var start;         /* start();          */
  var stop;          /* stop();           */

  //
  // #### _private methods_
  //
  var do_commit;     /* do_commit();      */
  var make_partials; /* make_partials();  */

  //
  // #### _that_
  //
  var that = {};

  /****************************************************************************/
  /*             PRIVATE COMPUTATION AND COMMIT FUNCTIONALITIES               */
  /****************************************************************************/
  //
  // ### make_partials
  // Computes the partial aggregates and cleans up the various accumulators
  //
  make_partials = function() {
    var partials = {
      'c': [],
      'ms': [],
      'g': []
    };

    ['c', 'ms', 'g'].forEach(function(type) {
      for(var path in my.acc[type]) {
        if(my.acc[type].hasOwnProperty(path) && my.acc[type][path].length > 0) {
          var partial = {
            typ: type,
            pth: path,
            pct: my.pct,
            sum: 0,
            cnt: 0,
            emp: false
          };

          /* Sort values by date */
          my.acc[type][path].sort(function(a, b) {
            return a.date - b.date;
          });
          /* First aggregation */
          my.acc[type][path].forEach(function(val) {
            partial.sum += val.value;
            partial.cnt += 1;
            partial.max = ((partial.max || val.value) > val.value) ?
              partial.max : val.value;
            partial.min = ((partial.min || val.value) < val.value) ?
              partial.min : val.value;
            partial.lst = val.value;
            partial.fst = partial.fst || val.value;
            partial.emp = partial.emp || val.emphasis;
          });

          /* Computes top 10 and bottom 10 */
          my.acc[type][path].sort(function(a, b) {
            return a.value - b.value;
          });
          var len = my.acc[type][path].length;
          var bot_index = Math.max(Math.min(Math.ceil(my.pct * len), len-1), 0);
          var top_index = Math.max(Math.min(Math.round((1.0 - my.pct) * len), len-1), 0);
          partial.bot = my.acc[type][path][bot_index].value;
          partial.top = my.acc[type][path][top_index].value;

          partials[type].push(partial);
        }
      }
    });

    /* Cleanup accumulators */
    my.acc = {
      'c':  {},
      'g':  {},
      'ms': {}
    };

    return partials;
  };

  //
  // ### do_commit
  // Computes the current partial-aggregates and send them to the DaTtSs server
  // for reporting and aggregation. Called periodicaly every DATTSS_PUSH_PERIOD
  //
  do_commit = function() {
    var commit = {
      prt: make_partials()
    };

    if(exports.CONFIG['DATTSS_DEBUG']) {
      console.log('=====================================');
      console.log(JSON.stringify(commit));
      console.log('=+++++++++++++++++++++++++++++++++++=');
    }

    if(my.creq) {
      my.creq.abort();
    }

    var options = {
      host: my.http_host,
      port: my.http_port,
      method: 'PUT',
      path: '/agg?auth=' + my.auth,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': new Buffer(JSON.stringify(commit)).length
      }
    };

    my.creq = http.request(options, function(res) {
      if(exports.CONFIG['DATTSS_DEBUG']) {
        console.log('/agg ' + res.statusCode + ' [' + my.auth + ']');
      }
      delete my.creq;
    }).on('error', function(err) {
      if(exports.CONFIG['DATTSS_DEBUG']) {
        console.log('ERROR: /agg ' + err.message + ' [' + my.auth + ']');
      }
    }).end(JSON.stringify(commit));
  };

  /****************************************************************************/
  /*                     PUBLIC STATISTICS CAPTURE INTERFACE                  */
  /****************************************************************************/
  //
  // ### agg
  // In charge of aggregating a new value for a given statistic
  // ```
  // @path {string}  the path of the statistic to aggregate
  // @value {string} a DaTtSs like value '1c' | '253ms' | '34g'
  // ```
  //
  agg = function(path, value) {
    if(my.stopped) {
      return;
    }

    var path_m = /^([A-Za-z0-9\-\_\.\!]+)$/.exec(path);
    if(!path_m) {
      if(exports.CONFIG['DATTSS_DEBUG']) {
        console.log('ERROR: agg invalid path: ' + path + ' [' + my.auth + ']');
      }
      return;
    }

    var value_m = /^(-?[0-9]+)(c|ms|g)(\!?)/.exec(value);
    if(value_m) {
      var type = value_m[2];
      var val = parseInt(value_m[1], 10);
      var emph = (value_m[3] === '!');

      my.acc[type][path] = my.acc[type][path] || [];
      my.acc[type][path].push({
        date: Date.now(),
        value: val,
        emphasis: emph
      });
    }
  };

  //
  // ### start
  // Starts the commit interval and make the object ready to accept new
  // aggregates. `start` is called implicitely at creation time.
  //
  start = function() {
    my.itv = setInterval(do_commit, exports.CONFIG['DATTSS_PUSH_PERIOD']);
    my.stopped = false;
  };

  //
  // ### stop
  // Cancels the commit interval so that the process can be exited. `start`
  // can be called to restart the tracking. While stopped aggregates are ignored
  //
  stop = function() {
    if(my.itv) {
      clearInterval(my.itv);
      delete my.itv;
    }
    my.stopped = true;
  };

  /****************************************************************************/
  /*               IMPLICIT INITIALISATION (COMMIT TIMER, START)              */
  /****************************************************************************/
  start();

  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'start', start, _super);
  fwk.method(that, 'stop', stop, _super);

  return that;
};

exports.dattss = dattss;
