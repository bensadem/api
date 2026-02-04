const express = require('express');
const router = express.Router();
const { AppConfig } = require('../models');

// Check app version and get update info
router.get('/check', async (req, res, next) => {
    try {
        const clientVersion = req.headers['x-app-version'] || req.query.version;

        const currentVersion = process.env.CURRENT_APP_VERSION || '1.0.0';
        const minVersion = process.env.MIN_SUPPORTED_VERSION || '1.0.0';

        // Get update URL from config or use default
        const updateUrl = await AppConfig.getValue(
            'update_url',
            'https://play.google.com/store/apps/details?id=com.nexttv.app'
        );

        const changelog = await AppConfig.getValue('changelog', []);
        const releaseNotes = await AppConfig.getValue('release_notes', '');

        let updateRequired = false;
        let updateAvailable = false;

        if (clientVersion) {
            updateRequired = compareVersions(clientVersion, minVersion) < 0;
            updateAvailable = compareVersions(clientVersion, currentVersion) < 0;
        }

        res.json({
            success: true,
            data: {
                currentVersion,
                minVersion,
                clientVersion: clientVersion || 'unknown',
                updateRequired,
                updateAvailable,
                updateUrl,
                releaseNotes,
                changelog
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get app configuration
router.get('/config', async (req, res, next) => {
    try {
        // Get maintenance mode from database first, fallback to env
        const dbMaintenanceMode = await AppConfig.getValue('maintenance_mode', null);
        const dbMaintenanceMessage = await AppConfig.getValue('maintenance_message', null);
        
        const maintenanceMode = dbMaintenanceMode !== null 
            ? dbMaintenanceMode 
            : process.env.MAINTENANCE_MODE === 'true';
        const maintenanceMessage = dbMaintenanceMessage !== null 
            ? dbMaintenanceMessage 
            : process.env.MAINTENANCE_MESSAGE;

        // Get additional configs
        const adConfig = await AppConfig.getValue('ad_config', {
            enabled: true,
            bannerEnabled: true,
            interstitialEnabled: true,
            interstitialInterval: 5
        });

        const featureFlags = await AppConfig.getValue('feature_flags', {
            liveTV: true,
            movies: true,
            series: true,
            catchup: true,
            search: true,
            favorites: true
        });

        // Get version settings from database first, fallback to env
        // Check both key formats (CMS uses app_version/min_app_version, old format uses current_version/min_version)
        const dbCurrentVersion = await AppConfig.getValue('app_version', null) 
            || await AppConfig.getValue('current_version', null);
        const dbMinVersion = await AppConfig.getValue('min_app_version', null) 
            || await AppConfig.getValue('min_version', null);
        const dbForceUpdate = await AppConfig.getValue('force_update', false);
        const dbUpdateUrl = await AppConfig.getValue('update_url', null);
        
        // Debug logging
        console.log('DB force_update value:', dbForceUpdate, typeof dbForceUpdate);
        
        const currentVersion = dbCurrentVersion || process.env.CURRENT_APP_VERSION || '1.0.0';
        const minVersion = dbMinVersion || process.env.MIN_SUPPORTED_VERSION || '1.0.0';
        const updateUrl = dbUpdateUrl || process.env.UPDATE_URL || 'https://play.google.com/store/apps/details?id=com.nexttv.app';

        res.json({
            success: true,
            data: {
                maintenance: {
                    enabled: maintenanceMode,
                    message: maintenanceMessage || ''
                },
                version: {
                    current: currentVersion,
                    minimum: minVersion
                },
                forceUpdate: dbForceUpdate,
                updateUrl: updateUrl,
                ads: adConfig,
                features: featureFlags
            }
        });
    } catch (error) {
        next(error);
    }
});

// Helper function to compare versions
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
}

module.exports = router;
