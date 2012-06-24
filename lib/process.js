var fwk = require('fwk');

/**
 * Process Object 
 *
 * in charge of receiving, storing, updating counters received
 * for a given process
 *
 * The process objects receives partial aggregates from a process. 
 * These partial aggregates should be 5s-partial aggregates but this is
 * not an hypothesis. Engine marks the receival time of these 
 * partial aggregates and transfer them to the process object. If the
 * is not known by engine yet, initialization takes place and the
 * current value is read from the disk. If the uptime value of the
 * partial aggregate received is below the local uptime value, that
 * means that a restart happened and the partials/stats are cleared.
 *
 * Finally every minute the commit method of the process is called:
 * the process then calculate a 1mn partial aggregate to be stored on
 * disk.
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg, user, name}
 */
var process = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg;
  my.user = spec.user;
  my.name = spec.name;

  my.last = Date.now();
  my.dirty = false;

  my.current = {};
  my.partials = {};

  // public
  var init;              /* init(cb); */
  var destroy;           /* detroy(); */
  var agg;               /* agg(data); */
  var commit;            /* commit(); */

  // private
  var agg_partials;      /* aggregate_partials(partials) */


  /*********************************************
   * PRIVATE HELPER FUNCTIONS                  *
   *********************************************/

  /**
   * Aggregates 5s-partial-aggregates received over the network into 
   * 1mn-partial-aggregates to be stored on the disk.
   * The trickiest part are the bot10, top90 fields as their aggregation 
   * is only an approximation of the truth. Other values aggregate naturally.
   * @param partials an array of partials as stored in my.partials[st]
   *                 partials are expected to be orderd by arrival time
   * @return a aggregated partial object
   */
  agg_partials = function(partials) {
    var agg = {sum: 0, cnt: 0};
    var work = [], acc = 0;

    partials.forEach(function(p) {
      work.push({cnt: p.cnt, t10: p.t10, b10: p.b10});
      agg.typ = p.typ;
      agg.sum += p.sum;
      agg.cnt += p.cnt;
      agg.max = ((agg.max || p.max) > p.max) ? agg.max : p.max;
      agg.min = ((agg.min || p.min) < p.min) ? agg.min : p.min;
      agg.lst = p.lst;
      agg.fst = agg.fst || p.fst;
    });

    // t10 calculation
    work.sort(function(a,b) { return b.t10 - a.t10; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.t10 = work[i].t10;
      acc += Math.ceil(work[i].cnt * 0.1);
      if(acc >= agg.cnt * 0.1)
        break;
    }

    //b10 calculation
    work.sort(function(a,b) { return a.b10 - b.b10; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.b10 = work[i].b10;
      acc += Math.ceil(work[i].cnt * 0.1);
      if(acc >= agg.cnt * 0.1)
        break;
    }
    
    return agg;
  };


  /*********************************************
   * PUBLIC FUNCTIONS                          *
   *********************************************/

  /**
   * retrieves the /{my.user}/current/{my.name} file to reconstruct
   * the my.current object (see engine.js for data structure)
   * It's in the current object that stats differ the most by type.
   * All stats type specific current values can be calculated from
   * the last minute 5s-partial aggregates: 'c' avg, 'g' dlt as well
   * as 'ms' max.
   * @param cb(err) error if something went wrong
   */
  init = function(cb) {
    var user_dir = my.cfg['DATTSS_STORAGE_PATH'] + '/' + my.user;
    var curr_dir = user_dir + '/current';

    fs.readFile(curr_dir + '/' + my.name + '.cur', 
                'utf8', function(err, data) {
                  if(err) {
                    if(error.code !== 'ENOENT') {
                      cb(err);
                    }
                    else {
                      // nothing to do
                      cb();
                    }
                  }
                  else {
                    try {
                      my.current = JSON.parse(data);
                    }
                    catch(err) {
                      cb(err);
                      return;
                    }
                    cb();
                  }
                });
  };

  /**
   * Destroys the current file for this process so that it won't appear
   * anymore for that user's current view
   */
  destroy = function() {
    var user_dir = my.cfg['DATTSS_STORAGE_PATH'] + '/' + my.user;
    var curr_dir = user_dir + '/current';

    fs.unlink(curr_dir + '/' + my.name + '.cur', function(err) {
      console.log('ERROR: process.destroy: unlink failed for ' + my.user + ':' + my.name);
    });
  };


  /**
   * This functions is in charge of aggregating a 5s-partial aggregate.
   * 5s is not a compulsory value here as we're storing all arrival times
   * and aggregating the whole list of partial aggregate on demand,
   * nevertheless, the systems expects 5s-partial aggregates.
   * @param data the partial aggregate (see engine.js for structure)
   */
  agg = function(data) {
    my.dirty = true;
    my.last = Date.now();

    // handle restart
    if((my.current.uptime || 0) > data.uptime) {
      my.partials = {};
      my.current = {};
    }

    // data.partials -> my.partials
    for(var st in data.partials) {
      my.partials[st] = my.partials[st] || [];
      var p = data.partials[st];
      p.rcv = my.last;
      p.drt = true;
      my.partials[st].push(p);
    }

    // update partials sliding window
    var empty = [];
    for(var st in my.partials) {
      while(my.partials[st].length > 0 && 
            !my.partials[st][0].drt &&
            (my.last - my.partials[st][0].rcv) > my.cfg['DATTSS_USER_CROND_PERIOD']) {
        my.partials[st].splice(0, 1);
      }
      if(my.partials[st].length === 0)
        empty.push(st);
    }
    empty.forEach(function(st) {
      delete my.partials[st];
    });

    // update current
    my.current.uptime = data.uptime;
    my.current.stats = my.current.stats || {};

    for(var st in my.partials) {
      var work = {sum: 0, cnt: 0};
      my.partials[st].forEach(function(p) {
        work.typ = p.typ;
        work.sum += p.sum;
        work.cnt += p.cnt;
        work.max = ((work.max || p.max) > p.max) ? work.max : p.max;
        work.min = ((work.min || p.min) < p.min) ? work.min : p.min;
        work.lst = p.lst;
        work.fst = work.fst || p.fst;
      });
      
      my.current.stats[st] = my.current.stats[st] || {};
      switch(work.typ) {
        case 'c':
          my.current.stats[st] = { typ: 'c',
                                   dte: my.last,
                                   sum: (my.current.status[st].sum || 0) + 
                                          (data.partials[st] ? (data.partials[st].sum || 0) : 0),
                                   avg: (work.sum / work.cnt).toFixed(2) };
          break;
        case 'g':
          my.current.stats[st] = { typ: 'g',
                                   dte: my.last,
                                   lst: work.lst,
                                   dlt: work.lst - work.fst };
          break;
        case 'ms':
          my.current.stats[st] = { typ: 'ms',
                                   dte: my.last,
                                   avg: (work.sum / work.cnt).toFixed(2),
                                   max: work.max,
                                   min: work.min };
          break;
      }
    }

    // evict inactive stats
    var evict = [];
    for(var st in my.current.stats) {
      if(my.last - my.current.stats[st].dte > my.cfg['DATTSS_STAT_EVICTION_PERIOD']) {
        evict.push(st);
      }
    }
    evict.forEach(function(st) {
      delete my.current.stats[st];
    }); 

    that.emit('update');
  };


  /**
   * This functions writes back to disk the current state if dirty as well
   * as the current 1mn-partial aggregate if any 5s-partial aggregate is
   * ready to be committed. Otherwise it does not write anything
   */
  commit = function() {
    if(!my.dirty)
      return;

    var now = Date.now();
    var iso = require('./isoperiod.js').isoperiod({ date: now });

    var user_dir = my.cfg['DATTSS_STORAGE_PATH'] + '/' + my.user;
    var curr_dir = user_dir + '/current';
    var isop_dir = user_dir + '/' + iso.week() + '_' + iso.day();
    var proc_dir = isop_dir + '/' + my.name; 

    var mplex = fwk.mplex({});

    fs.mkdir(user_dir, mplex.callback());
    fs.mkdir(curr_dir, mplex.callback());
    fs.mkdir(isop_dir, mplex.callback());
    fs.mkdir(proc_dir, mplex.callback());

    mplex.go(function() {
      // write back current
      fs.writeFile(curr_dir + '/' + my.name '.cur', JSON.stringify(my.current), 'utf8', function(err) {
        console.log('ERROR: process.commit: current writeFile failed for ' + my.user + ':' + my.name);
      });

      // update partials sliding window
      var empty = [];
      for(var st in my.partials) {
        while(my.partials[st].length > 0 && 
              !my.partials[st][0].drt &&
              (my.last_agg - my.partials[st][0].rcv) > my.cfg['DATTSS_USER_CROND_PERIOD']) {
            my.partials[st].splice(0, 1);
        }
        if(my.partials[st].length === 0)
          empty.push(st);
      }
      empty.forEach(function(st) {
        delete my.partials[st];
      });

      // compute 1mn-partial-aggregates and append to file on disk 
      for(var st in my.partials) {
        my.partials[st].forEach(function(p) {
          assert.ok(p.drt);
          p.drt = false;
        });
  
        var agg = agg_partials(my.partials[st]);
        var path = proc_dir + '/' + st + '.prt';  

        var ws = fs.createWriteStream(path, { flags: 'a', encoding: 'utf8', mode: 0666 });
        ws.write(iso.hour() + '|' + 
                 iso.minute() + '|' +
                 agg.typ + '|' +
                 agg.sum + '|' +
                 agg.cnt + '|' +
                 agg.max + '|' +
                 agg.min + '|' +
                 agg.t10 + '|' +
                 agg.b10 + '|' +
                 agg.fst + '|' +
                 agg.lst);
        ws.destroySoon();
      }
    });
  };


  

  fwk.getter(that, 'last', my, 'last');
  fwk.getter(that, 'dirty', my, 'dirty');
  fwk.getter(that, 'current', my, 'current');

  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'init', init, _super);
  fwk.method(that, 'destroy', destroy, _super);
  fwk.method(that, 'commit', commit, _super);
  
  return that;
};

exports.process = process;

