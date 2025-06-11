const SessionModel = require('../model/session');
const UserModel = require('../model/user');

console.log('SessionModel:', SessionModel);

// Create and Save a new session
exports.create = async (req, res) => {
    try {
        const { name, startTime, endTime, status, metadata } = req.body;
        const userId = req.session.userId;
        let sessionUserId = userId; // Default to current user's ID
        
        // Check if the user is trying to create a session for another user
        if (req.body.userId && req.body.userId !== userId) {
            const currentUser = await UserModel.findById(userId);
            if (!currentUser || !currentUser.isAdmin) {
                return res.redirect('/session');
            }
            sessionUserId = req.body.userId; // Allow admin to set different user ID
        }
        
        // Parse metadata if provided as a string (from textarea)
        let metadataObj = {};
        if (metadata && typeof metadata === 'string') {
            metadata.split('\n').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    metadataObj[key.trim()] = value.trim();
                }
            });
        } else if (metadata && typeof metadata === 'object') {
            metadataObj = metadata;
        }
        
        // Fetch user details to store name information
        const sessionUser = await UserModel.findById(sessionUserId);
        
        const newSession = new SessionModel({
            name,
            userId: sessionUserId,
            userFirstName: sessionUser ? sessionUser.firstName : '',
            userLastName: sessionUser ? sessionUser.lastName : '',
            userUsername: sessionUser ? sessionUser.username : '',
            startTime: startTime || new Date(),
            endTime: endTime || undefined,
            status: status || 'active',
            metadata: metadataObj
        });
        await newSession.save();
        res.redirect('/session');
    } catch (error) {
        console.error('Error creating session:', error);
        res.redirect('/session/new');
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
        res.status(500).redirect('back');
    }
};

// Update a session by ID
exports.update = async (req, res) => {
    try {
        const { name, startTime, endTime, status, metadata } = req.body;
        const userId = req.session.userId;
        const sessionId = req.params.id;
        
        // Fetch the session to be updated
        const session = await SessionModel.findById(sessionId);
        if (!session) {
            return res.redirect('/session');
        }
        
        // Check if the user is trying to change the userId of the session
        let sessionUserId = session.userId;
        if (req.body.userId && req.body.userId !== session.userId.toString()) {
            const currentUser = await UserModel.findById(userId);
            if (!currentUser || !currentUser.isAdmin) {
                return res.redirect(`/session/${sessionId}`);
            }
            sessionUserId = req.body.userId; // Allow admin to set different user ID
            // Update user information when userId changes
            const sessionUser = await UserModel.findById(sessionUserId);
            session.userFirstName = sessionUser ? sessionUser.firstName : '';
            session.userLastName = sessionUser ? sessionUser.lastName : '';
            session.userUsername = sessionUser ? sessionUser.username : '';
        }
        
        // Parse metadata if provided as a string (from textarea)
        let metadataObj = {};
        if (metadata && typeof metadata === 'string') {
            metadata.split('\n').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    metadataObj[key.trim()] = value.trim();
                }
            });
        } else if (metadata && typeof metadata === 'object') {
            metadataObj = metadata;
        }
        
        // Update session fields
        session.name = name || session.name;
        session.userId = sessionUserId;
        session.startTime = startTime ? new Date(startTime) : session.startTime;
        session.endTime = endTime ? new Date(endTime) : session.endTime;
        session.status = status || session.status;
        session.metadata = metadataObj;
        
        await session.save();
        res.redirect(`/session/${sessionId}`);
    } catch (error) {
        console.error('Error updating session:', error);
        res.redirect(`/session/${req.params.id}/edit`);
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
        res.status(500).redirect('back');
    }
}; 