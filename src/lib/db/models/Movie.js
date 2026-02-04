const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required'],
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
    streamUrl: {
        type: String,
        required: [true, 'Stream URL is required']
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
    duration: {
        type: Number, // Duration in minutes
        default: 0
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
movieSchema.index({ title: 'text', description: 'text', originalTitle: 'text' });

module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

