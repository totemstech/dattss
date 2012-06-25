
/**
 * @path PUT /agg
 */
exports.put_agg = function(req, res, next) {
  var email = req.param('user');

  var user = require('../lib/user.js').user({ email: email,
                                              mongo: req.store.mongo,
                                              cfg: req.store.cfg });

  user.exist(function(err, exist) {
    if(exist) {
      var engine = req.store.engine;
      var res = engine.agg(req.param('user'), 
                           req.body);
      if(res) {
        res.json({ ok: true });
      }
      else {
        res.json('Malformed Request', 500);
      }
    }
    else {
      res.json('User not found', 500);
    }
  });
};
