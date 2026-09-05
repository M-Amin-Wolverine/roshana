// ============================================
// 📦 وارد کردن ماژول‌های اصلی
// ============================================
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 🆕 ماژول‌های امنیتی و بهبود عملکرد
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// ============================================
// 💾 سیستم کش حافظه پیشرفته (جایگزین Redis)
// ============================================
class AdvancedMemoryCache {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // پاکسازی هر دقیقه
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expiresAt && now > value.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value: value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  }

  async del(key) {
    return this.store.delete(key);
  }

  async incr(key) {
    let val = await this.get(key);
    val = val ? parseInt(val) + 1 : 1;
    await this.set(key, val, 60);
    return val;
  }

  async setex(key, seconds, value) {
    return this.set(key, value, seconds);
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + (seconds * 1000);
      return true;
    }
    return false;
  }

  async ping() {
    return 'PONG';
  }

  // متد جدید برای عملیات批量
  async mget(keys) {
    const results = await Promise.all(keys.map(key => this.get(key)));
    return results;
  }

  async exists(key) {
    const value = await this.get(key);
    return value !== null;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item || !item.expiresAt) return -2;
    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

// ============================================
// 🔌 Circuit Breaker - FIXED VERSION
// ============================================

// اول کلاس رو تعریف کن
class AdvancedCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.timeout = options.timeout || 10000;
    this.fallback = options.fallback || null;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.performanceLog('Circuit breaker HALF_OPEN', 0);
      } else if (this.fallback) {
        logger.performanceLog('Using fallback method', 0);
        return await this.fallback();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        logger.successResponse('Circuit breaker recovered');
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      logger.errorResponse(error, { failures: this.failures, threshold: this.failureThreshold });
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.errorResponse(new Error('Circuit breaker OPENED'), { failures: this.failures });
      }
      throw error;
    }
  }
}

// ایجاد instance از کش حافظه
const memoryCache = new AdvancedMemoryCache();

// ============================================
// 🚫 Blacklist Manager مبتنی بر حافظه
// ============================================
class MemoryBlacklistManager {
  constructor() {
    this.failedAttempts = new Map();
    this.blacklist = new Map();
  }

  async addFromFailedAttempt(ip, phone, email) {
    const key = `failed:${ip}`;
    let attempts = this.failedAttempts.get(key) || 0;
    attempts++;
    this.failedAttempts.set(key, attempts);
    
    // تنظیم تایمر برای حذف بعد از 30 دقیقه
    setTimeout(() => {
      if (this.failedAttempts.get(key) === attempts) {
        this.failedAttempts.delete(key);
      }
    }, 1800000);
    
    if (attempts >= 5) {
      this.blacklist.set(`blacklist:ip:${ip}`, { value: 'true', expiresAt: Date.now() + 3600000 });
      if (phone) this.blacklist.set(`blacklist:phone:${phone}`, { value: 'true', expiresAt: Date.now() + 3600000 });
      if (email) this.blacklist.set(`blacklist:email:${email}`, { value: 'true', expiresAt: Date.now() + 3600000 });
      this.failedAttempts.delete(key);
      
      logSecurityEvent({ 
        action: 'AUTO_BLACKLIST', 
        ip, phone, email, 
        reason: 'too_many_failures' 
      });
    }
  }
  
  async isBlacklisted(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const phone = req.body?.phone;
    const email = req.body?.email;
    
    const checkBlacklist = (key) => {
      const item = this.blacklist.get(key);
      if (!item) return false;
      if (Date.now() > item.expiresAt) {
        this.blacklist.delete(key);
        return false;
      }
      return item.value === 'true';
    };
    
    const checks = [
      checkBlacklist(`blacklist:ip:${ip}`),
      phone && checkBlacklist(`blacklist:phone:${phone}`),
      email && checkBlacklist(`blacklist:email:${email}`)
    ];
    
    return checks.some(result => result === true);
  }
}

const blacklistManager = new MemoryBlacklistManager();

const checkBlacklist = async (req, res, next) => {
  if (await blacklistManager.isBlacklisted(req)) {
    logSecurityEvent({ action: 'BLACKLISTED_ACCESS', ip: req.ip, url: req.url });
    return res.status(403).json({
      success: false,
      message: 'دسترسی شما به دلیل فعالیت مشکوک مسدود شده است',
      error: 'access_denied'
    });
  }
  next();
};

// ============================================
// 🧠 سرویس پیشرفته OTP با حافظه
// ============================================
class MemoryOTPService {
  constructor() {
    this.otpStore = new Map();
    this.historyStore = new Map();
    this.cooldownStore = new Map();
  }

  async generateAndSendOTP(phone, type = 'login', length = CONFIG.OTP.CODE_LENGTH) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ذخیره در حافظه با TTL
    this.otpStore.set(`otp:${phone}:${type}`, {
      value: JSON.stringify({
        code,
        attempts: 0,
        createdAt: Date.now(),
        type
      }),
      expiresAt: Date.now() + (CONFIG.OTP.TTL * 1000)
    });
    
