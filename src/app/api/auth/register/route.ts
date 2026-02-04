import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');
const jwt = require('jsonwebtoken');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { email, password, username, deviceId, deviceType } = await request.json();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'Email already registered' },
                { status: 400 }
            );
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            username: username || email.split('@')[0],
            deviceId,
            deviceType: deviceType || 'unknown'
        });

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                },
                token
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
