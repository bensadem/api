import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Notification from '@/lib/db/models/Notification';

// GET active notifications for app users
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const now = new Date();

        // Get only active and non-expired notifications
        const notifications = await Notification.find({
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        })
            .sort({ priority: -1, createdAt: -1 })
            .limit(10)
            .select('title body type priority imageUrl actionUrl actionText createdAt')
            .lean();

        return NextResponse.json({
            success: true,
            data: notifications
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
