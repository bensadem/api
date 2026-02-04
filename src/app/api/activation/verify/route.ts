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

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { code, deviceId, deviceName } = body;

        console.log('Activation attempt:', { code, deviceId, deviceName });

        if (!code || !deviceId) {
            return NextResponse.json(
                { success: false, message: 'Code and Device ID are required' },
                { status: 400 }
            );
        }

        const normalizedCode = code.trim().toUpperCase();

        const activationCode = await ActivationCode.findOne({
            code: normalizedCode,
            isActive: true
        });

        if (!activationCode) {
            return NextResponse.json(
                { success: false, message: 'Invalid or inactive code' },
                { status: 404 }
            );
        }

        // Check expiration
        if (activationCode.expiresAt && new Date() > new Date(activationCode.expiresAt)) {
            return NextResponse.json(
                { success: false, message: 'Code has expired' },
                { status: 400 }
            );
        }

        // Check if device is already activated
        const existingDevice = activationCode.activatedDevices.find(
            (device: any) => device.deviceId === deviceId
        );

        if (existingDevice) {
            return NextResponse.json({
                success: true,
                message: 'Device already activated',
                data: {
                    playlistUrl: '/api/playlist/m3u',
                    expiresAt: activationCode.expiresAt
                }
            });
        }

        // Check max devices limit
        if (activationCode.activatedDevices.length >= activationCode.maxDevices) {
            return NextResponse.json(
                { success: false, message: 'Max devices limit reached for this code' },
                { status: 400 }
            );
        }

        // Activate device
        activationCode.activatedDevices.push({
            deviceId,
            deviceName: deviceName || 'Unknown Device',
            activatedAt: new Date(),
            lastActive: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        await activationCode.save();

        return NextResponse.json({
            success: true,
            message: 'Device activated successfully',
            data: {
                playlistUrl: '/api/playlist/m3u',
                expiresAt: activationCode.expiresAt
            }
        });

    } catch (error: any) {
        console.error('Activation verify error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to verify activation code' },
            { status: 500 }
        );
    }
}
