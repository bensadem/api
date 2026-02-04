import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const channel = await Channel.findOne({ _id: id, isActive: true })
            .select('-streamUrl -backupStreamUrl');

        if (!channel) {
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { channel }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch channel' },
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
