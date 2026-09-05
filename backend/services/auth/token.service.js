/**
 * Token Service
 * JWT token operations
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/auth/jwt.config');

const verifyToken = (token, secret, type = 'access') => {
    return jwt.verify(token, secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        complete: true
    });
};

module.exports = { verifyToken };
