/**
 * Response Utilities for Auth
 * Standardized response formats
 */

const authErrorResponse = (res, statusCode, message, errorCode, requestId = null) => {
    return res.status(statusCode).json({
        success: false,
        message: message,
        error: errorCode,
        requestId: requestId,
        timestamp: new Date().toISOString()
    });
};

const authSuccessResponse = (res, data = null, message = 'Success', requestId = null) => {
    return res.status(200).json({
        success: true,
        message: message,
        data: data,
        requestId: requestId,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    authErrorResponse,
    authSuccessResponse
};
