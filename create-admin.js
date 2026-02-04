require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    role: String,
    isActive: Boolean,
    deviceId: String,
    deviceType: String,
    lastLogin: Date,
    fcmToken: String,
    preferences: {
        notifications: Boolean,
        autoplay: Boolean,
        quality: String
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@nexttv.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin
        const admin = await User.create({
            email: 'admin@nexttv.com',
            password: 'admin123456',
            username: 'Admin',
            role: 'admin',
            isActive: true,
            deviceType: 'web',
            preferences: {
                notifications: true,
                autoplay: true,
                quality: 'auto'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@nexttv.com');
        console.log('Password: admin123456');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();
