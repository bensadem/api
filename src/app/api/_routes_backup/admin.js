const express = require('express');
const router = express.Router();
const { Channel, Movie, Series, Episode, User, Category, CatchUp, AppConfig, Analytics } = require('../models');
const { authenticate, requireAdmin } = require('../middleware');
const { parseM3U8Playlist } = require('../utils/m3u8Parser');

// Apply admin authentication to all routes
router.use(authenticate, requireAdmin);

// ==================== Dashboard Stats ====================
router.get('/dashboard', async (req, res, next) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            channelCount,
            movieCount,
            seriesCount,
            userCount,
            todayViews,
            last24HoursViews,
            last7DaysViews,
            last30DaysViews,
            totalViews
        ] = await Promise.all([
            Channel.countDocuments({ isActive: true }),
            Movie.countDocuments({ isActive: true }),
            Series.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: true }),
            Analytics.countDocuments({ createdAt: { $gte: todayStart } }),
            Analytics.countDocuments({ createdAt: { $gte: last24Hours } }),
            Analytics.countDocuments({ createdAt: { $gte: last7Days } }),
            Analytics.countDocuments({ createdAt: { $gte: last30Days } }),
            Analytics.countDocuments()
        ]);

        // Get popular channels
        const popularChannels = await Channel.find({ isActive: true })
            .sort({ viewCount: -1 })
            .limit(10)
            .select('name category viewCount logoUrl');

        // Get most viewed channel in last 24 hours
        const recentViews = await Analytics.aggregate([
            { $match: { createdAt: { $gte: last24Hours }, contentType: 'channel' } },
            { $group: { _id: '$contentId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        let mostViewedChannel = null;
        if (recentViews.length > 0) {
            const channelId = recentViews[0]._id;
            const channel = await Channel.findById(channelId).select('name logoUrl viewCount');
            if (channel) {
                mostViewedChannel = {
                    ...channel.toObject(),
                    recentViews: recentViews[0].count
                };
            }
        }

        // Get viewers by country
        const viewersByCountry = await Analytics.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Estimate active viewers (views in last 15 minutes)
        const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
        const activeViewers = await Analytics.countDocuments({
            createdAt: { $gte: last15Minutes }
        });

        // Get unique active users
        const activeUsers = await Analytics.distinct('user', {
            createdAt: { $gte: last15Minutes }
        });

        // Get device breakdown
        const deviceBreakdown = await Analytics.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            { $group: { _id: '$deviceInfo', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get hourly views for today
        const hourlyViews = await Analytics.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent analytics
        const recentActivity = await Analytics.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'email username');

        res.json({
            success: true,
            data: {
                stats: {
                    channels: channelCount,
                    movies: movieCount,
                    series: seriesCount,
                    users: userCount,
                    todayViews,
                    last24HoursViews,
                    last7DaysViews,
                    last30DaysViews,
                    totalViews,
                    activeViewers,
                    activeUsers: activeUsers.length
                },
                popularChannels,
                mostViewedChannel,
                viewersByCountry: viewersByCountry.map(v => ({
                    country: v._id || 'Unknown',
                    count: v.count
                })),
                deviceBreakdown: deviceBreakdown.map(d => ({
                    device: d._id || 'Unknown',
                    count: d.count
                })),
                hourlyViews: hourlyViews.map(h => ({
                    hour: h._id,
                    count: h.count
                })),
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== Channel Management ====================
router.get('/channels', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, search, isActive } = req.query;
        
        let query = {};
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) query.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const channels = await Channel.find(query)
            .sort({ category: 1, order: 1, name: 1 })
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

router.post('/channels', async (req, res, next) => {
    try {
        console.log('Creating channel with data:', JSON.stringify(req.body, null, 2));
        const channel = await Channel.create(req.body);
        console.log('Created channel:', JSON.stringify(channel, null, 2));
        res.status(201).json({
            success: true,
            message: 'Channel created',
            data: { channel }
        });
    } catch (error) {
        console.error('Error creating channel:', error);
        next(error);
    }
});

// Parse M3U8 playlist and extract quality variants
router.post('/channels/parse-m3u8', async (req, res, next) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        console.log('Parsing M3U8 URL:', url);
        const result = await parseM3U8Playlist(url);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error parsing M3U8:', error);
        next(error);
    }
});

router.put('/channels/:id', async (req, res, next) => {
    try {
        console.log('Updating channel', req.params.id, 'with data:', JSON.stringify(req.body, null, 2));
        const channel = await Channel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        console.log('Updated channel:', JSON.stringify(channel, null, 2));
        res.json({
            success: true,
            message: 'Channel updated',
            data: { channel }
        });
    } catch (error) {
        console.error('Error updating channel:', error);
        next(error);
    }
});

router.delete('/channels/:id', async (req, res, next) => {
    try {
        const channel = await Channel.findByIdAndDelete(req.params.id);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        res.json({
            success: true,
            message: 'Channel deleted'
        });
    } catch (error) {
        next(error);
    }
});

// Bulk import channels
router.post('/channels/import', async (req, res, next) => {
    try {
        const { channels } = req.body;

        if (!Array.isArray(channels)) {
            return res.status(400).json({
                success: false,
                message: 'channels must be an array'
            });
        }

        const results = await Channel.insertMany(channels, { ordered: false });

        res.json({
            success: true,
            message: `Imported ${results.length} channels`,
            data: { count: results.length }
        });
    } catch (error) {
        if (error.writeErrors) {
            return res.json({
                success: true,
                message: `Imported ${error.insertedDocs.length} channels with ${error.writeErrors.length} errors`,
                data: {
                    imported: error.insertedDocs.length,
                    errors: error.writeErrors.length
                }
            });
        }
        next(error);
    }
});

// ==================== Movie Management ====================
router.get('/movies', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, genre, search } = req.query;

        let query = {};
        if (genre) query.genre = genre;
        if (search) query.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const movies = await Movie.find(query)
            .sort({ createdAt: -1 })
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

router.post('/movies', async (req, res, next) => {
    try {
        const movie = await Movie.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Movie created',
            data: { movie }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/movies/:id', async (req, res, next) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.json({
            success: true,
            message: 'Movie updated',
            data: { movie }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/movies/:id', async (req, res, next) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Movie deleted' });
    } catch (error) {
        next(error);
    }
});

// ==================== Series Management ====================
router.get('/series', async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const series = await Series.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Series.countDocuments();

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

router.post('/series', async (req, res, next) => {
    try {
        const series = await Series.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Series created',
            data: { series }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/series/:seriesId/episodes', async (req, res, next) => {
    try {
        const episode = await Episode.create({
            ...req.body,
            series: req.params.seriesId
        });
        res.status(201).json({
            success: true,
            message: 'Episode created',
            data: { episode }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== User Management ====================
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        
        let query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
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

router.post('/users', async (req, res, next) => {
    try {
        const { name, email, password, role, isActive, subscription } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const user = await User.create({
            username: name,
            email,
            password,
            role: role || 'user',
            isActive: isActive !== false,
            subscription
        });

        res.status(201).json({
            success: true,
            message: 'User created',
            data: { user: { ...user.toObject(), password: undefined } }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/users/:id', async (req, res, next) => {
    try {
        const { name, email, password, role, isActive, subscription } = req.body;

        const updateData = {};
        if (name) updateData.username = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (subscription) updateData.subscription = subscription;
        if (password) updateData.password = password;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== App Configuration ====================
router.get('/config', async (req, res, next) => {
    try {
        const configs = await AppConfig.find();
        // Convert array of configs to single object
        const configObj = {};
        configs.forEach(c => {
            configObj[c.key] = c.value;
        });
        res.json({
            success: true,
            data: { 
                config: {
                    appName: configObj.app_name || 'NextTV',
                    appVersion: configObj.app_version || '1.0.0',
                    minAppVersion: configObj.min_app_version || '1.0.0',
                    maintenanceMode: configObj.maintenance_mode || false,
                    maintenanceMessage: configObj.maintenance_message || '',
                    forceUpdate: configObj.force_update || false,
                    updateUrl: configObj.update_url || '',
                    streamTokenSecret: configObj.stream_token_secret || '',
                    streamTokenExpiry: configObj.stream_token_expiry || 3600,
                    maxDevicesPerUser: configObj.max_devices_per_user || 5,
                    enableRegistration: configObj.enable_registration !== false,
                    enableGuestAccess: configObj.enable_guest_access || false,
                    defaultUserRole: configObj.default_user_role || 'user',
                    apiRateLimit: configObj.api_rate_limit || 100,
                    enableAnalytics: configObj.enable_analytics !== false,
                },
                configs 
            }
        });
    } catch (error) {
        next(error);
    }
});

// Bulk update config
router.put('/config', async (req, res, next) => {
    try {
        const configData = req.body;
        
        // Debug: Log incoming config data
        console.log('Incoming config update:', JSON.stringify(configData, null, 2));
        
        const keyMapping = {
            appName: 'app_name',
            appVersion: 'app_version',
            minAppVersion: 'min_app_version',
            maintenanceMode: 'maintenance_mode',
            maintenanceMessage: 'maintenance_message',
            forceUpdate: 'force_update',
            updateUrl: 'update_url',
            streamTokenSecret: 'stream_token_secret',
            streamTokenExpiry: 'stream_token_expiry',
            maxDevicesPerUser: 'max_devices_per_user',
            enableRegistration: 'enable_registration',
            enableGuestAccess: 'enable_guest_access',
            defaultUserRole: 'default_user_role',
            apiRateLimit: 'api_rate_limit',
            enableAnalytics: 'enable_analytics',
        };

        // Update each config key
        const updates = [];
        for (const [key, value] of Object.entries(configData)) {
            const dbKey = keyMapping[key] || key;
            updates.push(
                AppConfig.findOneAndUpdate(
                    { key: dbKey },
                    { key: dbKey, value },
                    { upsert: true, new: true }
                )
            );
        }
        await Promise.all(updates);

        res.json({
            success: true,
            message: 'Configuration updated'
        });
    } catch (error) {
        next(error);
    }
});

router.put('/config/:key', async (req, res, next) => {
    try {
        const { value, description } = req.body;
        const config = await AppConfig.setValue(req.params.key, value, description);
        res.json({
            success: true,
            message: 'Configuration updated',
            data: { config }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== Analytics ====================
router.get('/analytics', async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const analytics = await Analytics.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        eventType: '$eventType'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        res.json({
            success: true,
            data: { analytics }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== Category Management ====================
router.get('/categories', async (req, res, next) => {
    try {
        const { type, search } = req.query;
        let query = {};
        if (type) query.type = type;
        if (search) query.name = { $regex: search, $options: 'i' };

        const categories = await Category.find(query).sort({ order: 1, name: 1 });
        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/categories', async (req, res, next) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/categories/:id', async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/categories/:id', async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
