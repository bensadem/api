const express = require('express');
const router = express.Router();
const { CatchUp, Channel } = require('../models');
const { optionalAuth } = require('../middleware');
const { generateProtectedUrl } = require('../utils');

// Get all catchup content
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { channelId, category, date, page = 1, limit = 20 } = req.query;

        let query = {
            isActive: true,
            expiresAt: { $gt: new Date() }
        };

        if (channelId) {
            query.channel = channelId;
        }

        if (category) {
            query.category = category;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.startTime = { $gte: startOfDay, $lte: endOfDay };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const catchups = await CatchUp.find(query)
            .select('-streamUrl')
            .populate('channel', 'name logoUrl')
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CatchUp.countDocuments(query);

        res.json({
            success: true,
            data: {
                catchups,
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

// Get catchup by channel
router.get('/channel/:channelId', optionalAuth, async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const catchups = await CatchUp.find({
            channel: channelId,
            isActive: true,
            startTime: { $gte: startDate },
            expiresAt: { $gt: new Date() }
        })
        .select('-streamUrl')
        .sort({ startTime: -1 });

        // Group by date
        const groupedByDate = {};
        catchups.forEach(catchup => {
            const dateKey = catchup.startTime.toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(catchup);
        });

        res.json({
            success: true,
            data: {
                catchups: groupedByDate,
                totalCount: catchups.length
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get single catchup details
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const catchup = await CatchUp.findById(req.params.id)
            .select('-streamUrl')
            .populate('channel', 'name logoUrl');

        if (!catchup || !catchup.isActive) {
            return res.status(404).json({
                success: false,
                message: 'CatchUp content not found'
            });
        }

        if (catchup.expiresAt < new Date()) {
            return res.status(410).json({
                success: false,
                message: 'CatchUp content has expired'
            });
        }

        res.json({
            success: true,
            data: { catchup }
        });
    } catch (error) {
        next(error);
    }
});

// Get catchup stream URL
router.get('/:id/play', optionalAuth, async (req, res, next) => {
    try {
        const catchup = await CatchUp.findById(req.params.id);

        if (!catchup || !catchup.isActive) {
            return res.status(404).json({
                success: false,
                message: 'CatchUp content not found'
            });
        }

        if (catchup.expiresAt < new Date()) {
            return res.status(410).json({
                success: false,
                message: 'CatchUp content has expired'
            });
        }

        // Increment view count
        catchup.viewCount += 1;
        await catchup.save();

        // Generate protected URL
        const protectedUrl = generateProtectedUrl(
            catchup.streamUrl,
            catchup._id.toString(),
            req.userId ? req.userId.toString() : null
        );

        res.json({
            success: true,
            data: {
                streamUrl: protectedUrl,
                title: catchup.title,
                duration: catchup.duration
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
