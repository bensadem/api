const express = require('express');
const router = express.Router();
const { Movie, Analytics } = require('../models');
const { optionalAuth } = require('../middleware');
const { generateProtectedUrl } = require('../utils');

// Get all movies
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { genre, featured, search, year, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        if (genre) {
            query.genre = genre;
        }

        if (featured === 'true') {
            query.isFeatured = true;
        }

        if (year) {
            query.year = parseInt(year);
        }

        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const movies = await Movie.find(query)
            .select('-streamUrl')
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        res.json({
            success: true,
            data: {
                movies,
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

// Get featured movies
router.get('/featured', optionalAuth, async (req, res, next) => {
    try {
        const movies = await Movie.find({ isFeatured: true, isActive: true })
            .select('-streamUrl')
            .sort({ order: 1 })
            .limit(10);

        res.json({
            success: true,
            data: { movies }
        });
    } catch (error) {
        next(error);
    }
});

// Get movies grouped by genre
router.get('/grouped', optionalAuth, async (req, res, next) => {
    try {
        const genres = await Movie.distinct('genre', { isActive: true });

        const groupedMovies = await Promise.all(
            genres.map(async (genre) => {
                const movies = await Movie.find({
                    genre: genre,
                    isActive: true
                })
                .select('-streamUrl')
                .sort({ order: 1, rating: -1 })
                .limit(15);

                return {
                    genre,
                    movies,
                    count: movies.length
                };
            })
        );

        const filteredGroups = groupedMovies.filter(group => group.count > 0);

        res.json({
            success: true,
            data: { groups: filteredGroups }
        });
    } catch (error) {
        next(error);
    }
});

// Get single movie details
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id)
            .select('-streamUrl');

        if (!movie || !movie.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.json({
            success: true,
            data: { movie }
        });
    } catch (error) {
        next(error);
    }
});

// Get movie stream URL
router.get('/:id/play', optionalAuth, async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie || !movie.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Increment view count
        movie.viewCount += 1;
        await movie.save();

        // Log analytics
        await Analytics.create({
            eventType: 'movie_view',
            user: req.userId,
            deviceId: req.headers['x-device-id'],
            deviceType: req.headers['x-device-type'] || 'unknown',
            contentId: movie._id,
            contentType: 'movie',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            appVersion: req.headers['x-app-version']
        });

        // Generate protected URL
        const protectedUrl = generateProtectedUrl(
            movie.streamUrl,
            movie._id.toString(),
            req.userId ? req.userId.toString() : null
        );

        res.json({
            success: true,
            data: {
                streamUrl: protectedUrl,
                quality: movie.quality,
                title: movie.title,
                subtitles: movie.subtitles
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get available genres
router.get('/meta/genres', async (req, res, next) => {
    try {
        const genres = await Movie.distinct('genre', { isActive: true });

        const genresWithCount = await Promise.all(
            genres.map(async (genre) => {
                const count = await Movie.countDocuments({
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
