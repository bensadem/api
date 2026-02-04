import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { direction } = await request.json();
        const { id } = params;

        const channel = await Channel.findById(id);
        if (!channel) {
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        // Get all channels in same category, sorted by order
        const channels = await Channel.find({ category: channel.category })
            .sort({ order: 1, name: 1 });

        const currentIndex = channels.findIndex((c: any) => c._id.toString() === id);

        if (direction === 'up' && currentIndex > 0) {
            // Swap with previous
            const prevChannel = channels[currentIndex - 1];
            const tempOrder = channel.order || currentIndex;
            channel.order = prevChannel.order || (currentIndex - 1);
            prevChannel.order = tempOrder;
            await channel.save();
            await prevChannel.save();
        } else if (direction === 'down' && currentIndex < channels.length - 1) {
            // Swap with next
            const nextChannel = channels[currentIndex + 1];
            const tempOrder = channel.order || currentIndex;
            channel.order = nextChannel.order || (currentIndex + 1);
            nextChannel.order = tempOrder;
            await channel.save();
            await nextChannel.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Channel reordered'
        });
    } catch (error: any) {
        console.error('Reorder channel error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to reorder channel' },
            { status: 500 }
        );
    }
}
