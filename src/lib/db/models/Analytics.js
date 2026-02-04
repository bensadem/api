const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['channel_view', 'movie_view', 'series_view', 'search', 'app_open', 'error']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deviceId: {
        type: String,
        default: ''
    },
    deviceType: {
        type: String,
        enum: ['android', 'android_tv', 'web', 'unknown'],
        default: 'unknown'
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId
    },
    contentType: {
        type: String,
        enum: ['channel', 'movie', 'series', 'episode', 'catchup']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    duration: {
        type: Number, // Watch duration in seconds
        default: 0
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    appVersion: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for analytics queries
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ contentId: 1, contentType: 1, createdAt: -1 });
analyticsSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

