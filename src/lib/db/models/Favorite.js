const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure unique user-channel pairs
favoriteSchema.index({ user: 1, channel: 1 }, { unique: true });

// Static method to get user's favorites
favoriteSchema.statics.getUserFavorites = function(userId) {
    return this.find({ user: userId })
        .populate('channel')
        .sort({ addedAt: -1 });
};

// Static method to check if channel is favorited
favoriteSchema.statics.isFavorited = async function(userId, channelId) {
    const favorite = await this.findOne({ user: userId, channel: channelId });
    return !!favorite;
};

// Static method to toggle favorite
favoriteSchema.statics.toggle = async function(userId, channelId) {
    const existing = await this.findOne({ user: userId, channel: channelId });
    
    if (existing) {
        await this.deleteOne({ _id: existing._id });
        return { action: 'removed', isFavorited: false };
    } else {
        await this.create({ user: userId, channel: channelId });
        return { action: 'added', isFavorited: true };
    }
};

module.exports = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);

