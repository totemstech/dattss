
/**
 * @path GET /
 */
exports.get_index = function(req, res, next) {
  res.render('landing');
};

/**
 * @path GET /404
 */
exports.get_notfound = function(req, res, next) {
  res.render('404');
};


