var fwk = require('fwk');

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
   * @param process the process name
   * @param cb(err, process) the result callback
   */
  process_init = function(user, process, cb) {
    var p = require('./process').process({ cfg: cfg, 
                                           user: user,
                                           name: process });
    p.init(function(err) {
      if(err) {
        cb(err);
      }
      else {
        // update mechanism
        p.on('update', function() {
          that.emit(user, process, p.current());
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

  process_evict = function(user, process) {
    
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
                       var mcb = mplex.callback();
                       process_init(user, f, function(err, p) {
                         if(err) {
                           console.log('ENGINE `user_get`: Load failed for ' + user + ':' + f);
                         }
                         else {
                           my.users[user][process] = p;
                           mcb();
                         }
                       });
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
   * given app and updates the current state and minute partial agg.
   * A partial aggregate *MUST HAVE* the following format:
   * data = { app: "core",
   *          uptime: 123123,
   *          partials: { "new": { typ: 'c',
   *                               sum: 376,
   *                               cnt: 340,
   *                               max: 3,
   *                               min: 1,
   *                               t10: 3,
   *                               b10: 1,
   *                               fst: 1,
   *                               lst: 1 }          // unused for 'c'
   *                      "clients": { type: 'g', 
   *                                   sum: 990,     // unused for 'g'
   *                                   cnt: 45,
   *                                   max: 23,
   *                                   min: 21,
   *                                   t10: 23,
   *                                   b10: 22,
   *                                   fst: 23,
   *                                   lst: 22 },
   *                      "view": { type: 'ms',
   *                                sum: 5670,
   *                                cnt: 45,
   *                                max: 1240,
   *                                min: 9,
   *                                t10: 500,
   *                                b10: 34,
   *                                fst: 456,
   *                                lst: 123 } } };   // unused for 'ms'
   * 5s-partial aggregates are calculated client side and aggregated
   * (with approximation) server side to build rolling 1mn-partial 
   * aggregates to be stored on disk every 1mn. 
   */
  agg = function(user, process, data) {
    user_get(function(err, u) {
      if(err) {
        console.log('ENGINE AGG: Load failed for ' + user);
      }
      else {
        if(typeof u[process] !== 'undefined') {
          u[process].agg(data);
        }
        else {
          process_init(user, process, function(err, p) {
            my.users[user][process] = p;
            p.agg(data);
          });
        }
      }
    });
  };
  

  /**
   * The current state of an user is dictionary for each app that the
   * user have live which cotains the folowing information:
   * current['core'] = { app: "core",
   *                     uptime: 123123,
   *                     stats: { "new": { typ: 'c',
   *                                       sum: 534869,
   *                                       avg: 75.37 },        // 1mn average
   *                              "clients": { typ: 'g',
   *                                           lst: 22,
   *                                           dlt: -2.23 },    // 1mn delta
   *                              "view": { typ: 'ms',
   *                                        avg: 126.34,
   *                                        max: 1547,
   *                                        min: 67 } } };    // 1mn maximum
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
  

  return that;
};

exports.engine = engine;
