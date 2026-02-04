import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const User = require('@/lib/db/models/User');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        let query: any = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, email, password, role, isActive } = body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'Email already exists' },
                { status: 400 }
            );
        }

        const user = await User.create({
            username: name,
            email,
            password,
            role: role || 'user',
            isActive: isActive !== false
        });

        return NextResponse.json({
            success: true,
            message: 'User created',
            data: { user: { ...user.toObject(), password: undefined } }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}
