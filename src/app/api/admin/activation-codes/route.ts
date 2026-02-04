import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const ActivationCode = require('@/lib/db/models/ActivationCode');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const isActive = searchParams.get('isActive');

        let query: any = {};
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const codes = await ActivationCode.find(query)
            .populate('createdBy', 'email username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ActivationCode.countDocuments(query);
        const totalCodes = await ActivationCode.countDocuments();
        const activeCodes = await ActivationCode.countDocuments({ isActive: true });
        const totalActivations = await ActivationCode.aggregate([
            { $unwind: '$activatedDevices' },
            { $count: 'total' }
        ]);

        return NextResponse.json({
            success: true,
            data: {
                codes,
                stats: {
                    totalCodes,
                    activeCodes,
                    totalActivations: totalActivations[0]?.total || 0
                },
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Get activation codes error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get activation codes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { customCode, maxDevices, expiresAt, notes } = body;

        let code: string;

        // Use custom code if provided, otherwise generate random
        if (customCode && customCode.trim()) {
            code = customCode.trim().toUpperCase();

            // Check if custom code already exists
            const exists = await ActivationCode.findOne({ code });
            if (exists) {
                return NextResponse.json(
                    { success: false, message: 'This code already exists. Please choose a different code.' },
                    { status: 400 }
                );
            }
        } else {
            // Generate unique random code
            code = ActivationCode.schema.statics.generateCode();
            let exists = await ActivationCode.findOne({ code });

            // Keep generating until we get a unique code
            while (exists) {
                code = ActivationCode.schema.statics.generateCode();
                exists = await ActivationCode.findOne({ code });
            }
        }

        const activationCode = await ActivationCode.create({
            code,
            maxDevices: maxDevices || 1,
            expiresAt: expiresAt || null,
            notes: notes || '',
            isActive: true
        });

        return NextResponse.json({
            success: true,
            message: 'Activation code created',
            data: { code: activationCode }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create activation code error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create activation code' },
            { status: 500 }
        );
    }
}
