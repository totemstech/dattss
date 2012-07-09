
/**
 * @path PUT /agg
 */
exports.put_agg = function(req, res, next) {
  var auth = req.param('auth');

  // if this code is executed, it means that the auth has been 
  // verified. No need to check existence.

  var engine = req.store.engine;
  var succ = engine.agg(auth.split('_')[0], req.body);
  if(succ) {
    res.json({ ok: true });
  }
  else {
    res.json('Malformed Request', 500);
  }
};