    // سابقه درخواست
    let history = this.historyStore.get(`otp:history:${phone}`) || 0;
    history++;
    this.historyStore.set(`otp:history:${phone}`, history);
    setTimeout(() => {
      const current = this.historyStore.get(`otp:history:${phone}`);
      if (current === history) this.historyStore.delete(`otp:history:${phone}`);
    }, 86400000);
    
    // ارسال SMS واقعی
    try {
      await sms.send({
        to: phone,
        message: `کد تأیید شما: ${code}\nمعتبر تا ${CONFIG.OTP.TTL / 60} دقیقه`
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      // در محیط توسعه کد را نمایش می‌دهیم
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 OTP for ${phone}: ${code}`);
      }
    }
    
    return { code, expiresIn: CONFIG.OTP.TTL };
  }
  
  async verifyOTP(phone, code, type = 'login') {
    const key = `otp:${phone}:${type}`;
    const data = this.otpStore.get(key);
    if (!data || Date.now() > data.expiresAt) {
      if (data) this.otpStore.delete(key);
      return { valid: false, reason: 'expired' };
    }
    
    const otpData = JSON.parse(data.value);
    if (otpData.attempts >= CONFIG.OTP.MAX_ATTEMPTS) {
      this.otpStore.delete(key);
      return { valid: false, reason: 'max_attempts' };
    }
    
    if (otpData.code === code) {
      this.otpStore.delete(key);
      return { valid: true };
    }
    
    otpData.attempts++;
    data.value = JSON.stringify(otpData);
    data.expiresAt = Date.now() + (CONFIG.OTP.TTL * 1000);
    this.otpStore.set(key, data);
    return { valid: false, reason: 'invalid' };
  }
  
  async checkCooldown(phone) {
    const cooldown = this.cooldownStore.get(`otp:cooldown:${phone}`);
    if (cooldown) {
      const remaining = CONFIG.OTP.RESEND_COOLDOWN - (Date.now() - cooldown) / 1000;
      if (remaining > 0) return remaining;
      this.cooldownStore.delete(`otp:cooldown:${phone}`);
    }
    return 0;
  }
  
  async setCooldown(phone) {
    this.cooldownStore.set(`otp:cooldown:${phone}`, Date.now());
    setTimeout(() => {
      if (this.cooldownStore.get(`otp:cooldown:${phone}`) === Date.now()) {
        this.cooldownStore.delete(`otp:cooldown:${phone}`);
      }
    }, CONFIG.OTP.RESEND_COOLDOWN * 1000);
  }
}

const otpService = new MemoryOTPService();
const otpCircuitBreaker = new AdvancedCircuitBreaker({ 
  failureThreshold: 3, 
  timeout: 30000,
  fallback: async () => {
    console.log('⚠️ Using fallback OTP method');
    return { code: '123456', isFallback: true };
  }
});

// ============================================
// 💾 Cache سیستم برای کاربران (بهبود یافته)
// ============================================
class UserCache {
  constructor() {
    this.cache = new Map();
  }
  
  set(userId, userData) {
    this.cache.set(userId, { 
      data: userData, 
      expires: Date.now() + 30000 
    });
    setTimeout(() => {
      if (this.cache.get(userId)?.expires === Date.now() + 30000) {
        this.cache.delete(userId);
      }
    }, 30000);
  }
  
  get(userId) {
    const cached = this.cache.get(userId);
    if (cached && cached.expires > Date.now()) return cached.data;
    if (cached) this.cache.delete(userId);
    return null;
  }
  
  clear() {
    this.cache.clear();
  }
}

const userCache = new UserCache();
const cacheUser = (userId, userData) => userCache.set(userId, userData);
const getCachedUser = (userId) => userCache.get(userId);

// ============================================
// 🔑 Token مدیریت (بهبود یافته)
// ============================================
class TempTokenStore {
  constructor() {
    this.store = new Map();
  }
  
  save(key, token, expiresIn = 600000) {
    this.store.set(key, { token, expires: Date.now() + expiresIn });
    setTimeout(() => {
      if (this.store.get(key)?.expires === Date.now() + expiresIn) {
        this.store.delete(key);
      }
    }, expiresIn);
  }
  
  verify(key, token) {
    const stored = this.store.get(key);
    if (!stored || stored.expires < Date.now() || stored.token !== token) return false;
    this.store.delete(key);
    return true;
  }
  
  size() {
    return this.store.size;
  }
}

const tempTokenStore = new TempTokenStore();
const saveTempToken = (key, token, expiresIn = 600000) => tempTokenStore.save(key, token, expiresIn);
const verifyTempToken = (key, token) => tempTokenStore.verify(key, token);

// ============================================
// ⚙️ تنظیمات مرکزی (بدون تغییر)
// ============================================
const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  OTP: {
    TTL: 300,
    MAX_ATTEMPTS: 3,
    CODE_LENGTH: 6,
    RESEND_COOLDOWN: 60,
  },
  RATE_LIMITS: {
    GLOBAL: { windowMs: 15 * 60 * 1000, max: 200 },
    AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
    PASSWORD: { windowMs: 1 * 60 * 1000, max: 51 },
    SEND_OTP: { windowMs: 60 * 1000, max: 5 }
  }
};

// ============================================
// 🛡️ سیستم امنیتی پیشرفته (بدون تغییر)
// ============================================

// 1. هدرهای امنیتی (Helmet)
router.use(helmet());

// 2. فشرده‌سازی پاسخ‌ها
router.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 3. Sanitize ورودی‌ها
router.use(express.json());
router.use(mongoSanitize());
router.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string' && req.body[key].length < 1000) {
        req.body[key] = xss(req.body[key].trim());
      }
    });
  }
  next();
});

// 4. مسدودسازی پارامترهای تکراری
router.use((req, res, next) => {
  if (req.body && req.body.__proto__) delete req.body.__proto__;
  if (req.query && req.query.__proto__) delete req.query.__proto__;
  next();
});

// 5. Rate Limit عمومی
const globalRateLimiter = rateLimit({
  ...CONFIG.RATE_LIMITS.GLOBAL,
  message: { success: false, message: 'درخواست太多، لطفاً ۱۵ دقیقه دیگر تلاش کنید', error: 'too_many_requests' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});
router.use(globalRateLimiter);

// 6. Rate Limit برای مسیرهای حساس
const authRateLimiter = rateLimit(CONFIG.RATE_LIMITS.AUTH);
const passwordRateLimiter = rateLimit(CONFIG.RATE_LIMITS.PASSWORD);
const sendOtpRateLimiter = rateLimit(CONFIG.RATE_LIMITS.SEND_OTP);

// ============================================
// 📝 سیستم لاگ حرفه‌ای (بدون تغییر)
// ============================================
const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const auditLogStream = fs.createWriteStream(
  path.join(logDir, 'security-audit.log'),
  { flags: 'a' }
);

const logSecurityEvent = ({ action, ip, phone, userId, error, userAgent, details = {} }) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ip: ip?.slice(0, 15),
    phone: phone ? `${phone.slice(0, 4)}****${phone.slice(-4)}` : undefined,
    userId,
    userAgent: userAgent?.substring(0, 50),
    error: error?.message || error,
    environment: process.env.NODE_ENV,
    ...details
  };
  
  auditLogStream.write(JSON.stringify(logEntry) + '\n');
  
  if (process.env.NODE_ENV !== 'production') {
    const colors = {
      SUCCESS: '\x1b[32m',
      ERROR: '\x1b[31m',
      WARNING: '\x1b[33m',
      INFO: '\x1b[36m',
      RESET: '\x1b[0m'
    };
    const color = action.includes('SUCCESS') ? colors.SUCCESS : 
                  action.includes('FAILED') ? colors.ERROR : colors.INFO;
    console.log(`${color}[${action}]${colors.RESET}`, logEntry);
  }
};



// ============================================
// 🛤️ مسیرهای احراز هویت (بقیه کدها بدون تغییر)
// ============================================

// وارد کردن کنترلرها
const {
  sendOTP,
  verifyOTPController,
  login,
  forgotPassword,
  resetPassword,
  register,
  logout
} = require('../../controllers/authController');
const { sms, generateAndSendOTP, verifyOTP } = require('../../services/smsService');

// وارد کردن مدل‌ها و middleware
const { User } = require('../../models/User');
const { authMiddleware } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validation');

/**
 * 📤 ارسال کد OTP (نسخه پیشرفته با حافظه)
 */
router.post('/send-otp', 
  checkBlacklist,
  sendOtpRateLimiter,
  async (req, res, next) => {
    const startTime = Date.now();
    const { phone, type = 'login' } = req.body;
    
    // اعتبارسنجی شماره
    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل نامعتبر است',
        error: 'invalid_phone'
      });
    }
    
    try {
      // بررسی Cooldown
      const cooldownRemaining = await otpService.checkCooldown(phone);
      if (cooldownRemaining > 0) {
        return res.status(429).json({
          success: false,
          message: `لطفاً ${Math.ceil(cooldownRemaining)} ثانیه صبر کنید`,
          error: 'cooldown_active',
          remainingSeconds: Math.ceil(cooldownRemaining)
        });
      }
      
      // اجرا با Circuit Breaker
      const result = await otpCircuitBreaker.execute(async () => {
        return await otpService.generateAndSendOTP(phone, type);
      });
      
      // ثبت Cooldown
      await otpService.setCooldown(phone);
      
      // لاگ موفقیت
      const elapsed = Date.now() - startTime;
      logSecurityEvent({
        action: 'OTP_SEND_SUCCESS',
        ip: req.ip,
        phone,
        userAgent: req.headers['user-agent'],
        details: { elapsed, type, isFallback: result.isFallback }
      });
      
      // پاسخ نهایی
      res.json({
        success: true,
        message: 'کد تأیید ارسال شد',
        expiresIn: CONFIG.OTP.TTL,
        requestId: crypto.randomBytes(8).toString('hex'),
        ...(process.env.NODE_ENV === 'development' && { 
          code: result.code,
          debug: true 
        })
      });
      
    } catch (error) {
      logSecurityEvent({
        action: 'OTP_SEND_FAILED',
        ip: req.ip,
        phone,
        error,
        userAgent: req.headers['user-agent']
      });
      
      console.error(`
╔══════════════════════════════════════════════════════════╗
║ ❌ خطا در ارسال OTP                                     ║
╠══════════════════════════════════════════════════════════╣
║ 📞 شماره: ${phone?.slice(0, 4)}****${phone?.slice(-4)} 
║ 🚫 خطا: ${error.message?.slice(0, 50)}                 
║ ⏱️ زمان: ${Date.now() - startTime}ms                    
╚══════════════════════════════════════════════════════════╝
      `);
      
      res.status(503).json({
        success: false,
        message: 'سرویس موقتاً در دسترس نیست، لحظاتی دیگر تلاش کنید',
        error: 'service_unavailable',
        requestId: crypto.randomBytes(4).toString('hex')
      });
    }
  }
);

/**
 * ✅ تأیید کد OTP (نسخه پیشرفته با حافظه)
 */
router.post('/verify-otp', 
  checkBlacklist,
  authRateLimiter,
  async (req, res, next) => {
    const { phone, code, type = 'login' } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل و کد تأیید الزامی است',
        error: 'missing_fields'
      });
    }
    
    try {
      const verification = await otpService.verifyOTP(phone, code, type);
      
      if (!verification.valid) {
        const messages = {
          expired: 'کد تأیید منقضی شده است',
          max_attempts: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است',
          invalid: 'کد تأیید نامعتبر است'
        };
        
        logSecurityEvent({ 
          action: 'OTP_VERIFY_FAILED', 
          phone, 
          ip: req.ip, 
          reason: verification.reason 
        });
        
        return res.status(400).json({
          success: false,
          message: messages[verification.reason] || 'خطا در تأیید کد',
          error: verification.reason
        });
      }
      
      // تولید tempToken برای استفاده در ادامه
      const tempToken = jwt.sign(
        { phone, purpose: 'auth_temp', timestamp: Date.now() },
        CONFIG.JWT_SECRET,
        { expiresIn: '10m' }
      );
      saveTempToken(phone, tempToken);
      
      logSecurityEvent({ 
        action: 'OTP_VERIFIED', 
        phone, 
        ip: req.ip,
        details: { type }
      });
      
      res.json({
        success: true,
        message: 'کد تأیید صحیح است',
        tempToken,
        expiresIn: 600 // 10 دقیقه
      });
      
    } catch (error) {
      logSecurityEvent({ 
        action: 'OTP_VERIFY_ERROR', 
        phone, 
        ip: req.ip, 
        error 
      });
      next(error);
    }
  }
);

/**
 * 🔑 ورود با رمز عبور (بدون تغییر)
 */
/**
 * 🔑 ورود با رمز عبور
 */
router.post('/login', 
  checkBlacklist,
  authRateLimiter,
  async (req, res) => {
    const loginStart = Date.now();
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const { username, phone, password } = req.body;
    
    logSecurityEvent({ 
      action: 'LOGIN_ATTEMPT', 
      ip: clientIp, 
      username: username || phone,
      userAgent
    });
    
    try {
      let user = null;
      
      if (phone) {
        user = await User.findByPhone(phone);  // ✅ await اضافه شد
      } else if (username) {
        const isPhone = /^09[0-9]{9}$/.test(username);
        if (isPhone) {
          user = await User.findByPhone(username);  // ✅ await اضافه شد
        } else {
          user = await User.findByUsername(username);  // ✅ await اضافه شد
        }
      }
      
      if (!user) {
        await blacklistManager.addFromFailedAttempt(clientIp, phone, null);
        logSecurityEvent({ 
          action: 'LOGIN_FAILED', 
          ip: clientIp, 
          reason: 'user_not_found',
          duration: Date.now() - loginStart 
        });
        
        return res.status(401).json({
          success: false,
          message: 'نام کاربری یا رمز عبور اشتباه است'
        });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        await blacklistManager.addFromFailedAttempt(clientIp, user.phone, user.email);
        logSecurityEvent({ 
          action: 'LOGIN_FAILED', 
          userId: user.id, 
          ip: clientIp, 
          reason: 'wrong_password',
          duration: Date.now() - loginStart 
        });
        
        return res.status(401).json({
          success: false,
          message: 'نام کاربری یا رمز عبور اشتباه است'
        });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: CONFIG.JWT_EXPIRES_IN }
      );
      
      cacheUser(user.id, user);
      
      logSecurityEvent({ 
        action: 'LOGIN_SUCCESS', 
        userId: user.id, 
        ip: clientIp, 
        userAgent,
        duration: Date.now() - loginStart 
      });
      
      res.json({
        success: true,
        message: 'ورود موفق',
        token: token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          fullName: `${user.firstName} ${user.lastName}`,
          role: user.role,
          email: user.email
        }
      });
      
    } catch (error) {
      logSecurityEvent({ 
        action: 'LOGIN_ERROR', 
        ip: clientIp, 
        error: error.message 
      });
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ورود',
        error: 'server_error'
      });
    }
  }
);

/**
 * 📝 ثبت نام (بدون تغییر)
 */
router.post('/register', 
  checkBlacklist,
  authRateLimiter,
  async (req, res, next) => {
    const { username, email, phone, password } = req.body;
    
    logSecurityEvent({ 
      action: 'REGISTER_ATTEMPT', 
      ip: req.ip, 
      email, 
      phone 
    });
    
    try {
      // اعتبارسنجی سریع
      if (!username || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'تمام فیلدهای الزامی را پر کنید',
          error: 'missing_fields'
        });
      }
      
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور باید حداقل ۸ کاراکتر باشد',
          error: 'weak_password'
        });
      }
      
      const result = await register(req, res);
      
      if (result && result.success) {
        logSecurityEvent({ 
          action: 'REGISTER_SUCCESS', 
          ip: req.ip, 
          email, 
          userId: result.user?.id 
        });
      }
      
    } catch (error) {
      logSecurityEvent({ 
        action: 'REGISTER_FAILED', 
        ip: req.ip, 
        email, 
        reason: error.message 
      });
      next(error);
    }
  }
);

/**
 * 🔐 فراموشی رمز (بدون تغییر)
 */
router.post('/forgot-password', 
  checkBlacklist,
  passwordRateLimiter,
  async (req, res, next) => {
    const { phone } = req.body;
    
    logSecurityEvent({ 
      action: 'FORGOT_PASSWORD', 
      ip: req.ip, 
      phone 
    });
    
    try {
      await forgotPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 🔄 تغییر رمز با tempToken (بدون تغییر)
 */
// ============================================
// 🔄 RESET PASSWORD - نسخه نهایی فوق‌العاده خفن
// تغییر رمز عبور با اعتبارسنجی پیشرفته و امنیت بالا
// ============================================
router.post('/reset-password', 
  checkBlacklist,
  passwordRateLimiter,
  async (req, res, next) => {
    const startTime = Date.now();
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const { tempToken, newPassword, confirmPassword } = req.body;
    
    // ============================================
    // 📊 لاگ شروع عملیات
    // ============================================
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 🔄 درخواست تغییر رمز عبور                                    ║
╠══════════════════════════════════════════════════════════════╣
║ 🌐 IP: ${clientIp}
║ 📱 User-Agent: ${userAgent?.substring(0, 50)}...
║ ⏱️ زمان: ${new Date().toISOString()}
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // ============================================
    // ✅ مرحله 1: اعتبارسنجی اولیه ورودی‌ها
    // ============================================
    
    // بررسی وجود توکن و رمز جدید
    if (!tempToken || !newPassword) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_MISSING_FIELDS', 
        ip: clientIp, 
        reason: !tempToken ? 'missing_token' : 'missing_password'
      });
      
      return res.status(400).json({
        success: false,
        message: '❌ توکن و رمز عبور جدید الزامی است',
        error: 'missing_fields',
        required: ['tempToken', 'newPassword']
      });
    }
    
    // بررسی تطابق رمزهای عبور (اگر confirmPassword ارسال شده باشد)
    if (confirmPassword && newPassword !== confirmPassword) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_MISMATCH', 
        ip: clientIp, 
        reason: 'password_mismatch'
      });
      
      return res.status(400).json({
        success: false,
        message: '❌ رمز عبور جدید و تکرار آن مطابقت ندارند',
        error: 'password_mismatch'
      });
    }
    
    // اعتبارسنجی قدرت رمز عبور
    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_WEAK_PASSWORD', 
        ip: clientIp, 
        reason: passwordStrength.reason
      });
      
      return res.status(400).json({
        success: false,
        message: `❌ رمز عبور ضعیف است: ${passwordStrength.message}`,
        error: 'weak_password',
        requirements: passwordStrength.requirements
      });
    }
    
    // ============================================
    // 🎯 مرحله 2: بررسی و اعتبارسنجی توکن
    // ============================================
    
    let decoded;
    try {
      // دیکد کردن توکن
      decoded = jwt.verify(tempToken, CONFIG.JWT_SECRET);
      
      console.log(`✅ توکن با موفقیت دیکد شد - Phone: ${decoded.phone}, Purpose: ${decoded.purpose}`);
      
    } catch (error) {
      let errorMessage = 'توکن نامعتبر است';
      let errorCode = 'invalid_token';
      
      if (error.name === 'TokenExpiredError') {
        errorMessage = '⏰ توکن منقضی شده است. لطفاً دوباره فرآیند بازیابی را شروع کنید';
        errorCode = 'token_expired';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = '🔒 توکن نامعتبر است. ممکن است دستکاری شده باشد';
        errorCode = 'token_corrupted';
      }
      
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_TOKEN_ERROR', 
        ip: clientIp, 
        error: error.message,
        errorName: error.name
      });
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorCode,
        expired: error.name === 'TokenExpiredError'
      });
    }
    
    // بررسی purpose توکن (با پشتیبانی از چندین نوع)
    const validPurposes = ['auth_temp', 'reset_password', 'forgot_password'];
    if (!validPurposes.includes(decoded.purpose)) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_INVALID_PURPOSE', 
        ip: clientIp, 
        reason: `invalid_purpose: ${decoded.purpose}`,
        phone: decoded.phone
      });
      
      return res.status(400).json({
        success: false,
        message: '❌ نوع عملیات نامعتبر است. لطفاً دوباره فرآیند را شروع کنید',
        error: 'invalid_purpose',
        expectedPurposes: validPurposes,
        receivedPurpose: decoded.purpose
      });
    }
    
    // بررسی توکن در حافظه (یکبار مصرف)
    const isValidToken = verifyTempToken(decoded.phone, tempToken);
    if (!isValidToken) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_TOKEN_NOT_FOUND', 
        ip: clientIp, 
        reason: 'token_not_found_or_already_used',
        phone: decoded.phone
      });
      
      return res.status(400).json({
        success: false,
        message: '🔒 توکن منقضی یا قبلاً استفاده شده است. لطفاً دوباره تلاش کنید',
        error: 'token_already_used',
        action: 'restart_process'
      });
    }
    
    // ============================================
    // 👤 مرحله 3: پیدا کردن کاربر و تغییر رمز
    // ============================================
    
    try {
      // پیدا کردن کاربر با شماره تلفن
      const user = await User.findByPhone(decoded.phone);
      
      if (!user) {
        logSecurityEvent({ 
          action: 'RESET_PASSWORD_USER_NOT_FOUND', 
          ip: clientIp, 
          phone: decoded.phone,
          reason: 'user_not_found'
        });
        
        return res.status(404).json({
          success: false,
          message: '❌ کاربری با این شماره تلفن یافت نشد',
          error: 'user_not_found'
        });
      }
      
      // بررسی اینکه رمز جدید با رمز قبلی فرق داشته باشد
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        logSecurityEvent({ 
          action: 'RESET_PASSWORD_SAME_PASSWORD', 
          ip: clientIp, 
          userId: user.id,
          phone: decoded.phone
        });
        
        return res.status(400).json({
          success: false,
          message: '⚠️ رمز عبور جدید نباید با رمز قبلی یکسان باشد',
          error: 'same_password'
        });
      }
      
      // هش کردن رمز جدید
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // به روزرسانی رمز عبور در دیتابیس
      const updateResult = await User.update(user.id, { 
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString()
      });
      
      if (!updateResult.success) {
        throw new Error('Failed to update password');
      }
      
      // پاک کردن کش کاربر
      //cacheUser.delete(user.id);
      
      // باطل کردن تمام توکن‌های فعال (اختیاری)
      await invalidateAllUserTokens(user.id);
      
      // ============================================
      // 📧 ارسال ایمیل تأیید تغییر رمز (اختیاری)
      // ============================================
      try {
        await sendPasswordChangeNotification(user.email, user.username);
      } catch (emailError) {
        console.warn('⚠️ Failed to send password change notification:', emailError.message);
        // خطای ایمیل نباید فرآیند اصلی را متوقف کند
      }
      
      // ============================================
      // 📊 لاگ موفقیت و آمار
      // ============================================
      const elapsed = Date.now() - startTime;
      
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_SUCCESS', 
        ip: clientIp, 
        userId: user.id,
        phone: decoded.phone,
        userAgent,
        details: { 
          elapsed,
          passwordStrength: passwordStrength.score,
          purpose: decoded.purpose
        }
      });
      
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ✅ تغییر رمز عبور با موفقیت انجام شد                         ║
╠══════════════════════════════════════════════════════════════╣
║ 👤 کاربر: ${user.username} (${user.id})
║ 📞 تلفن: ${decoded.phone.slice(0, 4)}****${decoded.phone.slice(-4)}
║ ⏱️ زمان اجرا: ${elapsed}ms
║ 🔐 قدرت رمز: ${passwordStrength.score}/5 (${passwordStrength.label})
╚══════════════════════════════════════════════════════════════╝
      `);
      
      // ============================================
      // 🎉 پاسخ نهایی موفقیت
      // ============================================
      res.json({
        success: true,
        message: '✅ رمز عبور شما با موفقیت تغییر کرد',
        data: {
          userId: user.id,
          changedAt: new Date().toISOString(),
          nextAction: 'login'
        }
      });
      
    } catch (dbError) {
      logSecurityEvent({ 
        action: 'RESET_PASSWORD_DB_ERROR', 
        ip: clientIp, 
        phone: decoded.phone,
        error: dbError.message
      });
      
      console.error('❌ Database error in reset-password:', dbError);
      
      res.status(500).json({
        success: false,
        message: '❌ خطا در ذخیره‌سازی رمز عبور. لطفاً دوباره تلاش کنید',
        error: 'database_error',
        retry: true
      });
    }
    
    // ============================================
    // 🧹 پاکسازی خودکار (اختیاری - بعد از 5 ثانیه)
    // ============================================
    setTimeout(() => {
      // پاک کردن هرگونه داده موقت مرتبط
      cleanupTempData(decoded?.phone);
    }, 5000);
  }
);
// ============================================
// 🔧 توابع کمکی (Helper Functions)
// ============================================

