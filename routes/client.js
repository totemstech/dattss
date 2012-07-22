// if this code is executed, it means that the user has been 
// verified with a correct auth. No need to check existence.


/**
 * @path GET /s/home
 */
exports.get_home = function(req, res, next) {
  var email = req.session.email || null;
  if(email) {
    var user = require('../lib/user.js').user({ email: email,
                                                mongo: req.store.mongo,
                                                redis: req.store.redis,
                                                cfg: req.store.cfg });
    user.get(function(err, usr) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        /* DaTtSs */ req.store.dts.web.agg('home', '1c');
        res.render('home', { user: { email: email },
                             home: true,
                 	     auth: usr.id + '_' + req.store.access.auth(usr.id) });
      }
    });
  }
  else {
    res.redirect('/s/login');
  }
};


/**
 * @path GET /s/current
 */
exports.get_current = function(req, res, next) {
  var email = req.session.email || null;
  if(email) {
    var user = require('../lib/user.js').user({ email: email,
                                                mongo: req.store.mongo,
                                                redis: req.store.redis,
                                                cfg: req.store.cfg });
    user.get(function(err, usr) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        var engine = req.store.engine;
        engine.current(usr.id, function(err, cur, took) {
          if(err) {
            res.send(err.message, 500);
          }
          else {
            res.json({ ok: true,
                       id: usr.id,
                       took: took,
                       current: cur });
          }
        });
      }
    });
  }
  else {
    res.redirect('/s/login');
  }
};


/**
 * @path GET /s/stat
 */
exports.get_stat = function(req, res, next) {
  var email = req.session.email || null;

  var process = req.param('process');
  var type = req.param('type');
  var name = req.param('name');

  if(email) {
    var user = require('../lib/user.js').user({ email: email,
                                                mongo: req.store.mongo,
                                                redis: req.store.redis,
                                                cfg: req.store.cfg });
    user.get(function(err, usr) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        var engine = req.store.engine;
        engine.stat(usr.id, process, type, name, function(err, st, took) {
          res.json({ ok: true,
                     id: usr.id,
                     took: took,
                     stat: st });
        });
      }
    });
  }
  else {
    res.redirect('/s/login');
  }
};


/**
 * @path GET /s/destroy
 */
exports.get_destroy = function(req, res, next) {
  var email = req.session.email || null;

  var process = req.param('process');

  if(email) {
    var user = require('../lib/user.js').user({ email: email,
                                                mongo: req.store.mongo,
                                                redis: req.store.redis,
                                                cfg: req.store.cfg });
    user.get(function(err, usr) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        var engine = req.store.engine;
        engine.destroy(usr.id, process, function(err) {
          if(err) {
            res.send(err.message, 500);
          }
          else {
            res.json({ok: true});
          }
        });
      }
    });
  }
  else {
    res.redirect('/s/login');
  }
};


/******************************************************
 *                    DEMO                            *
 ******************************************************/


/**
 * @path GET /demo/home
 */
exports.get_demo_home = function(req, res, next) {
  /* DaTtSs */ req.store.dts.web.agg('demo', '1c');
  res.render('home', { demo: true,
                       home: true });
};


/**
 * @path GET /demo/current
 */
exports.get_demo_current = function(req, res, next) {
  var engine = req.store.engine;
  engine.current(0, function(err, cur, took) {
    if(err) {
      res.send(err.message, 500);
    }
    else {
      res.json({ ok: true,
                 id: 0,
                 took: took,
                 current: cur });
    }
  });
};


/**
 * @path GET /demo/stat
 */
exports.get_demo_stat = function(req, res, next) {
  var process = req.param('process');
  var type = req.param('type');
  var name = req.param('name');

  var engine = req.store.engine;
  engine.stat(0, process, type, name, function(err, st, took) {
    res.json({ ok: true,
               id: 0,
               took: took,
               stat: st });
  });
};

