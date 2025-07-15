const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { apiAuth, JWT_SECRET } = require('../middleware/apiAuth');

// Generate API token
router.post('/auth/token', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected route example
router.get('/protected', apiAuth, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username
        }
    });
});

module.exports = router; 