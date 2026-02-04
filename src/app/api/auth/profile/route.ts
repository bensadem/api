import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');
const jwt = require('jsonwebtoken');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, message: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        // Get user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { success: false, message: 'Account is deactivated' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    preferences: user.preferences
                }
            }
        });
    } catch (error: any) {
        console.error('Profile error:', error);

        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        if (error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: 'Token expired' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get profile' },
            { status: 500 }
        );
    }
}
