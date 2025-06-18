const express = require('express');
const router = express.Router();
const UserModel = require('../model/user');
const UserController = require('../controllers/UserController');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../services/email.service');
const passport = require('passport');
require('../config/google.auth');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.redirect('/?error=Please provide both username/email and password');
        }

        const user = await UserModel.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        if (!user) {
            return res.redirect('/?error=Invalid username or email');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.redirect('/?error=Invalid password');
        }

        req.session.userId = user._id;
        res.redirect(`/user/${user._id}`);
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/?error=An error occurred during login');
    }
});

// Registration route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).redirect(req.get('Referrer') || '/');
        }

        const newUser = new UserModel({
            username,
            email,
            password,
            firstName: firstName || '',
            lastName: lastName || '',
            isAdmin: false
        });
        await newUser.save();

        // Send verification email if email service is configured
        const emailService = require('../services/email.service');
        if (emailService.isConfigured) {
            try {
                await emailService.sendVerificationEmail(newUser);
                console.log(`Verification email sent to ${newUser.email}`);
            } catch (emailError) {
                console.error(`Failed to send verification email to ${newUser.email}:`, emailError);
                // Don't fail the registration if email sending fails
            }
        } else {
            console.log('Email service not configured, skipping verification email');
        }

        req.session.userId = newUser._id;
        res.redirect(`/user/${newUser._id}`);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).redirect(req.get('Referrer') || '/');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/',
        successRedirect: '/user'
    })
);

module.exports = router; 