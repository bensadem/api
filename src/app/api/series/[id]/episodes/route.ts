import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Series = require('@/lib/db/models/Series');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id: seriesId } = params;
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');

        // Note: Episodes are inside the Series document in `episodes` array
        const series = await Series.findOne({ _id: seriesId, isActive: true });

        if (!series) {
            return NextResponse.json(
                { success: false, message: 'Series not found' },
                { status: 404 }
            );
        }

        let episodes = series.episodes || [];

        if (season) {
            const seasonNum = parseInt(season);
            episodes = episodes.filter((ep: any) => ep.seasonNumber === seasonNum);
        }

        // Sort by season and episode number
        episodes.sort((a: any, b: any) => {
            if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
            return a.episodeNumber - b.episodeNumber;
        });

        // Hide streamUrl from list
        const safeEpisodes = episodes.map((ep: any) => {
            const { streamUrl, ...rest } = ep.toObject ? ep.toObject() : ep;
            return rest;
        });

        return NextResponse.json({
            success: true,
            data: safeEpisodes
        });
    } catch (error: any) {
        console.error('Get episodes error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch episodes' },
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
