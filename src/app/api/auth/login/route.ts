import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');
const jwt = require('jsonwebtoken');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { email, password, deviceId, deviceType, securityCode } = await request.json();

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check if account is active
        if (!user.isActive) {
            return NextResponse.json(
                { success: false, message: 'Account is deactivated' },
                { status: 403 }
            );
        }

        if (user.role === 'admin' || user.role === 'superadmin') {
            const validCode = process.env.ADMIN_SECRET_KEY || 'SecureAdmin2024!';
            if (securityCode !== validCode) {
                return NextResponse.json(
                    { success: false, message: 'Invalid Admin Security Code' },
                    { status: 403 }
                );
            }
        }

        // Update device info and last login
        user.deviceId = deviceId || user.deviceId;
        user.deviceType = deviceType || user.deviceType;
        await user.updateLastLogin();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    preferences: user.preferences
                },
                token
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
