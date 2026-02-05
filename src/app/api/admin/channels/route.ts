import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '1000');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const isActive = searchParams.get('isActive');

        let query: any = {};
        if (category) query.category = category;
        if (isActive !== null && isActive !== undefined) query.isActive = isActive === 'true';
        if (search) query.$text = { $search: search };

        const skip = (page - 1) * limit;

        const channels = await Channel.find(query)
            .sort({ category: 1, name: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Channel.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: {
                channels,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get channels error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get channels' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        console.log('Creating channel with body:', JSON.stringify(body, null, 2));

        const channel = await Channel.create(body);

        return NextResponse.json({
            success: true,
            message: 'Channel created',
            data: { channel }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create channel error:', error);

        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation failed',
                    errors: Object.values(error.errors).map((err: any) => err.message)
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Failed to create channel',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
