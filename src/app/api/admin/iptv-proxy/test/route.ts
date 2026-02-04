import { NextRequest, NextResponse } from 'next/server';
import { resolveStreamUrl } from '@/lib/utils/iptv-proxy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channelId } = body;

        if (!channelId) {
            return NextResponse.json(
                { success: false, message: 'Channel ID is required' },
                { status: 400 }
            );
        }

        const resolvedUrl = await resolveStreamUrl(channelId);

        if (resolvedUrl) {
            return NextResponse.json({
                success: true,
                message: 'Stream resolved successfully',
                data: {
                    streamUrl: resolvedUrl
                }
            });
        } else {
            return NextResponse.json(
                { success: false, message: 'Failed to resolve stream URL. Check server logs and configuration.' },
                { status: 502 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to test proxy' },
            { status: 500 }
        );
    }
}
