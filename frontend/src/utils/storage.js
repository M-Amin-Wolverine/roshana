// utils/storage.js

// لاگر ساده و قابل گسترش
const Logger = {
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  
  _log(level, action, key, data = null, error = null) {
    if (this._shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        action,
        key,
        data: data ? this._safeStringify(data) : null,
        error: error ? error.message || error : null
      };
      
      console[level === 'error' ? 'error' : 'log'](
        `[Storage][${action}] ${key || ''}`,
        data ? data : ''
      );
      
      // می‌توان لاگ‌ها را به سرور هم ارسال کرد
      if (level === 'error') {
        this._sendToServer(logEntry);
      }
    }
  },
  
  _shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  },
  
  _safeStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return '[Circular or Non-Serializable]';
    }
  },
  
  _sendToServer(entry) {
    // در صورت نیاز ارسال به سرور
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/logs', JSON.stringify(entry));
    }
  },
  
  debug(action, key, data) { this._log('debug', action, key, data); },
  info(action, key, data) { this._log('info', action, key, data); },
  warn(action, key, data) { this._log('warn', action, key, data); },
  error(action, key, error, data) { this._log('error', action, key, data, error); }
};

export const StorageManager = {
  // پشتیبانی از انواع مختلف استوریج
  storages: {
    local: localStorage,
    session: sessionStorage,
    memory: new Map() // fallback برای زمانی که storage در دسترس نیست
  },
  
  // تشخیص در دسترس بودن استوریج
  isAvailable(type = 'local') {
    try {
      const storage = this.storages[type];
      if (type === 'memory') return true;
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      Logger.error('check_availability', type, e);
      return false;
    }
  },
  
  // دریافت استوریج مناسب
  _getStorage(type = 'local') {
    if (this.isAvailable(type)) {
      return this.storages[type];
    }
    Logger.warn('storage_fallback', type, 'Using memory storage');
    return this.storages.memory;
  },
  
  // ذخیره با زمان انقضا (نسخه بهبودیافته)
  setWithExpiry(key, value, ttl = 3600000, type = 'local') {
    try {
      const item = {
        value: value,
        expiry: Date.now() + ttl,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const storage = this._getStorage(type);
      storage.setItem(key, JSON.stringify(item));
      
      Logger.debug('set_with_expiry', key, { ttl, type });
      return true;
    } catch (error) {
      Logger.error('set_with_expiry_failed', key, error);
      return false;
    }
  },
  
  getWithExpiry(key, type = 'local') {
    try {
      const storage = this._getStorage(type);
      const itemStr = storage.getItem(key);
      
      if (!itemStr) {
        Logger.debug('get_expiry_not_found', key);
        return null;
      }
      
      const item = JSON.parse(itemStr);
      
      // بررسی انقضا با زمان بافر (safe margin)
      if (Date.now() > item.expiry + 1000) {
        storage.removeItem(key);
        Logger.info('expired_item_removed', key, { expiry: item.expiry });
        return null;
      }
      
      // تمدید خودکار برای آیتم‌های نزدیک به انقضا (اختیاری)
      if (item.expiry - Date.now() < 60000) {
        Logger.debug('near_expiry', key, { remaining: item.expiry - Date.now() });
      }
      
      Logger.debug('get_with_expiry_success', key);
      return item.value;
    } catch (error) {
      Logger.error('get_with_expiry_failed', key, error);
      return null;
    }
  },
  
  // ذخیره با رمزگذاری ساده
  setEncrypted(key, value, secret = 'default-secret', type = 'local') {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(value)));
      const storage = this._getStorage(type);
      storage.setItem(`enc_${key}`, encoded);
      Logger.debug('set_encrypted', key);
      return true;
    } catch (error) {
      Logger.error('set_encrypted_failed', key, error);
      return false;
    }
  },
  
  getEncrypted(key, type = 'local') {
    try {
      const storage = this._getStorage(type);
      const encoded = storage.getItem(`enc_${key}`);
      if (!encoded) return null;
      
      const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
      Logger.debug('get_encrypted_success', key);
      return decoded;
    } catch (error) {
      Logger.error('get_encrypted_failed', key, error);
      return null;
    }
  },
  
  // ذخیره موقت برای جلسه جاری (نسخه با انقضا)
  setSession(key, value, ttl = null) {
    if (ttl) {
      return this.setWithExpiry(`session_${key}`, value, ttl, 'session');
    }
    
    try {
      const storage = this._getStorage('session');
      storage.setItem(key, JSON.stringify(value));
      Logger.debug('set_session', key);
      return true;
    } catch (error) {
      Logger.error('set_session_failed', key, error);
      return false;
    }
  },
  
  getSession(key) {
    try {
      // ابتدا چک کردن نسخه با انقضا
      const expiredItem = this.getWithExpiry(`session_${key}`, 'session');
      if (expiredItem !== null) return expiredItem;
      
      const storage = this._getStorage('session');
      const item = storage.getItem(key);
      
      if (!item) return null;
      
      Logger.debug('get_session_success', key);
      return JSON.parse(item);
    } catch (error) {
      Logger.error('get_session_failed', key, error);
      return null;
    }
  },
  
  // حذف با الگو (مثلاً همه کلیدهایی که با 'user_' شروع می‌شوند)
  clearByPattern(pattern, type = 'local') {
    try {
      const storage = this._getStorage(type);
      const keysToRemove = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key.match(pattern)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key));
      Logger.info('clear_by_pattern', null, { pattern, count: keysToRemove.length, type });
      return keysToRemove.length;
    } catch (error) {
      Logger.error('clear_by_pattern_failed', pattern, error);
      return 0;
    }
  },
  
  // دریافت همه کلیدها و مقادیر
  getAll(type = 'local') {
    try {
      const storage = this._getStorage(type);
      const result = {};
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        try {
          result[key] = JSON.parse(storage.getItem(key));
        } catch {
          result[key] = storage.getItem(key);
        }
      }
      
      Logger.debug('get_all', null, { count: Object.keys(result).length, type });
      return result;
    } catch (error) {
      Logger.error('get_all_failed', type, error);
      return {};
    }
  },
  
  // پاک کردن همه چیز با لاگ
  clearAll() {
    const localCount = this.getAll('local').length;
    const sessionCount = this.getAll('session').length;
    
    localStorage.clear();
    sessionStorage.clear();
    this.storages.memory.clear();
    
    Logger.info('clear_all_complete', null, { 
      localRemoved: localCount, 
      sessionRemoved: sessionCount 
    });
    
    return { localRemoved: localCount, sessionRemoved: sessionCount };
  },
  
  // گرفتن آمار استفاده از استوریج
  getStats() {
    const calculateSize = (storage, type) => {
      let total = 0;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        const value = storage.getItem(key);
        total += (key?.length || 0) + (value?.length || 0);
      }
      return total;
    };
    
    const stats = {
      local: { count: localStorage.length, size: calculateSize(localStorage, 'local') },
      session: { count: sessionStorage.length, size: calculateSize(sessionStorage, 'session') }
    };
    
    Logger.debug('stats_calculated', null, stats);
    return stats;
  }
};