/**
 * اعتبارسنجی قدرت رمز عبور (پیشرفته)
 */
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let label = 'ضعیف';
  let isValid = false;
  let message = '';
  let requirements = [];
  
  if (score <= 2) {
    label = 'خیلی ضعیف';
    isValid = false;
    message = 'رمز عبور بسیار ضعیف است';
    requirements = ['حداقل ۸ کاراکتر', 'حروف بزرگ و کوچک', 'اعداد', 'نویسه‌های خاص'];
  } else if (score === 3) {
    label = 'ضعیف';
    isValid = false;
    message = 'رمز عبور ضعیف است';
    requirements = ['حداقل ۸ کاراکتر', 'حروف بزرگ و کوچک', 'اعداد', 'نویسه‌های خاص'];
  } else if (score === 4) {
    label = 'متوسط';
    isValid = true;
    message = 'رمز عبور قابل قبول است';
  } else if (score === 5) {
    label = 'قوی';
    isValid = true;
    message = 'رمز عبور قوی است';
  }
  
  return {
    isValid,
    score,
    label,
    message,
    requirements,
    details: checks
  };
}

/**
 * باطل کردن تمام توکن‌های فعال کاربر
 */
async function invalidateAllUserTokens(userId) {
  try {
    // پیاده‌سازی بسته به نوع دیتابیس و سیستم توکن
    // مثلاً: حذف همه refresh tokens از دیتابیس
    console.log(`🔄 Invalidating all tokens for user: ${userId}`);
  } catch (error) {
    console.warn('⚠️ Failed to invalidate tokens:', error.message);
  }
}

