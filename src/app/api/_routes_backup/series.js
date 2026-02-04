const express = require('express');
const router = express.Router();
const { Series, Episode, Analytics } = require('../models');
const { optionalAuth } = require('../middleware');
const { generateProtectedUrl } = require('../utils');

// Get all series
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { genre, featured, search, status, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        if (genre) {
            query.genre = genre;
        }

        if (featured === 'true') {
            query.isFeatured = true;
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const series = await Series.find(query)
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Series.countDocuments(query);

        res.json({
            success: true,
            data: {
                series,
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

// Get featured series
router.get('/featured', optionalAuth, async (req, res, next) => {
    try {
        const series = await Series.find({ isFeatured: true, isActive: true })
            .sort({ order: 1 })
            .limit(10);

        res.json({
            success: true,
            data: { series }
        });
    } catch (error) {
        next(error);
    }
});

// Get single series details with episodes
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const series = await Series.findById(req.params.id);

        if (!series || !series.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }

        // Get all episodes grouped by season
        const episodes = await Episode.find({ series: series._id, isActive: true })
            .select('-streamUrl')
            .sort({ seasonNumber: 1, episodeNumber: 1 });

        // Group episodes by season
        const seasons = {};
        episodes.forEach(ep => {
            if (!seasons[ep.seasonNumber]) {
                seasons[ep.seasonNumber] = [];
            }
            seasons[ep.seasonNumber].push(ep);
        });

        res.json({
            success: true,
            data: {
                series,
                seasons,
                totalEpisodes: episodes.length
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get episodes of a series by season
router.get('/:id/seasons/:season', optionalAuth, async (req, res, next) => {
    try {
        const { id, season } = req.params;

        const episodes = await Episode.find({
            series: id,
            seasonNumber: parseInt(season),
            isActive: true
        })
        .select('-streamUrl')
        .sort({ episodeNumber: 1 });

        res.json({
            success: true,
            data: { episodes }
        });
    } catch (error) {
        next(error);
    }
});

// Get episode stream URL
router.get('/episodes/:episodeId/play', optionalAuth, async (req, res, next) => {
    try {
        const episode = await Episode.findById(req.params.episodeId)
            .populate('series', 'title');

        if (!episode || !episode.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Episode not found'
            });
        }

        // Increment view count
        episode.viewCount += 1;
        await episode.save();

        // Also increment series view count
        await Series.findByIdAndUpdate(episode.series._id, {
            $inc: { viewCount: 1 }
        });

        // Log analytics
        await Analytics.create({
            eventType: 'series_view',
            user: req.userId,
            deviceId: req.headers['x-device-id'],
            deviceType: req.headers['x-device-type'] || 'unknown',
            contentId: episode._id,
            contentType: 'episode',
            metadata: {
                seriesId: episode.series._id,
                seasonNumber: episode.seasonNumber,
                episodeNumber: episode.episodeNumber
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            appVersion: req.headers['x-app-version']
        });

        // Generate protected URL
        const protectedUrl = generateProtectedUrl(
            episode.streamUrl,
            episode._id.toString(),
            req.userId ? req.userId.toString() : null
        );

        res.json({
            success: true,
            data: {
                streamUrl: protectedUrl,
                quality: episode.quality,
                title: episode.title,
                seriesTitle: episode.series.title,
                seasonNumber: episode.seasonNumber,
                episodeNumber: episode.episodeNumber,
                subtitles: episode.subtitles
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get available genres
router.get('/meta/genres', async (req, res, next) => {
    try {
        const genres = await Series.distinct('genre', { isActive: true });

        const genresWithCount = await Promise.all(
            genres.map(async (genre) => {
                const count = await Series.countDocuments({
                    genre: genre,
                    isActive: true
                });
                return { name: genre, count };
            })
        );

        res.json({
            success: true,
            data: {
                genres: genresWithCount.filter(g => g.count > 0)
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
