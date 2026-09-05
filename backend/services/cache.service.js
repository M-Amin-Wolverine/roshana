// 📦 فایل: cache.service.js - پیاده‌سازی حافظه داخلی
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    
    console.log('✅ Memory Cache Service Started (No Redis)');
  }
  
  async set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
    return true;
  }
  
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async del(key) {
    return this.store.delete(key);
  }
  
  async incr(key) {
    let value = await this.get(key);
    value = (typeof value === 'number') ? value + 1 : 1;
    await this.set(key, value, 60);
    return value;
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
  
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
  
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 📦 فایل: otp.service.js
class OTPService {
  constructor(cache) {
    this.cache = cache;
    this.config = {
      ttl: 300,
      maxAttempts: 3,
      resendCooldown: 60
    };
  }
  
  async generateAndSendOTP(phone, type = 'login') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.cache.set(`otp:${phone}:${type}`, {
      code,
      attempts: 0,
      createdAt: Date.now(),
      type
    }, this.config.ttl);
    
    // لاگ زیبا برای دیباگ
    console.log(`
╔════════════════════════════════════════╗
║ 📱 OTP Generated                       ║
╠════════════════════════════════════════╣
║ Phone: ${phone}                         ║
║ Code: ${code}                           ║
║ Type: ${type}                           ║
║ Valid: ${this.config.ttl}s              ║
╚════════════════════════════════════════╝
    `);
    
    return { code, expiresIn: this.config.ttl };
  }
  
  async verifyOTP(phone, code, type = 'login') {
    const key = `otp:${phone}:${type}`;
    const data = await this.cache.get(key);
    
    if (!data) {
      return { valid: false, reason: 'expired' };
    }
    
    if (data.attempts >= this.config.maxAttempts) {
      await this.cache.del(key);
      return { valid: false, reason: 'max_attempts' };
    }
    
    if (data.code === code) {
      await this.cache.del(key);
      return { valid: true };
    }
    
    data.attempts++;
    await this.cache.set(key, data, this.config.ttl);
    
    return { 
      valid: false, 
      reason: 'invalid',
      remainingAttempts: this.config.maxAttempts - data.attempts
    };
  }
  
  async checkCooldown(phone) {
    const lastSent = await this.cache.get(`cooldown:${phone}`);
    if (lastSent) {
      const remaining = Math.ceil((this.config.resendCooldown - (Date.now() - lastSent) / 1000));
      if (remaining > 0) {
        return { allowed: false, remaining };
      }
    }
    return { allowed: true, remaining: 0 };
  }
  
  async setCooldown(phone) {
    await this.cache.set(`cooldown:${phone}`, Date.now(), this.config.resendCooldown);
  }
}

// 📦 فایل: rate-limiter.middleware.js
class RateLimiter {
  constructor(cache) {
    this.cache = cache;
    this.maxRequests = 5;
    this.windowMs = 60000;
  }
  
  async check(identifier) {
    const key = `rate:${identifier}`;
    const current = await this.cache.get(key) || { count: 0, resetTime: Date.now() + this.windowMs };
    
    if (Date.now() > current.resetTime) {
      current.count = 1;
      current.resetTime = Date.now() + this.windowMs;
    } else {
      current.count++;
    }
    
    await this.cache.set(key, current, this.windowMs / 1000);
    
    return {
      allowed: current.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - current.count),
      resetTime: current.resetTime
    };
  }
  
  middleware() {
    return async (req, res, next) => {
      const identifier = req.ip || req.connection.remoteAddress;
      const result = await this.check(identifier);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.'
        });
      }
      
      next();
    };
  }
}

// 📦 فایل: server.js - کد نهایی
const express = require('express');
const app = express();

app.use(express.json());

// راه‌اندازی سرویس‌ها (کاملاً بدون Redis)
const cache = new MemoryCache();
const otpService = new OTPService(cache);
const rateLimiter = new RateLimiter(cache);

// Middlewareها
const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  if (!/^09[0-9]{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }
  next();
};

// Blacklist middleware
const checkBlacklist = async (req, res, next) => {
  const ip = req.ip;
  const isBlocked = await cache.get(`blacklist:${ip}`);
  if (isBlocked) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

// 🚀 Route ارسال OTP
app.post('/send-otp', 
  checkBlacklist,
  rateLimiter.middleware(),
  validatePhone,
  async (req, res) => {
    const { phone, type = 'login' } = req.body;
    
    try {
      // Check cooldown
      const cooldown = await otpService.checkCooldown(phone);
      if (!cooldown.allowed) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${cooldown.remaining} seconds before requesting again`
        });
      }
      
      // Send OTP
      const result = await otpService.generateAndSendOTP(phone, type);
      
      // Set cooldown
      await otpService.setCooldown(phone);
      
      // Response
      res.json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: result.expiresIn,
        ...(process.env.NODE_ENV === 'development' && { code: result.code })
      });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// ✅ Route تأیید OTP
app.post('/verify-otp',
  rateLimiter.middleware(),
  async (req, res) => {
    const { phone, code, type = 'login' } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone and code are required'
      });
    }
    
    const result = await otpService.verifyOTP(phone, code, type);
    
    if (result.valid) {
      // Generate session token
      const token = require('crypto').randomBytes(32).toString('hex');
      
      res.json({
        success: true,
        message: 'OTP verified successfully',
        token: token
      });
    } else {
      const messages = {
        expired: 'OTP has expired',
        max_attempts: 'Maximum attempts exceeded',
        invalid: 'Invalid OTP code'
      };
      
      res.status(400).json({
        success: false,
        message: messages[result.reason] || 'Verification failed',
        remainingAttempts: result.remainingAttempts
      });
    }
  }
);

// 📊 Stats endpoint (برای مونیتورینگ)
app.get('/stats', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    res.json({
      cacheSize: cache.store.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║ 🚀 OTP SERVICE STARTED                     ║
╠════════════════════════════════════════════╣
║ Port: ${PORT}                               ║
║ Cache: In-Memory (No Redis)               ║
║ Status: Ready                              ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  cache.shutdown();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;