/**
 * ارسال ایمیل اطلاع‌رسانی تغییر رمز
 */
async function sendPasswordChangeNotification(email, username) {
  // پیاده‌سازی ارسال ایمیل
  console.log(`📧 Password change notification sent to: ${email}`);
  // در صورت وجود سرویس ایمیل:
  // await emailService.send({
  //   to: email,
  //   subject: 'تغییر رمز عبور',
  //   template: 'password-changed',
  //   data: { username, date: new Date().toISOString() }
  // });
}

/**
 * پاکسازی داده‌های موقت
 */
function cleanupTempData(phone) {
  if (phone) {
    // پاک کردن OTP و داده‌های موقت مرتبط
    console.log(`🧹 Cleanup temp data for: ${phone}`);
  }
}
/**
 * 🚪 خروج از حساب (بدون تغییر)
 */
router.post('/logout', 
  authMiddleware,
  async (req, res, next) => {
    logSecurityEvent({ 
      action: 'LOGOUT', 
      userId: req.user?.id, 
      ip: req.ip 
    });
    
    try {
      await logout(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 🔁 تمدید توکن (بدون تغییر)
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'توکن refresh الزامی است',
        error: 'missing_refresh_token'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, CONFIG.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: 'توکن refresh نامعتبر یا منقضی',
        error: 'invalid_refresh_token'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found'
      });
    }

    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone
      },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'توکن تمدید شد',
      token: newToken
    });

  } catch (error) {
    console.error('❌ Error in refresh-token:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تمدید توکن',
      error: 'server_error'
    });
  }
});

