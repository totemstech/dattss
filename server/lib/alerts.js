/*
 * DaTtSs: alerts.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-09-12 n1t0     Creation
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;
var swig = require('swig');

//
// ## Alerts object
// Manages alerts and how they will be sent.
// Alerts are sent immediately if the user didn't get any others during the last
// 10 minutes otherwise we queue them and wait until these 10 minutes elapse.
// ```
// @spec {}
// ```
//
var alerts = function(spec, my) {
  my = my || {};
  var _super = {};

  my.alerts = {};
  my.processed = {};

  //
  // ### _public methods_
  //
  var add;    /* add(uid, alerts); */

  //
  // ### _private methods_
  //

  //
  // ### _that_
  //
  var that = {};

  //
  // ### add
  // ```
  // @uid {string} the user id
  // @alerts {array} an array of alerts
  // ```
  //
  add = function(uid, alerts) {
    if(!my.initialized) {
      factory.log().error(new Error('Must be initialized first'));
      return;
    }

    if(!my.alerts[uid]) {
      my.alerts[uid] = [];
    }

    my.alerts[uid] = my.alerts[uid].concat(alerts);
  };

  //
  // ### Batch
  // Send a batch of alerts by email to each user having some alerts waiting
  //
  send_batch = function() {
    for(var uid in my.alerts) {
      if(my.alerts.hasOwnProperty(uid) &&
         my.alerts[uid].length > 0 &&
         !(my.processed[uid] &&
           my.processed[uid] > Date.now() - factory.config()['DATTSS_BTW_ALERTS'])) {
        my.processed[uid] = Date.now();

        var alerts = my.alerts[uid].splice(0, factory.config()['DATTSS_MAX_ALERTS']);
        var others = my.alerts[uid].length;
        console.log(others);
        delete my.alerts[uid];

        var template = swig.compileFile('./templates/alert.html');
        var body = template({
          alerts: alerts,
          others: others
        });

        var c_users = factory.data().collection('dts_users');
        c_users.findOne({
          uid: uid
        }, function(err, user) {
          if(err) {
            factory.log().error(err);
          }
          else if(!user) {
            factory.log().debug('Alert - user does not exist: ' + uid);
          }
          else {
            factory.email().send({
              to: user.eml,
              from: factory.config()['DATTSS_SENDGRID_FROM'],
              fromname: factory.config()['DATTSS_SENDGRID_FROMNAME'],
              subject: 'DaTtSs alerts',
              html: body
            }, function(success, message) {
              if(!success) {
                factory.log().error(new Error(message));
              }
              else {
                factory.log().debug('Alert - mail sent to: ' + user.eml);
              }
            });
          }
        });
      }
    }
  };

  //
  // ### init
  // Initialize the alerts object
  //
  init = function() {
    if(my.initialized)
      return;

    var filters = require('./filters.js')
    for(var filter in filters) {
      if(filters.hasOwnProperty(filter)) {
        swig.setFilter(filter, filters[filter]);
      }
    }

    my.batch_itv = setInterval(send_batch, factory.config()['DATTSS_BATCH_ITV']);
    my.initialized = true;
  };

  fwk.method(that, 'init', init, _super);
  fwk.method(that, 'add', add, _super);

  return that;
};

exports.alerts = alerts;
