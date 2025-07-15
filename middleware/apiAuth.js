const jwt = require('jsonwebtoken');
const User = require('../model/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const apiAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find user
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add user to request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is invalid' });
    }
};

module.exports = { apiAuth, JWT_SECRET }; 