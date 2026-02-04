import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query: any = { isActive: true }; // Only active channels for public
        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const channels = await Channel.find(query)
            .sort({ channelNumber: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .select('-streamUrl -backupStreamUrl'); // Hide stream URLs if needed, or keep provided auth logic later

        // For now, let's return everything needed for UI. 
        // Note: The app might expect streamUrl here or separate call. 
        // api_service calls /channels/:id/play for stream, so listing might not need it, 
        // but let's check what the app expects in Channel.fromJson.
        // Usually listings need basic info.

        return NextResponse.json({
            success: true,
            data: channels
        });
    } catch (error: any) {
        console.error('Get public channels error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch channels' },
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
