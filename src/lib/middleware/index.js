const { authenticate, optionalAuth, requireAdmin, requireModerator } = require('./auth');
const { checkMaintenance, checkAppVersion } = require('./appStatus');
const { errorHandler, notFound } = require('./errorHandler');

module.exports = {
    authenticate,
    optionalAuth,
    requireAdmin,
    requireModerator,
    checkMaintenance,
    checkAppVersion,
    errorHandler,
    notFound
};
