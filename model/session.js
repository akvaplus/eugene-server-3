const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', "paused", 'completed'],
        default: 'active'
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    userFirstName: {
        type: String,
        default: ''
    },
    userLastName: {
        type: String,
        default: ''
    },
    userUsername: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema); 