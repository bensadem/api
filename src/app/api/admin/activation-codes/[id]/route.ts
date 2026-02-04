import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const ActivationCode = require('@/lib/db/models/ActivationCode');

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const body = await request.json();
        const { id } = params;

        const code = await ActivationCode.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );

        if (!code) {
            return NextResponse.json(
                { success: false, message: 'Activation code not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Activation code updated',
            data: { code }
        });
    } catch (error: any) {
        console.error('Update activation code error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update activation code' },
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

        const code = await ActivationCode.findByIdAndDelete(id);

        if (!code) {
            return NextResponse.json(
                { success: false, message: 'Activation code not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Activation code deleted'
        });
    } catch (error: any) {
        console.error('Delete activation code error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete activation code' },
            { status: 500 }
        );
    }
}
