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
// ### @PUT /process
// Register a process with long-polling
//
exports.put_process = function(req, res, next) {
  var auth = req.param('auth');
  var process = req.param('process');

  var uid = auth.split('.')[0];

  var send = function(message) {
    res.end(auth + '-' + process);

    /* Avoid multiple calls */
    send = function() {};

    return true; /* Sent */
  };

  req.on('close', function() {
    send = function() {};
  });

  /* Set the timeout */
  req.setTimeout(10 * 1000);

  factory.engine().add_process(uid, process, send);
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
// ### @GET /processes
// Get the current processes
//
exports.get_processes = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_processes.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  factory.engine().processes(req.user.uid, function(err, processes) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_processes.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_processes.ok', '1c');
      return res.data(processes);
    }
  });
};

//
// ### @DELETE /process/:name
// Kill the given process
//
exports.del_process = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.del_process.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  factory.engine().kill_process(req.user.uid, req.param('name'), function(err) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.del_process.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.del_process.ok', '1c');
      return res.ok();
    }
  });
};

//
// ### @GET /stats/:path/:type/:offset/:step
// Get the current & past value for the given stat
//
exports.get_stats = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_stats.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  var path = req.param('path');
  var type = req.param('type');
  var step = req.param('step');
  step = parseInt(step, 10);
  if(isNaN(step) || step < 1 || step > 6)
    step = 2;
  var offset = parseInt(req.param('offset'), 10);
  if(isNaN(offset))
    offset = 0;
  offset = offset * 60 * 1000;

  var c_aggregates = factory.data().collection('dts_aggregates');

  var now = new Date();
  var start = new Date(new Date(now.getUTCFullYear(),
                                now.getUTCMonth(),
                                now.getUTCDate(),
                                0, 0, 0).getTime() + offset);
  var end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  var max_past = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);

  var pad = function(number) {
    if(number < 10) {
      return '0' + number.toString();
    }
    return number.toString()
  }

  fwk.async.parallel({
    current: function(cb_) {
      var aggs = {};

      c_aggregates.find({
        uid: req.user.uid,
        pth: path,
        typ: type,
        dte: {
          $gte: factory.aggregate_date(start),
          $lt: factory.aggregate_date(end)
        }
      }).each(function(err, point) {
        if(err) {
          return cb_(err);
        }
        else if(point) {
          /* Apply offset */
          var d = factory.agg_to_date(point.dte);
          var d_off = new Date(d.getTime() - offset);
          point.dte = factory.aggregate_date(d_off);

          /* Aggregate according to step */
          var date_r = /[0-9]{4}-[0-9]{2}-[0-9]{2}-([0-9]{2})-([0-9]{2})/;
          var agg_i = date_r.exec(point.dte);
          if(!agg_i) {
            return cb_(new Error('Wrong date: ' + point.dte));
          }

          var minutes = parseInt(agg_i[2], 10);
          var agg_on = agg_i[1] + '-' + pad(minutes - (minutes % step));
          aggs[agg_on] = aggs[agg_on] || [];
          aggs[agg_on].push(point);
        }
        else {
          return cb_(null, aggs);
        }
      });
    },
    past: function(cb_) {
      var aggs = {};

      c_aggregates.find({
        uid: req.user.uid,
        pth: path,
        typ: type,
        dte: {
          $gte: factory.aggregate_date(max_past),
          $lt: factory.aggregate_date(start)
        }
      }).each(function(err, point) {
        if(err) {
          return cb_(err);
        }
        else if(point) {
          /* Apply offset */
          var point_dte = factory.agg_to_date(point.dte);
          var point_dte_off = new Date(point_dte + offset);
          var dte_off = factory.aggregate_date(point_dte_off);

          /* Aggregate according to step */
          var date_r = /[0-9]{4}-[0-9]{2}-[0-9]{2}-([0-9]{2})-([0-9]{2})/;
          var agg_i = date_r.exec(dte_off);
          if(!agg_i) {
            return cb_(new Error('Wrong date: ' + dte_off));
          }

          var minutes = parseInt(agg_i[2], 10);
          var agg_on = agg_i[1] + '-' + pad(minutes - (minutes % step));
          aggs[agg_on] = aggs[agg_on] || [];
          aggs[agg_on].push(point);
        }
        else {
          return cb_(null, aggs);
        }
      });
    }
  }, function(err, result) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_stats.error', '1c');
      return res.error(err);
    }
    else {
      var response = {
        current: [],
        past: []
      };

      ['current', 'past'].forEach(function(type) {
        for(var date in result[type]) {
          if(result[type].hasOwnProperty(date)) {
            var pt = factory.agg_partials(result[type][date]);
            response[type].push({
              dte: date,
              sum: pt.sum / result[type][date].length,
              cnt: pt.cnt / result[type][date].length,
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
        response[type].sort(function(a, b) {
          if(a.dte > b.dte) return 1;
          if(a.dte < b.dte) return -1;
          return 0;
        });
      });

      /* DaTtSs */ factory.dattss().agg('routes.get_stats.ok', '1c');
      return res.data(response);
    }
  });
};

//
// ### GET /favorite
// Return the current favorites
//
exports.get_favorite = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.get_favorite.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  var c_favorites = factory.data().collection('dts_favorites');
  c_favorites.findOne({
    slt: factory.slt(req.user.uid),
    uid: req.user.uid
  }, function(err, favorite) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.get_favorite.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.get_favorite.ok', '1c');
      return res.data(favorite ? favorite.fav : []);
    }
  });
};

//
// ### PUT /favorite/:favorite
// Favorite a status
//
exports.put_favorite = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.put_favorite.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  /* Do not allow modification from demo */
  if(req.is_demo) {
    return res.ok();
  }

  var favorite = req.param('favorite');

  var c_favorites = factory.data().collection('dts_favorites');
  c_favorites.update({
    slt: factory.slt(req.user.uid),
    uid: req.user.uid
  }, {
    $addToSet: {
      fav: favorite
    }
  }, {
    upsert: true
  }, function(err) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.put_favorite.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.put_favorite.ok', '1c');
      return res.ok();
    }
  });
};

//
// ### DEL /favorite/:favorite
// Remove a status from favorites
//
exports.del_favorite = function(req, res, next) {
  if(!req.user) {
    /* DaTtSs */ factory.dattss().agg('routes.del_favorite.error', '1c');
    return res.error(new Error('Authentication error'));
  }

  /* Do not allow modification from demo */
  if(req.is_demo) {
    return res.ok();
  }

  var favorite = req.param('favorite');

  var c_favorites = factory.data().collection('dts_favorites');
  c_favorites.update({
    slt: factory.slt(req.user.uid),
    uid: req.user.uid
  }, {
    $pull: {
      fav: favorite
    }
  }, {
    upsert: true
  }, function(err) {
    if(err) {
      /* DaTtSs */ factory.dattss().agg('routes.del_favorite.error', '1c');
      return res.error(err);
    }
    else {
      /* DaTtSs */ factory.dattss().agg('routes.del_favorite.ok', '1c');
      return res.ok();
    }
  });
};
