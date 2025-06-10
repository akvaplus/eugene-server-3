const express = require('express')
const SessionController = require('../controllers/SessionController')
const router = express.Router();
const methodOverride = require('method-override');

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
router.get('/', (req, res) => {
    SessionController.findAll(req, res, sessions => {
        res.render('sessions/index', { sessions, userId: req.params.userId || undefined });
    });
});

router.get('/new', (req, res) => {
    // We need to get all users for the dropdown
    require('../model/user').find().then(users => {
        res.render('sessions/new', { users });
    }).catch(err => {
        req.flash('error', 'Error loading users for session creation');
        res.redirect('/session');
    });
});

router.get('/:id', (req, res) => {
    SessionController.findOne(req, res, session => {
        if (!session) {
            req.flash('error', 'Session not found');
            return res.redirect('/session');
        }
        res.render('sessions/show', { session });
    });
});

router.get('/:id/edit', (req, res) => {
    SessionController.findOne(req, res, session => {
        if (!session) {
            req.flash('error', 'Session not found');
            return res.redirect('/session');
        }
        require('../model/user').find().then(users => {
            res.render('sessions/edit', { session, users });
        }).catch(err => {
            req.flash('error', 'Error loading users for session edit');
            res.redirect('/session');
        });
    });
});

router.post('/', (req, res) => {
    SessionController.create(req, res, () => {
        req.flash('success', 'Session created successfully');
        res.redirect('/session');
    });
});

router.patch('/:id', (req, res) => {
    SessionController.update(req, res, () => {
        req.flash('success', 'Session updated successfully');
        res.redirect(`/session/${req.params.id}`);
    });
});

router.delete('/:id', (req, res) => {
    SessionController.destroy(req, res, () => {
        req.flash('success', 'Session deleted successfully');
        res.redirect('/session');
    });
});

router.get('/user/:userId', (req, res) => {
    SessionController.findByUserId(req, res, sessions => {
        res.render('sessions/index', { sessions, userId: req.params.userId });
    });
});

module.exports = router 