
/**
 * @path GET /
 */
exports.get_index = function(req, res, next) {
  var email = req.session.email;
  if(email)
    res.redirect('/home');
  else
    res.render('index');
};

/**
 * @path GET /home
 */
exports.get_home = function(req, res, next) {
  var email = req.session.email;
  res.render('home', { locals: { user: { email: email } } });
};

/**
 * @path GET /404
 */
exports.get_notfound = function(req, res, next) {
  res.render('404');
};


/**
 * @path GET /500
 */
exports.get_error = function(req, res, next) {
};