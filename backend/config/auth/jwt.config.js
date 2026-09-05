/**
 * JWT Configuration
 * Auto-generated refactor
 */

module.exports = {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    issuer: process.env.JWT_ISSUER || 'roshana-app',
    audience: process.env.JWT_AUDIENCE || 'roshana-users',
    algorithm: 'HS256',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
};