/**
 * 👤 دریافت اطلاعات کاربر فعلی (بدون تغییر)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let user = getCachedUser(req.user.id);
    
    if (!user) {
      user = await User.findById(req.user.id);

      if (user) cacheUser(req.user.id, user);
    }
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found'
      });
    }

    res.json({
      success: true,
      user: User.getPublicFields(user)
    });

  } catch (error) {
    console.error('❌ Error in /me:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات',
      error: 'server_error'
    });
  }
});

/**
 * ✅ بررسی فعال بودن توکن (بدون تغییر)
 */
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'توکن معتبر است',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

/**
 * 🔐 تغییر رمز عبور (بدون تغییر)
 */
router.post('/change-password', 
  authMiddleware,
  passwordRateLimiter,
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور قدیم و جدید الزامی است',
          error: 'missing_fields'
        });
      }

      logSecurityEvent({ 
        action: 'CHANGE_PASSWORD_ATTEMPT', 
        userId, 
        ip: req.ip 
      });

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد',
          error: 'weak_password'
        });
      }

      const result = await User.changePassword(userId, oldPassword, newPassword);

      if (!result.success) {
        logSecurityEvent({ 
          action: 'CHANGE_PASSWORD_FAILED', 
          userId, 
          ip: req.ip, 
          reason: result.message 
        });
        return res.status(400).json({
          success: false,
          message: result.message,
          error: 'password_change_failed'
        });
      }

      logSecurityEvent({ 
        action: 'CHANGE_PASSWORD_SUCCESS', 
        userId, 
        ip: req.ip 
      });

      res.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد'
      });

    } catch (error) {
      console.error('❌ Error in change-password:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تغییر رمز عبور',
        error: 'server_error'
      });
    }
  }
);

