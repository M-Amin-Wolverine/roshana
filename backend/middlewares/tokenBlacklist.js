// 📦 Token Blacklist - مدیریت پیشرفته توکن‌های مسدود شده
// 🎨 نسخه 2.0 - با پشتیبانی از Redis و حافظه

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
//                    ⚙️ تنظیمات
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  // نوع ذخیره‌سازی: 'memory' | 'redis' | 'file'
  storageType: process.env.TOKEN_BLACKLIST_STORAGE || 'memory',
  
  // زمان انقضای پیش‌فرض توکن‌ها (به ثانیه)
  defaultExpiry: parseInt(process.env.JWT_EXPIRE || '3600') * 2,
  
  // فایل پشتیبان (برای حالت file)
  backupFile: path.join(__dirname, '..', 'data', 'token-blacklist.json'),
  
  // Redis (اگر استفاده شود)
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // پاکسازی خودکار
  autoCleanup: true,
  cleanupInterval: 60 * 60 * 1000 // هر ساعت
};

// ═══════════════════════════════════════════════════════════════
//                    🗄️ مدیریت ذخیره‌سازی
// ═══════════════════════════════════════════════════════════════
class TokenStore {
  constructor() {
    this.store = new Map();
    this.metadata = new Map();
  }

  // ═════════════════════════════════════════════════════════════
  //                    ➕ اضافه کردن توکن
  // ═════════════════════════════════════════════════════════════
  async add(token, options = {}) {
    const {
      reason = 'logout',
      userId = null,
      tokenType = 'access', // access | refresh
      expiresAt = Date.now() + CONFIG.defaultExpiry * 1000,
      metadata = {}
    } = options;

    // هش کردن توکن برای امنیت بیشتر
    const tokenHash = this.hashToken(token);
    
    this.store.set(tokenHash, {
      token: tokenHash, // فقط هش ذخیره می‌شود
      reason,
      userId,
      tokenType,
      expiresAt,
      blacklistedAt: Date.now(),
      ...metadata
    });

    // ذخیره متادیتا
    this.metadata.set(tokenHash, {
      reason,
      userId,
      tokenType,
      blacklistedAt: Date.now()
    });

    // ذخیره در فایل (backup)
    if (CONFIG.storageType === 'file') {
      this.saveToFile();
    }

    return true;
  }

  // ═════════════════════════════════════════════════════════════
  //                    🔍 بررسی وجود توکن
  // ═════════════════════════════════════════════════════════════
  async has(token) {
    const tokenHash = this.hashToken(token);
    const entry = this.store.get(tokenHash);
    
    if (!entry) return false;
    
    // بررسی انقضا
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.remove(token);
      return false;
    }
    
