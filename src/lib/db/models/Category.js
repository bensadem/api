const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['channel', 'movie', 'series'],
        default: 'channel'
    },
    slug: {
        type: String,
        lowercase: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '📺'
    },
    logo: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create compound index for unique name per type  
categorySchema.index({ name: 1, type: 1 }, { unique: true });
// Compound index for slug + type
categorySchema.index({ slug: 1, type: 1 }, { unique: true });

// Pre-save middleware to generate slug
categorySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    next();
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// Drop old slug_1 index if it exists (one-time fix)
if (Category.collection) {
    Category.collection.dropIndex('slug_1').catch(() => {
        // Index doesn't exist, that's fine
    });
}

module.exports = Category;

