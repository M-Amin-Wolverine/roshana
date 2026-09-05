/**
 * Request Utilities for Auth
 * Helper functions for request processing
 */

const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

const getClientIp = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           'unknown';
};

const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'unknown';
};

module.exports = {
    extractTokenFromHeader,
    getClientIp,
    getUserAgent
};
