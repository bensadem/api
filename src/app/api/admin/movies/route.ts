import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Movie = require('@/lib/db/models/Movie');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const genre = searchParams.get('genre');
        const search = searchParams.get('search');

        let query: any = {};
        if (genre) query.genre = genre;
        if (search) query.$text = { $search: search };

        const skip = (page - 1) * limit;

        const movies = await Movie.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Movie.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: {
                movies,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get movies error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get movies' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const movie = await Movie.create(body);

        return NextResponse.json({
            success: true,
            message: 'Movie created',
            data: { movie }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create movie error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create movie' },
            { status: 500 }
        );
    }
}
