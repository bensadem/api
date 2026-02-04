import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
// Use require for CJS model import if standard import fails, 
// strictly speaking in Next.js App Router we can use import if the file is valid module,
// but AppConfig.js is module.exports.
import mongoose from 'mongoose';
const AppConfig = mongoose.models.AppConfig || require('@/lib/db/models/AppConfig');

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Fetch all configs
        const configs = await AppConfig.find({});

        // Convert array to object map
        const configObj: Record<string, any> = {};
        configs.forEach((c: any) => {
            configObj[c.key] = c.value;
        });

        return NextResponse.json({
            success: true,
            data: {
                version: {
                    current: configObj.app_version || '1.0.0',
                    minimum: configObj.min_app_version || '1.0.0'
                },
                maintenance: {
                    enabled: configObj.maintenance_mode || false,
                    message: configObj.maintenance_message || 'System under maintenance'
                },
                forceUpdate: configObj.force_update || false,
                updateUrl: configObj.update_url || '',
                privacyPolicyUrl: configObj.privacy_policy_url || '',
                termsUrl: configObj.terms_url || '',
                supportEmail: configObj.support_email || 'support@bathtv.com'
            }
        });
    } catch (error) {
        console.error('Error fetching version config:', error);
        // Fallback to default
        return NextResponse.json({
            success: true,
            data: {
                version: {
                    current: '1.0.0',
                    minimum: '1.0.0'
                },
                maintenance: {
                    enabled: false,
                    message: 'System under maintenance'
                },
                forceUpdate: false,
                updateUrl: '',
                privacyPolicyUrl: '',
                termsUrl: '',
                supportEmail: 'support@bathtv.com'
            }
        });
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
