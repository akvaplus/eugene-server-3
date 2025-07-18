const UserModel = require('../model/user');
const SessionModel = require('../model/session');

// Create and Save a new user
exports.create = async (req, res, callback) => {
    // Validate required fields
    const requiredFields = ['username', 'email', 'password', 'firstName'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({ 
            message: `Missing required fields: ${missingFields.join(', ')}` 
        });
    }

    try {
        const user = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName || '',
            age: req.body.age,
            weight: req.body.weight,
            sex: req.body.sex,
            isEmailVerified: req.body.isEmailVerified || false
        });

        const data = await user.save();
        
        // Send verification email if email service is configured
        const emailService = require('../services/email.service');
        if (emailService.isConfigured) {
            try {
                await emailService.sendVerificationEmail(data);
                console.log(`Verification email sent to ${data.email}`);
            } catch (emailError) {
                console.error(`Failed to send verification email to ${data.email}:`, emailError);
                // Don't fail the registration if email sending fails
                // Just log the error and continue
            }
        } else {
            console.log('Email service not configured, skipping verification email');
        }
        
        if (callback) {
            callback(data);
        } else {
            res.status(201).json({
                message: "User created successfully! A verification email has been sent.",
                user: {
                    id: data._id,
                    username: data.username,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    age: data.age,
                    weight: data.weight,
                    sex: data.sex,
                    isEmailVerified: data.isEmailVerified,
                    createdAt: data.createdAt
                }
            });
        }
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).redirect(req.get('Referrer') || '/');
        }
        res.status(500).redirect(req.get('Referrer') || '/');
    }
};

// Retrieve all users
exports.findAll = async (req, res, callback) => {
    try {
        // Log who is requesting the data
        let requestingUser = 'Unknown User';
        if (req.session.userId) {
            const user = await UserModel.findById(req.session.userId).select('username email firstName lastName');
            if (user) {
                requestingUser = `User ID: ${req.session.userId}, Username: ${user.username}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`;
            } else {
                requestingUser = `User ID: ${req.session.userId} (User not found)`;
            }
        }
        console.log(`User data requested from /user/api by ${requestingUser} at ${new Date().toISOString()}`);
        const users = await UserModel.find().select('-password -emailVerificationToken -resetPasswordToken');
        if (callback) {
            callback(users);
        } else {
            res.status(200).json(users);
        }
    } catch (error) {
        res.status(500).redirect(req.get('Referrer') || '/');
    }
};

// Find a single user by ID
exports.findOne = async (req, res, callback) => {
    try {
        const user = await UserModel.findById(req.params.id).select('-password -emailVerificationToken -resetPasswordToken');
        if (!user) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({ 
                    message: 'User not found' 
                });
            }
        } else {
            if (callback) {
                callback(user);
            } else {
                res.status(200).json(user);
            }
        }
    } catch (error) {
        res.status(500).redirect(req.get('Referrer') || '/');
    }
};

// Update a user by ID
exports.update = async (req, res, callback) => {
    console.log('req.body:', req.body); // DEBUG: log the entire request body
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: 'Data to update cannot be empty!'
        });
    }

    const id = req.params.id;
    // Only allow updating specific fields
    const allowedFields = ['username', 'email', 'firstName', 'lastName', 'age', 'weight', 'sex'];
    const updateData = {};
    allowedFields.forEach(field => {
        if (typeof req.body[field] !== 'undefined') {
            updateData[field] = req.body[field];
        }
    });
    // Ensure lastName is always set (even if empty)
    if (typeof updateData.lastName === 'undefined') {
        updateData.lastName = '';
    }
    console.log('data', updateData);
    try {
        const user = await UserModel.findByIdAndUpdate(
            id, 
            updateData, 
            { 
                new: true, 
                runValidators: true,
                useFindAndModify: false 
            }
        ).select('-password -emailVerificationToken -resetPasswordToken');

        if (!user) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({
                    message: 'User not found'
                });
            }
        } else {
            if (callback) {
                callback(user);
            } else {
                res.status(200).json({
                    message: 'User updated successfully',
                    user
                });
            }
        }
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).redirect(req.get('Referrer') || '/');
        }
        res.status(500).redirect(req.get('Referrer') || '/');
    }
};

// Delete a user by ID along with their sessions
exports.removeUser = async (req, res) => {
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
};

// Update user password
exports.updatePassword = async (req, res, callback) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).redirect(req.get('Referrer') || '/');
        }
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).redirect(req.get('Referrer') || '/');
        }
        user.password = newPassword;
        await user.save();
        if (callback) {
            callback(user);
        } else {
            res.status(200).json({
                message: 'Password updated successfully'
            });
        }
    } catch (err) {
        res.status(500).redirect(req.get('Referrer') || '/');
    }
};