import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');
const Movie = require('@/lib/db/models/Movie');
const Series = require('@/lib/db/models/Series');
const User = require('@/lib/db/models/User');
const Analytics = require('@/lib/db/models/Analytics');

export async function GET(request: NextRequest) {
    try {
        await connectDB();

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

        // Estimate active viewers (views in last 15 minutes)
        const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
        const activeViewers = await Analytics.countDocuments({
            createdAt: { $gte: last15Minutes }
        });

        // Get unique active users
        const activeUsers = await Analytics.distinct('user', {
            createdAt: { $gte: last15Minutes }
        });

        return NextResponse.json({
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
                popularChannels
            }
        });
    } catch (error: any) {
        console.error('Dashboard error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to load dashboard' },
            { status: 500 }
        );
    }
}
