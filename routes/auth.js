const express = require('express');
const router = express.Router();
const UserModel = require('../model/user');
const UserController = require('../controllers/UserController');

// Login route
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
        req.flash('error', 'Username/Email and password are required.');
        return res.redirect('/');
    }
    
    try {
        // Check if identifier is email or username
        const query = identifier.includes('@') 
            ? { email: identifier }
            : { username: identifier };
        
        const user = await UserModel.findOne(query);
        
        if (!user) {
            req.flash('error', 'Invalid credentials.');
            return res.redirect('/');
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid credentials.');
            return res.redirect('/');
        }
        
        // If credentials are correct, store user ID in session
        req.session.userId = user._id;
        req.flash('success', 'Logged in successfully!');
        res.redirect('/user');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login.');
        res.redirect('/');
    }
});

// Registration route
router.post('/register', (req, res) => {
    UserController.create(req, res, (user) => {
        // Store user ID in session after successful registration
        req.session.userId = user._id;
        req.flash('success', 'Registration successful! A verification email has been sent.');
        res.redirect('/user');
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            req.flash('error', 'Error logging out.');
        } else {
            req.flash('success', 'Logged out successfully.');
        }
        res.redirect('/');
    });
});

module.exports = router; 