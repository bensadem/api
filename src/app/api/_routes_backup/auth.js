const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware');
const { generateToken } = require('../utils');

// Register new user
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, username, deviceId, deviceType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            username: username || email.split('@')[0],
            deviceId,
            deviceType: deviceType || 'unknown'
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

// Login user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password, deviceId, deviceType } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update device info and last login
        user.deviceId = deviceId || user.deviceId;
        user.deviceType = deviceType || user.deviceType;
        await user.updateLastLogin();

        // Generate token
        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    preferences: user.preferences
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

// Guest login (anonymous user)
router.post('/guest', async (req, res, next) => {
    try {
        const { deviceId, deviceType } = req.body;

        // Create or find guest user based on device ID
        let user = await User.findOne({ deviceId, role: 'user' });

        if (!user) {
            user = await User.create({
                email: `guest_${deviceId}@nexttv.local`,
                password: require('crypto').randomBytes(16).toString('hex'),
                username: `Guest_${deviceId.substring(0, 8)}`,
                deviceId,
                deviceType: deviceType || 'unknown'
            });
        }

        await user.updateLastLogin();

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Guest login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    isGuest: true
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    username: req.user.username,
                    role: req.user.role,
                    preferences: req.user.preferences,
                    createdAt: req.user.createdAt
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.put('/me', authenticate, async (req, res, next) => {
    try {
        const { username, preferences } = req.body;

        if (username) req.user.username = username;
        if (preferences) {
            req.user.preferences = { ...req.user.preferences, ...preferences };
        }

        await req.user.save();

        res.json({
            success: true,
            message: 'Profile updated',
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    username: req.user.username,
                    preferences: req.user.preferences
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update FCM token for notifications
router.put('/fcm-token', authenticate, async (req, res, next) => {
    try {
        const { fcmToken } = req.body;

        req.user.fcmToken = fcmToken;
        await req.user.save();

        res.json({
            success: true,
            message: 'FCM token updated'
        });
    } catch (error) {
        next(error);
    }
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Logout (optional - mainly for cleanup)
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        // Clear FCM token on logout
        req.user.fcmToken = '';
        await req.user.save();

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    username: req.user.username,
                    role: req.user.role,
                    isActive: req.user.isActive,
                    preferences: req.user.preferences
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
