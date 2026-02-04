import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');
const Channel = require('@/lib/db/models/Channel');
const jwt = require('jsonwebtoken');

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await connectDB();
        const user = await User.findById(decoded.userId);
        return user;
    } catch (error) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Populate history
        await user.populate('watchHistory.channelId');

        // Extract valid channels (filter out nulls if channel was deleted)
        const historyChannels = user.watchHistory
            .map((item: any) => item.channelId)
            .filter((channel: any) => channel != null);

        return NextResponse.json({
            success: true,
            data: {
                channels: historyChannels
            }
        });
    } catch (error: any) {
        console.error('Get history error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { channelId } = await request.json();
        if (!channelId) {
            return NextResponse.json({ success: false, message: 'Channel ID required' }, { status: 400 });
        }

        // Remove existing entry for this channel
        user.watchHistory = user.watchHistory.filter(
            (item: any) => item.channelId?.toString() !== channelId
        );

        // Add new entry to top
        user.watchHistory.unshift({
            channelId,
            timestamp: new Date()
        });

        // Limit to 50
        if (user.watchHistory.length > 50) {
            user.watchHistory = user.watchHistory.slice(0, 50);
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Added to history'
        });
    } catch (error: any) {
        console.error('Add history error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
