import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Series = require('@/lib/db/models/Series');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; episodeId: string } }
) {
    try {
        await connectDB();
        const { id: seriesId, episodeId } = params;

        const series = await Series.findOne({ _id: seriesId, isActive: true });

        if (!series) {
            return NextResponse.json(
                { success: false, message: 'Series not found' },
                { status: 404 }
            );
        }

        const episode = series.episodes.id(episodeId);

        if (!episode) {
            return NextResponse.json(
                { success: false, message: 'Episode not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                streamUrl: episode.streamUrl,
                title: episode.title,
                quality: 'HD'
            }
        });
    } catch (error: any) {
        console.error('Get episode play error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch stream' },
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
