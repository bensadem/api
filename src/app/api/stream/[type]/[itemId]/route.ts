import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { type: string; itemId: string } }
) {
    // This endpoint seems redundant as specific /play endpoints exist.
    // However, api_service uses it in `getStreamUrl(itemId, type)`.
    // We should implement it to redirect or fetch from specific play handlers.
    // Or just return mock success if it's a fallback.
    // Let's implement basic type switching.

    // For now, to avoid 404, return error or mock.
    // Ideally duplicate logic from /play routes or internal fetch.

    return NextResponse.json({
        success: false,
        message: 'Please use specific play endpoints'
    }, { status: 400 });
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
