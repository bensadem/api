const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Channel name is required'],
        trim: true,
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    logoUrl: {
        type: String,
        default: ''
    },
    streamUrl: {
        type: String,
        required: false
    },
    externalChannelId: {
        type: String,
        default: ''
    },
    streamUrls: {
        auto: { type: String, default: '' },
        fhd: { type: String, default: '' },  // 1080p
        hd: { type: String, default: '' },   // 720p
        sd: { type: String, default: '' },   // 480p
        ld: { type: String, default: '' }    // 360p
    },
    backupStreamUrl: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: 'International'
    },
    language: {
        type: String,
        default: 'English'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    epgId: {
        type: String,
        default: ''
    },
    quality: {
        type: String,
        enum: ['SD', 'HD', 'FHD', '4K'],
        default: 'HD'
    },
    viewCount: {
        type: Number,
        default: 0
    },
    lastChecked: {
        type: Date,
        default: Date.now
    },
    isWorking: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for search
channelSchema.index({ name: 'text', description: 'text' });

// Static method to get channels by category
channelSchema.statics.getByCategory = function (category) {
    return this.find({ category, isActive: true, isWorking: true }).sort({ order: 1, name: 1 });
};

// Static method to get featured channels
channelSchema.statics.getFeatured = function () {
    return this.find({ isFeatured: true, isActive: true, isWorking: true }).sort({ order: 1 });
};

// Method to increment view count
channelSchema.methods.incrementViews = function () {
    this.viewCount += 1;
    return this.save();
};

module.exports = mongoose.models.Channel || mongoose.model('Channel', channelSchema);

