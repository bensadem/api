import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
const AppConfig = require('@/lib/db/models/AppConfig');

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const configs = await AppConfig.find();

        // Convert array of configs to single object
        const configObj: any = {};
        configs.forEach((c: any) => {
            configObj[c.key] = c.value;
        });

        return NextResponse.json({
            success: true,
            data: {
                config: {
                    appName: configObj.app_name || 'NextTV',
                    appVersion: configObj.app_version || '1.0.0',
                    minAppVersion: configObj.min_app_version || '1.0.0',
                    maintenanceMode: configObj.maintenance_mode || false,
                    maintenanceMessage: configObj.maintenance_message || '',
                    forceUpdate: configObj.force_update || false,
                    updateUrl: configObj.update_url || '',
                    streamTokenSecret: configObj.stream_token_secret || '',
                    streamTokenExpiry: configObj.stream_token_expiry || 3600,
                    maxDevicesPerUser: configObj.max_devices_per_user || 5,
                    enableRegistration: configObj.enable_registration !== false,
                    enableGuestAccess: configObj.enable_guest_access || false,
                    defaultUserRole: configObj.default_user_role || 'user',
                    apiRateLimit: configObj.api_rate_limit || 100,
                    enableAnalytics: configObj.enable_analytics !== false,
                    // IPTV Proxy Settings
                    iptvProxyEnabled: configObj.iptv_proxy_enabled === 'true' || configObj.iptv_proxy_enabled === true,
                    iptvProxyBaseUrl: configObj.iptv_proxy_base_url || '',
                    iptvProxyUsername: configObj.iptv_proxy_username || '',
                    iptvProxyPassword: configObj.iptv_proxy_password || '',
                },
                configs
            }
        });
    } catch (error: any) {
        console.error('Get config error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to get config' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        await connectDB();
        const configData = await request.json();

        const keyMapping: any = {
            appName: 'app_name',
            appVersion: 'app_version',
            minAppVersion: 'min_app_version',
            maintenanceMode: 'maintenance_mode',
            maintenanceMessage: 'maintenance_message',
            forceUpdate: 'force_update',
            updateUrl: 'update_url',
            streamTokenSecret: 'stream_token_secret',
            streamTokenExpiry: 'stream_token_expiry',
            maxDevicesPerUser: 'max_devices_per_user',
            enableRegistration: 'enable_registration',
            enableGuestAccess: 'enable_guest_access',
            defaultUserRole: 'default_user_role',
            apiRateLimit: 'api_rate_limit',
            enableAnalytics: 'enable_analytics',
            // IPTV Proxy Settings
            iptvProxyEnabled: 'iptv_proxy_enabled',
            iptvProxyBaseUrl: 'iptv_proxy_base_url',
            iptvProxyUsername: 'iptv_proxy_username',
            iptvProxyPassword: 'iptv_proxy_password',
        };

        // Update each config key
        const updates: Promise<any>[] = [];
        for (const [key, value] of Object.entries(configData)) {
            const dbKey = keyMapping[key] || key;
            updates.push(
                AppConfig.findOneAndUpdate(
                    { key: dbKey },
                    { key: dbKey, value },
                    { upsert: true, new: true }
                )
            );
        }
        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            message: 'Configuration updated'
        });
    } catch (error: any) {
        console.error('Update config error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update config' },
            { status: 500 }
        );
    }
}
