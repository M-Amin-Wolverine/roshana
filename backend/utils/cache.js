// ═════════════════════════════════════════════════════════════
// 🗄️ Cache Service - نسخه پیشرفته
// Multi-Layer Caching with Memory, Redis & File System
// ═════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═════════════════════════════════════════════════════════════
// 🎨 Console Colors
// ═════════════════════════════════════════════════════════════

const Colors = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m',
    GRAY: '\x1b[90m'
};

const log = {
    info: (msg) => console.log(`${Colors.CYAN}ℹ${Colors.RESET} ${msg}`),
    success: (msg) => console.log(`${Colors.GREEN}✓${Colors.RESET} ${msg}`),
    warn: (msg) => console.log(`${Colors.YELLOW}⚠${Colors.RESET} ${msg}`),
    error: (msg) => console.log(`${Colors.RED}✗${Colors.RESET} ${msg}`)
};

// ═════════════════════════════════════════════════════════════
// ⚙️ Configuration
// ═════════════════════════════════════════════════════════════

const CONFIG = {
    // Cache Driver: memory, redis, file
    driver: process.env.CACHE_DRIVER || 'memory',
    
    // Memory Cache Settings
    memory: {
        maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 500,
        ttl: parseInt(process.env.CACHE_TTL) || 3600000, // 1 hour
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60000 // 1 minute
    },
    
    // Redis Settings
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: process.env.CACHE_KEY_PREFIX || 'roshana:',
        ttl: parseInt(process.env.CACHE_TTL) || 3600
    },
    
    // File Cache Settings
    file: {
        path: process.env.CACHE_FILE_PATH || path.join(__dirname, '../cache'),
        ttl: parseInt(process.env.CACHE_TTL) || 3600,
        extension: '.cache'
    },
    
    // Cache Groups
    groups: {
        user: { ttl: 1800, prefix: 'user:' },
        product: { ttl: 3600, prefix: 'product:' },
        category: { ttl: 7200, prefix: 'category:' },
        settings: { ttl: 86400, prefix: 'settings:' },
        session: { ttl: 3600, prefix: 'session:' },
        otp: { ttl: 300, prefix: 'otp:' },
        rateLimit: { ttl: 900, prefix: 'rate:' }
    },
    
    // Compression
    compression: {
        enabled: process.env.CACHE_COMPRESSION === 'true',
        threshold: 1024
    }
};

// ═════════════════════════════════════════════════════════════
// 💾 Memory Cache Store
// ═════════════════════════════════════════════════════════════

class MemoryCache {
    constructor() {
        this.store = new Map();
        this.hits = 0;
        this.misses = 0;
        
        // Periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, CONFIG.memory.checkPeriod);
    }
    
    /**
     * Set cache value
     */
    set(key, value, ttl = CONFIG.memory.ttl) {
        const expiresAt = ttl ? Date.now() + ttl : null;
        
        this.store.set(key, {
            value,
            expiresAt,
            createdAt: Date.now(),
            hits: 0
        });
        
        // Enforce max size
        if (this.store.size > CONFIG.memory.maxSize) {
            const firstKey = this.store.keys().next().value;
            this.store.delete(firstKey);
        }
        
        return true;
    }
    
    /**
     * Get cache value
     */
    get(key) {
        const item = this.store.get(key);
        
        if (!item) {
            this.misses++;
            return null;
        }
        
        // Check expiration
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            this.misses++;
            return null;
        }
        
        item.hits++;
        this.hits++;
        
