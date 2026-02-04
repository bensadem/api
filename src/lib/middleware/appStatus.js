const { AppConfig } = require('../models');

// Check if app is in maintenance mode
const checkMaintenance = async (req, res, next) => {
    try {
        // Skip maintenance check for admin routes
        if (req.path.startsWith('/api/admin')) {
            return next();
        }

        const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
        
        if (maintenanceMode) {
            // Check for maintenance bypass token (for testing)
            const bypassToken = req.headers['x-maintenance-bypass'];
            if (bypassToken === process.env.JWT_SECRET) {
                return next();
            }

            return res.status(503).json({
                success: false,
                maintenance: true,
                message: process.env.MAINTENANCE_MESSAGE || 'We are performing scheduled maintenance. Please try again later.',
                retryAfter: 3600 // Suggest retry after 1 hour
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Check app version for forced updates
const checkAppVersion = async (req, res, next) => {
    try {
        const clientVersion = req.headers['x-app-version'];
        
        if (!clientVersion) {
            // If no version header, skip check (might be web or testing)
            return next();
        }

        const minVersion = process.env.MIN_SUPPORTED_VERSION || '1.0.0';
        const currentVersion = process.env.CURRENT_APP_VERSION || '1.0.0';

        // Simple version comparison (major.minor.patch)
        const isVersionValid = compareVersions(clientVersion, minVersion) >= 0;

        if (!isVersionValid) {
            return res.status(426).json({
                success: false,
                updateRequired: true,
                message: 'Please update to the latest version of NextTV.',
                currentVersion: currentVersion,
                minVersion: minVersion,
                updateUrl: 'https://play.google.com/store/apps/details?id=com.nexttv.app'
            });
        }

        // Attach version info to request for logging
        req.appVersion = clientVersion;
        next();
    } catch (error) {
        next(error);
    }
};

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

module.exports = {
    checkMaintenance,
    checkAppVersion
};
