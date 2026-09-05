// ============================================
// 🚨 Advanced Enum Error System
// ============================================

class EnumError extends Error {
    constructor(message, options = {}) {
        super(message);

        this.name = 'EnumError';

        this.enumName = options.enumName || null;
        this.invalidValue = options.invalidValue;
        this.code = options.code || 'ENUM_ERROR';
        this.statusCode = options.statusCode || 500;
        this.details = options.details || {};
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace?.(this, EnumError);
    }

    toJSON() {
        return {
            error: this.name,
            code: this.code,
            message: this.message,
            enumName: this.enumName,
            invalidValue: this.invalidValue,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

module.exports = EnumError;