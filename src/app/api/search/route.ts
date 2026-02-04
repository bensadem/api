import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');
const Movie = require('@/lib/db/models/Movie');
const Series = require('@/lib/db/models/Series');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const type = searchParams.get('type');

        if (!q) {
            return NextResponse.json({
                success: true,
                data: { channels: [], movies: [], series: [] }
            });
        }

        const regex = new RegExp(q, 'i');
        const query = { title: regex, isActive: true }; // Assuming title/name fields
        const channelQuery = { name: regex, isActive: true };

        const results: any = { channels: [], movies: [], series: [] };

        if (!type || type === 'channel') {
            results.channels = await Channel.find(channelQuery).limit(10).select('-streamUrl');
        }
        if (!type || type === 'movie') {
            results.movies = await Movie.find(query).limit(10).select('-streamUrl');
        }
        if (!type || type === 'series') {
            results.series = await Series.find(query).limit(10);
        }

        return NextResponse.json({
            success: true,
            data: results
        });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
            { success: false, message: 'Search failed' },
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
