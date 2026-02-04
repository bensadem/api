import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Return 5 random active channels as featured for now, or flag specific ones if schema has 'isFeatured'
        const channels = await Channel.find({ isActive: true })
            .limit(5)
            .select('-streamUrl -backupStreamUrl');

        return NextResponse.json({
            success: true,
            data: channels
        });
    } catch (error: any) {
        console.error('Get featured channels error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch featured channels' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
