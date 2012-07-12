var fwk = require('fwk');
var events = require('events');
var fs = require('fs');
var util = require('util');
var assert = require('assert');
var mkdirp = require('mkdirp');
var isoperiod = require('./isoperiod.js');
var partials = require('./partials.js');

/**
 * Counter Object 
 *
 * In charge of loading all data relative to a counter in memory and
 * aggregating it according to the type requested
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg, user, process, type, name, dts}
 */
var stat = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg;
  my.user = spec.user;
  my.process = spec.process;
  my.name = spec.name;
  my.type = spec.type;
  my.dts = spec.dts;

  my.data = {};

  my.DAY = 24 * 60 * 60 * 1000;

  my.user_dir = my.cfg['DATTSS_STORAGE_PATH'] + '/' + my.user;
  my.curr_dir = my.user_dir + '/current';

  // public
  var load;         /* load(cb); */
  var compute_day;  /* compute_day(step); */
  var compute_hist; /* compute_hist(step) */

  // private


  var that = new events.EventEmitter();


  /*********************************************
   * PRIVATE HELPER FUNCTIONS                  *
   *********************************************/


  /*********************************************
   * PUBLIC FUNCTIONS                          *
   *********************************************/
  
  /**
   * Loads all data relative to that stat from the disk into memory
   * for calculation. The amount of data loaded in memory is driven
   * by my.cfg['DATTSS_STAT_HISTORY_DAYS'] which is the number of
   * days used to compute historical values
   * @param cb(err)
   */
  load = function(cb) {
    var now = Date.now();
    var mplex = fwk.mplex({});

    for(var i = 0; i < my.cfg['DATTSS_STAT_HISTORY_DAYS']; i ++) {
      var iso = isoperiod.isoperiod({ date: now - i * my.DAY });
      var day_str = iso.week() + '_' + iso.day();
      var path = my.user_dir + '/' + 
                 day_str + '/' + 
                 my.process + '/' +
                 my.type + '_' + my.name + '.prt';

      (function(day_str, path, fcb) {
        fs.readFile(path, 'utf8', function(err, data) {
          if(err) {
            // no data here
            fcb();
          }
          else {
            var lines = data.split('\n');
            lines.forEach(function(l) {
              var cmp = l.split(',');
              if(cmp.length === (partials.STRING_PARTS_COUNT + 2)) {
                var hour = parseInt(cmp.shift(), 10);
                var minute = parseInt(cmp.shift(), 10);
                var prt = partials.parse(cmp.join(','));

                //console.log('ADDING [' + my.process + '] ' + my.type + '_' + my.name + ': ' + 
                //            day_str + '_' + hour + '_' + minute);
                my.data[day_str + '_' + hour + '_' + minute] = prt;
              }
            });
            fcb();
          }
        });
      })(day_str, path, mplex.callback());
    }
    
    mplex.go(function() {
      // and we're all done!
      cb();
      /* DaTtSs */ my.dts.srv.agg('stat.load', (Date.now() - now) + 'ms');
      /* DaTtSs */ my.dts.srv.agg('stat.load', '1c');
    });
  };
  

  /**
   * Computes the current day values (whith history averages) with the 
   * provided step [multiple of 1 (minute)]
   * @param step the graph data step to cover a day
   * @return stat the calculated stat data
   */
  compute_day = function(step) {
    if(typeof step !== 'number' || step <= 0)
      step = 1;

    var now = Date.now();
    var agg = { today: [],
                past: [] };

    var iso = isoperiod.isoperiod({ date: now });
    var today_str = iso.week() + '_' + iso.day();
    var total = my.cfg['DATTSS_STAT_HISTORY_DAYS'] * 24 * 60;

    for(var i = 0; i < total; i ++) {
      var iso = isoperiod.isoperiod({ date: now - (i * 60 * 1000) });
      var day_str = iso.week() + '_' + iso.day();
      var min_str = day_str + '_' + iso.hour() + '_' + iso.minute();
      var pos = Math.floor((iso.hour() * 60 + iso.minute()) / step);

      if(my.data[min_str]) {
        if(day_str === today_str) {
          agg.today[pos] = agg.today[pos] || [];
          agg.today[pos].push(my.data[min_str]);
        }
        else {
          agg.past[pos] = agg.past[pos] || {};
          agg.past[pos][day_str] = agg.past[pos][day_str] || [];
          agg.past[pos][day_str].push(my.data[min_str]);
        }
      }
    }

    agg.today.forEach(function(prts, i) {
      agg.today[i] = partials.agg_partials(prts);
    });

    agg.past.forEach(function(p, i) {
      var prts = [];
      fwk.forEach(p, function(day_prts) {
        prts.push(partials.agg_partials(day_prts));
      });
      agg.past[i] = partials.avg_partials(prts);
    });

    // fill out gaps in past
    for(var i = 0; i < (24 * 60) / step; i++) {
      if(typeof agg.past[i] === 'undefined') {
        agg.past[i] = null;
      }
    }

    /* DaTtSs */ my.dts.srv.agg('stat.compute_day', (Date.now() - now) + 'ms');
    /* DaTtSs */ my.dts.srv.agg('stat.compute_day', '1c');
    return agg;
  };


  /**
   * Computes the historical data with the provided step [multiple of 
   * 1 (minute)]. History goes back to my.cfg['DATTSS_STAT_HISTORY_DAYS']
   * which defaults to 7 * 4 days (40320 points)
   * @param step the graph data step to cover history
   * @return stat the calculated stat data
   */
  compute_hist = function(step) {
    var stat = [];
    /* DaTtSs */ my.dts.srv.agg('stat.compute_hist', (Date.now() - now) + 'ms');
    /* DaTtSs */ my.dts.srv.agg('stat.compute_hist', '1c');
  };


  fwk.method(that, 'load', load, _super);
  fwk.method(that, 'compute_day', compute_day, _super);
  fwk.method(that, 'compute_hist', compute_hist, _super);

  return that;
};

exports.stat = stat;
