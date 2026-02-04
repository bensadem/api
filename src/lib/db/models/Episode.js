const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
    series: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Series',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Episode title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    seasonNumber: {
        type: Number,
        required: true
    },
    episodeNumber: {
        type: Number,
        required: true
    },
    streamUrl: {
        type: String,
        required: [true, 'Stream URL is required']
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // Duration in minutes
        default: 0
    },
    airDate: {
        type: Date
    },
    subtitles: [{
        language: String,
        url: String
    }],
    quality: {
        type: String,
        enum: ['SD', 'HD', 'FHD', '4K'],
        default: 'HD'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for series episodes
episodeSchema.index({ series: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.models.Episode || mongoose.model('Episode', episodeSchema);