        return item.value;
    }
    
    /**
     * Check if key exists
     */
    has(key) {
        const item = this.store.get(key);
        
        if (!item) return false;
        
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return false;
        }
        
        return true;
    }
    
    /**
     * Delete cache value
     */
    delete(key) {
        return this.store.delete(key);
    }
    
    /**
     * Clear all cache
     */
    clear() {
        this.store.clear();
        this.hits = 0;
        this.misses = 0;
    }
    
    /**
     * Get multiple keys
     */
    getMany(keys) {
        return keys.map(key => this.get(key));
    }
    
    /**
     * Set multiple keys
     */
    setMany(items, ttl) {
        for (const [key, value] of items) {
            this.set(key, value, ttl);
        }
    }
    
    /**
     * Get keys by pattern
     */
    keys(pattern = '*') {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.store.keys()).filter(key => regex.test(key));
    }
    
    /**
     * Delete by pattern
     */
    deletePattern(pattern) {
        const keys = this.keys(pattern);
        keys.forEach(key => this.store.delete(key));
        return keys.length;
    }
    
    /**
     * Cleanup expired items
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.store.entries()) {
            if (item.expiresAt && now > item.expiresAt) {
                this.store.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            log.debug(`Cleaned ${cleaned} expired cache items`);
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.store.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) : 0
        };
    }
}

// ═════════════════════════════════════════════════════════════
// 📁 File Cache Store
// ═════════════════════════════════════════════════════════════

class FileCache {
    constructor() {
        this.cacheDir = CONFIG.file.path;
        this.ensureDirectory();
    }
    
    ensureDirectory() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    
    getFilePath(key) {
        const filename = crypto.createHash('md5').update(key).digest('hex');
        return path.join(this.cacheDir, `${filename}${CONFIG.file.extension}`);
    }
    
    set(key, value, ttl = CONFIG.file.ttl) {
        try {
            const filePath = this.getFilePath(key);
            const data = {
                value,
                expiresAt: ttl ? Date.now() + ttl : null,
                createdAt: Date.now()
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
            return true;
        } catch (error) {
            log.error(`File cache set error: ${error.message}`);
            return false;
        }
    }
    
    get(key) {
        try {
            const filePath = this.getFilePath(key);
            
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.expiresAt && Date.now() > data.expiresAt) {
                fs.unlinkSync(filePath);
                return null;
            }
            
            return data.value;
        } catch (error) {
            return null;
        }
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        try {
            const filePath = this.getFilePath(key);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    clear() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.cacheDir, file));
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    keys() {
        try {
            return fs.readdirSync(this.cacheDir)
                .filter(f => f.endsWith(CONFIG.file.extension))
                .map(f => f.replace(CONFIG.file.extension, ''));
        } catch (error) {
            return [];
        }
    }
    
    cleanup() {
        const files = fs.readdirSync(this.cacheDir);
        let cleaned = 0;
        
        files.forEach(file => {
            try {
                const filePath = path.join(this.cacheDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.expiresAt && Date.now() > data.expiresAt) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            } catch (e) {
                // Ignore errors
            }
        });
        
        return cleaned;
    }
}

// ═════════════════════════════════════════════════════════════
// 🔴 Redis Cache Store
// ═════════════════════════════════════════════════════════════

class RedisCache {
    constructor() {
        this.client = null;
        this.connected = false;
        this.init();
    }
    
    async init() {
        try {
            const redis = require('redis');
            
            this.client = redis.createClient({
                socket: {
                    host: CONFIG.redis.host,
                    port: CONFIG.redis.port
                },
                password: CONFIG.redis.password,
                database: CONFIG.redis.db
            });
            
            this.client.on('error', (err) => {
                log.error(`Redis error: ${err.message}`);
                this.connected = false;
            });
            
            this.client.on('connect', () => {
                this.connected = true;
                log.success('Redis connected');
            });
            
            await this.client.connect();
        } catch (error) {
            log.warn(`Redis not available: ${error.message}`);
            this.connected = false;
        }
    }
    
    async set(key, value, ttl = CONFIG.redis.ttl) {
        if (!this.connected) return false;
        
        try {
            const fullKey = `${CONFIG.redis.keyPrefix}${key}`;
            const serialized = JSON.stringify(value);
            
            if (ttl) {
                await this.client.setEx(fullKey, ttl, serialized);
            } else {
                await this.client.set(fullKey, serialized);
            }
            
            return true;
        } catch (error) {
            log.error(`Redis set error: ${error.message}`);
            return false;
        }
    }
    
    async get(key) {
        if (!this.connected) return null;
        
        try {
            const fullKey = `${CONFIG.redis.keyPrefix}${key}`;
            const value = await this.client.get(fullKey);
            
            if (!value) return null;
            
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }
    
    async has(key) {
        if (!this.connected) return false;
        
        try {
            const fullKey = `${CONFIG.redis.keyPrefix}${key}`;
            return await this.client.exists(fullKey) > 0;
        } catch (error) {
            return false;
        }
    }
    
    async delete(key) {
        if (!this.connected) return false;
        
        try {
            const fullKey = `${CONFIG.redis.keyPrefix}${key}`;
            await this.client.del(fullKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async clear() {
        if (!this.connected) return false;
        
        try {
            const keys = await this.client.keys(`${CONFIG.redis.keyPrefix}*`);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async keys(pattern = '*') {
        if (!this.connected) return [];
        
        try {
            const fullPattern = `${CONFIG.redis.keyPrefix}${pattern}`;
            return await this.client.keys(fullPattern);
        } catch (error) {
            return [];
        }
    }
    
    async deletePattern(pattern) {
        if (!this.connected) return 0;
        
        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return keys.length;
        } catch (error) {
            return 0;
        }
    }
    
    async getStats() {
        if (!this.connected) return null;
        
        try {
            const info = await this.client.info('memory');
            return {
                connected: this.connected,
                memory: info
            };
        } catch (error) {
            return { connected: false };
        }
    }
}

// ═════════════════════════════════════════════════════════════
// 🎯 Cache Service Class
// ═════════════════════════════════════════════════════════════

class CacheService {
    constructor() {
        this.config = CONFIG;
        this.driver = CONFIG.driver;
        this.cache = null;
        
        // Initialize cache driver
        this.init();
    }
    
    init() {
        switch (this.driver) {
            case 'redis':
                this.cache = new RedisCache();
                break;
                
            case 'file':
                this.cache = new FileCache();
                break;
                
            case 'memory':
            default:
                this.cache = new MemoryCache();
                break;
        }
        
        log.info(`Cache service initialized with driver: ${this.driver}`);
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Main Methods
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Get value from cache
     */
    async get(key) {
        return this.cache.get(key);
    }
    
    /**
     * Set value in cache
     */
    async set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }
    
    /**
     * Check if key exists
     */
    async has(key) {
        return this.cache.has(key);
    }
    
    /**
     * Delete key from cache
     */
    async delete(key) {
        return this.cache.delete(key);
    }
    
    /**
     * Clear all cache
     */
    async clear() {
        return this.cache.clear();
    }
    
    /**
     * Get multiple keys
     */
    async getMany(keys) {
        if (this.cache.getMany) {
            return this.cache.getMany(keys);
        }
        
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }
    
    /**
     * Set multiple keys
     */
    async setMany(items, ttl) {
        if (this.cache.setMany) {
            return this.cache.setMany(items, ttl);
        }
        
        for (const [key, value] of items) {
            await this.set(key, value, ttl);
        }
        return true;
    }
    
    /**
     * Get keys by pattern
     */
    async keys(pattern = '*') {
        if (this.cache.keys) {
            return this.cache.keys(pattern);
        }
        return [];
    }
    
    /**
     * Delete by pattern
     */
    async deletePattern(pattern) {
        if (this.cache.deletePattern) {
            return this.cache.deletePattern(pattern);
        }
        
        const keys = await this.keys(pattern);
        let deleted = 0;
        for (const key of keys) {
            if (await this.delete(key)) deleted++;
        }
        return deleted;
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Group Methods
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Get from group
     */
    async getFromGroup(group, id) {
        const groupConfig = CONFIG.groups[group];
        if (!groupConfig) {
            throw new Error(`Invalid cache group: ${group}`);
        }
        
        const key = `${groupConfig.prefix}${id}`;
        return this.get(key);
    }
    
    /**
     * Set in group
     */
    async setInGroup(group, id, value) {
        const groupConfig = CONFIG.groups[group];
        if (!groupConfig) {
            throw new Error(`Invalid cache group: ${group}`);
        }
        
        const key = `${groupConfig.prefix}${id}`;
        return this.set(key, value, groupConfig.ttl);
    }
    
    /**
     * Delete from group
     */
    async deleteFromGroup(group, id) {
        const groupConfig = CONFIG.groups[group];
        if (!groupConfig) {
            throw new Error(`Invalid cache group: ${group}`);
        }
        
        const key = `${groupConfig.prefix}${id}`;
        return this.delete(key);
    }
    
    /**
     * Clear group
     */
    async clearGroup(group) {
        const groupConfig = CONFIG.groups[group];
        if (!groupConfig) {
            throw new Error(`Invalid cache group: ${group}`);
        }
        
        return this.deletePattern(`${groupConfig.prefix}*`);
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Remember Methods (Cache with fallback)
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Remember - get from cache or execute function
     */
    async remember(key, ttl, callback) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        // Execute callback to get fresh data
        const fresh = await callback();
        
        // Store in cache
        if (fresh !== undefined && fresh !== null) {
            await this.set(key, fresh, ttl);
        }
        
        return fresh;
    }
    
    /**
     * Remember forever (no expiration)
     */
    async rememberForever(key, callback) {
        return this.remember(key, null, callback);
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Increment/Decrement
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Increment value
     */
    async increment(key, amount = 1) {
        const current = await this.get(key) || 0;
        const newValue = current + amount;
        await this.set(key, newValue);
        return newValue;
    }
    
    /**
     * Decrement value
     */
    async decrement(key, amount = 1) {
        return this.increment(key, -amount);
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Tags (for file/memory cache)
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Tag a cache entry
     */
    async tag(key, tags) {
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const taggedKeys = (await this.get(tagKey)) || [];
            
            if (!taggedKeys.includes(key)) {
                taggedKeys.push(key);
                await this.set(tagKey, taggedKeys);
            }
        }
    }
    
    /**
     * Invalidate by tag
     */
    async invalidateTag(tag) {
        const tagKey = `tag:${tag}`;
        const taggedKeys = await this.get(tagKey) || [];
        
        for (const key of taggedKeys) {
            await this.delete(key);
        }
        
        await this.delete(tagKey);
        return taggedKeys.length;
    }
    
    // ═════════════════════════════════════════════════════════════
    // 🎯 Statistics
    // ═════════════════════════════════════════════════════════════
    
    /**
     * Get cache statistics
     */
    async getStats() {
        if (this.cache.getStats) {
            return this.cache.getStats();
        }
        
        return {
            driver: this.driver,
            keys: await this.keys()
        };
    }
    
    /**
     * Cleanup expired entries
     */
    async cleanup() {
        if (this.cache.cleanup) {
            return this.cache.cleanup();
        }
        return 0;
    }
}

// ═════════════════════════════════════════════════════════════
// 📤 Export Singleton Instance
// ═════════════════════════════════════════════════════════════

const cache = new CacheService();

module.exports = {
    // Main service
    cache,
    
    // Convenience methods
    get: (key) => cache.get(key),
    set: (key, value, ttl) => cache.set(key, value, ttl),
    has: (key) => cache.has(key),
    delete: (key) => cache.delete(key),
    clear: () => cache.clear(),
    remember: (key, ttl, callback) => cache.remember(key, ttl, callback),
    rememberForever: (key, callback) => cache.rememberForever(key, callback),
    getFromGroup: (group, id) => cache.getFromGroup(group, id),
    setInGroup: (group, id, value) => cache.setInGroup(group, id, value),
    deleteFromGroup: (group, id) => cache.deleteFromGroup(group, id),
    clearGroup: (group) => cache.clearGroup(group),
    increment: (key, amount) => cache.increment(key, amount),
    decrement: (key, amount) => cache.decrement(key, amount),
    tag: (key, tags) => cache.tag(key, tags),
    invalidateTag: (tag) => cache.invalidateTag(tag),
    getStats: () => cache.getStats(),
    cleanup: () => cache.cleanup(),
    
    // Configuration
    config: CONFIG,
    
    // Export class
    CacheService
};