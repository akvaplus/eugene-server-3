const express = require('express')
const SessionController = require('../controllers/SessionController')
const router = express.Router();
const methodOverride = require('method-override');
const SessionModel = require('../model/session');
const { isAuthenticated } = require('../middleware/auth');
const UserModel = require('../model/user');

// Use method override to support PUT and DELETE in forms
router.use(methodOverride('_method'));

// Routes for API
router.get('/api', SessionController.findAll);
router.get('/api/:id', SessionController.findOne);
router.post('/api', SessionController.create);
router.patch('/api/:id', SessionController.update);
router.delete('/api/:id', SessionController.destroy);
router.get('/api/user/:userId', SessionController.findByUserId);

// Routes for views
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let sessions;
        const currentUser = await UserModel.findById(req.session.userId);
        if (currentUser && currentUser.isAdmin) {
            sessions = await SessionModel.find().populate('userId');
        } else {
            sessions = await SessionModel.find({ userId: req.session.userId }).populate('userId');
        }
        res.render('sessions/index', { sessions, activePage: 'sessions' });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.redirect(req.get('Referrer') || '/session');
    }
});

router.get('/new', isAuthenticated, async (req, res) => {
    try {
        const users = await UserModel.find();
        res.render('sessions/new', { users });
    } catch (error) {
        console.error('Error loading new session form:', error);
        res.redirect(req.get('Referrer') || '/session');
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const session = await SessionModel.findById(req.params.id).populate('userId');
        if (!session) {
            return res.redirect('/session');
        }
        res.render('sessions/show', { session, activePage: 'sessions' });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.redirect('/session');
    }
});

router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const session = await SessionModel.findById(req.params.id).populate('userId');
        const users = await UserModel.find();
        if (!session) {
            return res.redirect('/session');
        }
        res.render('sessions/edit', { session, users });
    } catch (error) {
        console.error('Error loading edit session form:', error);
        res.redirect('/session');
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    await SessionController.create(req, res);
});

router.patch('/:id', isAuthenticated, async (req, res) => {
    await SessionController.update(req, res);
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await SessionModel.findByIdAndDelete(req.params.id);
        res.redirect('/session');
    } catch (error) {
        console.error('Error deleting session:', error);
        res.redirect('/session');
    }
});

router.get('/user/:userId', (req, res) => {
    SessionController.findByUserId(req, res, sessions => {
        res.render('sessions/index', { sessions, userId: req.params.userId });
    });
});

module.exports = router 