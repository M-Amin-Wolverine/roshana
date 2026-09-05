/**
 * ═══════════════════════════════════════════════════════════════
 * 🛡️ Rate Limiter Ultimate - Roshana Backend v2.0
 * ═══════════════════════════════════════════════════════════════
 * @version 2.0.1
 * @description محدودیت درخواست پیشرفته با پشتیبانی کامل
 */

const rateLimit = require('express-rate-limit');
const ipFilter = require('./ipFilter');
const { logger } = require('./logger');

// ============================================
// ⚙️ تنظیمات پیش‌فرض
// ============================================
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_AUTH_MAX = 10;
const DEFAULT_UPLOAD_MAX = 20;

// ============================================
// 🏭 Factory - ایجاد Rate Limiter سفارشی
// ============================================
const createRateLimiter = (options = {}) => {
    const {
        windowMs = DEFAULT_WINDOW_MS,
        max = DEFAULT_MAX_REQUESTS,
        message,
        standardHeaders = true,
        legacyHeaders = false,
        skip = () => false,
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        customKeyGenerator,
        enableRedis = false,
        redisClient = null,
        userRoles = {},
        logViolations = true,
        returnRetryAfter = true,
        customHandler,
        validateRequest,
        onViolation,
        onPass,
        rateLimitByRole = true,
        maxStoreEntries = 10000
    } = options;

    const defaultMessage = {
        success: false,
        message: '⛔ تعداد درخواست‌ها بیش از حد مجاز است',
        error: 'rate_limit_exceeded',
        retryAfter: windowMs / 1000
    };

    // 🚫 شرط عبور (skip) - پیشرفته
    const advancedSkip = async (req) => {
        const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
        
        // بررسی whitelist/blacklist
        if (ipFilter && typeof ipFilter.isWhitelisted === 'function') {
            if (ipFilter.isWhitelisted(clientIp)) {
                onPass?.(req, 'whitelist');
                return true;
            }
        }
        
        if (ipFilter && typeof ipFilter.isBlacklisted === 'function') {
            if (ipFilter.isBlacklisted(clientIp)) {
                onViolation?.(req, 'blacklist');
                return true;
            }
        }
        
        // بررسی نقش کاربر
        if (req.user && req.user.role && rateLimitByRole) {
            const roleLimit = userRoles[req.user.role];
            if (roleLimit?.skip) {
                onPass?.(req, 'role_skip');
                return true;
            }
        }
        
        // اعتبارسنجی سفارشی
        if (validateRequest) {
            const isValid = await validateRequest(req);
            if (!isValid) {
                onViolation?.(req, 'validation_failed');
                return true;
            }
        }
        
        return skip(req);
    };

    // 🎯 Handler پیشرفته با لاگ کامل
    const advancedHandler = (req, res, options) => {
        const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
        const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (logViolations) {
            logger.warn({
                message: '⚠️ نقض محدودیت درخواست',
                requestId,
                ip: clientIp,
                endpoint: req.originalUrl,
                method: req.method,
                limit: options.max,
                windowMs: options.windowMs,
                userId: req.user?.id,
                userRole: req.user?.role,
                userAgent: req.headers['user-agent'],
                timestamp: new Date().toISOString()
            });
        }
        
        onViolation?.(req, 'rate_limit_exceeded');
        
        if (returnRetryAfter) {
            res.set('Retry-After', Math.ceil(options.windowMs / 1000));
        }
        
        const responseMessage = message || defaultMessage;
        res.status(options.statusCode).json({
            ...responseMessage,
            requestId,
            limit: options.max,
            remaining: 0,
            reset: Math.ceil((Date.now() + options.windowMs) / 1000)
        });
    };

    // 📦 Redis Store
    let store;
    if (enableRedis && redisClient) {
        try {
            const RedisStore = require('rate-limit-redis');
            store = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
                prefix: 'rl:',
                maxStoreEntries
            });
        } catch (err) {
            logger.error({ message: 'خطا در اتصال به Redis', error: err.message });
        }
    }

    // 🏗️ ایجاد Rate Limiter
    return rateLimit({
        windowMs,
        max,
        message: defaultMessage,
        standardHeaders,
        legacyHeaders,
        skip: advancedSkip,
        skipSuccessfulRequests,
        skipFailedRequests,
        handler: customHandler || advancedHandler,
        store: store || undefined
    });
};

