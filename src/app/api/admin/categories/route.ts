import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Category = require('@/lib/db/models/Category');

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        let query: any = {};
        if (type) query.type = type;
        if (search) query.name = { $regex: search, $options: 'i' };

        const categories = await Category.find(query).sort({ order: 1, name: 1 });

        return NextResponse.json({
            success: true,
            data: { categories }
        });
    } catch (error: any) {
        console.error('Get categories error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get categories' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const category = await Category.create(body);

        return NextResponse.json({
            success: true,
            message: 'Category created',
            data: { category }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create category error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create category' },
            { status: 500 }
        );
    }
}
