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
        const { id } = params;

        const series = await Series.findOne({ _id: id, isActive: true });

        if (!series) {
            return NextResponse.json(
                { success: false, message: 'Series not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { series }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch series' },
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
