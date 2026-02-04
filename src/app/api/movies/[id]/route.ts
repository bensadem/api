import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Movie = require('@/lib/db/models/Movie');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const movie = await Movie.findOne({ _id: id, isActive: true })
            .select('-streamUrl');

        if (!movie) {
            return NextResponse.json(
                { success: false, message: 'Movie not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { movie }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch movie' },
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