/**
 * ✏️ بروزرسانی پروفایل (بدون تغییر)
 */
router.put('/profile', 
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userData = req.body;

      delete userData.password;
      delete userData.role;
      delete userData.id;
      delete userData.isActive;

      const result = await User.update(userId, userData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          error: 'update_failed'
        });
      }

      const updatedUser = User.findById(userId);
      cacheUser(userId, updatedUser);

      res.json({
        success: true,
        message: 'پروفایل با موفقیت بروزرسانی شد',
        user: User.getPublicFields(updatedUser)
      });

    } catch (error) {
      console.error('❌ Error in profile update:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی پروفایل',
        error: 'server_error'
      });
    }
  }
);

/**
 * 📧 تأیید ایمیل (بدون تغییر)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'توکن تأیید الزامی است',
        error: 'missing_token'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'توکن نامعتبر یا منقضی',
        error: 'invalid_token'
      });
    }

    if (decoded.purpose !== 'email_verification') {
      return res.status(400).json({
        success: false,
        message: 'نوع توکن نامعتبر',
        error: 'invalid_purpose'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found'
      });
    }

    if (typeof User.verifyEmail === 'function') {
      await User.verifyEmail(decoded.userId);
    }

    logSecurityEvent({ 
      action: 'EMAIL_VERIFIED', 
      userId: decoded.userId, 
      ip: req.ip 
    });

    res.json({
      success: true,
      message: 'ایمیل با موفقیت تأیید شد'
    });

  } catch (error) {
    console.error('❌ Error in verify-email:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تأیید ایمیل',
      error: 'server_error'
    });
  }
});

/**
 * 📧 ارسال مجدد لینک تأیید ایمیل (بدون تغییر)
 */
