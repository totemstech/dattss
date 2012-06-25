var fwk = require('fwk');
var events = require('events');
var util = require('util');

/**
 * Engine Object 
 *
 * in charge of receiving, storing, updating counters received
 * from users/apps.
 *
 * Engine offers a fairly simple interface:
 * - `agg` is the aggregation interface which receives partial aggregates
 *   from the apps, stores it in memory in the `app` object and make sure
 *   to write it to disk every minutes (minute partial aggregates as well
 *   as current status)
 * - `warning` / `error` for error tracking stream
 * - on(user) for realtime reporting of updates
 * - current(user) to retrive current state for a user
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg}
 */
var engine = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg; 

  my.users = {};

  // public
  var agg;                    /* agg(user, app, data); */
  var error;                  /* error(user, errors); */
  var warning;                /* warning(user, warnings); */

  var current;                /* current(user, cb); */
  
  // private
  var user_get;               /* user_get(user, cb); */
  var user_crond;             /* user_crond() */
  var user_evict;             /* user_evict(user) */
  var process_init;           /* process_init(user, process, cb); */

  var that = new events.EventEmitter();


  /*********************************************
   *  USER MANAGEMENT PRIVATE FUNCTIONS        *
   *********************************************/

  /**
   * Handles the asycnrhonous loading of a process. If the process does
   * not exist, then it is created.
   * @param user the user name or email
   * @param name the process name
   * @param cb(err, process) the result callback
   */
  process_init = function(user, name, cb) {
    var p = require('./process').process({ cfg: cfg, 
                                           user: user,
                                           name: name });
    p.init(function(err) {
      if(err) {
        cb(err);
      }
      else {
        // update mechanism
        p.on('update', function() {
          that.emit(user, name, p.current());
        });
        cb(null, p);
      }
    });
  };


  /**
   * Handles the removal of the processes listeners before eviction
   * of an entire user (after a given period of inactivity)
   */
  user_evict = function(user) {
    if(typeof my.users[user] !== 'undefined') {
      for(p in my.users[user]) {
        my.users[user][p].removeAllListeners();
        my.users[user][p].destroy();
      }
      delete my.users[user];
    }
  };


  /**
   * Called every minutes, the user_crond method calls commit on users
   * and evicts users that have been inactive for a given period
   */
  user_crond = function() {
    for(var u in my.users) {
      var last = 0;
      for(var p in my.users[u]) {
        if(my.users[u][p].last() > last) {
          last = my.users[u][p].last();
        }
        my.users[u][p].commit();
      }
      if(Date.now() - last > my.cfg['DATTSS_USER_EVICTION_PERIOD']) {
        user_evict(u);
      }
    }
  };

  /**
   * `user_crond` interval call every minute
   */
  my.itv = setInterval(user_crond, my.cfg['DATTSS_USER_CROND_PERIOD']);

  /**
   * Retrieves the current user (actually its list of processes) that are
   * still on disk in its `current` directory and put them in memory, or
   * directly return them if they where alread loaded
   * @param user the user name or email
   * @param cb(err, u) callback with error reporting
   */
  user_get = function(user, cb) {
    if(typeof my.users[user] === 'undefined') {
      my.users[user] = {};
      fs.readdir(my.cfg['DATTSS_STORAGE_PATH'] + '/current/' + my.user + '/', 
                 function(err, files) {
                   if(err) {
                     cb(err);
                   }
                   else {
                     var mplex = fwk.mplex({});
                     files.forEach(function(f) {
                       if(f.substr(-3,3) === '.cur') {
                         var name = f.substr(0, f.length-3);
                         var mcb = mplex.callback();
                         process_init(user, name, function(err, p) {
                           if(err) {
                             console.log('ERROR: [engine] `user_get`: ' +
                                         'Load failed for ' + user + ':' + name);
                           }
                           else {
                             my.users[user][name] = p;
                           }
                           mcb();
                         });
                       }
                     });
                     mplex.go(function() {
                       cb(null, my.users[user]);
                     });
                   }
      });
    }
    else {
      cb(null, my.users[user]);
    }
  };


  /*********************************************
   *  PUBLIC FUNCTIONS                         *
   *********************************************/

  /**
   * Partial aggregation function. Receives partial aggregates from a
   * given process and updates the current state and minute partial agg.
   * A partial aggregate *MUST HAVE* the following format:
   * data = { nam: "core",
   *          upt: 123123,
   *          mem: 13996032,
   *          prt: { 'c': [{ typ: 'c',
   *                         nam: 'new'
   *                         sum: 376,
   *                         cnt: 340,
   *                         max: 3,
   *                         min: 1,
   *                         top: 3,
   *                         bot: 1,
   *                         fst: 1,
   *                         lst: 1 }],
   *                 'ms': [{ typ: 'g', 
   *                          nam: 'cache',
   *                          sum: 990,          
   *                          cnt: 45,
   *                          max: 23,
   *                          min: 21,
   *                          top: 23,
   *                          bot: 22,
   *                          fst: 23,
   *                          lst: 22 }],
   *                 'g': [{ typ: 'ms',
   *                         nam: 'view',
   *                         sum: 5670,
   *                         cnt: 45,
   *                         max: 1240,
   *                         min: 9,
   *                         top: 500,
   *                         bot: 34,
   *                         fst: 456,
   *                         lst: 123 }] 
   *            } 
   *         };   
   * 5s-partial aggregates are calculated client side and aggregated
   * (with approximation) server side to build sliding 1mn-partial 
   * aggregates to be stored on disk every 1mn. 
   */
  agg = function(user, data) {
    console.log(user);
    console.log(util.inspect(data, false, 10));
    // normalization
    if(typeof data.nam !== 'string' ||
       typeof data.upt !== 'number' ||
       typeof data.prt === 'undefined' ||
       !Array.isArray(data.prt.c) ||
       !Array.isArray(data.prt.ms) ||
       !Array.isArray(data.prt.g)) {
         return false;
    }
    if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(data.nam))
      return false;
    data.prt.c.forEach(function(prt) {
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.nam))
        return false;
    });
    data.prt.ms.forEach(function(prt) {
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.nam))
        return false;
    });
    data.prt.g.forEach(function(prt) {
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.nam))
        return false;
    });
    
    // init user/process and aggregate
    user_get(function(err, u) {
      if(err) {
        console.log('ERROR: [engine] `agg`: ' + 
                    'Load failed for ' + user);
      }
      else {
        if(typeof u[data.nam] !== 'undefined') {
          u[data.nam].agg(data);
        }
        else {
          process_init(user, data.nam, function(err, p) {
            my.users[user][data.nam] = p;
            p.agg(data);
          });
        }
      }
    });

    return true;
  };
  

  /**
   * The current state of an user is dictionary for each app that the
   * user have live which cotains the folowing information:
   * current['core'] = { nam: "core",
   *                     upt: 123123,
   *                     mem: 19238123,
   *                     sts: { 'c': [{ typ: 'c',
   *                                    nam: 'new',
   *                                    sum: 534869,
   *                                    avg: 75.37 }],
   *                            'g': [{ typ: 'g',
   *                                    nam: 'cache',
   *                                    lst: 22,
   *                                    dlt: -2.23 },
   *                                  { typ: 'g',
   *                                    nam: 'clients',
   *                                    lst: 123,
   *                                    dlt: 3.23 }],
   *                            'ms': [{ typ: 'ms',
   *                                     nam: 'view',
   *                                     avg: 126.34,
   *                                     max: 1547,
   *                                     min: 67 }] 
   *                           } 
   *                      }; 
   * The current data is calculated by each process object and stored
   * every minute on the disk in case of restart. The current data is 
   * calculated from the 5s-partial aggregate it receives.
   */
  current = function(user, cb) {
    user_get(function(err, u) {
      if(err) {
        cb(err);
      }
      else {
        var cur = {};
        for(var p in u) {
          cur[p] = u[p].current(); 
        }
        cb(null, cur);
      }
    });
  };

  
  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'current', current, _super);

  return that;
};

exports.engine = engine;