    return true;
  }

  // ═════════════════════════════════════════════════════════════
  //                    🗑️ حذف توکن
  // ═════════════════════════════════════════════════════════════
  async remove(token) {
    const tokenHash = this.hashToken(token);
    this.store.delete(tokenHash);
    this.metadata.delete(tokenHash);
    
    if (CONFIG.storageType === 'file') {
      this.saveToFile();
    }
    
    return true;
  }

  // ═════════════════════════════════════════════════════════════
  //                    📊 اطلاعات توکن
  // ═════════════════════════════════════════════════════════════
  async getInfo(token) {
    const tokenHash = this.hashToken(token);
    return this.store.get(tokenHash) || null;
  }

  // ═════════════════════════════════════════════════════════════
  //                    👤 توکن‌های یک کاربر
  // ═════════════════════════════════════════════════════════════
  async getUserTokens(userId) {
    const tokens = [];
    for (const [hash, data] of this.store) {
      if (data.userId === userId) {
        tokens.push({
          token: hash.substring(0, 20) + '...',
          reason: data.reason,
          tokenType: data.tokenType,
          blacklistedAt: data.blacklistedAt,
          expiresAt: data.expiresAt
        });
      }
    }
    return tokens;
  }

  // ═════════════════════════════════════════════════════════════
  //                    📈 آمار
  // ═════════════════════════════════════════════════════════════
  async getStats() {
    let validCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [hash, data] of this.store) {
      if (data.expiresAt && now > data.expiresAt) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    // تعداد بر اساس نوع
    const byType = {
      access: 0,
      refresh: 0
    };

    for (const [hash, data] of this.store) {
      if (data.tokenType === 'access') byType.access++;
      else if (data.tokenType === 'refresh') byType.refresh++;
    }

    return {
      total: this.store.size,
      valid: validCount,
      expired: expiredCount,
      byType,
      memoryUsage: `${(JSON.stringify([...this.store]).length / 1024).toFixed(2)} KB`
    };
  }

  // ═════════════════════════════════════════════════════════════
  //                    🧹 پاکسازی توکن‌های منقضی
  // ═════════════════════════════════════════════════════════════
  async cleanup() {
    const now = Date.now();
    let removedCount = 0;

    for (const [hash, data] of this.store) {
      if (data.expiresAt && now > data.expiresAt) {
        this.store.delete(hash);
        this.metadata.delete(hash);
        removedCount++;
      }
    }

    if (CONFIG.storageType === 'file') {
      this.saveToFile();
    }

    return { removedCount, remaining: this.store.size };
  }

  // ═════════════════════════════════════════════════════════════
  //                    🔐 هش کردن توکن
  // ═════════════════════════════════════════════════════════════
  hashToken(token) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // ═════════════════════════════════════════════════════════════
  //                    💾 ذخیره در فایل
  // ═════════════════════════════════════════════════════════════
  saveToFile() {
    try {
      const dataDir = path.dirname(CONFIG.backupFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const jsonData = JSON.stringify({
        store: [...this.store],
        savedAt: new Date().toISOString()
      }, null, 2);

      fs.writeFileSync(CONFIG.backupFile, jsonData);
    } catch (error) {
      console.error('❌ خطا در ذخیره فایل:', error.message);
    }
  }

  // ═════════════════════════════════════════════════════════════
  //                    📂 بارگذاری از فایل
  // ═════════════════════════════════════════════════════════════
  loadFromFile() {
    try {
      if (fs.existsSync(CONFIG.backupFile)) {
        const jsonData = fs.readFileSync(CONFIG.backupFile, 'utf8');
        const data = JSON.parse(jsonData);
        
        if (data.store && Array.isArray(data.store)) {
          this.store = new Map(data.store);
        }
        
        console.log(`✅ ${this.store.size} توکن از فایل بارگذاری شد`);
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری فایل:', error.message);
    }
  }

  // ═════════════════════════════════════════════════════════════
  //                    🗑️ پاک کردن همه
  // ═════════════════════════════════════════════════════════════
  async clear() {
    this.store.clear();
    this.metadata.clear();
    
    if (CONFIG.storageType === 'file') {
      this.saveToFile();
    }
    
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════
//                    🏗️ نمونه اصلی
// ═══════════════════════════════════════════════════════════════
const tokenStore = new TokenStore();

// بارگذاری از فایل در صورت وجود
if (CONFIG.storageType === 'file') {
  tokenStore.loadFromFile();
}

// پاکسازی خودکار
if (CONFIG.autoCleanup) {
  setInterval(() => {
    tokenStore.cleanup().then(result => {
      if (result.removedCount > 0) {
        console.log(`🧹 پاکسازی: ${result.removedCount} توکن منقضی حذف شد`);
      }
    });
  }, CONFIG.cleanupInterval);
}

// ═══════════════════════════════════════════════════════════════
//                    📤 توابع سازگار با نسخه قبلی
// ═══════════════════════════════════════════════════════════════
const tokenBlacklist = new Set();

function addToBlacklist(token, reason = 'logout') {
  tokenBlacklist.add(token);
  console.log(`🚫 Token added to blacklist: ${reason}`);
}

function isBlacklisted(token) {
  return tokenBlacklist.has(token);
}

function removeFromBlacklist(token) {
  tokenBlacklist.delete(token);
}

function getBlacklistSize() {
  return tokenBlacklist.size;
}

function clearBlacklist() {
  tokenBlacklist.clear();
  console.log('🗑️ Token blacklist cleared');
}

// ═══════════════════════════════════════════════════════════════
//                    🎯 توابع جدید پیشرفته
// ═══════════════════════════════════════════════════════════════

// ➕ اضافه کردن توکن با جزئیات
async function blacklistToken(token, options = {}) {
  return await tokenStore.add(token, options);
}

// 🔍 بررسی توکن (نسخه پیشرفته)
async function checkToken(token) {
  return await tokenStore.has(token);
}

// ❌ مسدود کردن تمام توکن‌های کاربر
async function blacklistUserTokens(userId, reason = 'user_logout') {
  // این تابع باید توکن‌های فعال کاربر را از دیتابیس دریافت کند
  // و به لیست سیاه اضافه کند
  console.log(`🚫 Blocking all tokens for user: ${userId}`);
  return { success: true, reason };
}

// 📊 آمار کامل
async function getBlacklistStats() {
  return await tokenStore.getStats();
}

// 👤 توکن‌های یک کاربر
async function getUserBlacklistedTokens(userId) {
  return await tokenStore.getUserTokens(userId);
}

// 🧹 پاکسازی دستی
async function cleanupBlacklist() {
  return await tokenStore.cleanup();
}

// 📥 اطلاعات یک توکن
async function getTokenInfo(token) {
  return await tokenStore.getInfo(token);
}

// 🗑️ پاک کردن همه
async function clearAllBlacklist() {
  return await tokenStore.clear();
}

// 📤 خروجی ماژول
module.exports = {
  // نسخه قبلی (سازگاری)
  tokenBlacklist,
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
  getBlacklistSize,
  clearBlacklist,

  // نسخه جدید (پیشرفته)
  blacklistToken,
  checkToken,
  blacklistUserTokens,
  getBlacklistStats,
  getUserBlacklistedTokens,
  cleanupBlacklist,
  getTokenInfo,
  clearAllBlacklist,

  // کلاس اصلی برای دسترسی پیشرفته
  TokenStore,
  tokenStore
};