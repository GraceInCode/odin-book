module.exports = {
  isNotGuest: (req, res, next) => {
    if (req.user && req.user.username === 'guest') {
      req.flash('error', 'Guests cannot perform this action.');
      return res.redirect('/');
    }
    next();
  }
};