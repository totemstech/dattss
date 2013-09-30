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
  var start;      /* start();              */
  var agg;        /* agg(uid, data);       */
  var current;    /* current(uid);         */

  //
  // #### _private methods_
  //
  var crond;      /* crond();              */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();

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
        //if((now - my.envs[uid].last()) >
        //   factory.config()['DATTSS_EVICTION_PERIOD']) {
        //  delete my.envs[uid];
        //}
        //else {
          envs_count ++;
          stats_count += my.envs[uid].count();
        //}
      }
    }
    /* DaTtSs */ factory.dattss().agg('environment.active', envs_count + 'g');
    /* DaTtSs */ factory.dattss().agg('environment.stats', stats_count + 'g');
  };

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

        if(!my.envs[uid]) {
          my.envs[uid] = require('./environment.js').environment({
            uid: uid
          });

          my.envs[uid].init(function(err) {
            if(err) {
              factory.log().error(err);
              /* DaTtSs */ factory.dattss().agg('engine.start.error', '1c');
            }
          });
        }
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

    if(!my.envs[uid]) {
      my.envs[uid] = require('./environment.js').environment({
        uid: uid
      });
      my.envs[uid].init(function(err) {
        if(err) {
          factory.log().error(err);
          /* DaTtSs */ factory.dattss().agg('engine.agg.error', '1c');
        }
        else {
          my.envs[uid].agg(data);
        }
      });
    }
    else {
      my.envs[uid].agg(data);
    }

    if(!my.updates[uid] || my.updates[uid] < Date.now() - 1000 * 5) {
      my.updates[uid] = Date.now();
      that.emit(uid + ':update', my.envs[uid].current());
    }

    return true;
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
    if(my.envs[uid]) {
      /* DaTtSs */ factory.dattss().agg('engine.current.ok', '1c');
      return cb_(null, my.envs[uid].current());
    }
    else {
      my.envs[uid] = require('./environment.js').environment({
        uid: uid
      });
      my.envs[uid].init(function(err) {
        if(err) {
          /* DaTtSs */ factory.dattss().agg('engine.current.error', '1c');
          return cb_(err);
        }
        else {
          /* DaTtSs */ factory.dattss().agg('engine.current.ok', '1c');
          return cb_(null, my.envs[uid].current());
        }
      });
    }
  }

  fwk.method(that, 'start', start, _super);
  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'current', current, _super);

  return that;
};

exports.engine = engine;
