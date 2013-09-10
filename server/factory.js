/**
 * DaTtSs: Factory
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-15  n1t0    Creation
 */

var fwk = require('fwk');
var crypto = require('crypto');
var client = require('mongodb').MongoClient;
var MongoSessionStore = require('connect-mongodb');
var fs = require('fs');

//
// ## Factory object
//
// Loads and manages all dependencies
//
var factory = function(spec, my) {
  var _super = {};
  my = my || {};

  //
  // #### _public methods_
  //
  var slt;                          /* slt(str);                  */
  var hash;                         /* hash(strings, encoding);   */
  var aggregate_date;               /* aggregate_date(date);      */
  var agg_to_date;                  /* agg_to_date(date);         */
  var agg_partials;                 /* agg_partials(partials);    */

  var config;                       /* config();                  */
  var access;                       /* access();                  */
  var data;                         /* data();                    */
  var session_store;                /* session_store();           */
  var email;                        /* email();                   */
  var dattss;                       /* dattss();                  */
  var engine;                       /* engine();                  */

  var cleanup;                      /* cleanup();                 */

  var init;                         /* init(cb_);                 */

  //
  // #### _private methods_
  //

  //
  // #### _that_
  //
  var that = fwk.factory(spec, my);

  //
  // ### slt
  // Computes a crypto hashed salt value from a given string
  // ```
  // @str {string} the string to hash from
  // ```
  //
  slt = function(str) {
    var b = new Buffer(hash([str], 'binary'), 'binary');
    return (b.readUInt32BE(0) % that.config()['DATTSS_SALT_SPACE']);
  };

  //
  // ### hash
  // Computes a hash value from the given strings
  // ```
  // @strings {string array} an array of strings used to update HMAC
  // @encoding {string} the encoding used [optional] (default: 'hex')
  // ```
  //
  hash = function(strings, encoding) {
    encoding = encoding || 'hex';
    var hash = crypto.createHmac('sha1', that.config()['DATTSS_HMAC']);
    strings.forEach(function(update) {
      hash.update(new Buffer(update));
    });
    return hash.digest(encoding);
  };

  //
  // ### aggregate_date
  // Return aggregate date (UTC) computed from the given date with a minute
  // precision.
  // ```
  // @date {Date} the date to compute
  // @utc {boolean} whether to use UTC
  // ```
  //
  aggregate_date = function(date, utc) {
    var agg = '';
    var pad = function(n) {
      if(n < 10) {
        return '0' + n;
      }
      return n;
    }

    var year = 'get' + (utc ? 'UTC' : '') + 'FullYear';
    var month = 'get' + (utc ? 'UTC' : '') + 'Month';
    var days = 'get' + (utc ? 'UTC' : '') + 'Date';
    var hours = 'get' + (utc ? 'UTC' : '') + 'Hours';
    var minutes = 'get' + (utc ? 'UTC' : '') + 'Minutes';

    agg += date[year]();
    agg += '-' + pad(date[month]() + 1);
    agg += '-' + pad(date[days]());
    agg += '-' + pad(date[hours]());
    agg += '-' + pad(date[minutes]());

    return agg;
  };

  //
  // ### agg_to_date
  // Return a date computed from an aggregate date
  // ```
  // @date {string} the aggregated date
  // ```
  //
  agg_to_date = function(date) {
    var date_r = /^([0-9]{4})-([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{2})$/;
    var d = date_r.exec(date);

    if(!d || d.length < 6) {
      throw new Error('Wrong date: ' + date);
    }

    return new Date(parseInt(d[1], 10),
                    parseInt(d[2], 10) - 1,
                    parseInt(d[3], 10),
                    parseInt(d[4], 10),
                    parseInt(d[5], 10));
  };

  //
  // agg_partials
  // Aggregates partials.
  // The trickiest part are the bot, top fields as their aggregation
  // is only an approximation of the truth. Other values aggregate naturally.
  // ```
  // @partials {array} of partials as stored in my.partials[st]
  //                   partials are expected to be orderd by arrival time
  // @return {object} an aggregated partial object
  // ```
  //
  agg_partials = function(partials) {
    var agg = {sum: 0, cnt: 0};
    var work = [], acc = 0;

    partials.forEach(function(p) {
      work.push({cnt: p.cnt, top: p.top, bot: p.bot});
      agg.typ = p.typ;
      agg.pct = p.pct;
      agg.sum += p.sum;
      agg.cnt += p.cnt;
      agg.max = ((agg.max || p.max) > p.max) ? agg.max : p.max;
      agg.min = ((agg.min || p.min) < p.min) ? agg.min : p.min;
      agg.lst = p.lst;
      agg.fst = (typeof agg.fst === 'undefined') ? p.fst : agg.fst;
    });

    /* top calculation */
    work.sort(function(a,b) { return b.top - a.top; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.top = work[i].top;
      acc += work[i].cnt;
      if(acc >= agg.cnt * agg.pct)
        break;
    }

    /* bot calculation */
    work.sort(function(a,b) { return a.bot - b.bot; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.bot = work[i].bot;
      acc += work[i].cnt;
      if(acc >= agg.cnt * agg.pct)
        break;
    }

    return agg;
  };

  //
  // ### config
  // Return config object
  //
  config = function() {
    if(!my.cfg) {
      my.cfg = fwk.populateConfig(require("./config.js").config);
    }
    return my.cfg;
  };

  //
  // ### access
  // Return access object
  //
  access = function() {
    if(!my.access) {
      my.access = require('./lib/access.js').access({});
    }
    return my.access;
  };

  //
  // ### data
  // Return mongo-data object
  //
  data = function() {
    if(my.initialized) {
      return my.data;
    }
    throw new Error('Use factory.init() first');
  };

  //
  // ### session_store
  // Return the mongo-based session store object
  //
  session_store = function() {
    if(!my.session_store) {
      my.session_store = new MongoSessionStore({
        db: that.data(),
        collection: 'dts_sessions',
        reapInterval: 10 * 60 * 1000
      });
    }
    return my.session_store;
  };

  //
  // ### email
  // Return the email object
  //
  email = function() {
    if(!my.email) {
      var sendgrid = require('sendgrid').SendGrid;
      my.email = new sendgrid(that.config()['DATTSS_SENDGRID_USER'],
                              that.config()['DATTSS_SENDGRID_PASS']);
    }
    return my.email;
  };

  //
  // ### dattss
  // Return the dattss object
  //
  dattss = function() {
    if(!my.dattss) {
      my.dattss = require('../clients/nodejs/lib/dattss.js').dattss({
        auth: that.config()['DATTSS_SRV_AUTH_KEY'],
        http_host: 'localhost',
        http_port: 3002
      });
    }
    return my.dattss;
  };

  //
  // ### engine
  // Return the engine object
  //
  engine = function() {
    if(!my.engine) {
      my.engine = require('./lib/engine.js').engine();
      my.engine.start();
    }
    return my.engine;
  };

  //
  // ### cleanup
  // Clean database aggregates according to `DATTSS_HISTORY_PERIOD`
  //
  cleanup = function() {
    if(!my.initialized)
      return;

    var c_aggregates = that.data().collection('dts_aggregates');
    var date = aggregate_date(new Date(Date.now() -
                                       that.config()['DATTSS_HISTORY_PERIOD']),
                              true);

    that.log().out('[CLEANUP] Starting...');
    c_aggregates.remove({
      dte: {
        $lt: date
      }
    }, function(err) {
      if(err) {
        that.log().error(err);
      }
      else {
        that.log().out('[CLEANUP] Done.');
      }
    });
  };

  //
  // ### init
  // Initialize modules that need to, like mongo
  // ```
  // @cb_ {function(err)}
  // ```
  //
  init = function(cb_) {
    if(my.initialized)
      return cb_();

    my.initialized = true;

    var options = {
      db: {
        native_parser: false,
      },
      server: {
        auto_reconnect: true
      }
    };

    if(that.config()['DEBUG']) {
      that.log().out('DEBUG mode');
      my.DEBUG = true;
    }

    client.connect(that.config()['DATTSS_MONGO_URL'],
                   options,
                   function(err, db) {
                     if(err) {
                       my.initialized = false;
                       return cb_(err);
                     }
                     else {
                       that.log().out('Mongo [data]:  OK');
                       my.data = db;

                       cleanup();
                       setInterval(cleanup, 60 * 60 * 1000);
                       return cb_();
                     }
                   });
  };

  fwk.method(that, 'slt', slt, _super);
  fwk.method(that, 'hash', hash, _super);
  fwk.method(that, 'aggregate_date', aggregate_date, _super);
  fwk.method(that, 'agg_to_date', agg_to_date, _super);
  fwk.method(that, 'agg_partials', agg_partials, _super);

  fwk.method(that, 'config', config, _super);
  fwk.method(that, 'access', access, _super);
  fwk.method(that, 'data', data, _super);
  fwk.method(that, 'session_store', session_store, _super);
  fwk.method(that, 'email', email, _super);
  fwk.method(that, 'dattss', dattss, _super);
  fwk.method(that, 'engine', engine, _super);

  fwk.method(that, 'init', init, _super);

  return that;
};

exports.factory = factory({ name: 'dattss-server' });
