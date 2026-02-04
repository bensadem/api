import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Favorite = require('@/lib/db/models/Favorite');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { itemId: string } }
) {
    try {
        await connectDB();
        const { itemId } = params;

        // Mock check
        return NextResponse.json({
            success: true,
            data: { isFavorite: false }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to check favorite' },
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
