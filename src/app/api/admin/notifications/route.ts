import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Notification from '@/lib/db/models/Notification';

// GET all notifications (for admin)
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        let query: any = {};
        if (activeOnly) {
            const now = new Date();
            query = {
                isActive: true,
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: now } }
                ]
            };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
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

// POST create notification
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();

        const notification = await Notification.create({
            title: body.title,
            body: body.body,
            type: body.type || 'info',
            priority: body.priority || 'normal',
            imageUrl: body.imageUrl,
            actionUrl: body.actionUrl,
            actionText: body.actionText,
            targetAudience: body.targetAudience || 'all',
            isActive: body.isActive !== false,
            expiresAt: body.expiresAt || null,
        });

        return NextResponse.json({
            success: true,
            data: notification
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
