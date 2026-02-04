const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    username: {
        type: String,
        trim: true,
        default: ''
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
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    fcmToken: {
        type: String,
        default: ''
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        autoplay: {
            type: Boolean,
            default: true
        },
        quality: {
            type: String,
            enum: ['auto', 'SD', 'HD', 'FHD'],
            default: 'auto'
        }
    },
    watchHistory: [{
        channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = Date.now();
    return this.save();
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

