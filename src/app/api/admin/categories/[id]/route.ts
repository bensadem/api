import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const Category = require('@/lib/db/models/Category');
const Channel = require('@/lib/db/models/Channel');

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { category }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch category' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const category = await Category.findByIdAndUpdate(
            id,
            { ...body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Category updated',
            data: { category }
        });
    } catch (error: any) {
        console.error('Update category error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update category' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Check if category is used based on its type
        let usedCount = 0;

        if (!force) {
            if (category.type === 'channel') {
                const Channel = require('@/lib/db/models/Channel');
                usedCount = await Channel.countDocuments({ category: category.name });
            } else if (category.type === 'movie') {
                const Movie = require('@/lib/db/models/Movie');
                usedCount = await Movie.countDocuments({ category: category.name });
            } else if (category.type === 'series') {
                const Series = require('@/lib/db/models/Series');
                usedCount = await Series.countDocuments({ category: category.name });
            }

            if (usedCount > 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Category is used by ${usedCount} items. Force delete to remove anyway.`
                    },
                    { status: 400 }
                );
            }
        }

        await Category.findByIdAndDelete(id);

        if (force) {
            const updateQuery = { category: category.name };
            const updateAction = { $set: { category: 'Uncategorized' } };

            if (category.type === 'channel') {
                const Channel = require('@/lib/db/models/Channel');
                await Channel.updateMany(updateQuery, updateAction);
            } else if (category.type === 'movie') {
                const Movie = require('@/lib/db/models/Movie');
                await Movie.updateMany(updateQuery, updateAction);
            } else if (category.type === 'series') {
                const Series = require('@/lib/db/models/Series');
                await Series.updateMany(updateQuery, updateAction);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Category deleted'
        });
    } catch (error: any) {
        console.error('Delete category error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete category' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
