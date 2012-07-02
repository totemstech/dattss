// if this code is executed, it means that the user has been 
// verified with a correct auth. No need to check existence.

/**
 * @path GET /current
 */
exports.get_current = function(req, res, next) {
  var email = req.session.email || null;
  if(email) {
    var engine = req.store.engine;
    engine.current(email, function(err, cur) {
      if(err) {
        res.send(err.message, 500);
      }
      else {
        res.json({ ok: true,
                   current: cur });
      }
    });
  }
  else {
    res.redirect('/login');
  }
};


/**
 * @path GET /stat
 */
exports.get_stat = function(req, res, next) {
  var email = req.session.email || null;

  var process = req.param('process');
  var type = req.param('type');
  var name = req.param('name');

  if(email) {
    var engine = req.store.engine;
    engine.stat(email, process, type, name, function(err, st, took) {
      res.json({ ok: true,
                 took: took,
                 stat: st });
    });
  }
  else {
    res.redirect('/login');
  }
};
