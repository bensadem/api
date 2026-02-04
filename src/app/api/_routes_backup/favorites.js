const express = require('express');
const router = express.Router();
const { Favorite, Channel } = require('../models');
const { authenticate } = require('../middleware');

// Get user's favorites
router.get('/', authenticate, async (req, res, next) => {
    try {
        const favorites = await Favorite.getUserFavorites(req.userId);

        const channels = favorites
            .map(fav => fav.channel)
            .filter(ch => ch && ch.isActive)
            .map(ch => ({
                ...ch.toObject(),
                streamUrl: undefined,
                backupStreamUrl: undefined
            }));

        res.json({
            success: true,
            data: {
                favorites: channels,
                count: channels.length
            }
        });
    } catch (error) {
        next(error);
    }
});

// Add channel to favorites
router.post('/:channelId', authenticate, async (req, res, next) => {
    try {
        const { channelId } = req.params;

        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        // Check if already favorited
        const existing = await Favorite.findOne({
            user: req.userId,
            channel: channelId
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Channel already in favorites'
            });
        }

        await Favorite.create({
            user: req.userId,
            channel: channelId
        });

        res.status(201).json({
            success: true,
            message: 'Channel added to favorites',
            data: {
                isFavorited: true
            }
        });
    } catch (error) {
        next(error);
    }
});

// Remove channel from favorites
router.delete('/:channelId', authenticate, async (req, res, next) => {
    try {
        const { channelId } = req.params;

        const result = await Favorite.deleteOne({
            user: req.userId,
            channel: channelId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({
            success: true,
            message: 'Channel removed from favorites',
            data: {
                isFavorited: false
            }
        });
    } catch (error) {
        next(error);
    }
});

// Toggle favorite status
router.post('/:channelId/toggle', authenticate, async (req, res, next) => {
    try {
        const { channelId } = req.params;

        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        const result = await Favorite.toggle(req.userId, channelId);

        res.json({
            success: true,
            message: result.action === 'added' ? 'Added to favorites' : 'Removed from favorites',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// Check if channel is favorited
router.get('/:channelId/check', authenticate, async (req, res, next) => {
    try {
        const { channelId } = req.params;

        const isFavorited = await Favorite.isFavorited(req.userId, channelId);

        res.json({
            success: true,
            data: {
                isFavorited
            }
        });
    } catch (error) {
        next(error);
    }
});

// Sync favorites (bulk operation)
router.post('/sync', authenticate, async (req, res, next) => {
    try {
        const { channelIds } = req.body;

        if (!Array.isArray(channelIds)) {
            return res.status(400).json({
                success: false,
                message: 'channelIds must be an array'
            });
        }

        // Get current favorites
        const currentFavorites = await Favorite.find({ user: req.userId });
        const currentIds = currentFavorites.map(f => f.channel.toString());

        // Add new favorites
        const toAdd = channelIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !channelIds.includes(id));

        // Verify channels exist
        const validChannels = await Channel.find({
            _id: { $in: toAdd },
            isActive: true
        });
        const validIds = validChannels.map(c => c._id.toString());

        // Create new favorites
        if (validIds.length > 0) {
            await Favorite.insertMany(
                validIds.map(channelId => ({
                    user: req.userId,
                    channel: channelId
                })),
                { ordered: false }
            ).catch(() => {}); // Ignore duplicate errors
        }

        // Remove old favorites
        if (toRemove.length > 0) {
            await Favorite.deleteMany({
                user: req.userId,
                channel: { $in: toRemove }
            });
        }

        res.json({
            success: true,
            message: 'Favorites synced',
            data: {
                added: validIds.length,
                removed: toRemove.length
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
