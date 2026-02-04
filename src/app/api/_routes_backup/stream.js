const express = require('express');
const router = express.Router();
const { Channel, Movie, Series, Episode } = require('../models');
const { verifyStreamToken } = require('../utils');

// Stream proxy endpoint - validates token and redirects to actual stream
router.get('/:contentId', async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const { token, type = 'channel' } = req.query;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Stream token required'
            });
        }

        // Verify the token
        const verification = verifyStreamToken(token);

        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                message: verification.error || 'Invalid or expired token'
            });
        }

        // Check if token was generated for this content
        if (verification.payload.channelId !== contentId) {
            return res.status(403).json({
                success: false,
                message: 'Token not valid for this content'
            });
        }

        let streamUrl;

        // Get stream URL based on content type
        switch (type) {
            case 'movie':
                const movie = await Movie.findById(contentId);
                if (!movie || !movie.isActive) {
                    return res.status(404).json({
                        success: false,
                        message: 'Movie not found'
                    });
                }
                streamUrl = movie.streamUrl;
                break;

            case 'episode':
                const episode = await Episode.findById(contentId);
                if (!episode || !episode.isActive) {
                    return res.status(404).json({
                        success: false,
                        message: 'Episode not found'
                    });
                }
                streamUrl = episode.streamUrl;
                break;

            case 'channel':
            default:
                const channel = await Channel.findById(contentId);
                if (!channel || !channel.isActive || !channel.isWorking) {
                    return res.status(404).json({
                        success: false,
                        message: 'Channel not found or unavailable'
                    });
                }
                streamUrl = channel.streamUrl;
                break;
        }

        // Redirect to actual stream URL
        // In production, you might want to proxy the stream instead
        res.redirect(302, streamUrl);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
