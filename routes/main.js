
/**
 * @path GET /
 */
exports.get_index = function(req, res, next) {
  /* DaTtSs */ req.store.dts.web.agg('landing', '1c!');
  res.render('landing');
};

/**
 * @path GET /404
 */
exports.get_notfound = function(req, res, next) {
  /* DaTtSs */ req.store.dts.web.agg('404', '1c');
  res.render('404');
};


