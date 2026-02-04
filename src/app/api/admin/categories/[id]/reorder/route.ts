import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Category = require('@/lib/db/models/Category');

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { direction } = await request.json();
        const { id } = params;

        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Get all categories of same type, sorted by order
        const categories = await Category.find({ type: category.type })
            .sort({ order: 1 });

        const currentIndex = categories.findIndex((c: any) => c._id.toString() === id);

        if (direction === 'up' && currentIndex > 0) {
            // Swap with previous
            const prevCategory = categories[currentIndex - 1];
            const tempOrder = category.order;
            category.order = prevCategory.order;
            prevCategory.order = tempOrder;
            await category.save();
            await prevCategory.save();
        } else if (direction === 'down' && currentIndex < categories.length - 1) {
            // Swap with next
            const nextCategory = categories[currentIndex + 1];
            const tempOrder = category.order;
            category.order = nextCategory.order;
            nextCategory.order = tempOrder;
            await category.save();
            await nextCategory.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Category reordered'
        });
    } catch (error: any) {
        console.error('Reorder category error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to reorder category' },
            { status: 500 }
        );
    }
}
