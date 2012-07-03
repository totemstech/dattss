
/**
 * @path GET /
 */
exports.get_index = function(req, res, next) {
  var email = req.session.email;
  if(email)
    res.redirect('/home');
  else
    res.redirect('/login');
};

/**
 * @path GET /home
 */
exports.get_home = function(req, res, next) {
  var email = req.session.email;
  res.render('home', { locals: { user: { email: email },
                                 home: true } });
};


/**
 * @path GET /404
 */
exports.get_notfound = function(req, res, next) {
  res.render('404');
};


