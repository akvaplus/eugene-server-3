const UserModel = require('../model/user');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
};

const isAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/');
        }
        const user = await UserModel.findById(req.session.userId);
        if (!user) {
            return res.redirect('/');
        }
        if (!user.isAdmin) {
            return res.redirect(`/user/${req.session.userId}`);
        }
        next();
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        res.redirect('/');
    }
};

module.exports = { isAuthenticated, isAdmin }; 