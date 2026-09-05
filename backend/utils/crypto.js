/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔐 Crypto Utilities - نسخه پیشرفته
 * Handle encryption, decryption, hashing, and security operations
 * ═══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ═══════════════════════════════════════════════════════════════════
// 📦 Configuration & Constants
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    // Bcrypt
    SALT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    
    // AES-256
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    IV_LENGTH: 16,
    AUTH_TAG_LENGTH: 16,
    
    // Key Derivation
    PBKDF2_ITERATIONS: 100000,
    PBKDF2_KEYLEN: 64,
    SCRYPT_N: 16384,
    SCRYPT_R: 8,
    SCRYPT_P: 1,
    
    // Token Generation
    DEFAULT_TOKEN_LENGTH: 32,
    OTP_LENGTH: 6,
    
    // Password Policy
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    
    // Algorithms
    ENCRYPTION_ALGORITHMS: ['aes-256-cbc', 'aes-256-gcm', 'chacha20-poly1305'],
    HASH_ALGORITHMS: ['sha256', 'sha384', 'sha512', 'blake2b512', 'blake2s256']
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 Core Crypto Class
// ═══════════════════════════════════════════════════════════════════

class CryptoUtils {
    constructor() {
        this.config = CONFIG;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔑 Password Operations
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        this.validateString(password, 'Password');
        return await bcrypt.hash(password, CONFIG.SALT_ROUNDS);
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Match result
     */
    async comparePassword(password, hash) {
        this.validateString(password, 'Password');
        this.validateString(hash, 'Hash');
        return await bcrypt.compare(password, hash);
    }

    /**
     * Hash password with salt (manual)
     * @param {string} password - Plain text password
     * @param {string} salt - Custom salt (optional)
     * @returns {Promise<{hash: string, salt: string}>}
     */
    async hashPasswordWithSalt(password, salt = null) {
        this.validateString(password, 'Password');
        
        const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = await bcrypt.hash(password + generatedSalt, CONFIG.SALT_ROUNDS);
        
        return {
            hash,
            salt: generatedSalt,
            combined: `${generatedSalt}:${hash}`
        };
    }

    /**
     * Verify password with manual salt
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored hash with salt
     * @returns {Promise<boolean>}
     */
    async verifyPasswordWithSalt(password, storedHash) {
        const [salt, hash] = storedHash.split(':');
        const newHash = await bcrypt.hash(password + salt, CONFIG.SALT_ROUNDS);
        return crypto.timingSafeEqual(
            Buffer.from(newHash),
            Buffer.from(hash)
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎲 Random Generators
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Generate random string
     * @param {number} length - Length of random string
     * @returns {string} Random hex string
     */
    generateRandomString(length = CONFIG.DEFAULT_TOKEN_LENGTH) {
        this.validateNumber(length, 'Length');
        if (length < 1 || length > 1024) {
            throw new Error('Length must be between 1 and 1024');
        }
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    /**
     * Generate random string with custom charset
     * @param {number} length - Length of string
     * @param {string} charset - Character set to use
     * @returns {string}
     */
    generateRandomFromCharset(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        this.validateNumber(length, 'Length');
        
        const randomBytes = crypto.randomBytes(length);
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += charset[randomBytes[i] % charset.length];
        }
        
        return result;
    }

    /**
     * Generate numeric OTP
     * @param {number} length - OTP length (default 6)
     * @returns {string} Numeric OTP
     */
    generateOTP(length = CONFIG.OTP_LENGTH) {
        this.validateNumber(length, 'Length');
        if (length < 4 || length > 10) {
            throw new Error('OTP length must be between 4 and 10');
        }
        
        // Use crypto.randomInt for better security
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        
        return String(crypto.randomInt(min, max + 1));
    }

    /**
     * Generate alphanumeric OTP
     * @param {number} length - OTP length
     * @returns {string}
     */
    generateAlphaNumericOTP(length = 8) {
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
        return this.generateRandomFromCharset(length, charset);
    }

    /**
     * Generate UUID v4
     * @returns {string} UUID v4
     */
    generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Generate multiple UUIDs
     * @param {number} count - Number of UUIDs
     * @returns {string[]} Array of UUIDs
     */
    generateUUIDs(count = 1) {
        this.validateNumber(count, 'Count');
        return Array.from({ length: count }, () => crypto.randomUUID());
    }

    /**
     * Generate secure random number in range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    generateRandomNumber(min, max) {
        this.validateNumber(min, 'Min');
        this.validateNumber(max, 'Max');
        if (min >= max) {
            throw new Error('Min must be less than Max');
        }
        return crypto.randomInt(min, max + 1);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 Encryption - AES-256-CBC
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Encrypt string using AES-256-CBC
     * @param {string} text - Plain text to encrypt
     * @param {string} key - Custom encryption key (optional)
     * @returns {string} Encrypted text (iv:encrypted)
     */
    encrypt(text, key = null) {
        this.validateString(text, 'Text');
        
        const encryptionKey = key ? this.deriveKey(key) : Buffer.from(CONFIG.ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(CONFIG.IV_LENGTH);
        
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt string using AES-256-CBC
     * @param {string} encryptedText - Encrypted text
     * @param {string} key - Custom decryption key (optional)
     * @returns {string} Decrypted text
     */
    decrypt(encryptedText, key = null) {
        this.validateString(encryptedText, 'Encrypted text');
        
        const [ivHex, encrypted] = encryptedText.split(':');
        
        if (!ivHex || !encrypted) {
            throw new Error('Invalid encrypted text format');
        }
        
        const encryptionKey = key ? this.deriveKey(key) : Buffer.from(CONFIG.ENCRYPTION_KEY, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 Encryption - AES-256-GCM (Authenticated)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Encrypt using AES-256-GCM (with authentication tag)
     * @param {string} text - Plain text
     * @param {string} key - Custom key (optional)
     * @returns {string} iv:authTag:encrypted
     */
    encryptGCM(text, key = null) {
        this.validateString(text, 'Text');
        
        const encryptionKey = key ? this.deriveKey(key) : Buffer.from(CONFIG.ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(CONFIG.IV_LENGTH);
        
        const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt using AES-256-GCM
     * @param {string} encryptedText - Encrypted text
     * @param {string} key - Custom key (optional)
     * @returns {string}
     */
    decryptGCM(encryptedText, key = null) {
        this.validateString(encryptedText, 'Encrypted text');
        
        const parts = encryptedText.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid GCM encrypted text format');
        }
        
        const [ivHex, authTagHex, encrypted] = parts;
        const encryptionKey = key ? this.deriveKey(key) : Buffer.from(CONFIG.ENCRYPTION_KEY, 'hex');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 Encryption - ChaCha20-Poly1305
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Encrypt using ChaCha20-Poly1305
     * @param {string} text - Plain text
     * @param {string} key - Custom key (optional)
     * @returns {string}
     */
    encryptChaCha20(text, key = null) {
        this.validateString(text, 'Text');
        
        const encryptionKey = key ? this.deriveKeyChaCha20(key) : crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        
        const cipher = crypto.createCipheriv('chacha20-poly1305', encryptionKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptionKey.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt using ChaCha20-Poly1305
     * @param {string} encryptedText - Encrypted text
     * @returns {string}
     */
    decryptChaCha20(encryptedText) {
        const parts = encryptedText.split(':');
        
        if (parts.length !== 4) {
            throw new Error('Invalid ChaCha20 encrypted text format');
        }
        
        const [ivHex, authTagHex, keyHex, encrypted] = parts;
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = Buffer.from(keyHex, 'hex');
        
        const decipher = crypto.createDecipheriv('chacha20-poly1305', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔑 Key Derivation
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Derive key from password using PBKDF2
     * @param {string} password - Password
     * @param {string} salt - Salt (optional, auto-generated)
     * @returns {Promise<{key: string, salt: string}>}
     */
    async deriveKeyPBKDF2(password, salt = null) {
        this.validateString(password, 'Password');
        
        const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
        
        const key = await new Promise((resolve, reject) => {
            crypto.pbkdf2(
                password,
                saltBuffer,
                CONFIG.PBKDF2_ITERATIONS,
                CONFIG.PBKDF2_KEYLEN,
                'sha512',
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                }
            );
        });
        
        return {
            key: key.toString('hex'),
            salt: saltBuffer.toString('hex'),
            iterations: CONFIG.PBKDF2_ITERATIONS,
            algorithm: 'pbkdf2'
        };
    }

    /**
     * Derive key using scrypt
     * @param {string} password - Password
     * @param {string} salt - Salt (optional)
     * @returns {Promise<{key: string, salt: string}>}
     */
    async deriveKeyScrypt(password, salt = null) {
        this.validateString(password, 'Password');
        
        const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
        
        const key = await new Promise((resolve, reject) => {
            crypto.scrypt(
                password,
                saltBuffer,
                64,
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                }
            );
        });
        
        return {
            key: key.toString('hex'),
            salt: saltBuffer.toString('hex'),
            algorithm: 'scrypt'
        };
    }

    /**
     * Derive key for AES (internal use)
     * @param {string} password - Password
     * @returns {Buffer}
     */
    deriveKey(password) {
        return crypto.pbkdf2Sync(
            password,
            'roshana-salt', // Fixed salt for consistent key derivation
            10000,
            32,
            'sha256'
        );
    }

    /**
     * Derive key for ChaCha20
     * @param {string} password - Password
     * @returns {Buffer}
     */
    deriveKeyChaCha20(password) {
        return crypto.pbkdf2Sync(
            password,
            'roshana-chacha',
            10000,
            32,
            'sha512'
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // #️⃣ Hashing Operations
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Hash string using SHA-256
     * @param {string} text - Text to hash
     * @returns {string} Hash in hex
     */
    hashSHA256(text) {
        this.validateString(text, 'Text');
        return crypto.createHash('sha256').update(text).digest('hex');
    }

    /**
     * Hash string using SHA-384
     * @param {string} text - Text to hash
     * @returns {string}
     */
    hashSHA384(text) {
        this.validateString(text, 'Text');
        return crypto.createHash('sha384').update(text).digest('hex');
    }

    /**
     * Hash string using SHA-512
     * @param {string} text - Text to hash
     * @returns {string}
     */
    hashSHA512(text) {
        this.validateString(text, 'Text');
        return crypto.createHash('sha512').update(text).digest('hex');
    }

    /**
     * Hash using BLAKE2b
     * @param {string} text - Text to hash
     * @returns {string}
     */
    hashBLAKE2b(text) {
        this.validateString(text, 'Text');
        return crypto.createHash('blake2b512').update(text).digest('hex');
    }

    /**
     * Hash using BLAKE2s
     * @param {string} text - Text to hash
     * @returns {string}
     */
    hashBLAKE2s(text) {
        this.validateString(text, 'Text');
        return crypto.createHash('blake2s256').update(text).digest('hex');
    }

    /**
     * Hash with custom algorithm
     * @param {string} text - Text to hash
     * @param {string} algorithm - Algorithm name
     * @returns {string}
     */
    hash(text, algorithm = 'sha256') {
        this.validateString(text, 'Text');
        
        const validAlgorithms = CONFIG.HASH_ALGORITHMS;
        if (!validAlgorithms.includes(algorithm)) {
            throw new Error(`Invalid algorithm. Valid: ${validAlgorithms.join(', ')}`);
        }
        
        return crypto.createHash(algorithm).update(text).digest('hex');
    }

    /**
     * Hash file content
     * @param {Buffer} buffer - File buffer
     * @param {string} algorithm - Algorithm
     * @returns {string}
     */
    hashBuffer(buffer, algorithm = 'sha256') {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer');
        }
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔏 HMAC Operations
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Create HMAC
     * @param {string} text - Text
     * @param {string} secret - Secret key
     * @param {string} algorithm - Algorithm (sha256, sha512, etc.)
     * @returns {string}
     */
    createHMAC(text, secret, algorithm = 'sha256') {
        this.validateString(text, 'Text');
        this.validateString(secret, 'Secret');
        
        return crypto.createHmac(algorithm, secret).update(text).digest('hex');
    }

    /**
     * Verify HMAC
     * @param {string} text - Original text
     * @param {string} signature - HMAC signature
     * @param {string} secret - Secret key
     * @param {string} algorithm - Algorithm
     * @returns {boolean}
     */
    verifyHMAC(text, signature, secret, algorithm = 'sha256') {
        const expectedSignature = this.createHMAC(text, secret, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎫 Token Generation
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Generate token pair (access + refresh)
     * @returns {{accessToken: string, refreshToken: string}}
     */
    generateTokenPair() {
        return {
            accessToken: this.generateRandomString(64),
            refreshToken: this.generateRandomString(64)
        };
    }

    /**
     * Generate secure token with expiration
     * @param {number} expiresIn - Expiration in seconds
     * @returns {{token: string, expiresAt: Date}}
     */
    generateTokenWithExpiration(expiresIn = 3600) {
        this.validateNumber(expiresIn, 'Expires in');
        
        return {
            token: this.generateRandomString(64),
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            expiresIn
        };
    }

    /**
     * Generate API key
     * @param {string} prefix - Key prefix (e.g., 'roshana_live_')
     * @returns {string}
     */
    generateAPIKey(prefix = 'roshana_') {
        const timestamp = Date.now().toString(36);
        const randomPart = this.generateRandomString(24);
        return `${prefix}${timestamp}_${randomPart}`;
    }

    /**
     * Generate short code (for referral, coupon, etc.)
     * @param {number} length - Code length
     * @returns {string}
     */
    generateShortCode(length = 8) {
        return this.generateRandomFromCharset(length, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔗 Data Hash & Verification
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Create data hash (for verification)
     * @param {object|string} data - Data to hash
     * @returns {string}
     */
    createDataHash(data) {
        const secret = process.env.HASH_SECRET || 'default-secret';
        
        const sortedData = typeof data === 'object'
            ? JSON.stringify(data, Object.keys(data).sort())
            : data;
        
        return this.hashSHA256(sortedData + secret);
    }

    /**
     * Verify data hash
     * @param {object|string} data - Original data
     * @param {string} hash - Stored hash
     * @returns {boolean}
     */
    verifyDataHash(data, hash) {
        const computedHash = this.createDataHash(data);
        
        // Use timing-safe comparison
        try {
            return crypto.timingSafeEqual(
                Buffer.from(computedHash),
                Buffer.from(hash)
            );
        } catch (e) {
            return false;
        }
    }

    /**
     * Create checksum for file verification
     * @param {Buffer} buffer - File buffer
     * @returns {string}
     */
    createChecksum(buffer) {
        return this.hashSHA256(buffer);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 Encoding/Decoding
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Encode to Base64
     * @param {string} text - Text to encode
     * @returns {string}
     */
    encodeBase64(text) {
        this.validateString(text, 'Text');
        return Buffer.from(text).toString('base64');
    }

    /**
     * Decode from Base64
     * @param {string} encoded - Base64 encoded string
     * @returns {string}
     */
    decodeBase64(encoded) {
        this.validateString(encoded, 'Encoded');
        return Buffer.from(encoded, 'base64').toString('utf8');
    }

    /**
     * Encode to Base64URL (URL-safe)
     * @param {string} text - Text to encode
     * @returns {string}
     */
    encodeBase64URL(text) {
        this.validateString(text, 'Text');
        return Buffer.from(text).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * Decode from Base64URL
     * @param {string} encoded - Base64URL encoded string
     * @returns {string}
     */
    decodeBase64URL(encoded) {
        this.validateString(encoded, 'Encoded');
        
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        
        return Buffer.from(base64, 'base64').toString('utf8');
    }

    /**
     * Encode object to JWT-like string
     * @param {object} payload - Data to encode
     * @param {string} secret - Secret key
     * @param {number} expiresIn - Expiration in seconds
     * @returns {string}
     */
    encodeJWT(payload, secret, expiresIn = 3600) {
        const header = { alg: 'HS256', typ: 'JWT' };
        
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + expiresIn
        };
        
        const encodedHeader = this.encodeBase64URL(JSON.stringify(header));
        const encodedPayload = this.encodeBase64URL(JSON.stringify(tokenPayload));
        
        const signature = this.createHMAC(
            `${encodedHeader}.${encodedPayload}`,
            secret,
            'sha256'
        );
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * Decode JWT-like token
     * @param {string} token - JWT token
     * @param {string} secret - Secret key
     * @returns {object|null}
     */
    decodeJWT(token, secret) {
        try {
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                return null;
            }
            
            const [encodedHeader, encodedPayload, signature] = parts;
            
            // Verify signature
            const expectedSignature = this.createHMAC(
                `${encodedHeader}.${encodedPayload}`,
                secret,
                'sha256'
            );
            
            if (!crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            )) {
                return null;
            }
            
            const payload = JSON.parse(this.decodeBase64URL(encodedPayload));
            
            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                return { valid: false, error: 'Token expired', payload };
            }
            
            return { valid: true, payload };
            
        } catch (error) {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔒 Password Strength
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {object} Strength analysis
     */
    checkPasswordStrength(password) {
        this.validateString(password, 'Password');
        
        const result = {
            score: 0,
            strength: 'very_weak',
            suggestions: [],
            isValid: false
        };
        
        // Length checks
        if (password.length >= CONFIG.PASSWORD_MIN_LENGTH) {
            result.score += 20;
        } else {
            result.suggestions.push(`حداقل ${CONFIG.PASSWORD_MIN_LENGTH} کاراکتر`);
        }
        
        if (password.length >= 12) result.score += 10;
        if (password.length >= 16) result.score += 10;
        
        // Character variety
        if (/[a-z]/.test(password)) result.score += 10;
        if (/[A-Z]/.test(password)) result.score += 10;
        if (/[0-9]/.test(password)) result.score += 10;
        if (/[^a-zA-Z0-9]/.test(password)) result.score += 20;
        
        // Common patterns check
        const commonPatterns = [
            /^[a-z]+$/i,           // Only letters
            /^[0-9]+$/,            // Only numbers
            /(.)\1{2,}/,           // Repeated characters
            /^(password|123456|qwerty)/i  // Common passwords
        ];
        
        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                result.score = Math.max(0, result.score - 20);
                result.suggestions.push('از الگوهای رایج استفاده نکنید');
                break;
            }
        }
        
        // Determine strength
        if (result.score >= 80) result.strength = 'very_strong';
        else if (result.score >= 60) result.strength = 'strong';
        else if (result.score >= 40) result.strength = 'medium';
        else if (result.score >= 20) result.strength = 'weak';
        
        // Valid if meets minimum requirements
        result.isValid = 
            password.length >= CONFIG.PASSWORD_MIN_LENGTH &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password);
        
        return result;
    }

    /**
     * Generate secure password
     * @param {number} length - Password length
     * @returns {string}
     */
    generateSecurePassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        
        // Ensure at least one of each type
        let password = '';
        password += lowercase[crypto.randomInt(lowercase.length)];
        password += uppercase[crypto.randomInt(uppercase.length)];
        password += numbers[crypto.randomInt(numbers.length)];
        password += symbols[crypto.randomInt(symbols.length)];
        
        // Fill rest randomly
        for (let i = password.length; i < length; i++) {
            password += allChars[crypto.randomInt(allChars.length)];
        }
        
        // Shuffle
        return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎭 Data Masking
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Mask email address
     * @param {string} email - Email to mask
     * @returns {string}
     */
    maskEmail(email) {
        const [username, domain] = email.split('@');
        
        if (!username || !domain) {
            return email;
        }
        
        const visibleChars = Math.min(3, Math.floor(username.length / 2));
        const masked = username.slice(0, visibleChars) + '*'.repeat(username.length - visibleChars);
        
        return `${masked}@${domain}`;
    }

    /**
     * Mask phone number
     * @param {string} phone - Phone to mask
     * @returns {string}
     */
    maskPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length < 4) {
            return '*'.repeat(phone.length);
        }
        
        const visible = cleaned.slice(-4);
        const masked = '*'.repeat(cleaned.length - 4) + visible;
        
        // Add formatting back
        if (phone.includes('+')) {
            return '+' + masked;
        }
        
        return masked;
    }

    /**
     * Mask credit card number
     * @param {string} cardNumber - Card number
     * @returns {string}
     */
    maskCreditCard(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length < 13) {
            return '*'.repeat(cardNumber.length);
        }
        
        const first4 = cleaned.slice(0, 4);
        const last4 = cleaned.slice(-4);
        const masked = first4 + '*'.repeat(cleaned.length - 8) + last4;
        
        // Add spaces every 4 digits
        return masked.match(/.{1,4}/g).join(' ');
    }

    // ═══════════════════════════════════════════════════════════════
    // ⏱️ Time-Safe Comparison
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Compare strings in constant time (prevent timing attacks)
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {boolean}
     */
    timingSafeCompare(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }
        
        try {
            return crypto.timingSafeEqual(
                Buffer.from(a),
                Buffer.from(b)
            );
        } catch (e) {
            return a === b;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔢 Validation Helpers
    // ═══════════════════════════════════════════════════════════════
    
    validateString(value, name = 'Value') {
        if (typeof value !== 'string' || value.length === 0) {
            throw new Error(`${name} must be a non-empty string`);
        }
    }

    validateNumber(value, name = 'Value') {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`${name} must be a valid number`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📤 Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════

const cryptoUtils = new CryptoUtils();

module.exports = {
    // Main instance
    crypto: cryptoUtils,
    
    // Individual exports for convenience
    hashPassword: (p) => cryptoUtils.hashPassword(p),
    comparePassword: (p, h) => cryptoUtils.comparePassword(p, h),
    generateOTP: (l) => cryptoUtils.generateOTP(l),
    generateUUID: () => cryptoUtils.generateUUID(),
    encrypt: (t, k) => cryptoUtils.encrypt(t, k),
    decrypt: (t, k) => cryptoUtils.decrypt(t, k),
    encryptGCM: (t, k) => cryptoUtils.encryptGCM(t, k),
    decryptGCM: (t, k) => cryptoUtils.decryptGCM(t, k),
    hashSHA256: (t) => cryptoUtils.hashSHA256(t),
    hashSHA512: (t) => cryptoUtils.hashSHA512(t),
    createHMAC: (t, s, a) => cryptoUtils.createHMAC(t, s, a),
    verifyHMAC: (t, sig, s, a) => cryptoUtils.verifyHMAC(t, sig, s, a),
    generateTokenPair: () => cryptoUtils.generateTokenPair(),
    generateAPIKey: (p) => cryptoUtils.generateAPIKey(p),
    checkPasswordStrength: (p) => cryptoUtils.checkPasswordStrength(p),
    generateSecurePassword: (l) => cryptoUtils.generateSecurePassword(l),
    maskEmail: (e) => cryptoUtils.maskEmail(e),
    maskPhone: (p) => cryptoUtils.maskPhone(p),
    maskCreditCard: (c) => cryptoUtils.maskCreditCard(c),
    timingSafeCompare: (a, b) => cryptoUtils.timingSafeCompare(a, b),
    encodeJWT: (p, s, e) => cryptoUtils.encodeJWT(p, s, e),
    decodeJWT: (t, s) => cryptoUtils.decodeJWT(t, s),
    encodeBase64: (t) => cryptoUtils.encodeBase64(t),
    decodeBase64: (e) => cryptoUtils.decodeBase64(e),
    encodeBase64URL: (t) => cryptoUtils.encodeBase64URL(t),
    decodeBase64URL: (e) => cryptoUtils.decodeBase64URL(e),
    deriveKeyPBKDF2: (p, s) => cryptoUtils.deriveKeyPBKDF2(p, s),
    deriveKeyScrypt: (p, s) => cryptoUtils.deriveKeyScrypt(p, s),
    
    // Export class for extension
    CryptoUtils
};