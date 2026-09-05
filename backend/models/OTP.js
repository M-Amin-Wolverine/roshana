/**
 * OTP Model - Enhanced Version
 * Handle OTP (One-Time Password) operations with full security features
 * 
 * @author Your Name
 * @version 2.0.0
 * @description Comprehensive OTP management system with rate limiting,
 *              encryption, caching, and audit logging
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const crypto = require('crypto');
const { EventEmitter } = require('events');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    // OTP Settings
    codeLength: 6,
    codeType: 'numeric', // numeric, alphabetic, alphanumeric
    expiresInMinutes: 5,
    allowResendAfterSeconds: 30,
    
    // Rate Limiting
    maxAttemptsPerWindow: 3,
    maxAttemptsWindowMinutes: 15,
    cooldownMinutes: 1,
    maxOTPsPerDay: 10,
    maxOTPsPerWeek: 30,
    
    // Security
    hashAlgorithm: 'bcrypt',
    hashRounds: 12,
    enableIPTracking: true,
    enableDeviceFingerprint: true,
    
    // Cache
    enableCache: true,
    cacheTTLSeconds: 300,
    
    // Logging
    enableAuditLog: true,
    logLevel: 'info', // debug, info, warn, error
    
    // Cleanup
    autoCleanupEnabled: true,
    cleanupIntervalHours: 24,
    retentionDays: 7,
    
    // Database
    batchSize: 100,
    queryTimeout: 5000
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

class OTPError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.name = 'OTPError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

class OTPRateLimitError extends OTPError {
    constructor(message, retryAfter) {
        super(message, 'RATE_LIMIT_EXCEEDED', 429);
        this.retryAfter = retryAfter;
    }
}

class OTPValidationError extends OTPError {
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
}

class OTPAuthenticationError extends OTPError {
    constructor(message) {
        super(message, 'AUTHENTICATION_FAILED', 401);
    }
}

// ============================================================================
// EVENT EMITTER FOR OTP EVENTS
// ============================================================================

class OTPEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
    }
}

const otpEvents = new OTPEventEmitter();

// Event types
const OTP_EVENTS = {
    CREATED: 'otp:created',
    VERIFIED: 'otp:verified',
    FAILED: 'otp:failed',
    EXPIRED: 'otp:expired',
    USED: 'otp:used',
    RATE_LIMITED: 'otp:rate_limited',
    DELETED: 'otp:deleted',
    CLEANUP: 'otp:cleanup'
};

// ============================================================================
// MAIN OTP CLASS
// ============================================================================

class OTPModel {
    // Static properties
    static instance = null;
    static config = { ...DEFAULT_CONFIG };
    static db = null;
    static cache = null;
    static logger = null;

    // Instance properties
    initialized = false;
    cleanupInterval = null;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Get singleton instance
     * @returns {OTPModel}
     */
    static getInstance() {
        if (!OTPModel.instance) {
            OTPModel.instance = new OTPModel();
        }
        return OTPModel.instance;
    }

    /**
     * Initialize OTP model with database and configuration
     * @param {Object} options - Initialization options
     * @param {Object} options.database - Database connection
     * @param {Object} options.cache - Cache layer (optional)
     * @param {Object} options.logger - Logger instance (optional)
     * @param {Object} options.config - Custom configuration (optional)
     */
    static initialize(options = {}) {
        const {
            database,
            cache = null,
            logger = null,
            config = {}
        } = options;

        if (!database) {
            throw new OTPError('Database connection is required', 'NO_DATABASE', 500);
        }

        OTPModel.db = database;
        OTPModel.cache = cache;
        OTPModel.logger = logger || OTPModel._defaultLogger();
        
        // Merge configuration
        OTPModel.config = { ...DEFAULT_CONFIG, ...config };

        const instance = OTPModel.getInstance();
        instance.initialized = true;
        instance._setupEventListeners();
        
        if (OTPModel.config.autoCleanupEnabled) {
            instance._startCleanupScheduler();
        }

        OTPModel.logger.info('OTP Model initialized successfully');
        
        return instance;
    }

    /**
     * Default logger if none provided
     */
    static _defaultLogger() {
        return {
            debug: (...args) => console.debug('[OTP DEBUG]', ...args),
            info: (...args) => console.info('[OTP INFO]', ...args),
            warn: (...args) => console.warn('[OTP WARN]', ...args),
            error: (...args) => console.error('[OTP ERROR]', ...args)
        };
    }

    /**
     * Check if model is initialized
     */
    _ensureInitialized() {
        if (!this.initialized || !OTPModel.db) {
            throw new OTPError('OTP Model not initialized', 'NOT_INITIALIZED', 500);
        }
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    _setupEventListeners() {
        otpEvents.on(OTP_EVENTS.CREATED, this._handleOTPCreated.bind(this));
        otpEvents.on(OTP_EVENTS.VERIFIED, this._handleOTPVerified.bind(this));
        otpEvents.on(OTP_EVENTS.FAILED, this._handleOTPFailed.bind(this));
        otpEvents.on(OTP_EVENTS.RATE_LIMITED, this._handleRateLimited.bind(this));
    }

    _handleOTPCreated(data) {
        OTPModel.logger.info(`OTP created for user ${data.userId}, type: ${data.type}`);
    }

    _handleOTPVerified(data) {
        OTPModel.logger.info(`OTP verified for user ${data.userId}, type: ${data.type}`);
    }

    _handleOTPFailed(data) {
        OTPModel.logger.warn(`OTP verification failed for user ${data.userId}, type: ${data.type}, attempt: ${data.attempt}`);
    }

    _handleRateLimited(data) {
        OTPModel.logger.warn(`Rate limit exceeded for user ${data.userId}, type: ${data.type}`);
    }

    // ============================================================================
    // CODE GENERATION
    // ============================================================================

    /**
     * Generate a random OTP code
     * @param {number} length - Code length (default from config)
     * @param {string} type - Code type: numeric, alphabetic, alphanumeric
     * @returns {string} Generated code
     */
    static generateCode(length = OTPModel.config.codeLength, type = OTPModel.config.codeType) {
        let chars = '';
        
        switch (type) {
            case 'numeric':
                chars = '0123456789';
                break;
            case 'alphabetic':
                chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                break;
            case 'alphanumeric':
            default:
                chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                break;
        }

        let code = '';
        const randomBytes = crypto.randomBytes(length);
        
        for (let i = 0; i < length; i++) {
            code += chars[randomBytes[i] % chars.length];
        }

        // Ensure numeric codes don't start with 0
        if (type === 'numeric' && code[0] === '0') {
            code = code.replace(/^0/, chars[1] || '1');
        }

        return code;
    }

    /**
     * Generate cryptographically secure code
     * @param {number} length 
     * @returns {string}
     */
    static generateSecureCode(length = OTPModel.config.codeLength) {
        const buffer = crypto.randomInt(0, Math.pow(10, length));
        return buffer.toString().padStart(length, '0');
    }

    // ============================================================================
    // HASHING & ENCRYPTION
    // ============================================================================

    /**
     * Hash OTP code using bcrypt
     * @param {string} code - Plain OTP code
     * @returns {Promise<string>} Hashed code
     */
    static async hashCode(code) {
        const bcrypt = require('bcrypt');
        return await bcrypt.hash(code, OTPModel.config.hashRounds);
    }

    /**
     * Verify OTP code against hash
     * @param {string} code - Plain OTP code
     * @param {string} hashedCode - Hashed code from database
     * @returns {Promise<boolean>}
     */
    static async verifyCode(code, hashedCode) {
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(code, hashedCode);
    }

    /**
     * Encrypt sensitive data
     * @param {string} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    static encrypt(data) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.OTP_ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @returns {string} Decrypted data
     */
    static decrypt(encryptedData) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.OTP_ENCRYPTION_KEY || 'default-key', 'salt', 32);
        
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ============================================================================
    // CREATE OTP
    // ============================================================================

    /**
     * Create new OTP
     * @param {Object} options - OTP creation options
     * @param {number|string} options.userId - User ID
     * @param {string} options.type - OTP type (login, register, password_reset, etc.)
     * @param {string} options.code - OTP code (optional, auto-generated if not provided)
     * @param {number} options.expiresInMinutes - Expiration time in minutes
     * @param {string} options.ipAddress - Client IP address
     * @param {string} options.userAgent - Client user agent
     * @param {string} options.deviceFingerprint - Device fingerprint
     * @returns {Promise<Object>} Created OTP object
     */
    async create(options = {}) {
        this._ensureInitialized();

        const {
            userId,
            type = 'login',
            code = null,
            expiresInMinutes = OTPModel.config.expiresInMinutes,
            ipAddress = null,
            userAgent = null,
            deviceFingerprint = null
        } = options;

        // Validation
        this._validateCreateOptions({ userId, type });

        // Check rate limiting
        await this._checkRateLimit(userId, type);

        // Check daily limit
        await this._checkDailyLimit(userId, type);

        // Generate code if not provided
        const otpCode = code || OTPModel.generateCode();
        
        // Hash the code for storage
        const hashedCode = await OTPModel.hashCode(otpCode);

        // Calculate expiration
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        const now = new Date();

        // Create OTP record
        const otpData = {
            user_id: userId,
            code: hashedCode,
            type,
            expires_at: expiresAt,
            ip_address: OTPModel.config.enableIPTracking ? ipAddress : null,
            user_agent: userAgent,
            device_fingerprint: OTPModel.config.enableDeviceFingerprint ? deviceFingerprint : null,
            is_used: false,
            created_at: now,
            attempts: 0
        };

        try {
            const [result] = await OTPModel.db.query(
                `INSERT INTO otps 
                (user_id, code, type, expires_at, ip_address, user_agent, device_fingerprint, is_used, created_at, attempts) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    otpData.user_id,
                    otpData.code,
                    otpData.type,
                    otpData.expires_at,
                    otpData.ip_address,
                    otpData.user_agent,
                    otpData.device_fingerprint,
                    otpData.is_used,
                    otpData.created_at,
                    otpData.attempts
                ]
            );

            const createdOTP = {
                id: result.insertId,
                ...otpData,
                code: otpCode // Return plain code only once
            };

            // Emit event
            otpEvents.emit(OTP_EVENTS.CREATED, {
                userId,
                type,
                otpId: createdOTP.id
            });

            // Log audit
            await this._logAudit('CREATE', userId, type, { otpId: createdOTP.id });

            return createdOTP;

        } catch (error) {
            OTPModel.logger.error('Failed to create OTP:', error);
            throw new OTPError('Failed to create OTP', 'CREATE_FAILED', 500);
        }
    }

    /**
     * Validate create options
     */
    _validateCreateOptions({ userId, type }) {
        if (!userId) {
            throw new OTPValidationError('User ID is required', 'userId');
        }

        if (!type || typeof type !== 'string') {
            throw new OTPValidationError('OTP type is required', 'type');
        }

        const validTypes = ['login', 'register', 'password_reset', 'email_verification', 'phone_verification', 'transaction'];
        if (!validTypes.includes(type)) {
            throw new OTPValidationError(`Invalid OTP type. Valid types: ${validTypes.join(', ')}`, 'type');
        }
    }

    // ============================================================================
    // VERIFY OTP
    // ============================================================================

    /**
     * Verify OTP code
     * @param {Object} options - Verification options
     * @param {number|string} options.userId - User ID
     * @param {string} options.code - OTP code to verify
     * @param {string} options.type - OTP type
     * @param {string} options.ipAddress - Client IP (optional)
     * @returns {Promise<Object>} Verification result
     */
    async verify(options = {}) {
        this._ensureInitialized();

        const {
            userId,
            code,
            type,
            ipAddress = null
        } = options;

        // Validation
        if (!userId) {
            throw new OTPValidationError('User ID is required', 'userId');
        }
        if (!code) {
            throw new OTPValidationError('Code is required', 'code');
        }
        if (!type) {
            throw new OTPValidationError('Type is required', 'type');
        }

        // Check rate limiting before verification
        await this._checkVerificationLimit(userId, type);

        try {
            // Find valid OTP
            const otp = await this._findValidOTP(userId, code, type);

            if (!otp) {
                // Log failed attempt
                await this._recordFailedAttempt(userId, type, ipAddress);
                await this._incrementAttempts(userId, type);
                
                otpEvents.emit(OTP_EVENTS.FAILED, {
                    userId,
                    type,
                    attempt: await this._getAttemptCount(userId, type)
                });

                throw new OTPAuthenticationError('Invalid or expired OTP');
            }

            // Verify code
            const isValid = await OTPModel.verifyCode(code, otp.code);

            if (!isValid) {
                await this._recordFailedAttempt(userId, type, ipAddress);
                await this._incrementAttempts(userId, type);
                
                otpEvents.emit(OTP_EVENTS.FAILED, {
                    userId,
                    type,
                    attempt: await this._getAttemptCount(userId, type)
                });

                throw new OTPAuthenticationError('Invalid OTP code');
            }

            // Mark OTP as used
            await this.markAsUsed(otp.id);

            // Clear failed attempts
            await this._clearFailedAttempts(userId, type);

            // Emit success event
            otpEvents.emit(OTP_EVENTS.VERIFIED, {
                userId,
                type,
                otpId: otp.id
            });

            // Log audit
            await this._logAudit('VERIFY', userId, type, { otpId: otp.id });

            return {
                success: true,
                otpId: otp.id,
                userId,
                type,
                message: 'OTP verified successfully'
            };

        } catch (error) {
            if (error instanceof OTPAuthenticationError || error instanceof OTPValidationError) {
                throw error;
            }
            OTPModel.logger.error('OTP verification error:', error);
            throw new OTPError('Verification failed', 'VERIFICATION_ERROR', 500);
        }
    }

    /**
     * Find valid OTP by user, code and type
     */
    async _findValidOTP(userId, code, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otps 
             WHERE user_id = ? AND type = ? 
             AND is_used = FALSE 
             AND expires_at > NOW()
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId, type]
        );

        if (!rows || rows.length === 0) {
            return null;
        }

        return rows[0];
    }

    // ============================================================================
    // MARK AS USED
    // ============================================================================

    /**
     * Mark OTP as used
     * @param {number} otpId - OTP ID
     * @returns {Promise<boolean>}
     */
    async markAsUsed(otpId) {
        this._ensureInitialized();

        if (!otpId) {
            throw new OTPValidationError('OTP ID is required', 'otpId');
        }

        try {
            await OTPModel.db.query(
                `UPDATE otps SET is_used = TRUE, used_at = NOW() WHERE id = ?`,
                [otpId]
            );

            otpEvents.emit(OTP_EVENTS.USED, { otpId });

            return true;
        } catch (error) {
            OTPModel.logger.error('Failed to mark OTP as used:', error);
            throw new OTPError('Failed to update OTP', 'UPDATE_FAILED', 500);
        }
    }

    // ============================================================================
    // RATE LIMITING
    // ============================================================================

    /**
     * Check if user can request new OTP
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type
     * @returns {Promise<boolean>}
     */
    async canRequestOTP(userId, type) {
        this._ensureInitialized();

        try {
            // Check cooldown
            const canRequest = await this._checkCooldown(userId, type);
            if (!canRequest) {
                return false;
            }

            // Check attempts in window
            const attemptsInWindow = await this._getAttemptsInWindow(userId, type);
            if (attemptsInWindow >= OTPModel.config.maxAttemptsPerWindow) {
                return false;
            }

            // Check daily limit
            const dailyCount = await this._getDailyCount(userId, type);
            if (dailyCount >= OTPModel.config.maxOTPsPerDay) {
                return false;
            }

            return true;
        } catch (error) {
            OTPModel.logger.error('Error checking rate limit:', error);
            return false;
        }
    }

    /**
     * Internal rate limit check
     */
    async _checkRateLimit(userId, type) {
        const canRequest = await this.canRequestOTP(userId, type);
        
        if (!canRequest) {
            const retryAfter = await this._getRetryAfter(userId, type);
            
            otpEvents.emit(OTP_EVENTS.RATE_LIMITED, { userId, type });
            await this._logAudit('RATE_LIMITED', userId, type, { retryAfter });

            throw new OTPRateLimitError(
                'Too many OTP requests. Please try again later.',
                retryAfter
            );
        }
    }

    /**
     * Check verification rate limit
     */
    async _checkVerificationLimit(userId, type) {
        const attempts = await this._getVerificationAttempts(userId, type);
        
        if (attempts >= OTPModel.config.maxAttemptsPerWindow) {
            throw new OTPRateLimitError(
                'Too many verification attempts. Please try again later.',
                OTPModel.config.maxAttemptsWindowMinutes
            );
        }
    }

    /**
     * Get retry after seconds
     */
    async _getRetryAfter(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT TIMESTAMPDIFF(SECOND, NOW(), MIN(expires_at)) as retry_after
             FROM otps 
             WHERE user_id = ? AND type = ? 
             AND is_used = FALSE 
             AND expires_at > NOW()
             ORDER BY expires_at ASC 
             LIMIT 1`,
            [userId, type]
        );

        return rows[0]?.retry_after || OTPModel.config.cooldownMinutes * 60;
    }

    /**
     * Check cooldown period
     */
    async _checkCooldown(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otps 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)`,
            [userId, type, OTPModel.config.allowResendAfterSeconds]
        );

        return rows[0].count === 0;
    }

    /**
     * Get attempts in time window
     */
    async _getAttemptsInWindow(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otps 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [userId, type, OTPModel.config.maxAttemptsWindowMinutes]
        );

        return rows[0].count;
    }

    /**
     * Get daily OTP count
     */
    async _getDailyCount(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otps 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userId, type]
        );

        return rows[0].count;
    }

    /**
     * Get verification attempts
     */
    async _getVerificationAttempts(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otp_attempts 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
             AND success = FALSE`,
            [userId, type, OTPModel.config.maxAttemptsWindowMinutes]
        );

        return rows[0].count;
    }

    /**
     * Check daily limit
     */
    async _checkDailyLimit(userId, type) {
        const dailyCount = await this._getDailyCount(userId, type);
        
        if (dailyCount >= OTPModel.config.maxOTPsPerDay) {
            throw new OTPRateLimitError(
                'Daily OTP limit exceeded',
                24 * 60 * 60 // 24 hours in seconds
            );
        }
    }

    // ============================================================================
    // ATTEMPT TRACKING
    // ============================================================================

    /**
     * Record failed attempt
     */
    async _recordFailedAttempt(userId, type, ipAddress) {
        try {
            await OTPModel.db.query(
                `INSERT INTO otp_attempts (user_id, type, ip_address, success, created_at)
                 VALUES (?, ?, ?, FALSE, NOW())`,
                [userId, type, ipAddress]
            );
        } catch (error) {
            OTPModel.logger.error('Failed to record attempt:', error);
        }
    }

    /**
     * Clear failed attempts
     */
    async _clearFailedAttempts(userId, type) {
        try {
            await OTPModel.db.query(
                `DELETE FROM otp_attempts WHERE user_id = ? AND type = ?`,
                [userId, type]
            );
        } catch (error) {
            OTPModel.logger.error('Failed to clear attempts:', error);
        }
    }

    /**
     * Get attempt count
     */
    async _getAttemptCount(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otp_attempts 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [userId, type, OTPModel.config.maxAttemptsWindowMinutes]
        );

        return rows[0].count;
    }

    /**
     * Increment OTP attempts
     */
    async _incrementAttempts(userId, type) {
        try {
            await OTPModel.db.query(
                `UPDATE otps SET attempts = attempts + 1 
                 WHERE user_id = ? AND type = ? 
                 AND is_used = FALSE 
                 AND expires_at > NOW()
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [userId, type]
            );
        } catch (error) {
            OTPModel.logger.error('Failed to increment attempts:', error);
        }
    }

    // ============================================================================
    // DELETE & CLEANUP
    // ============================================================================

    /**
     * Delete expired OTPs for a user
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type (optional)
     * @returns {Promise<number>} Number of deleted OTPs
     */
    async deleteExpired(userId, type = null) {
        this._ensureInitialized();

        let query = `DELETE FROM otps WHERE user_id = ? AND expires_at < NOW()`;
        const params = [userId];

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        try {
            const [result] = await OTPModel.db.query(query, params);
            
            otpEvents.emit(OTP_EVENTS.DELETED, { userId, type, count: result.affectedRows });

            return result.affectedRows;
        } catch (error) {
            OTPModel.logger.error('Failed to delete expired OTPs:', error);
            throw new OTPError('Failed to delete expired OTPs', 'DELETE_FAILED', 500);
        }
    }

    /**
     * Delete all OTPs for a user
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type (optional)
     * @returns {Promise<number>}
     */
    async deleteAll(userId, type = null) {
        this._ensureInitialized();

        let query = `DELETE FROM otps WHERE user_id = ?`;
        const params = [userId];

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        try {
            const [result] = await OTPModel.db.query(query, params);
            return result.affectedRows;
        } catch (error) {
            OTPModel.logger.error('Failed to delete OTPs:', error);
            throw new OTPError('Failed to delete OTPs', 'DELETE_FAILED', 500);
        }
    }

    /**
     * Cleanup old OTPs (retention policy)
     * @returns {Promise<number>} Number of deleted OTPs
     */
    async cleanup() {
        this._ensureInitialized();

        const retentionDays = OTPModel.config.retentionDays;

        try {
            const [result] = await OTPModel.db.query(
                `DELETE FROM otps 
                 WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
                 AND is_used = TRUE`,
                [retentionDays]
            );

            const [unusedResult] = await OTPModel.db.query(
                `DELETE FROM otps 
                 WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)`
            );

            const totalDeleted = result.affectedRows + unusedResult.affectedRows;

            otpEvents.emit(OTP_EVENTS.CLEANUP, { deleted: totalDeleted });

            OTPModel.logger.info(`Cleanup completed. Deleted ${totalDeleted} OTPs`);

            return totalDeleted;
        } catch (error) {
            OTPModel.logger.error('Cleanup failed:', error);
            throw new OTPError('Cleanup failed', 'CLEANUP_FAILED', 500);
        }
    }

    /**
     * Start cleanup scheduler
     */
    _startCleanupScheduler() {
        const intervalHours = OTPModel.config.cleanupIntervalHours;
        const intervalMs = intervalHours * 60 * 60 * 1000;

        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanup();
            } catch (error) {
                OTPModel.logger.error('Scheduled cleanup failed:', error);
            }
        }, intervalMs);

        OTPModel.logger.info(`Cleanup scheduler started. Interval: ${intervalHours} hours`);
    }

    /**
     * Stop cleanup scheduler
     */
    stopCleanupScheduler() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            OTPModel.logger.info('Cleanup scheduler stopped');
        }
    }

    // ============================================================================
    // QUERY METHODS
    // ============================================================================

    /**
     * Get recent OTPs for a user
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type
     * @param {number} limit - Number of records
     * @returns {Promise<Array>}
     */
    async getRecentOTPs(userId, type, limit = 5) {
        this._ensureInitialized();

        const [rows] = await OTPModel.db.query(
            `SELECT id, user_id, type, is_used, expires_at, created_at, used_at, attempts
             FROM otps
             WHERE user_id = ? AND type = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [userId, type, limit]
        );

        return rows;
    }

    /**
     * Get OTP by ID
     * @param {number} otpId - OTP ID
     * @returns {Promise<Object|null>}
     */
    async getById(otpId) {
        this._ensureInitialized();

        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otps WHERE id = ?`,
            [otpId]
        );

        return rows[0] || null;
    }

    /**
     * Get OTP statistics for a user
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type (optional)
     * @returns {Promise<Object>}
     */
    async getStatistics(userId, type = null) {
        this._ensureInitialized();

        let whereClause = 'WHERE user_id = ?';
        const params = [userId];

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        const [stats] = await OTPModel.db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
                SUM(CASE WHEN is_used = FALSE AND expires_at < NOW() THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
                MAX(created_at) as last_created
             FROM otps 
             ${whereClause}`,
            params
        );

        return stats[0];
    }

    /**
     * Get all active OTPs for a user
     * @param {number|string} userId - User ID
     * @param {string} type - OTP type (optional)
     * @returns {Promise<Array>}
     */
    async getActiveOTPs(userId, type = null) {
        this._ensureInitialized();

        let query = `SELECT * FROM otps 
                     WHERE user_id = ? AND is_used = FALSE AND expires_at > NOW()`;
        const params = [userId];

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await OTPModel.db.query(query, params);
        return rows;
    }

    // ============================================================================
    // AUDIT LOGGING
    // ============================================================================

    /**
     * Log audit event
     */
    async _logAudit(action, userId, type, metadata = {}) {
        if (!OTPModel.config.enableAuditLog) {
            return;
        }

        try {
            await OTPModel.db.query(
                `INSERT INTO otp_audit_log (action, user_id, type, metadata, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [action, userId, type, JSON.stringify(metadata)]
            );
        } catch (error) {
            OTPModel.logger.error('Failed to log audit:', error);
        }
    }

    /**
     * Get audit log for a user
     * @param {number|string} userId - User ID
     * @param {number} limit - Number of records
     * @returns {Promise<Array>}
     */
    async getAuditLog(userId, limit = 50) {
        this._ensureInitialized();

        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otp_audit_log 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );

        return rows;
    }

    // ============================================================================
    // CACHE METHODS
    // ============================================================================

    /**
     * Get cached value
     */
    async _getCached(key) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return null;
        }

        try {
            return await OTPModel.cache.get(key);
        } catch (error) {
            OTPModel.logger.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cached value
     */
    async _setCached(key, value, ttl = null) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return;
        }

        const cacheTTL = ttl || OTPModel.config.cacheTTLSeconds;

        try {
            await OTPModel.cache.setex(key, cacheTTL, JSON.stringify(value));
        } catch (error) {
            OTPModel.logger.error('Cache set error:', error);
        }
    }

    /**
     * Delete cached value
     */
    async _deleteCached(key) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return;
        }

        try {
            await OTPModel.cache.del(key);
        } catch (error) {
            OTPModel.logger.error('Cache delete error:', error);
        }
    }

    // ============================================================================
    // VALIDATION HELPERS
    // ============================================================================

    /**
     * Validate OTP format
     */
    static validateCodeFormat(code, type = 'numeric') {
        if (!code || typeof code !== 'string') {
            return { valid: false, error: 'Code must be a string' };
        }

        const length = OTPModel.config.codeLength;
        
        if (code.length !== length) {
            return { valid: false, error: `Code must be ${length} characters` };
        }

        const patterns = {
            numeric: /^\d+$/,
            alphabetic: /^[a-zA-Z]+$/,
            alphanumeric: /^[a-zA-Z0-9]+$/
        };

        const pattern = patterns[type] || patterns.alphanumeric;
        
        if (!pattern.test(code)) {
            return { valid: false, error: `Code must be ${type}` };
        }

        return { valid: true };
    }

    /**
     * Validate user ID
     */
    static validateUserId(userId) {
        if (userId === undefined || userId === null || userId === '') {
            return { valid: false, error: 'User ID is required' };
        }

        return { valid: true };
    }

    // ============================================================================
    // BULK OPERATIONS
    // ============================================================================

    /**
     * Bulk delete OTPs
     * @param {Array<number>} otpIds - Array of OTP IDs
     * @returns {Promise<number>}
     */
    async bulkDelete(otpIds) {
        if (!Array.isArray(otpIds) || otpIds.length === 0) {
            return 0;
        }

        const placeholders = otpIds.map(() => '?').join(',');
        
        try {
            const [result] = await OTPModel.db.query(
                `DELETE FROM otps WHERE id IN (${placeholders})`,
                otpIds
            );

            return result.affectedRows;
        } catch (error) {
            OTPModel.logger.error('Bulk delete failed:', error);
            throw new OTPError('Bulk delete failed', 'BULK_DELETE_FAILED', 500);
        }
    }

    /**
     * Bulk mark OTPs as used
     * @param {Array<number>} otpIds - Array of OTP IDs
     * @returns {Promise<number>}
     */
    async bulkMarkAsUsed(otpIds) {
        if (!Array.isArray(otpIds) || otpIds.length === 0) {
            return 0;
        }

        const placeholders = otpIds.map(() => '?').join(',');
        
        try {
            const [result] = await OTPModel.db.query(
                `UPDATE otps SET is_used = TRUE, used_at = NOW() 
                 WHERE id IN (${placeholders})`,
                otpIds
            );

            return result.affectedRows;
        } catch (error) {
            OTPModel.logger.error('Bulk update failed:', error);
            throw new OTPError('Bulk update failed', 'BULK_UPDATE_FAILED', 500);
        }
    }

    // ============================================================================
    // TRANSACTION SUPPORT
    // ============================================================================

    /**
     * Create OTP in transaction
     */
    async createInTransaction(options = {}) {
        const connection = await OTPModel.db.getConnection();
        
        try {
            await connection.beginTransaction();

            const result = await this._createInConnection(connection, options);

            await connection.commit();

            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Internal create method with connection
     */
    async _createInConnection(connection, options) {
        const {
            userId,
            type = 'login',
            code = null,
            expiresInMinutes = OTPModel.config.expiresInMinutes,
            ipAddress = null,
            userAgent = null,
            deviceFingerprint = null
        } = options;

        const otpCode = code || OTPModel.generateCode();
        const hashedCode = await OTPModel.hashCode(otpCode);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        const [result] = await connection.query(
            `INSERT INTO otps 
            (user_id, code, type, expires_at, ip_address, user_agent, device_fingerprint, is_used, created_at, attempts) 
            VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW(), 0)`,
            [userId, hashedCode, type, expiresAt, ipAddress, userAgent, deviceFingerprint]
        );

        return {
            id: result.insertId,
            userId,
            code: otpCode,
            type,
            expiresAt
        };
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Get remaining time until OTP expires
     * @param {number} otpId - OTP ID
     * @returns {Promise<number>} Seconds remaining
     */
    async getRemainingTime(otpId) {
        const otp = await this.getById(otpId);
        
        if (!otp) {
            return 0;
        }

        const now = new Date();
        const expiresAt = new Date(otp.expires_at);
        const diff = expiresAt - now;

        return Math.max(0, Math.floor(diff / 1000));
    }

    /**
     * Check if OTP is expired
     * @param {number} otpId - OTP ID
     * @returns {Promise<boolean>}
     */
    async isExpired(otpId) {
        const remaining = await this.getRemainingTime(otpId);
        return remaining === 0;
    }

    /**
     * Check if OTP is used
     * @param {number} otpId - OTP ID
     * @returns {Promise<boolean>}
     */
    async isUsed(otpId) {
        const otp = await this.getById(otpId);
        return otp ? otp.is_used : false;
    }

    /**
     * Get OTP status
     * @param {number} otpId - OTP ID
     * @returns {Promise<string>} Status: active, used, expired, not_found
     */
    async getStatus(otpId) {
        const otp = await this.getById(otpId);

        if (!otp) {
            return 'not_found';
        }

        if (otp.is_used) {
            return 'used';
        }

        if (new Date(otp.expires_at) < new Date()) {
            return 'expired';
        }

        return 'active';
    }

    // ============================================================================
    // EVENT SUBSCRIPTION
    // ============================================================================

    /**
     * Subscribe to OTP events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    static on(event, callback) {
        otpEvents.on(event, callback);
    }

    /**
     * Unsubscribe from OTP events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    static off(event, callback) {
        otpEvents.off(event, callback);
    }

    /**
     * Subscribe to OTP events (once)
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    static once(event, callback) {
        otpEvents.once(event, callback);
    }

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    static updateConfig(newConfig) {
        OTPModel.config = { ...OTPModel.config, ...newConfig };
        OTPModel.logger.info('OTP configuration updated');
    }

    /**
     * Get current configuration
     * @returns {Object}
     */
    static getConfig() {
        return { ...OTPModel.config };
    }

    // ============================================================================
    // DATABASE SCHEMA
    // ============================================================================

    /**
     * Get database schema for OTPs table
     * @returns {string}
     */
    static getSchema() {
        return `
-- OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    attempts INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_type_created (user_id, type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Attempts Table (for rate limiting)
CREATE TABLE IF NOT EXISTS otp_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_type_created (user_id, type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Audit Log Table (continued from line 1493)
CREATE TABLE IF NOT EXISTS otp_audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
    }

    /**
     * Get migration SQL for adding new columns
     * @returns {Array<string>}
     */
    static getMigrations() {
        return [
            `ALTER TABLE otps ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) AFTER expires_at`,
            `ALTER TABLE otps ADD COLUMN IF NOT EXISTS user_agent TEXT AFTER ip_address`,
            `ALTER TABLE otps ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255) AFTER user_agent`,
            `ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0 AFTER used_at`,
            `CREATE INDEX IF NOT EXISTS idx_otp_user_type ON otps(user_id, type)`,
            `CREATE INDEX IF NOT EXISTS idx_otp_expires ON otps(expires_at)`
        ];
    }

    // ============================================================================
    // EMAIL/SMS INTEGRATION (PLACEHOLDERS)
    // ============================================================================

    /**
     * Send OTP via email
     * @param {Object} options - Email options
     * @param {string} options.email - Recipient email
     * @param {string} options.code - OTP code
     * @param {string} options.type - OTP type
     * @param {string} options.userName - User name (optional)
     * @returns {Promise<boolean>}
     */
    async sendViaEmail(options = {}) {
        const { email, code, type, userName = 'User' } = options;

        if (!email) {
            throw new OTPValidationError('Email is required', 'email');
        }

        // Email template
        const template = this._getEmailTemplate(type, code, userName);
        
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        OTPModel.logger.info(`Sending OTP email to ${email}, type: ${type}`);

        // Placeholder for actual email sending
        // await emailService.send({
        //     to: email,
        //     subject: template.subject,
        //     html: template.html,
        //     text: template.text
        // });

        return true;
    }

    /**
     * Send OTP via SMS
     * @param {Object} options - SMS options
     * @param {string} options.phone - Recipient phone number
     * @param {string} options.code - OTP code
     * @param {string} options.type - OTP type
     * @returns {Promise<boolean>}
     */
    async sendViaSMS(options = {}) {
        const { phone, code, type } = options;

        if (!phone) {
            throw new OTPValidationError('Phone is required', 'phone');
        }

        // Validate phone format
        if (!this._validatePhoneNumber(phone)) {
            throw new OTPValidationError('Invalid phone number format', 'phone');
        }

        // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
        OTPModel.logger.info(`Sending OTP SMS to ${phone}, type: ${type}`);

        // Placeholder for actual SMS sending
        // await smsService.send({
        //     to: phone,
        //     message: `Your verification code is: ${code}`
        // });

        return true;
    }

    /**
     * Get email template based on OTP type
     * @param {string} type - OTP type
     * @param {string} code - OTP code
     * @param {string} userName - User name
     * @returns {Object} Email template
     */
    _getEmailTemplate(type, code, userName) {
        const templates = {
            login: {
                subject: 'Your Login Verification Code',
                html: this._getLoginEmailHTML(code, userName),
                text: `Your login verification code is: ${code}. This code will expire in ${OTPModel.config.expiresInMinutes} minutes.`
            },
            register: {
                subject: 'Complete Your Registration',
                html: this._getRegisterEmailHTML(code, userName),
                text: `Your registration verification code is: ${code}. This code will expire in ${OTPModel.config.expiresInMinutes} minutes.`
            },
            password_reset: {
                subject: 'Password Reset Request',
                html: this._getPasswordResetEmailHTML(code, userName),
                text: `Your password reset code is: ${code}. This code will expire in ${OTPModel.config.expiresInMinutes} minutes.`
            },
            email_verification: {
                subject: 'Verify Your Email Address',
                html: this._getEmailVerificationHTML(code, userName),
                text: `Your email verification code is: ${code}. This code will expire in ${OTPModel.config.expiresInMinutes} minutes.`
            },
            transaction: {
                subject: 'Transaction Verification Code',
                html: this._getTransactionEmailHTML(code, userName),
                text: `Your transaction verification code is: ${code}. This code will expire in ${OTPModel.config.expiresInMinutes} minutes.`
            }
        };

        return templates[type] || templates.login;
    }

    /**
     * Email HTML templates
     */
    _getLoginEmailHTML(code, userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Login Verification</h2>
                <p>Hello ${userName},</p>
                <p>Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in ${OTPModel.config.expiresInMinutes} minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
            </div>
        `;
    }

    _getRegisterEmailHTML(code, userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Complete Registration</h2>
                <p>Hello ${userName},</p>
                <p>Thank you for registering. Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in ${OTPModel.config.expiresInMinutes} minutes.</p>
            </div>
        `;
    }

    _getPasswordResetEmailHTML(code, userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d9534f;">Password Reset</h2>
                <p>Hello ${userName},</p>
                <p>You requested a password reset. Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in ${OTPModel.config.expiresInMinutes} minutes.</p>
                <p style="color: #d9534f;">If you didn't request this, please secure your account.</p>
            </div>
        `;
    }

    _getEmailVerificationHTML(code, userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p>Hello ${userName},</p>
                <p>Please verify your email address with this code:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in ${OTPModel.config.expiresInMinutes} minutes.</p>
            </div>
        `;
    }

    _getTransactionEmailHTML(code, userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Transaction Verification</h2>
                <p>Hello ${userName},</p>
                <p>Your transaction verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in ${OTPModel.config.expiresInMinutes} minutes.</p>
            </div>
        `;
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone number
     * @returns {boolean}
     */
    _validatePhoneNumber(phone) {
        // Basic validation - can be enhanced
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    }

    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone
     */
    _formatPhoneNumber(phone) {
        return phone.replace(/[\s-]/g, '').replace(/^\+/, '');
    }

    // ============================================================================
    // ADVANCED VALIDATION
    // ============================================================================

    /**
     * Validate OTP request
     * @param {Object} options - Request options
     * @returns {Object} Validation result
     */
    validateRequest(options = {}) {
        const { userId, type, ipAddress, userAgent, deviceFingerprint } = options;
        const errors = [];

        // User ID validation
        const userIdValidation = OTPModel.validateUserId(userId);
        if (!userIdValidation.valid) {
            errors.push({ field: 'userId', error: userIdValidation.error });
        }

        // Type validation
        const validTypes = ['login', 'register', 'password_reset', 'email_verification', 'phone_verification', 'transaction'];
        if (!validTypes.includes(type)) {
            errors.push({ field: 'type', error: `Invalid type. Valid: ${validTypes.join(', ')}` });
        }

        // IP validation (if enabled)
        if (OTPModel.config.enableIPTracking && ipAddress) {
            if (!this._validateIPAddress(ipAddress)) {
                errors.push({ field: 'ipAddress', error: 'Invalid IP address format' });
            }
        }

        // Device fingerprint validation
        if (OTPModel.config.enableDeviceFingerprint && !deviceFingerprint) {
            errors.push({ field: 'deviceFingerprint', error: 'Device fingerprint is required' });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate IP address
     * @param {string} ip - IP address
     * @returns {boolean}
     */
    _validateIPAddress(ip) {
        // IPv4 validation
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        // IPv6 validation
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        if (ipv4Regex.test(ip)) {
            const parts = ip.split('.');
            return parts.every(part => parseInt(part) <= 255);
        }

        return ipv6Regex.test(ip);
    }

    /**
     * Check for suspicious activity
     * @param {string} userId - User ID
     * @param {string} ipAddress - IP address
     * @param {string} deviceFingerprint - Device fingerprint
     * @returns {Promise<Object>} Suspicious activity check result
     */
    async checkSuspiciousActivity(userId, ipAddress, deviceFingerprint) {
        const suspiciousIndicators = [];

        // Check for multiple IPs in short time
        const recentIPs = await this._getRecentIPAddresses(userId);
        if (recentIPs.length > 3) {
            suspiciousIndicators.push({
                type: 'multiple_ips',
                message: 'Multiple IP addresses detected in recent requests'
            });
        }

        // Check for multiple devices
        const recentDevices = await this._getRecentDevices(userId);
        if (recentDevices.length > 5) {
            suspiciousIndicators.push({
                type: 'multiple_devices',
                message: 'Multiple devices detected'
            });
        }

        // Check for rapid requests
        const rapidRequests = await this._checkRapidRequests(userId);
        if (rapidRequests) {
            suspiciousIndicators.push({
                type: 'rapid_requests',
                message: 'Too many requests in short time'
            });
        }

        return {
            suspicious: suspiciousIndicators.length > 0,
            indicators: suspiciousIndicators,
            riskLevel: suspiciousIndicators.length > 2 ? 'high' : 
                      suspiciousIndicators.length > 0 ? 'medium' : 'low'
        };
    }

    /**
     * Get recent IP addresses for user
     */
    async _getRecentIPAddresses(userId) {
        const [rows] = await OTPModel.db.query(
            `SELECT DISTINCT ip_address FROM otps 
             WHERE user_id = ? AND ip_address IS NOT NULL
             AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
            [userId]
        );
        return rows.map(r => r.ip_address);
    }

    /**
     * Get recent devices for user
     */
    async _getRecentDevices(userId) {
        const [rows] = await OTPModel.db.query(
            `SELECT DISTINCT device_fingerprint FROM otps 
             WHERE user_id = ? AND device_fingerprint IS NOT NULL
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userId]
        );
        return rows.map(r => r.device_fingerprint);
    }

    /**
     * Check for rapid requests
     */
    async _checkRapidRequests(userId) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otps 
             WHERE user_id = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
            [userId]
        );
        return rows[0].count > 5;
    }

    // ============================================================================
    // ADVANCED RATE LIMITING
    // ============================================================================

    /**
     * Get comprehensive rate limit info
     * @param {string} userId - User ID
     * @param {string} type - OTP type
     * @returns {Promise<Object>}
     */
    async getRateLimitInfo(userId, type) {
        const [
            cooldownCheck,
            attemptsInWindow,
            dailyCount,
            weeklyCount,
            lastOTP
        ] = await Promise.all([
            this._checkCooldown(userId, type),
            this._getAttemptsInWindow(userId, type),
            this._getDailyCount(userId, type),
            this._getWeeklyCount(userId, type),
            this._getLastOTP(userId, type)
        ]);

        return {
            canRequest: !cooldownCheck && 
                       attemptsInWindow < OTPModel.config.maxAttemptsPerWindow &&
                       dailyCount < OTPModel.config.maxOTPsPerDay,
            cooldownRemaining: cooldownCheck ? await this._getCooldownRemaining(userId, type) : 0,
            attemptsInWindow,
            maxAttemptsPerWindow: OTPModel.config.maxAttemptsPerWindow,
            dailyCount,
            maxDaily: OTPModel.config.maxOTPsPerDay,
            weeklyCount,
            maxWeekly: OTPModel.config.maxOTPsPerWeek,
            lastOTP: lastOTP ? {
                id: lastOTP.id,
                createdAt: lastOTP.created_at,
                expiresAt: lastOTP.expires_at,
                isUsed: lastOTP.is_used
            } : null
        };
    }

    /**
     * Get weekly OTP count
     */
    async _getWeeklyCount(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(*) as count FROM otps 
             WHERE user_id = ? AND type = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [userId, type]
        );
        return rows[0].count;
    }

    /**
     * Get last OTP for user
     */
    async _getLastOTP(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otps 
             WHERE user_id = ? AND type = ?
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId, type]
        );
        return rows[0] || null;
    }

    /**
     * Get cooldown remaining time
     */
    async _getCooldownRemaining(userId, type) {
        const [rows] = await OTPModel.db.query(
            `SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(created_at, INTERVAL ? SECOND)) as remaining
             FROM otps 
             WHERE user_id = ? AND type = ?
             ORDER BY created_at DESC 
             LIMIT 1`,
            [OTPModel.config.allowResendAfterSeconds, userId, type]
        );
        return Math.max(0, rows[0]?.remaining || 0);
    }

    /**
     * Advanced rate limiting with multiple factors
     * @param {Object} options - Rate limit options
     * @returns {Promise<Object>} Rate limit result
     */
    async checkAdvancedRateLimit(options = {}) {
        const { userId, type, ipAddress, deviceFingerprint } = options;

        const results = {
            allowed: true,
            reasons: [],
            limits: {}
        };

        // Check user-based limits
        const userLimit = await this._checkUserRateLimit(userId, type);
        if (!userLimit.allowed) {
            results.allowed = false;
            results.reasons.push(userLimit.reason);
        }
        results.limits.user = userLimit;

        // Check IP-based limits (if enabled)
        if (ipAddress && OTPModel.config.enableIPTracking) {
            const ipLimit = await this._checkIPRateLimit(ipAddress, type);
            if (!ipLimit.allowed) {
                results.allowed = false;
                results.reasons.push(ipLimit.reason);
            }
            results.limits.ip = ipLimit;
        }

        // Check device-based limits
        if (deviceFingerprint && OTPModel.config.enableDeviceFingerprint) {
            const deviceLimit = await this._checkDeviceRateLimit(deviceFingerprint, type);
            if (!deviceLimit.allowed) {
                results.allowed = false;
                results.reasons.push(deviceLimit.reason);
            }
            results.limits.device = deviceLimit;
        }

        return results;
    }

    /**
     * Check user rate limit
     */
    async _checkUserRateLimit(userId, type) {
        const dailyCount = await this._getDailyCount(userId, type);
        const weeklyCount = await this._getWeeklyCount(userId, type);
        const cooldownCheck = await this._checkCooldown(userId, type);

        if (dailyCount >= OTPModel.config.maxOTPsPerDay) {
            return { allowed: false, reason: 'Daily limit exceeded' };
        }

        if (weeklyCount >= OTPModel.config.maxOTPsPerWeek) {
            return { allowed: false, reason: 'Weekly limit exceeded' };
        }

        if (!cooldownCheck) {
            return { allowed: false, reason: 'Cooldown period active' };
        }

        return { allowed: true };
    }

    /**
     * Check IP rate limit
     */
    async _checkIPRateLimit(ipAddress, type) {
        const maxIPsPerDay = 20; // Configurable

        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(DISTINCT user_id) as count FROM otps 
             WHERE ip_address = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [ipAddress]
        );

        if (rows[0].count > maxIPsPerDay) {
            return { allowed: false, reason: 'IP rate limit exceeded' };
        }

        return { allowed: true };
    }

    /**
     * Check device rate limit
     */
    async _checkDeviceRateLimit(deviceFingerprint, type) {
        const maxDevicesPerDay = 10;

        const [rows] = await OTPModel.db.query(
            `SELECT COUNT(DISTINCT user_id) as count FROM otps 
             WHERE device_fingerprint = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [deviceFingerprint]
        );

        if (rows[0].count > maxDevicesPerDay) {
            return { allowed: false, reason: 'Device rate limit exceeded' };
        }

        return { allowed: true };
    }

    // ============================================================================
    // ANALYTICS & REPORTING
    // ============================================================================

    /**
     * Get OTP analytics
     * @param {Object} options - Analytics options
     * @returns {Promise<Object>}
     */
    async getAnalytics(options = {}) {
        const { startDate, endDate, type } = options;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (startDate) {
            whereClause += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND created_at <= ?';
            params.push(endDate);
        }

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        const [analytics] = await OTPModel.db.query(
            `SELECT 
                COUNT(*) as total_otps,
                SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
                SUM(CASE WHEN is_used = FALSE AND expires_at < NOW() THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
                AVG(attempts) as avg_attempts,
                MAX(attempts) as max_attempts,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT ip_address) as unique_ips
             FROM otps 
             ${whereClause}`,
            params
        );

        // Get type breakdown
        const [typeBreakdown] = await OTPModel.db.query(
            `SELECT type, COUNT(*) as count, 
                    SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used
             FROM otps 
             ${whereClause}
             GROUP BY type`,
            params
        );

        // Get hourly distribution
        const [hourlyDistribution] = await OTPModel.db.query(
            `SELECT HOUR(created_at) as hour, COUNT(*) as count
             FROM otps 
             ${whereClause}
             GROUP BY HOUR(created_at)
             ORDER BY hour`,
            params
        );

        return {
            summary: analytics[0],
            typeBreakdown,
            hourlyDistribution
        };
    }

    /**
     * Get user activity report
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getUserActivityReport(userId) {
        const [stats] = await OTPModel.db.query(
            `SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as successful_verifications,
                SUM(CASE WHEN is_used = FALSE AND expires_at < NOW() THEN 1 ELSE 0 END) as expired,
                MIN(created_at) as first_request,
                MAX(created_at) as last_request,
                COUNT(DISTINCT type) as types_used,
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(DISTINCT device_fingerprint) as unique_devices
             FROM otps 
             WHERE user_id = ?`,
            [userId]
        );

        const [byType] = await OTPModel.db.query(
            `SELECT type, COUNT(*) as count, 
                    SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used
             FROM otps 
             WHERE user_id = ?
             GROUP BY type`,
            [userId]
        );

        return {
            summary: stats[0],
            byType
        };
    }

    // ============================================================================
    // EXPORT/IMPORT
    // ============================================================================

    /**
     * Export OTPs to JSON
     * @param {Object} options - Export options
     * @returns {Promise<string>}
     */
    async exportToJSON(options = {}) {
        const { userId, type, startDate, endDate, limit = 1000 } = options;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (userId) {
            whereClause += ' AND user_id = ?';
            params.push(userId);
        }

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        if (startDate) {
            whereClause += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND created_at <= ?';
            params.push(endDate);
        }

        params.push(limit);

        const [rows] = await OTPModel.db.query(
            `SELECT id, user_id, type, is_used, expires_at, created_at, used_at, attempts
             FROM otps 
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT ?`,
            params
        );

        return JSON.stringify(rows, null, 2);
    }

    /**
     * Import OTPs from JSON
     * @param {string} jsonData - JSON data
     * @returns {Promise<Object>} Import result
     */
    async importFromJSON(jsonData) {
        const otps = JSON.parse(jsonData);
        
        if (!Array.isArray(otps)) {
            throw new OTPValidationError('Invalid JSON format', 'data');
        }

        let imported = 0;
        let failed = 0;
        const errors = [];

        for (const otp of otps) {
            try {
                await OTPModel.db.query(
                    `INSERT INTO otps (user_id, code, type, expires_at, is_used, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [otp.user_id, otp.code, otp.type, otp.expires_at, otp.is_used || false, otp.created_at]
                );
                imported++;
            } catch (error) {
                failed++;
                errors.push({ otp: otp.id || otp.user_id, error: error.message });
            }
        }

        return { imported, failed, errors };
    }

    // ============================================================================
    // CACHING LAYER
    // ============================================================================

    /**
     * Cache OTP verification result
     * @param {string} key - Cache key
     * @param {Object} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     */
    async cacheSet(key, value, ttl = 300) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return;
        }

        try {
            const cacheKey = `otp:${key}`;
            await OTPModel.cache.setex(cacheKey, ttl, JSON.stringify(value));
        } catch (error) {
            OTPModel.logger.error('Cache set error:', error);
        }
    }

    /**
     * Get cached OTP verification result
     * @param {string} key - Cache key
     * @returns {Promise<Object|null>}
     */
    async cacheGet(key) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return null;
        }

        try {
            const cacheKey = `otp:${key}`;
            const cached = await OTPModel.cache.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            OTPModel.logger.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Invalidate cache
     * @param {string} key - Cache key
     */
    async cacheInvalidate(key) {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return;
        }

        try {
            const cacheKey = `otp:${key}`;
            await OTPModel.cache.del(cacheKey);
        } catch (error) {
            OTPModel.logger.error('Cache invalidate error:', error);
        }
    }

    /**
     * Clear all OTP cache
     */
    async cacheClear() {
        if (!OTPModel.config.enableCache || !OTPModel.cache) {
            return;
        }

        try {
            const keys = await OTPModel.cache.keys('otp:*');
            if (keys.length > 0) {
                await OTPModel.cache.del(...keys);
            }
        } catch (error) {
            OTPModel.logger.error('Cache clear error:', error);
        }
    }

    // ============================================================================
    // PAGINATION
    // ============================================================================

    /**
     * Get paginated OTPs
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getPaginated(options = {}) {
        const { 
            page = 1, 
            limit = 20, 
            userId, 
            type, 
            isUsed,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (userId) {
            whereClause += ' AND user_id = ?';
            params.push(userId);
        }

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        if (isUsed !== undefined) {
            whereClause += ' AND is_used = ?';
            params.push(isUsed);
        }

        // Get total count
        const [countResult] = await OTPModel.db.query(
            `SELECT COUNT(*) as total FROM otps ${whereClause}`,
            params
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Get paginated data
        const validSortFields = ['id', 'user_id', 'type', 'created_at', 'expires_at', 'is_used'];
        const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otps 
             ${whereClause} 
             ORDER BY ${safeSortBy} ${safeSortOrder} 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    // ============================================================================
    // ADVANCED SEARCH
    // ============================================================================

    /**
     * Search OTPs with filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>}
     */
    async search(filters = {}) {
        const {
            userId,
            type,
            isUsed,
            ipAddress,
            deviceFingerprint,
            startDate,
            endDate,
            hasExpired,
            minAttempts,
            limit = 100
        } = filters;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (userId) {
            whereClause += ' AND user_id = ?';
            params.push(userId);
        }

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        if (isUsed !== undefined) {
            whereClause += ' AND is_used = ?';
            params.push(isUsed);
        }

        if (ipAddress) {
            whereClause += ' AND ip_address = ?';
            params.push(ipAddress);
        }

        if (deviceFingerprint) {
            whereClause += ' AND device_fingerprint = ?';
            params.push(deviceFingerprint);
        }

        if (startDate) {
            whereClause += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND created_at <= ?';
            params.push(endDate);
        }

        if (hasExpired !== undefined) {
            if (hasExpired) {
                whereClause += ' AND expires_at < NOW()';
            } else {
                whereClause += ' AND expires_at > NOW()';
            }
        }

        if (minAttempts) {
            whereClause += ' AND attempts >= ?';
            params.push(minAttempts);
        }

        params.push(limit);

        const [rows] = await OTPModel.db.query(
            `SELECT * FROM otps ${whereClause} ORDER BY created_at DESC LIMIT ?`,
            params
        );

        return rows;
    }

    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================

    /**
     * Batch create OTPs
     * @param {Array<Object>} otps - Array of OTP data
     * @returns {Promise<Object>} Batch result
     */
    async batchCreate(otps) {
        if (!Array.isArray(otps) || otps.length === 0) {
            return { created: 0, failed: 0, results: [] };
        }

        const results = [];
        let created = 0;
        let failed = 0;

        for (const otpData of otps) {
            try {
                const result = await this.create(otpData);
                results.push({ success: true, ...result });
                created++;
            } catch (error) {
                results.push({ success: false, error: error.message, ...otpData });
                failed++;
            }
        }

        return { created, failed, results };
    }

    /**
     * Batch verify OTPs
     * @param {Array<Object>} verifications - Array of verification data
     * @returns {Promise<Object>} Batch result
     */
    async batchVerify(verifications) {
        if (!Array.isArray(verifications) || verifications.length === 0) {
            return { verified: 0, failed: 0, results: [] };
        }

        const results = [];
        let verified = 0;
        let failed = 0;

        for (const verification of verifications) {
            try {
                const result = await this.verify(verification);
                results.push({ success: true, ...result });
                verified++;
            } catch (error) {
                results.push({ success: false, error: error.message, ...verification });
                failed++;
            }
        }

        return { verified, failed, results };
    }

    // ============================================================================
    // MAINTENANCE METHODS
    // ============================================================================

    /**
     * Get model health status
     * @returns {Promise<Object>}
     */
    async healthCheck() {
        const checks = {
            database: false,
            cache: false,
            config: false
        };

        // Check database
        try {
            await OTPModel.db.query('SELECT 1');
            checks.database = true;
        } catch (error) {
            OTPModel.logger.error('Database health check failed:', error);
        }

        // Check cache
        if (OTPModel.cache) {
            try {
                await OTPModel.cache.ping();
                checks.cache = true;
            } catch (error) {
                OTPModel.logger.error('Cache health check failed:', error);
            }
        } else {
            checks.cache = null; // Not configured
        }

        // Check config
        checks.config = OTPModel.config && Object.keys(OTPModel.config).length > 0;

        return {
            healthy: checks.database && checks.config,
            checks,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get model statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        const [rows] = await OTPModel.db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
                SUM(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_used = FALSE AND expires_at < NOW() THEN 1 ELSE 0 END) as expired
             FROM otps`
        );

        return rows[0];
    }

    /**
     * Optimize database tables
     * @returns {Promise<void>}
     */
    async optimize() {
        try {
            await OTPModel.db.query('OPTIMIZE TABLE otps');
            await OTPModel.db.query('OPTIMIZE TABLE otp_attempts');
            await OTPModel.db.query('OPTIMIZE TABLE otp_audit_log');
            OTPModel.logger.info('Database tables optimized');
        } catch (error) {
            OTPModel.logger.error('Optimization failed:', error);
        }
    }

    /**
     * Analyze database tables
     * @returns {Promise<void>}
     */
    async analyze() {
        try {
            await OTPModel.db.query('ANALYZE TABLE otps');
            await OTPModel.db.query('ANALYZE TABLE otp_attempts');
            await OTPModel.db.query('ANALYZE TABLE otp_audit_log');
            OTPModel.logger.info('Database tables analyzed');
        } catch (error) {
            OTPModel.logger.error('Analysis failed:', error);
        }
    }

    // ============================================================================
    // DESTRUCTOR
    // ============================================================================

    /**
     * Cleanup and destroy instance
     */
    destroy() {
        this.stopCleanupScheduler();
        this.initialized = false;
        OTPModel.logger.info('OTP Model destroyed');
    }
}

// ============================================================================
// STATIC CONVENIENCE METHODS
// ============================================================================

/**
 * Create OTP (static method)
 */
OTPModel.create = async function(options) {
    const instance = OTPModel.getInstance();
    return await instance.create(options);
};

/**
 * Verify OTP (static method)
 */
OTPModel.verify = async function(options) {
    const instance = OTPModel.getInstance();
    return await instance.verify(options);
};

/**
 * Generate code (static method)
 */
OTPModel.generate = function(length, type) {
    return OTPModel.generateCode(length, type);
};

/**
 * Can request OTP (static method)
 */
OTPModel.canRequest = async function(userId, type) {
    const instance = OTPModel.getInstance();
    return await instance.canRequestOTP(userId, type);
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = OTPModel;
module.exports.OTPError = OTPError;
module.exports.OTPRateLimitError = OTPRateLimitError;
module.exports.OTPValidationError = OTPValidationError;
module.exports.OTPAuthenticationError = OTPAuthenticationError;
module.exports.OTP_EVENTS = OTP_EVENTS;
module.exports.otpEvents = otpEvents;