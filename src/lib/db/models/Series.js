const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Series title is required'],
        trim: true,
        index: true
    },
    originalTitle: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    posterUrl: {
        type: String,
        default: ''
    },
    backdropUrl: {
        type: String,
        default: ''
    },
    trailerUrl: {
        type: String,
        default: ''
    },
    genre: [{
        type: String
    }],
    year: {
        type: Number
    },
    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    imdbId: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'English'
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'cancelled'],
        default: 'ongoing'
    },
    totalSeasons: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Text index for search
seriesSchema.index({ title: 'text', description: 'text', originalTitle: 'text' });

module.exports = mongoose.models.Series || mongoose.model('Series', seriesSchema);

