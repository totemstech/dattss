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

  var config;                       /* config();                  */
  var access;                       /* access();                  */
  var data;                         /* data();                    */
  var session_store;                /* session_store();           */
  var email;                        /* email();                   */
  var dattss;                       /* dattss();                  */

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
        collection: 'dts-sessions',
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
        auth: 'b22b7b32acb9e606befec211b738316beb191c23.68a3db19f8d51757e3dda7b53a4aa667519ce0ed',
        name: my.name
      });
    }
    return my.dattss;
  }

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
                       return cb_();
                     }
                   });
  };

  fwk.method(that, 'slt', slt, _super);
  fwk.method(that, 'hash', hash, _super);

  fwk.method(that, 'config', config, _super);
  fwk.method(that, 'access', access, _super);
  fwk.method(that, 'data', data, _super);
  fwk.method(that, 'session_store', session_store, _super);
  fwk.method(that, 'email', email, _super);
  fwk.method(that, 'dattss', dattss, _super);

  fwk.method(that, 'init', init, _super);

  return that;
};

exports.factory = factory({ name: 'dattss' });