import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const channel = await Channel.findById(id);
        if (!channel) {
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { channel }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch channel' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const channel = await Channel.findByIdAndUpdate(
            id,
            { ...body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!channel) {
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Channel updated',
            data: { channel }
        });
    } catch (error: any) {
        console.error('Update channel error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update channel' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const channel = await Channel.findByIdAndDelete(id);

        if (!channel) {
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Channel deleted'
        });
    } catch (error: any) {
        console.error('Delete channel error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete channel' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
