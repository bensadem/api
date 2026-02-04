import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const ActivationCode = require('@/lib/db/models/ActivationCode');

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { deviceId: string } }
) {
    try {
        await connectDB();
        const { deviceId } = params;

        if (!deviceId) {
            return NextResponse.json(
                { success: false, message: 'Device ID is required' },
                { status: 400 }
            );
        }

        // Find code that has this device activated
        const code = await ActivationCode.findOne({
            'activatedDevices.deviceId': deviceId,
            isActive: true
        });

        if (!code) {
            return NextResponse.json({
                success: false,
                message: 'Device not activated',
                data: { isActivated: false }
            });
        }

        // Check if codeExpired
        if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
            return NextResponse.json({
                success: false,
                message: 'Activation expired',
                data: { isActivated: false, expired: true }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                isActivated: true,
                expiresAt: code.expiresAt,
                playlistUrl: '/api/playlist/m3u'
            }
        });

    } catch (error: any) {
        console.error('Check activation status error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to check status' },
            { status: 500 }
        );
    }
}
