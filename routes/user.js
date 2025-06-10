const express = require('express')
const UserController = require('../controllers/UserController')
const router = express.Router();
const methodOverride = require('method-override');

// Use method override to support PUT and DELETE in forms
router.use(methodOverride('_method'));

// Routes for API
router.get('/api', UserController.findAll);
router.get('/api/:id', UserController.findOne);
router.post('/api', UserController.create);
router.patch('/api/:id', UserController.update);
router.delete('/api/:id', UserController.destroy);

// Routes for views
router.get('/', (req, res) => {
    UserController.findAll(req, res, users => {
        res.render('users/index', { users });
    });
});

router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await require('../model/user').findOne({
            emailVerificationToken: req.params.token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Verification link is invalid or has expired.');
            return res.redirect('/user');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        req.flash('success', 'Email verified successfully!');
        res.redirect(`/user/${user._id}`);
    } catch (error) {
        console.error('Error verifying email:', error);
        req.flash('error', 'An error occurred while verifying your email.');
        res.redirect('/user');
    }
});

router.get('/new', (req, res) => {
    res.render('users/new');
});

router.get('/:id', (req, res) => {
    UserController.findOne(req, res, user => {
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/user');
        }
        res.render('users/show', { user });
    });
});

router.get('/:id/edit', (req, res) => {
    UserController.findOne(req, res, user => {
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/user');
        }
        res.render('users/edit', { user });
    });
});

router.post('/', (req, res) => {
    UserController.create(req, res, () => {
        req.flash('success', 'User created successfully. A verification email has been sent.');
        res.redirect('/user');
    });
});

router.patch('/:id', (req, res) => {
    UserController.update(req, res, () => {
        req.flash('success', 'User updated successfully');
        res.redirect(`/user/${req.params.id}`);
    });
});

router.delete('/:id', (req, res) => {
    UserController.destroy(req, res, () => {
        req.flash('success', 'User deleted successfully');
        res.redirect('/user');
    });
});

router.post('/:id/password', (req, res) => {
    UserController.updatePassword(req, res, () => {
        req.flash('success', 'Password updated successfully');
        res.redirect(`/user/${req.params.id}`);
    });
});

module.exports = router