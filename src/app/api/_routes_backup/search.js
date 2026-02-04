const express = require('express');
const router = express.Router();
const { Channel, Movie, Series, Analytics } = require('../models');
const { optionalAuth } = require('../middleware');

// Global search across all content
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { q, type, page = 1, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchQuery = q.trim();
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const results = {};

        // Search based on type or all
        if (!type || type === 'channels') {
            const channels = await Channel.find({
                $text: { $search: searchQuery },
                isActive: true,
                isWorking: true
            })
            .select('-streamUrl -backupStreamUrl')
            .sort({ score: { $meta: 'textScore' } })
            .limit(type ? parseInt(limit) : 10);

            results.channels = channels;
        }

        if (!type || type === 'movies') {
            const movies = await Movie.find({
                $text: { $search: searchQuery },
                isActive: true
            })
            .select('-streamUrl')
            .sort({ score: { $meta: 'textScore' } })
            .limit(type ? parseInt(limit) : 10);

            results.movies = movies;
        }

        if (!type || type === 'series') {
            const series = await Series.find({
                $text: { $search: searchQuery },
                isActive: true
            })
            .sort({ score: { $meta: 'textScore' } })
            .limit(type ? parseInt(limit) : 10);

            results.series = series;
        }

        // Log search analytics
        await Analytics.create({
            eventType: 'search',
            user: req.userId,
            deviceId: req.headers['x-device-id'],
            deviceType: req.headers['x-device-type'] || 'unknown',
            metadata: {
                query: searchQuery,
                type: type || 'all',
                resultsCount: {
                    channels: results.channels?.length || 0,
                    movies: results.movies?.length || 0,
                    series: results.series?.length || 0
                }
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            appVersion: req.headers['x-app-version']
        });

        res.json({
            success: true,
            data: {
                query: searchQuery,
                results,
                totalCount: (results.channels?.length || 0) + 
                           (results.movies?.length || 0) + 
                           (results.series?.length || 0)
            }
        });
    } catch (error) {
        next(error);
    }
});

// Search suggestions (autocomplete)
router.get('/suggestions', optionalAuth, async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                data: { suggestions: [] }
            });
        }

        const searchQuery = q.trim();
        const regex = new RegExp('^' + searchQuery, 'i');

        const [channelNames, movieTitles, seriesTitles] = await Promise.all([
            Channel.distinct('name', { name: regex, isActive: true }),
            Movie.distinct('title', { title: regex, isActive: true }),
            Series.distinct('title', { title: regex, isActive: true })
        ]);

        // Combine and limit suggestions
        const suggestions = [...new Set([
            ...channelNames.slice(0, 5),
            ...movieTitles.slice(0, 5),
            ...seriesTitles.slice(0, 5)
        ])].slice(0, 10);

        res.json({
            success: true,
            data: { suggestions }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
