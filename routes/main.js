
/**
 * @path GET /
 */
exports.get_index = function(req, res, next) {
  var email = req.session.email || null;

  if(email) {
    res.redirect('/s/home');
  }
  else {
    /* DaTtSs */ req.store.dts.web.agg('landing', '1c');
    res.render('landing');
  }
};

/**
 * @path GET /404
 */
exports.get_notfound = function(req, res, next) {
  /* DaTtSs */ req.store.dts.web.agg('404', '1c');
  res.render('404');
};


