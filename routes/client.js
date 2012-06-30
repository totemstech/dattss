// if this code is executed, it means that the user has been 
// verified with a correct auth. No need to check existence.

/**
 * @path GET /current
 */
exports.get_current = function(req, res, next) {
  var email = req.param('user');

  var engine = req.store.engine;
  engine.current(email, function(err, cur) {
    if(err) {
      res.send(err.message, 500);
    }
    else {
      res.json({ ok: true,
                 cur: cur });
    }
  });
};


/**
 * @path GET /counter
 */
exports.get_counter = function(req, res, next) {
  var email = req.param('user');
  var type = req.param('type');
  var name = req.param('name');

  var entine = req.store.engine;
  engine.counter(email, type, name, function(err, cur) {

  });
};
