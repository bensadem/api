import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Channel = require('@/lib/db/models/Channel');

import { resolveStreamUrl } from '@/lib/utils/iptv-proxy';

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
            console.log(`Channel ${id} not found`);
            return NextResponse.json(
                { success: false, message: 'Channel not found' },
                { status: 404 }
            );
        }

        console.log(`Play request for channel: ${channel.name} (ID: ${id})`);
        let streamUrl = channel.streamUrl;

        // If streamUrl is missing but we have an external ID, try to resolve it
        if (!streamUrl && channel.externalChannelId) {
            console.log(`Resolving external ID: ${channel.externalChannelId}`);
            const resolvedUrl = await resolveStreamUrl(channel.externalChannelId);
            if (resolvedUrl) {
                console.log(`Successfully resolved to: ${resolvedUrl}`);
                streamUrl = resolvedUrl;
            } else {
                console.error(`Failed to resolve external ID: ${channel.externalChannelId}`);
            }
        }

        if (!streamUrl) {
            return NextResponse.json(
                { success: false, message: 'Stream not available' },
                { status: 404 }
            );
        }

        // Ideally check headers/auth here to ensure user is allowed to play.
        // For now, return the stream URL.

        return NextResponse.json({
            success: true,
            data: {
                streamUrl: streamUrl,
                backupStreamUrl: channel.backupStreamUrl,
                name: channel.name,
                quality: channel.quality || 'HD'
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch stream' },
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
