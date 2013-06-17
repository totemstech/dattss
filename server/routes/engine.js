/*
 * DaTtSs: engine.js
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

//
// ### @PUT /agg
// Aggregates value
//
exports.put_agg = function(req, res, next) {
  var auth = req.param('auth');
  var uid = auth.split('.')[0];

  if(factory.engine().agg(uid, req.body)) {
    /* DaTtSs */ factory.dattss().agg('routes.put_agg.ok', '1c');
    return res.ok();
  }
  else {
    /* DaTtSs */ factory.dattss().agg('routes.put_agg.error', '1c');
    return res.error(new Error('Malformed request'));
  }
};

//
// ### @GET /status
// Get the current status
//
exports.get_status = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_status.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  factory.engine().current(req.user.uid, function(err, current) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_status.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_status.ok', '1c');
      return res.data(current);
    }
  });
};

//
// ### @GET /stats/:path/:type/:offset
// Get the current & past value for the given stat
//
exports.get_stats = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_stats.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  var path = req.param('path');
  var type = req.param('type');
  var offset = parseInt(req.param('offset'), 10);
  if(isNaN(offset))
    offset = 0;
  offset = offset * 60 * 1000;

  var c_aggregates = factory.data().collection('dts_aggregates');

  var now = new Date();
  var start = new Date(new Date(now.getUTCFullYear(),
                                now.getUTCMonth(),
                                now.getUTCDate(),
                                0, 0, 0).getTime() +
                       (new Date().getTimezoneOffset() * 60 * 1000))
  var end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  fwk.async.parallel({
    current: function(cb_) {
      c_aggregates.find({
        uid: req.user.uid,
        pth: path,
        typ: type,
        dte: {
          $gte: factory.aggregate_date(start),
          $lt: factory.aggregate_date(end)
        }
      }).toArray(function(err, points) {
        if(err) {
          return cb_(err);
        }
        else {
          points.forEach(function(point) {
            var d = factory.agg_to_date(point.dte);
            var d_off = new Date(d.getTime() - offset);
            point.dte = factory.aggregate_date(d_off);
          });
          return cb_(null, points);
        }
      });
    },
    past: function(cb_) {
      var aggs = {};
      var points = [];

      c_aggregates.find({
        uid: req.user.uid,
        pth: path,
        typ: type,
        dte: {
          $gte: factory.aggregate_date(new Date(0)),
          $lt: factory.aggregate_date(start)
        }
      }).each(function(err, point) {
        if(err) {
          return cb_(err);
        }
        else if(point) {
          var point_dte = factory.agg_to_date(point.dte);
          var point_dte_off = new Date(point_dte + offset);
          var dte_off = factory.aggregate_date(point_dte_off);

          var dte_r = /[0-9\-]{11}([0-9\-]+)/;
          var dte = (dte_r.exec(dte_off) || [, null])[1];

          aggs[dte] = aggs[dte] || [];
          aggs[dte].push(point);
        }
        else {
          for(var date in aggs) {
            if(aggs.hasOwnProperty(date)) {
              var pt = factory.agg_partials(aggs[date]);
              points.push({
                dte: date,
                sum: pt.sum / aggs[date].length,
                cnt: pt.cnt / aggs[date].length,
                typ: pt.typ,
                pct: pt.pct,
                max: pt.max,
                min: pt.min,
                lst: pt.lst,
                fst: pt.fst,
                bot: pt.bot,
                top: pt.top
              });
            }
          }
          points.sort(function(a, b) {
            if(a.dte > b.dte) return 1;
            if(a.dte < b.dte) return -1;
            return 0;
          });

          return cb_(null, points);
        }
      });
    }
  }, function(err, result) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_stats.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_stats.ok', '1c');
      return res.data({
        current: result.current,
        past: result.past
      });
    }
  });
};
