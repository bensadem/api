import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Movie = require('@/lib/db/models/Movie');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query: any = { isActive: true };
        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const movies = await Movie.find(query)
            .sort({ releaseDate: -1, title: 1 })
            .skip(skip)
            .limit(limit)
            .select('-streamUrl'); // Hide stream URL

        return NextResponse.json({
            success: true,
            data: movies
        });
    } catch (error: any) {
        console.error('Get public movies error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch movies' },
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
