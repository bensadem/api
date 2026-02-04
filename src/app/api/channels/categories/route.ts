import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Category = require('@/lib/db/models/Category');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get categories from Category collection, sorted by order
        const categories = await Category.find({
            type: 'channel',
            isActive: true
        }).sort({ order: 1, name: 1 });

        const formattedCategories = categories.map((cat: any) => ({
            id: cat._id.toString(),
            name: cat.name,
            type: 'channel',
            icon: cat.icon || '📺',
            order: cat.order || 0
        }));

        return NextResponse.json({
            success: true,
            data: formattedCategories
        });
    } catch (error: any) {
        console.error('Get channel categories error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
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
