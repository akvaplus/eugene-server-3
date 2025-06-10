// Middleware to check if user is authenticated
module.exports = function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        req.flash('error', 'Please log in to access this page.');
        res.redirect('/');
    }
}; 