const authRoutes = require('./auth');
const channelRoutes = require('./channels');
const favoriteRoutes = require('./favorites');
const movieRoutes = require('./movies');
const seriesRoutes = require('./series');
const catchupRoutes = require('./catchup');
const searchRoutes = require('./search');
const playlistRoutes = require('./playlist');
const streamRoutes = require('./stream');
const versionRoutes = require('./version');
const adminRoutes = require('./admin');
const activationRoutes = require('./activation');

module.exports = {
    authRoutes,
    channelRoutes,
    favoriteRoutes,
    movieRoutes,
    seriesRoutes,
    catchupRoutes,
    searchRoutes,
    playlistRoutes,
    streamRoutes,
    versionRoutes,
    adminRoutes,
    activationRoutes
};
