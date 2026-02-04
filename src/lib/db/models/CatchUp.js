const mongoose = require('mongoose');

const catchUpSchema = new mongoose.Schema({
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Program title is required'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    streamUrl: {
        type: String,
        required: [true, 'Stream URL is required']
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // Duration in minutes
        default: 0
    },
    category: {
        type: String,
        default: 'General'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for querying active catchup content
catchUpSchema.index({ channel: 1, startTime: -1 });

// TTL index to automatically delete expired content
catchUpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.CatchUp || mongoose.model('CatchUp', catchUpSchema);