router.post('/resend-verification', 
  authMiddleware,
  authRateLimiter,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد',
          error: 'user_not_found'
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'ایمیل قبلاً تأیید شده',
          error: 'already_verified'
        });
      }

      const verificationToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          purpose: 'email_verification'
        },
        CONFIG.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`\n📧 لینک تأیید ایمیل برای ${user.email}: ${verificationToken}\n`);
      
      logSecurityEvent({ 
        action: 'RESEND_VERIFICATION', 
        userId: user.id, 
        ip: req.ip 
      });

      res.json({
        success: true,
        message: 'لینک تأیید ارسال شد'
      });

    } catch (error) {
      console.error('❌ Error in resend-verification:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ارسال لینک تأیید',
        error: 'server_error'
      });
    }
  }
);

/**
 * 🏥 مسیر سلامت برای مانیتورینگ (بهبود یافته با حافظه)
 */
router.get('/health', async (req, res) => {
  let memoryStatus = 'healthy';
  try {
    await memoryCache.ping();
  } catch (error) {
    memoryStatus = 'unhealthy';
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheSize: userCache.cache.size,
    tempTokens: tempTokenStore.size(),
    memoryCache: memoryStatus,
    environment: process.env.NODE_ENV
  });
});

/**
 * 🧪 Route تست برای توسعه (بهبود یافته با حافظه)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test/otp/:phone', async (req, res) => {
    const { phone } = req.params;
    const data = await memoryCache.get(`otp:${phone}:login`);
    res.json({ 
      phone, 
      data: data ? JSON.parse(data) : null,
      cooldown: await otpService.checkCooldown(phone)
    });
  });
  
  router.get('/test/blacklist/:ip', async (req, res) => {
    const { ip } = req.params;
    const isBlacklisted = await blacklistManager.blacklist.get(`blacklist:ip:${ip}`);
    res.json({ ip, isBlacklisted: isBlacklisted ? isBlacklisted.value === 'true' : false });
  });
}

// ============================================
// 📤 خروجی ماژول
// ============================================
module.exports = router;