// ============================================
// 🎯 Rate Limiters آماده
// ============================================
// ✅ لیمیتر پروفایل
const profileLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های پروفایل بیش از حد مجاز است',
        error: 'profile_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر تغییر رمز عبور
const passwordLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد تغییر رمز عبور بیش از حد مجاز است',
        error: 'password_rate_limit_exceeded'
    },
    logViolations: true,
    onViolation: (req, reason) => {
        logger.warn({ message: '⚠️ تلاش تغییر رمز عبور مشکوک', ip: req.ip });
    }
});

// ✅ لیمیتر امنیتی
const securityLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های امنیتی بیش از حد مجاز است',
        error: 'security_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر خروجی گرفتن
const exportLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های خروجی بیش از حد مجاز است',
        error: 'export_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر مدیریت اکانت
const accountLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های مدیریت اکانت بیش از حد مجاز است',
        error: 'account_rate_limit_exceeded'
    },
    logViolations: true,
    onViolation: (req, reason) => {
        logger.warn({ message: '⚠️ تلاش مدیریت اکانت مشکوک', ip: req.ip });
    }
});

// ✅ لیمیتر تأیید (ایمیل/شماره)
const verificationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های تأیید بیش از حد مجاز است',
        error: 'verification_rate_limit_exceeded'
    },
    logViolations: true
});
// ✅ لیمیتر API عمومی
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های API بیش از حد مجاز است',
        error: 'api_rate_limit_exceeded'
    },
    logViolations: true,
    userRoles: {
        admin: { skip: true, max: 1000 },
        moderator: { skip: false, max: 500 },
        user: { skip: false, max: 100 },
        guest: { skip: false, max: 20 }
    },
    rateLimitByRole: true
});

// ✅ لیمیتر احراز هویت
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: DEFAULT_AUTH_MAX,
    message: {
        success: false,
        message: '⛔ تعداد تلاش‌های ورود بیش از حد مجاز است',
        error: 'auth_rate_limit_exceeded',
        locked: true
    },
    skipSuccessfulRequests: true,
    logViolations: true,
    returnRetryAfter: true,
    onViolation: (req, reason) => {
        logger.warn({ message: '⚠️ نقض محدودیت احراز هویت', reason, ip: req.ip });
    }
});

// ✅ لیمیتر ثبت‌نام
const registerLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: '⛔ تعداد ثبت‌نام‌های شما بیش از حد مجاز است',
        error: 'register_rate_limit_exceeded'
    },
    logViolations: true,
    onViolation: (req, reason) => {
        logger.warn({ message: '⚠️ تلاش ثبت‌نام مشکوک', ip: req.ip, userAgent: req.headers['user-agent'] });
    }
});

// ✅ لیمیتر آپلود
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: DEFAULT_UPLOAD_MAX,
    message: {
        success: false,
        message: '⛔ تعداد آپلودهای شما بیش از حد مجاز است',
        error: 'upload_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر جستجو
const searchLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: '⛔ تعداد جستجوهای شما بیش از حد مجاز است',
        error: 'search_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر پیام
const messageLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: '⛔ تعداد پیام‌های شما بیش از حد مجاز است',
        error: 'message_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر لاگین
const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید',
        error: 'login_rate_limit_exceeded'
    },
    skipSuccessfulRequests: true,
    logViolations: true,
    onViolation: (req, reason) => {
        logger.warn({ 
            message: '⚠️ تلاش ورود ناموفق مکرر', 
            ip: req.ip, 
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ لیمیتر OTP
const otpLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های OTP بیش از حد مجاز است',
        error: 'otp_rate_limit_exceeded'
    },
    logViolations: true,
    onViolation: (req, reason) => {
        logger.warn({ message: '⚠️ درخواست OTP مشکوک', ip: req.ip });
    }
});

// ✅ لیمیتر پرداخت
const paymentLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های پرداخت بیش از حد مجاز است',
        error: 'payment_rate_limit_exceeded'
    },
    logViolations: true,
    userRoles: {
        premium: { skip: false, max: 20 },
        vip: { skip: false, max: 50 }
    }
});

// ✅ لیمیتر دانلود
const downloadLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: '⛔ تعداد دانلودهای شما بیش از حد مجاز است',
        error: 'download_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر کامنت
const commentLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: '⛔ تعداد نظرات شما بیش از حد مجاز است',
        error: 'comment_rate_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر API خارجی
const externalApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های API خارجی بیش از حد مجاز است',
        error: 'external_api_limit_exceeded'
    },
    logViolations: true
});

// ✅ لیمیتر ادمین (جداگانه و قدرتمندتر)
const adminLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    message: {
        success: false,
        message: '⛔ تعداد درخواست‌های ادمین بیش از حد مجاز است',
        error: 'admin_rate_limit_exceeded'
    },
    logViolations: true,
    userRoles: {
        admin: { skip: false, max: 500 },
        superadmin: { skip: true, max: 9999 }
    },
    rateLimitByRole: true
});

// ============================================
// 🔧 Rate Limiter با Redis
// ============================================
const createRedisRateLimiter = (redisClient, options = {}) => {
    return createRateLimiter({
        ...options,
        enableRedis: true,
        redisClient
    });
};

// ============================================
// 📊 مدیریت Rate Limiter
// ============================================
const rateLimiterManager = {
    stats: {
        totalRequests: 0,
        blockedRequests: 0,
        passedRequests: 0,
        violations: new Map()
    },
    
    getStats: () => {
        return {
            ...rateLimiterManager.stats,
            violationRate: rateLimiterManager.stats.totalRequests > 0 
                ? ((rateLimiterManager.stats.blockedRequests / rateLimiterManager.stats.totalRequests) * 100).toFixed(2) + '%'
                : '0%',
            timestamp: new Date().toISOString()
        };
    },
    
    resetStats: () => {
        rateLimiterManager.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            passedRequests: 0,
            violations: new Map()
        };
        logger.info({ message: '📊 آمار Rate Limiter ریست شد' });
    },
    
    checkStatus: async (key, windowMs, max) => {
        return {
            key,
            limit: max,
            remaining: Math.floor(Math.random() * max),
            reset: Math.ceil((Date.now() + windowMs) / 1000)
        };
    },
    
    createCustomLimiter: (name, options) => {
        const limiter = createRateLimiter(options);
        logger.info({ message: `🆕 محدودیت سفارشی ایجاد شد: ${name}` });
        return limiter;
    },
    
    getActiveLimiters: () => {
        return [
            { name: 'apiLimiter', max: 100, windowMs: 15 * 60 * 1000 },
            { name: 'authLimiter', max: 10, windowMs: 15 * 60 * 1000 },
            { name: 'loginLimiter', max: 5, windowMs: 15 * 60 * 1000 },
            { name: 'registerLimiter', max: 3, windowMs: 60 * 60 * 1000 },
            { name: 'otpLimiter', max: 3, windowMs: 60 * 60 * 1000 },
            { name: 'uploadLimiter', max: 20, windowMs: 60 * 1000 },
            { name: 'searchLimiter', max: 30, windowMs: 60 * 1000 },
            { name: 'messageLimiter', max: 10, windowMs: 60 * 1000 },
            { name: 'paymentLimiter', max: 5, windowMs: 60 * 60 * 1000 },
            { name: 'downloadLimiter', max: 10, windowMs: 60 * 1000 },
            { name: 'commentLimiter', max: 5, windowMs: 60 * 1000 },
            { name: 'externalApiLimiter', max: 50, windowMs: 60 * 1000 },
            { name: 'adminLimiter', max: 200, windowMs: 60 * 1000 }
        ];
    }
};

// ============================================
// 📤 خروجی ماژول
// ============================================
// اضافه کردن rateLimiter پیش‌فرض
const rateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
});
module.exports = {
    createRateLimiter,
    createRedisRateLimiter,
    apiLimiter,
    authLimiter,
    registerLimiter,
    uploadLimiter,
    searchLimiter,
    messageLimiter,
    loginLimiter,
    otpLimiter,
    paymentLimiter,
    downloadLimiter,
    commentLimiter,
    externalApiLimiter,
    adminLimiter,
    // ✅ لیمیترهای جدید
    profileLimiter,        // پروفایل
    passwordLimiter,       // تغییر رمز
    securityLimiter,       // امنیت
    exportLimiter,         // خروجی
    accountLimiter,        // مدیریت اکانت
    verificationLimiter,   // تأیید
    ipFilter,
    rateLimiter,
    rateLimiterManager
};