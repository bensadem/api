import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@nexttv.com' });
        if (existingAdmin) {
            return NextResponse.json({
                success: false,
                message: 'Admin user already exists'
            }, { status: 400 });
        }

        // Create admin user
        const admin = await User.create({
            email: 'admin@nexttv.com',
            password: 'admin123456',
            username: 'Admin',
            role: 'admin',
            isActive: true
        });

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                user: {
                    id: admin._id,
                    email: admin.email,
                    username: admin.username,
                    role: admin.role
                }
            }
        });
    } catch (error: any) {
        console.error('Create admin error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create admin' },
            { status: 500 }
        );
    }
}
