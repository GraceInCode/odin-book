// Correct export
module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Please sign in to access this page.');
    res.redirect('/auth/login');
  }
};

module.exports.isOwnProfile = async (req, res, next) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId !== req.user.id) {
    req.flash('error', 'Unauthorized.');
    return res.redirect('/users');
  }
  next();
};