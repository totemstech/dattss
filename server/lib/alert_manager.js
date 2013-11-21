/*
 * DaTtSs: alert_manager.js
 *
 * (c) Copyright Teleportd Ltd 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-10-08 n1t0    File Creation
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;
var swig = require('swig');

//
// ## Alert manager object
// Manage alerts for a given user. The environment of this user
// is feeding with new partials every minutes
// ```
// @spec { uid }
// ```
//
var alert_manager = function(spec, my) {
  var _super = {};
  my = my || {};

  my.uid = spec.uid;

  my.alerts = {};
  my.partials = {};

  my.currents = []; /* used to determine if an alert has already been set     */
  my.to_send = [];  /* an array of alerts to send                             */

  //
  // #### _private methods_
  //
  var retrieve_value;    /* retrieve_value(partials, key); */
  var add_alert;         /* add_alert(alert);              */
  var check;             /* check();                       */
  var send;              /* send();                        */
  var clean;             /* clean();                       */

  //
  // #### _public methods_
  //
  var init;              /* init(cb_);                     */
  var load_alerts;       /* load_alerts(cb_);              */
  var add_partial;       /* add_partial(partial);          */

  //
  // #### _that_
  //
  var that = {};

  /****************************************************************************/
  /*                             PRIVATE METHODS                              */
  /****************************************************************************/
  //
  // ### retrieve_value
  // Retrieve a value from a list of partials
  // ```
  // @partials {array} an array of partials
  // @key      {string} the value to retrieve
  // ```
  //
  retrieve_value = function(partials, key) {
    var nr_points = factory.config()['DATTSS_ALERTS_AVG_ITV'];
    var end = Date.now();

    var value = 0;
    if(key === 'avg') {
      var last_commit = false;
      for(var i = 0; i < nr_points; i++) {
        /* We start from the older one as `partials` should be ordered        */
        var prt_date = factory.aggregate_date(
          new Date(end - ((nr_points - (i + 1)) * 60 * 1000)),
          true
        );
        for(var n = 0; n < partials.length; n++) {
          if(partials[n].dte === prt_date) {
            value += partials[n].sum;

            if(prt_date === factory.aggregate_date(new Date(end), true)) {
              last_commit = true;
            }
            break;
          }
        }
      }
      /* If we didn't receive the last commit yet, it should not be           */
      /* considered as a 0, so we divide by `nr_points - 1` minutes           */
      if(last_commit) {
        value = (value / (nr_points * 60)).toFixed(2);
      }
      else {
        value = (value / ((nr_points - 1) * 60)).toFixed(2);
      }
    }
    else if(key === 'lst') {
      value = partials[partials.length - 1].lst;
    }
    else {
      /* We check the two last minutes in case we didn't receive the last     */
      /* commit yet                                                           */
      var prt_date = factory.aggregate_date(
        new Date(end),
        true
      );
      var prt_date_1 = factory.aggregate_date(
        new Date(end - 1 * 60 * 1000),
        true
      );
      if(partials[partials.length - 1].dte === prt_date ||
         partials[partials.length - 1].dte === prt_date_1) {
        value = partials[partials.length - 1][key];
      }
    }

    return value;
  };

  //
  // ### add_alert
  // Add an alert to the list of those that will be send
  // ```
  // @alert {object} the alert to add
  // ```
  //
  add_alert = function(alert) {
    var name = alert.type + '-' + alert.path;
    if(my.currents.indexOf(name) !== -1) {
      return;
    }

    my.to_send.push(alert);
    my.currents.push(name);
  };

  //
  // ### check
  // Check if an alert need to be send
  //
  check = function() {
    /* We don't check for alerts until the moving average is rightly set up */
    if(Date.now() - my.started_at <
       factory.config()['DATTSS_ALERTS_AVG_ITV'] * 60 * 1000) {
      return;
    }

    for(var name in my.alerts) {
      if(my.alerts.hasOwnProperty(name) &&
         my.partials.hasOwnProperty(name)) {
        var alerts = my.alerts[name];
        var partials = my.partials[name];

        if(partials.length > 0) {
          alerts.forEach(function(alert) {
            var value = retrieve_value(partials, alert.key);
            var good = true;

            switch(alert.ope) {
              case '<': {
                if(value < alert.val)
                  good = false;
                break;
              }
              case '>': {
                if(value > alert.val)
                  good = false;
                break;
              }
              case '=': {
                if(value === alert.val)
                  good = false;
                break;
              }
            };

            if(!good) {
              add_alert({
                type: name.split('-')[0],
                path: name.split('-')[1],
                key: alert.key,
                expected: alert.val,
                operator: alert.ope,
                value: value
              });
            }
          });
        }
      }
    }
  };

  //
  // ### send
  // Send all pending alerts
  //
  send = function() {
    if(my.to_send.length > 0 &&
       my.last < Date.now() - factory.config()['DATTSS_BTW_ALERTS']) {
      var alerts = my.to_send.splice(0, factory.config()['DATTSS_MAX_ALERTS']);
      var others = my.to_send.length;
      my.to_send = [];
      my.currents = [];
      my.last = Date.now();

      var template = swig.compileFile('./templates/alert.html');
      var body = template({
        alerts: alerts,
        others: others
      });

      var c_users = factory.data().collection('dts_users');
      c_users.findOne({
        uid: my.uid
      }, function(err, user) {
        if(err) {
          factory.log().error(err);
        }
        else if(!user) {
          factory.log().debug('Alert - user does not exist: ' + my.uid);
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
  };

  //
  // ### clean
  // Clean the partials
  //
  clean = function() {
    var older = factory.aggregate_date(
      new Date(Date.now() - factory.config()['DATTSS_ALERTS_AVG_ITV'] * 60 * 1000),
      true
    );

    for(var name in my.partials) {
      if(my.partials.hasOwnProperty(name)) {
        var done = false;
        while(!done) {
          if(my.partials[name].length > 0 &&
             my.partials[name][0].dte < older) {
            my.partials[name].shift();
          }
          else {
            done = true;
          }
        }
      }
    }
  };

  /****************************************************************************/
  /*                              PUBLIC METHODS                              */
  /****************************************************************************/
  //
  // ### init
  // ```
  // @cb_ {function(err)}
  // ```
  //
  init = function(cb_) {
    my.started_at = Date.now();
    my.last = new Date(0);

    load_alerts(function(err) {
      if(err) {
        return cb_(err);
      }
      else {
        var filters = require('./filters.js')
        for(var filter in filters) {
          if(filters.hasOwnProperty(filter)) {
            swig.setFilter(filter, filters[filter]);
          }
        }

        my.check_itv = setInterval(check, 30 * 1000);
        my.clean_itv = setInterval(clean, 60 * 1000);
        my.batch_itv = setInterval(send, 30 * 1000);

        return cb_();
      }
    });
  };

  //
  // ### load_alerts
  // Load alerts
  // ```
  // @cb_ {function(err)}
  // ```
  //
  load_alerts = function(cb_) {
    my.alerts = {};
    var c_alerts = factory.data().collection('dts_alerts');
    c_alerts.find({
      uid: my.uid
    }).each(function(err, alert) {
      if(err) {
        return cb_(err);
      }
      else if(alert) {
        var path = alert.typ + '-' + alert.pth;
        my.alerts[path] = my.alerts[path] || [];
        my.alerts[path].push(alert);
      }
      else {
        return cb_();
      }
    });
  };

  //
  // ### add_partial
  // Add a new partial
  // ```
  // @partial {object} the partial to add
  // ```
  //
  add_partial = function(partial) {
    var name = partial.typ + '-' + partial.pth;
    if(my.alerts.hasOwnProperty(name)) {
      my.partials[name] = my.partials[name] || [];
      my.partials[name].push(partial);
    }
  };

  fwk.method(that, 'init', init, _super);
  fwk.method(that, 'load_alerts', load_alerts, _super);
  fwk.method(that, 'add_partial', add_partial, _super);

  return that;
};

exports.alert_manager = alert_manager;
