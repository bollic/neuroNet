function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  return res.redirect('/login');
}

function onlyField(req, res, next) {
  if (req.session.user?.role === 'field') return next();
  return res.status(403).send("Accesso riservato ai FIELD");
}

function onlyOffice(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'office') {
    return res.status(403).send("Accesso riservato agli OFFICE");
  }
  next();
}

module.exports = {
  isAuthenticated,
  onlyField,
  onlyOffice
};
