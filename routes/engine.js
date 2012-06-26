
/**
 * @path PUT /agg
 */
exports.put_agg = function(req, res, next) {
  var email = req.param('user');

  // if this code is executed, it means that the user has been 
  // verified with a correct auth. No need to check existence.

  var engine = req.store.engine;
  var succ = engine.agg(req.param('user'), 
                        req.body);
  if(succ) {
    res.json({ ok: true });
  }
  else {
    res.json('Malformed Request', 500);
  }
};
