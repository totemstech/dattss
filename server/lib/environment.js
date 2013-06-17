/*
 * DaTtSs: environment.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
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
// ## Environment Object
// User specific object. Takes care of all aggregation for a given user
// and computes his current status
// ```
// @extends events.EventEmitter
// @spec { uid }
// ```
//
var environment = function(spec, my) {
  my = my || {};
  var _super = {};

  if(typeof spec.uid !== 'string' ||
     spec.uid === '') {
    throw new Error('Wrong `uid`: ' + spec.uid);
  }

  my.uid = spec.uid;
  my.dirty = false;
  my.last = Date.now();

  my.status = {
    'c':  [],
    'g':  [],
    'ms': []
  };
  my.aggregates = {
    'c':  {},
    'g':  {},
    'ms': {}
  };

  //
  // #### _public methods_
  //
  var init;               /* init(cb_);                    */
  var agg;                /* agg(data);                    */
  var commit;             /* commit();                     */
  var current;            /* current();                    */
  var count;              /* count();                      */


  //
  // #### _private methods_
  //
  var slide_partials;     /* slide_partials(force);        */
  var aggregate_partials; /* aggregate_partials(cleanup);  */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();

  //
  // ### slide_partials
  // Slide the partials to only keep the ones that are within the
  // DATTSS_CROND_PERIOD window. This function is indempotent and can
  // be called as much as needed.
  // ```
  // @force {boolean} whether to force cleaning all partials.
  // ```
  //
  slide_partials = function(force) {
    var now = Date.now();
    ['c', 'g', 'ms'].forEach(function(type) {
      for(var path in my.aggregates[type]) {
        if(my.aggregates[type].hasOwnProperty(path)) {
          /* We keep around dirty partials plus the ones that are less than a */
          /* DATTSS_CROND_PERIOD old (for moving averages)                    */
          while(my.aggregates[type][path].length > 0 &&
                !my.aggregates[type][path][0].drt &&
                (force ||
                 (now - my.aggregates[type][path][0].rcv) >= factory.config()['DATTSS_CROND_PERIOD'])) {
            my.aggregates[type][path].splice(0, 1);
          }
        }
      }
    });
  };

  //
  // ### aggregate_partials
  // Return an aggregation of 5s partials into 1m partials to be stored in
  // database. The trickiest parts are the bottom and top fields as their
  // aggregation is only an approximation of the truth. Other values aggregate
  // naturally
  // ```
  // @cleanup {boolean} whether to remove the partials dirtiness
  // ```
  //
  aggregate_partials = function(cleanup) {
    var aggs = {};

    ['c', 'g', 'ms'].forEach(function(type) {
      aggs[type] = {};

      for(var path in my.aggregates[type]) {
        if(my.aggregates[type].hasOwnProperty(path) &&
           my.aggregates[type][path].length > 0) {
          my.aggregates[type][path].forEach(function(partial) {
            if(cleanup) {
              partial.drt = false;
            }
          });

          aggs[type][path] = factory.agg_partials(my.aggregates[type][path]);
        }
      }
    });

    return aggs;
  };

  //
  // ### init
  // Loads all data relative to the current user
  //
  init = function(cb_) {
    var now = Date.now();
    var c_statuses = factory.data().collection('dts_statuses');
    c_statuses.findOne({
      uid: my.uid,
      slt: factory.slt(my.uid)
    }, function(err, status) {
      if(err) {
        /* DaTtSs */ factory.dattss().agg('environment.init.error', '1c');
        return cb_(err);
      }
      else if(!status) {
        /* DaTtSs */ factory.dattss().agg('environment.init.ok', '1c');
        /* DaTtSs */ factory.dattss().agg('environment.init.ok', (Date.now() - now) + 'ms');
        return cb_();
      }
      else {
        /* DaTtSs */ factory.dattss().agg('environment.init.ok', '1c');
        /* DaTtSs */ factory.dattss().agg('environment.init.ok', (Date.now() - now) + 'ms');
        my.status = status.sts;
        return cb_();
      }
    });
  };

  //
  // ### agg
  // Aggregate a 5s-partial
  // ```
  // @data {object} the data to aggregate
  // ```
  //
  agg = function(data) {
    my.dirty = true;
    my.last = Date.now();

    ['c', 'g', 'ms'].forEach(function(type) {
      /* We keep all partials */
      data.prt[type].forEach(function(partial) {
        partial.rcv = my.last;
        partial.drt = true;
        my.aggregates[type][partial.pth] = my.aggregates[type][partial.pth] || [];
        my.aggregates[type][partial.pth].push(partial);
      });

      /* Update current status */
      for(var path in my.aggregates[type]) {
        if(my.aggregates[type].hasOwnProperty(path)) {
          /* Retrieve last partial for the given path */
          var last_partial = {};
          data.prt[type].forEach(function(partial) {
            if(partial.pth === path) {
              last_partial = partial;
            }
          });

          /* Retrieve last status for the given path */
          var last_status = {};
          for(var i = my.status[type].length - 1; i >= 0; i--) {
            if(my.status[type][i].pth === path) {
              last_status = my.status[type][i];
              my.status[type].splice(i, 1);
            }
          }

          /* Compute new status */
          var work = {
            typ: type,
            sum: 0,
            cnt: 0
          };
          my.aggregates[type][path].forEach(function(partial) {
            work.sum += partial.sum;
            work.cnt += partial.cnt;
            work.max = ((work.max || partial.max) > partial.max) ?
              work.max : partial.max;
            work.min = ((work.min || partial.min) < partial.min) ?
              work.min : partial.min;
            work.lst = partial.lst;
            work.fst = (work.fst === null) ? partial.fst : work.fst;
            work.emp = work.emp || partial.emp;
          });

          switch(work.typ) {
            case 'c': {
              var sec = factory.config()['DATTSS_CROND_PERIOD'] / 1000;
              my.status[type].push({
                typ: 'c',
                pth: path,
                emp: (work.emp === null) ?
                  (last_status.emp || false) : work.emp,
                sum: (last_status.sum || 0) + (last_partial.sum || 0),
                avg: (work.sum / sec).toFixed(2)
              });
              break;
            }
            case 'g': {
              my.status[type].push({
                typ: 'g',
                pth: path,
                emp: (work.emp === null) ?
                  (last_status.emp || false) : work.emp,
                lst: (work.lst === null) ? (last_status.lst || null) : work.lst,
                avg: (work.cnt !== 0) ? (work.sum / work.cnt).toFixed(2) : null,
                max: work.max,
                min: work.min
              });
              break;
            }
            case 'ms': {
              my.status[type].push({
                typ: 'ms',
                pth: path,
                emp: (work.emp === null) ?
                  (last_status.emp || false) : work.emp,
                avg: (work.cnt !== 0) ? (work.sum / work.cnt).toFixed(2) : null,
                max: work.max,
                min: work.min
              });
              break;
            }
          };
        }
      }
    });

    /* DaTtSs */ factory.dattss().agg('environment.agg.ok', '1c');
    that.emit('update');

    return true;
  };

  //
  // ### commit
  // Computes 1m-aggregates and store them in database. This function is called
  // every DATTSS_CROND_PERIOD.
  //
  commit = function(cb_) {
    if(!my.dirty) {
      return;
    }

    /* Save current status to database to avoid data loss on reboot */
    var current = {
      sts: fwk.shallow(my.status),
      uid: my.uid,
      slt: factory.slt(my.uid)
    };
    var c_statuses = factory.data().collection('dts_statuses');
    c_statuses.update({
      uid: current.uid,
      slt: current.slt
    }, current, {
      upsert: true
    }, function(err) {
      if(err) {
        /* Not a problem as it will be saved on next commit */
        /* DaTtSs */ factory.dattss().agg('environment.commit.current.error', '1c');
        factory.log().error(err);
      }
      else {
        /* DaTtSs */ factory.dattss().agg('environment.commit.current.ok', '1c');
      }
    });

    /* Compute 1m-aggregates and save them */
    slide_partials(true);
    var aggs = aggregate_partials(true);
    var dte = factory.aggregate_date(new Date(), true);
    var c_aggregates = factory.data().collection('dts_aggregates');

    ['c', 'g', 'ms'].forEach(function(type) {
      for(var path in aggs[type]) {
        if(aggs[type].hasOwnProperty(path)) {
          var prt = {
            uid: my.uid,
            slt: factory.slt(my.uid + '-' + dte),
            typ: type,
            dte: dte,
            pth: path
          };
          for(var key in aggs[type][path]) {
            if(aggs[type][path].hasOwnProperty(key)) {
              prt[key] = aggs[type][path][key];
            }
          }

          c_aggregates.update({
            uid: prt.uid,
            slt: prt.slt,
            dte: prt.dte,
            pth: prt.pth,
            typ: prt.typ
          }, prt, {
            upsert: true
          }, function(err) {
            if(err) {
              /* DaTtSs */ factory.dattss().agg('environment.commit.aggs.error', '1c');
              factory.log().error(err);
            }
            else {
              /* DaTtSs */ factory.dattss().agg('environment.commit.aggs.ok', '1c');
            }
          });
        }
      }
    });
  };

  //
  // ### current
  // Returns the current status
  //
  current = function() {
    var current = fwk.shallow(my.status);
    ['c', 'g', 'ms'].forEach(function(type) {
      current[type].sort(function(a, b) {
        if(a.pth < b.pth) return -1;
        if(a.pth > b.pth) return 1;
        return 0;
      });
    });
    return current;
  };

  //
  // ### count
  // Return the number of stats active in this environment
  //
  count = function() {
    var count = 0;
    ['c', 'g', 'ms'].forEach(function(type) {
      count += my.status[type].length;
    });
    return count;
  };

  fwk.getter(that, 'last', my, 'last');

  fwk.method(that, 'init', init, _super);
  fwk.method(that, 'agg', agg, _super);
  fwk.method(that, 'commit', commit, _super);
  fwk.method(that, 'current', current, _super);
  fwk.method(that, 'count', count, _super);

  return that;
};

exports.environment = environment;
