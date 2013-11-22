/*
 * DaTtSs: engine.js
 *
 * (c) Copyright Teleports Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-22  n1t0    Creation
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;
var events = require('events');
var util = require('util');

//
// ## Engine Object
// In charge of receiving, storing and updating stats (counters, gauges, timers)
//
// Engine offers a fairly simple interface:
//   - `agg` is the aggregation interface which receives partial aggregates from
//     the client.
//   - `on` for realtime reporting of updates
//
// ```
// @extends events.EventEmitter
// @spec {}
// ```
//
var engine = function(spec, my) {
  my = my || {};
  var _super = {};

  my.envs = {};
  my.updates = {};

  //
  // #### _public methods_
  //
  var start;           /* start();                      */
  var agg;             /* agg(uid, data);               */
  var refresh_alerts;  /* refresh_alerts(uid, cb_);     */
  var current;         /* current(uid, cb_);            */
  var add_process;     /* add_process(uid, name, cb);   */
  var processes;       /* processes(uid, cb_);          */
  var kill_process;    /* kill_process(uid, name, cb_); */

  //
  // #### _private methods_
  //
  var crond;      /* crond();              */
  var get_env;    /* get_env(uid, cb_);    */
  var update;     /* update(uid);          */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();

  /****************************************************************************/
  /*                             PRIVATE METHODS                              */
  /****************************************************************************/
  //
  // ### crond
  // Takes care of environments (commit, eviction, ..). This function is called
  // every DATTSS_CROND_PERIOD (1mn)
  //
  crond = function() {
    var now = Date.now();
    var envs_count = 0;
    var stats_count = 0;
    for(var uid in my.envs) {
      if(my.envs.hasOwnProperty(uid)) {
        my.envs[uid].commit();
        envs_count ++;
        stats_count += my.envs[uid].count();
      }
    }
    /* DaTtSs */ factory.dattss().agg('environment.active', envs_count + 'g');
    /* DaTtSs */ factory.dattss().agg('environment.stats', stats_count + 'g');
  };

  //
  // ### get_env
  // Initialized the environment for a specific user if it does not
  // exist then return it
  // ```
  // @uid {string} the user ID
  // @cb_ {function(err)}
  // ```
  //
  get_env = function(uid, cb_) {
    if(my.envs[uid]) {
      return cb_(null, my.envs[uid]);
    }
    else {
      my.envs[uid] = require('./environment.js').environment({
        uid: uid
      });

      my.envs[uid].init(function(err) {
        if(err) {
          return cb_(err);
        }
        else {
          my.envs[uid].on('update', function() {
            return update(uid);
          });
          return cb_(null, my.envs[uid]);
        }
      });
    }
  };

  //
  // ### update
  // Emit an update if enough time elapsed since last one
  // ```
  // @uid  {string}   the user ID
  // ```
  //
  update = function(uid) {
    if(!my.updates[uid] || my.updates[uid] < Date.now() - 1000 * 5) {
      my.updates[uid] = Date.now();
      that.emit(uid + ':update', {
        status: my.envs[uid].current(),
        processes: my.envs[uid].processes()
      });
    }
  };

  /****************************************************************************/
  /*                             PUBLIC INTERFACE                             */
  /****************************************************************************/
  //
  // ### start
  // Does everything that needs to be done before starting the work
  //
  start = function() {
    /* Loads envs for each user */
    var c_users = factory.data().collection('dts_users');
    c_users.find({}).each(function(err, user) {
      if(err) {
        factory.log().error(err);
        /* DaTtSs */ factory.dattss().agg('engine.start.error', '1c');
      }
      else if(user) {
        var uid = user.uid;

        /* initialize env by getting it */
        get_env(uid, function(err, env) {
          if(err) {
            factory.log().error(err);
            /* DaTtSs */ factory.dattss().agg('engine.start.error', '1c');
          }
        });
      }
      else {
        if(!my.crond_itv) {
          factory.log().out('Engine started');
          my.crond_itv = setInterval(crond, factory.config()['DATTSS_CROND_PERIOD']);
        }
      }
    });
  };

  //
  // ### agg
  // Aggregates partials received from processes and updates the current state.
  // A partial aggregate *MUST HAVE* the following format:
  // ```
  // data = {
  //   prt: {
  //     'c': [ {
  //       typ: 'c',
  //       pth: 'routes.get_user',
  //       sum: 376,
  //       cnt: 340,
  //       max: 3,
  //       min: 1,
  //       top: 3,
  //       bot: 1,
  //       fst: 1,
  //       lst: 1
  //     } ],
  //     'ms': [ {
  //       typ: 'ms',
  //       pth: 'request',
  //       sum: 990,
  //       cnt: 45,
  //       max: 23,
  //       min: 21,
  //       top: 23,
  //       bot: 22,
  //       fst: 23,
  //       lst: 22
  //     } ],
  //     'g': [ {
  //       typ: 'c',
  //       pth: 'views',
  //       sum: 5670,
  //       cnt: 45,
  //       max: 1240,
  //       min: 9,
  //       top: 500,
  //       bot: 34,
  //       fst: 456,
  //       lst: 123
  //     } ]
  //   }
  // };
  // ```
  // 5s-partial aggregates are calculated client side and aggregated (with
  // approximation) server side to build sliding 1mn-partial aggregates to
  // be stored in database every minutes
  //
  // ```
  // @uid {string} the user id
  // @data {object} the data to aggregate
  // ```
  //
  agg = function(uid, data) {
    if(typeof data.prt === 'undefined' ||
       !Array.isArray(data.prt.c) ||
       !Array.isArray(data.prt.ms) ||
       !Array.isArray(data.prt.g)) {
      return false;
    }
    for(var i in data.prt.c) {
      var prt = data.prt.c[i];
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.pth)) {
        return false;
      }
    }
    for(var i in data.prt.ms) {
      var prt = data.prt.ms[i];
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.pth)) {
        return false;
      }
    }
    for(var i in data.prt.g) {
      var prt = data.prt.g[i];
      if(!/^([A-Za-z0-9\-\_\.\:]+)$/.exec(prt.pth)) {
        return false;
      }
    };

    get_env(uid, function(err, env) {
      if(err) {
        factory.log().error(err);
        /* DaTtSs */ factory.dattss().agg('engine.agg.error', '1c');
      }
      else {
        env.agg(data);
      }
    });

    update(uid);

    return true;
  };

  //
  // ### refresh_alerts
  // Refresh alerts on the given environment after the user added/removed one.
  // ```
  // @uid {string} the user unique id
  // @cb_ {function(err)}
  // ```
  refresh_alerts = function(uid, cb_) {
    get_env(uid, function(err, env) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('engine.refresh_alerts.error', '1c');
        return cb_(err);
      }
      else {
        /* DaTtSs */ factory.dattss().agg('engine.refresh_alerts.ok', '1c');
        return env.load_alerts(cb_);
      }
    });
  };

  //
  // ### current
  // The current state for a given user represents a dictionnary with the status
  // of all paths right now: type, counts, averages, ...
  // ```
  // @uid {string} the user ID
  // @cb_ {function(err, current)}
  // ```
  //
  current = function(uid, cb_) {
    get_env(uid, function(err, env) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('engine.current.error', '1c');
        return cb_(err);
      }
      else {
        /* DaTtSs */ factory.dattss().agg('engine.current.ok', '1c');
        return cb_(null, env.current());
      }
    });
  };

  //
  // ### add_process
  // Add a process to a given user
  // ```
  // @uid  {string} the user ID
  // @name {string} the process name
  // @btn  {function()}
  // ```
  //
  add_process = function(uid, name, btn) {
    get_env(uid, function(err, env) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('engine.processes.error', '1c');
        /* nothing else to do */
        return;
      }
      else {
        /* DaTtSs */ factory.dattss().agg('engine.processes.ok', '1c');
        return env.add_process(name, btn);
      }
    });
  };

  //
  // ### processes
  // Compute processes for a given user
  // ```
  // @uid {string} the user ID
  // @cb_ {function(err, processes)}
  // ```
  //
  processes = function(uid, cb_) {
    get_env(uid, function(err, env) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('engine.processes.error', '1c');
        return cb_(err);
      }
      else {
        /* DaTtSs */ factory.dattss().agg('engine.processes.ok', '1c');
        return cb_(null, env.processes());
      }
    });
  };

  //
  // ### kill_process
  // Kill the given process
  // ```
  // @uid {string} the user ID
  // @name {string} the process name
  // @cb_ {function(err)}
  // ```
  //
  kill_process = function(uid, name, cb_) {
    get_env(uid, function(err, env) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('engine.processes.error', '1c');
        return cb_(err);
      }
      else {
        /* DaTtSs */ factory.dattss().agg('engine.processes.ok', '1c');
        return env.kill_process(name, cb_);
      }
    });
  };

  fwk.method(that, 'start', start, _super);
  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'refresh_alerts', refresh_alerts, _super);
  fwk.method(that, 'current', current, _super);
  fwk.method(that, 'add_process', add_process, _super);
  fwk.method(that, 'processes', processes, _super);
  fwk.method(that, 'kill_process', kill_process, _super);

  return that;
};

exports.engine = engine;
