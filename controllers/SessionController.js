const SessionModel = require('../model/session');
const UserModel = require('../model/user');

console.log('SessionModel:', SessionModel);

// Create and Save a new session
exports.create = async (req, res, callback) => {
    // Validate required fields
    const requiredFields = ['name', 'userId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        req.flash('error', `Missing required fields: ${missingFields.join(', ')}`);
        return res.status(400).redirect('back');
    }

    try {
        // Check if user exists
        const user = await UserModel.findById(req.body.userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.status(400).redirect('back');
        }

        const session = new SessionModel({
            name: req.body.name,
            userId: req.body.userId,
            startTime: req.body.startTime || Date.now(),
            endTime: req.body.endTime,
            status: req.body.status || 'active',
            metadata: req.body.metadata || {}
        });

        const data = await session.save();
        if (callback) {
            callback(data);
        } else {
            res.status(201).json({
                message: "Session created successfully!",
                session: {
                    id: data._id,
                    name: data.name,
                    userId: data.userId,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: data.status,
                    metadata: data.metadata,
                    createdAt: data.createdAt
                }
            });
        }
    } catch (err) {
        req.flash('error', err.message || 'Error occurred while creating session');
        res.status(500).redirect('back');
    }
};

// Retrieve all sessions
exports.findAll = async (req, res, callback) => {
    try {
        const sessions = await SessionModel.find().populate('userId');
        if (callback) {
            callback(sessions);
        } else {
            res.status(200).json(sessions);
        }
    } catch (error) {
        req.flash('error', error.message || 'Error retrieving sessions');
        res.status(500).redirect('back');
    }
};

// Find a single session by ID
exports.findOne = async (req, res, callback) => {
    try {
        const session = await SessionModel.findById(req.params.id).populate('userId');
        if (!session) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({ 
                    message: 'Session not found' 
                });
            }
        } else {
            if (callback) {
                callback(session);
            } else {
                res.status(200).json(session);
            }
        }
    } catch (error) {
        req.flash('error', error.message || 'Error retrieving session');
        res.status(500).redirect('back');
    }
};

// Update a session by ID
exports.update = async (req, res, callback) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        req.flash('error', 'Data to update cannot be empty!');
        return res.status(400).redirect('back');
    }

    const id = req.params.id;
    const updateData = { ...req.body };

    try {
        // If userId is being updated, check if user exists
        if (updateData.userId) {
            const user = await UserModel.findById(updateData.userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.status(400).redirect('back');
            }
        }

        const session = await SessionModel.findByIdAndUpdate(
            id, 
            updateData, 
            { 
                new: true, 
                runValidators: true,
                useFindAndModify: false 
            }
        ).populate('userId');

        if (!session) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({
                    message: 'Session not found'
                });
            }
        } else {
            if (callback) {
                callback(session);
            } else {
                res.status(200).json({
                    message: 'Session updated successfully',
                    session
                });
            }
        }
    } catch (err) {
        req.flash('error', err.message || 'Error updating session');
        res.status(500).redirect('back');
    }
};

// Delete a session by ID
exports.destroy = async (req, res, callback) => {
    try {
        const session = await SessionModel.findByIdAndDelete(req.params.id);
        if (!session) {
            if (callback) {
                callback(null);
            } else {
                return res.status(404).json({
                    message: 'Session not found'
                });
            }
        } else {
            if (callback) {
                callback(session);
            } else {
                res.status(200).json({
                    message: 'Session deleted successfully!'
                });
            }
        }
    } catch (err) {
        req.flash('error', err.message || 'Error deleting session');
        res.status(500).redirect('back');
    }
};

// Find sessions by User ID
exports.findByUserId = async (req, res, callback) => {
    try {
        const sessions = await SessionModel.find({ userId: req.params.userId }).populate('userId');
        if (callback) {
            callback(sessions);
        } else {
            res.status(200).json(sessions);
        }
    } catch (error) {
        req.flash('error', error.message || 'Error retrieving sessions for user');
        res.status(500).redirect('back');
    }
}; 