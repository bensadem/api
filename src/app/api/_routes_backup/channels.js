const express = require('express');
const router = express.Router();
const { Channel, Analytics } = require('../models');
const { authenticate, optionalAuth } = require('../middleware');
const { generateProtectedUrl, generateStreamToken } = require('../utils');

// Get all channels (grouped by category)
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { category, featured, search, page = 1, limit = 50 } = req.query;

        let query = { isActive: true, isWorking: true };

        if (category) {
            query.category = category;
        }

        if (featured === 'true') {
            query.isFeatured = true;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const channels = await Channel.find(query)
            .select('-streamUrl -backupStreamUrl')
            .sort({ order: 1, name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Channel.countDocuments(query);

        res.json({
            success: true,
            data: {
                channels,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get channels grouped by category
router.get('/grouped', optionalAuth, async (req, res, next) => {
    try {
        // Get categories from database
        let categories;
        try {
            const Category = require('../models').Category;
            categories = await Category.find({ type: 'channel', isActive: true }).sort({ order: 1, name: 1 });
            categories = categories.map(c => c.name);
        } catch (e) {
            // Fallback to distinct categories from channels
            categories = await Channel.distinct('category', { isActive: true });
        }
        
        const groupedChannels = await Promise.all(
            categories.map(async (category) => {
                const channels = await Channel.find({
                    category,
                    isActive: true,
                    isWorking: true
                })
                .select('-streamUrl -backupStreamUrl')
                .sort({ order: 1, name: 1 })
                .limit(20);

                return {
                    category,
                    channels,
                    count: channels.length
                };
            })
        );

        // Filter out empty categories
        const filteredGroups = groupedChannels.filter(group => group.count > 0);

        res.json({
            success: true,
            data: {
                groups: filteredGroups
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get categories list - MUST be before /:id route
router.get('/categories', async (req, res, next) => {
    try {
        const { type } = req.query;
        
        // Get categories from Category model if it exists, otherwise use distinct
        let categories;
        try {
            const Category = require('../models').Category;
            let query = {};
            if (type) query.type = type;
            categories = await Category.find(query).sort({ order: 1, name: 1 });
        } catch (e) {
            // Fallback to distinct categories from channels
            const distinctCategories = await Channel.distinct('category', { isActive: true });
            categories = distinctCategories.map(name => ({ _id: name, name, type: 'channel' }));
        }

        res.json({
            success: true,
            data: {
                categories
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get featured channels
router.get('/featured', optionalAuth, async (req, res, next) => {
    try {
        const channels = await Channel.getFeatured();

        res.json({
            success: true,
            data: {
                channels: channels.map(ch => ({
                    ...ch.toObject(),
                    streamUrl: undefined,
                    backupStreamUrl: undefined
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get single channel details
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id)
            .select('-streamUrl -backupStreamUrl');

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        res.json({
            success: true,
            data: { channel }
        });
    } catch (error) {
        next(error);
    }
});

// Get channel stream URL (protected with token)
router.get('/:id/play', optionalAuth, async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        if (!channel.isActive || !channel.isWorking) {
            return res.status(403).json({
                success: false,
                message: 'Channel is currently unavailable'
            });
        }

        // Increment view count
        await channel.incrementViews();

        // Log analytics
        await Analytics.create({
            eventType: 'channel_view',
            user: req.userId,
            deviceId: req.headers['x-device-id'],
            deviceType: req.headers['x-device-type'] || 'unknown',
            contentId: channel._id,
            contentType: 'channel',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            appVersion: req.headers['x-app-version']
        });

        // Generate protected URL with token
        const protectedUrl = generateProtectedUrl(
            channel.streamUrl,
            channel._id.toString(),
            req.userId ? req.userId.toString() : null
        );

        const response = {
            success: true,
            data: {
                streamUrl: protectedUrl,
                quality: channel.quality,
                name: channel.name
            }
        };

        // Include backup URL if available
        if (channel.backupStreamUrl) {
            response.data.backupStreamUrl = generateProtectedUrl(
                channel.backupStreamUrl,
                channel._id.toString(),
                req.userId ? req.userId.toString() : null
            );
        }

        res.json(response);
    } catch (error) {
        next(error);
    }
});

// Get available categories
router.get('/meta/categories', async (req, res, next) => {
    try {
        const categories = await Channel.distinct('category', { isActive: true });
        
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Channel.countDocuments({
                    category,
                    isActive: true,
                    isWorking: true
                });
                return { name: category, count };
            })
        );

        res.json({
            success: true,
            data: {
                categories: categoriesWithCount.filter(c => c.count > 0)
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
