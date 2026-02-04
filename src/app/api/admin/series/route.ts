import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Series = require('@/lib/db/models/Series');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const skip = (page - 1) * limit;

        const series = await Series.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Series.countDocuments();

        return NextResponse.json({
            success: true,
            data: {
                series,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get series error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get series' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const series = await Series.create(body);

        return NextResponse.json({
            success: true,
            message: 'Series created',
            data: { series }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create series error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create series' },
            { status: 500 }
        );
    }
}
