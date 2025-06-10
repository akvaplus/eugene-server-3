const UserModel = require('../model/user');

// Create and Save a new user
exports.create = async (req, res, callback) => {
    // Validate required fields
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
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
            lastName: req.body.lastName,
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
            req.flash('error', 'Username or email already exists');
            return res.status(400).redirect('back');
        }
        req.flash('error', err.message || 'Error occurred while creating user');
        res.status(500).redirect('back');
    }
};

// Retrieve all users
exports.findAll = async (req, res, callback) => {
    try {
        const users = await UserModel.find().select('-password -emailVerificationToken -resetPasswordToken');
        if (callback) {
            callback(users);
        } else {
            res.status(200).json(users);
        }
    } catch (error) {
        req.flash('error', error.message || 'Error retrieving users');
        res.status(500).redirect('back');
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
        req.flash('error', error.message || 'Error retrieving user');
        res.status(500).redirect('back');
    }
};

// Update a user by ID
exports.update = async (req, res, callback) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: 'Data to update cannot be empty!'
        });
    }

    const id = req.params.id;
    const updateData = { ...req.body };

    // Prevent updating sensitive fields directly
    delete updateData.password;
    delete updateData.emailVerificationToken;
    delete updateData.resetPasswordToken;
    delete updateData.isEmailVerified;
    delete updateData.loginAttempts;
    delete updateData.lockUntil;

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
            req.flash('error', 'Username or email already exists');
            return res.status(400).redirect('back');
        }
        req.flash('error', err.message || 'Error updating user');
        res.status(500).redirect('back');
    }
};

// Delete a user by ID
exports.destroy = async (req, res, callback) => {
    try {
        const user = await UserModel.findByIdAndDelete(req.params.id);
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
                    message: 'User deleted successfully!'
                });
            }
        }
    } catch (err) {
        req.flash('error', err.message || 'Error deleting user');
        res.status(500).redirect('back');
    }
};

// Optional: Password update endpoint
exports.updatePassword = async (req, res, callback) => {
    if (!req.body.password) {
        req.flash('error', 'New password is required');
        return res.status(400).redirect('back');
    }

    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({
                    message: 'User not found'
                });
            }
        } else {
            user.password = req.body.password;
            await user.save();
            
            if (callback) {
                callback(user);
            } else {
                res.status(200).json({
                    message: 'Password updated successfully'
                });
            }
        }
    } catch (err) {
        req.flash('error', err.message || 'Error updating password');
        res.status(500).redirect('back');
    }
};