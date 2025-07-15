const express = require('express')
const UserController = require('../controllers/UserController')
const router = express.Router();
const methodOverride = require('method-override');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const UserModel = require('../model/user');
const SessionModel = require('../model/session');

// Use method override to support PUT and DELETE in forms
router.use(methodOverride('_method'));

// Routes for API
router.get('/api', UserController.findAll);
router.get('/api/:id', UserController.findOne);
router.post('/api', UserController.create);
// Change API update from PATCH to POST
router.post('/api/:id/update', UserController.update);
// Temporarily comment out the delete API route to prevent errors
// router.delete('/api/:id', UserController.destroy);
// Replace with a direct implementation if needed
// Change API delete from DELETE to POST
router.post('/api/:id/delete', async (req, res) => {
    try {
        const user = await UserModel.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await SessionModel.deleteMany({ userId: req.params.id });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Routes for views
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await UserModel.find();
        res.render('users/index', { users, activePage: 'users' });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.redirect('/');
    }
});

router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await require('../model/user').findOne({
            emailVerificationToken: req.params.token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.redirect('/user');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.redirect(`/user/${user._id}`);
    } catch (error) {
        console.error('Error verifying email:', error);
        res.redirect('/user');
    }
});

router.get('/new', (req, res) => {
    res.render('users/new');
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.redirect('/user');
        }
        res.render('users/show', { user, activePage: 'profile' });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.redirect('/user');
    }
});

router.get('/:id/edit', (req, res) => {
    UserController.findOne(req, res, user => {
        if (!user) {
            return res.redirect('/user');
        }
        res.render('users/edit', { user });
    });
});

router.post('/', (req, res) => {
    UserController.create(req, res, () => {
        res.redirect('/user');
    });
});

// Change view update from PATCH to POST
router.post('/:id/update', (req, res) => {
    UserController.update(req, res, () => {
        res.redirect(`/user/${req.params.id}`);
    });
});

router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUser = await UserModel.findById(req.session.userId);
        
        // Check if user is admin or deleting their own account
        if (!currentUser || (currentUser._id.toString() !== userId && !currentUser.isAdmin)) {
            return res.redirect('/user');
        }
        
        // Delete user and their sessions
        await UserModel.findByIdAndDelete(userId);
        await SessionModel.deleteMany({ userId: userId });
        
        // If user is deleting their own account, log them out
        if (currentUser._id.toString() === userId) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                res.redirect('/');
            });
        } else {
            res.redirect('/user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.redirect(req.get('Referrer') || '/');
    }
});

router.post('/:id/password', (req, res) => {
    UserController.updatePassword(req, res, () => {
        res.redirect(`/user/${req.params.id}`);
    });
});

module.exports = router