const express = require('express');
const router = express.Router();
const { Channel } = require('../models');
const { optionalAuth } = require('../middleware');
const { generateStreamToken } = require('../utils');

// Generate M3U8 playlist for all channels
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { category, format = 'm3u' } = req.query;
        
        let query = { isActive: true, isWorking: true };
        if (category) {
            query.category = category;
        }

        const channels = await Channel.find(query)
            .sort({ category: 1, order: 1, name: 1 });

        if (format === 'json') {
            // Return JSON format for the app
            const channelList = channels.map(ch => ({
                id: ch._id,
                name: ch.name,
                category: ch.category,
                logoUrl: ch.logoUrl,
                quality: ch.quality,
                epgId: ch.epgId
            }));

            return res.json({
                success: true,
                data: {
                    channels: channelList,
                    total: channelList.length
                }
            });
        }

        // Generate M3U8 playlist format
        let playlist = '#EXTM3U\n';
        playlist += '#PLAYLIST:BathTV Live Channels\n\n';

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        for (const channel of channels) {
            // Generate a token for each channel
            const token = generateStreamToken(
                channel._id.toString(),
                req.userId ? req.userId.toString() : null,
                7200 // 2 hour expiration for playlist URLs
            );

            playlist += `#EXTINF:-1 tvg-id="${channel.epgId || ''}" `;
            playlist += `tvg-name="${channel.name}" `;
            playlist += `tvg-logo="${channel.logoUrl || ''}" `;
            playlist += `group-title="${channel.category}",${channel.name}\n`;
            playlist += `${baseUrl}/api/stream/${channel._id}?token=${token}\n\n`;
        }

        res.setHeader('Content-Type', 'application/x-mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename="nexttv_playlist.m3u"');
        res.send(playlist);
    } catch (error) {
        next(error);
    }
});

// Get playlist by category
router.get('/category/:category', optionalAuth, async (req, res, next) => {
    try {
        const { category } = req.params;

        const channels = await Channel.find({
            category,
            isActive: true,
            isWorking: true
        }).sort({ order: 1, name: 1 });

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let playlist = '#EXTM3U\n';
        playlist += `#PLAYLIST:NextTV ${category} Channels\n\n`;

        for (const channel of channels) {
            const token = generateStreamToken(
                channel._id.toString(),
                req.userId ? req.userId.toString() : null,
                7200
            );

            playlist += `#EXTINF:-1 tvg-id="${channel.epgId || ''}" `;
            playlist += `tvg-name="${channel.name}" `;
            playlist += `tvg-logo="${channel.logoUrl || ''}" `;
            playlist += `group-title="${channel.category}",${channel.name}\n`;
            playlist += `${baseUrl}/api/stream/${channel._id}?token=${token}\n\n`;
        }

        res.setHeader('Content-Type', 'application/x-mpegurl');
        res.setHeader('Content-Disposition', `attachment; filename="nexttv_${category.toLowerCase()}.m3u"`);
        res.send(playlist);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
