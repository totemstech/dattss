/*
 * DaTtSs: alerts.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-09-12  n1t0    Creation
 */

var fwk = require('fwk');
var factory = require('../factory.js').factory;

//
// ### GET /s/alert
//
exports.get_alerts = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_alert.error', '1c');
    return res.error(new Error('Authentication Error'));
  }

  var alerts = [];

  var c_alerts = factory.data().collection('dts_alerts');
  c_alerts.find({
    uid: req.user.uid,
  }).each(function(err, alert) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_alert.error', '1c');
      return res.error(err);
    }
    else if(alert) {
      alerts.push({
        id: alert.aid,
        type: alert.typ,
        path: alert.pth,
        key: alert.key,
        operator: alert.ope,
        value: alert.val
      });
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_alert.ok', '1c');
      res.data(alerts);
    }
  });
};

//
// ### PUT /s/alert/:type/:path
//
exports.put_alert = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.put_alert.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  var type = req.param('type');
  var path = req.param('path');
  var key = req.param('key');
  var operator = req.param('operator');
  var value = parseInt(req.param('value'), 10);

  if(typeof key !== 'string' || key.trim() === '') {
    /* DaTtSs */ factory.dattss().agg('routes.put_alert.error', '1c');
    return res.error(new Error('Wrong param key: ' + key));
  }
  if(typeof operator !== 'string' || operator.trim() === '') {
    /* DaTtSs */ factory.dattss().agg('routes.put_alert.error', '1c');
    return res.error(new Error('Wrong param operator: ' + operator));
  }
  if(typeof value !== 'number' || isNaN(value)) {
    /* DaTtSs */ factory.dattss().agg('routes.put_alert.error', '1c');
    return res.error(new Error('Wrong param value: ' + value));
  }

  var c_alerts = factory.data().collection('dts_alerts');

  var alert_id = factory.hash([ type,
                                path,
                                req.user.uid,
                                Date.now().toString() ]);

  var alert = {
    aid: alert_id,
    slt: factory.slt(alert_id),
    uid: req.user.uid,
    typ: type,
    pth: path,
    key: key,
    ope: operator,
    val: value
  };

  c_alerts.insert(alert, function(err) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.put_alert.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.put_alert.ok', '1c');
      return factory.engine().refresh_alerts(req.user.uid, res.ok);
    }
  });
};

//
// ### DEL /s/alert/:aid
//
exports.del_alert = function(req, res, next) {
  var aid = req.param('aid');

  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.del_alert.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  var c_alerts = factory.data().collection('dts_alerts');
  c_alerts.remove({
    aid: aid,
    slt: factory.slt(aid)
  }, function(err) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.del_alert.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.del_alert.ok', '1c');
      return factory.engine().refresh_alerts(req.user.uid, res.ok);
    }
  });
};
