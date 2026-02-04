import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Favorite = require('@/lib/db/models/Favorite');

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { itemId: string } }
) {
    try {
        await connectDB();
        const { itemId } = params;

        // Mock success for now. Real implementation needs Auth.
        // We pretend we saved it.

        return NextResponse.json({
            success: true,
            message: 'Added to favorites'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to add favorite' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { itemId: string } }
) {
    try {
        await connectDB();
        const { itemId } = params;

        // Mock success
        return NextResponse.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to remove favorite' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
