const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    body: {
        type: String,
        required: [true, 'Notification body is required'],
        trim: true,
        maxlength: [500, 'Body cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'promo'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    imageUrl: {
        type: String,
        trim: true
    },
    actionUrl: {
        type: String,
        trim: true
    },
    actionText: {
        type: String,
        trim: true,
        maxlength: [30, 'Action text cannot exceed 30 characters']
    },
    targetAudience: {
        type: String,
        enum: ['all', 'active', 'inactive', 'premium'],
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Check if notification is expired
notificationSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Prevent model recompilation in Next.js
module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
