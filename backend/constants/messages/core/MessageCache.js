class MessageCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.ttl = options.ttl || 5 * 60 * 1000;
        this.maxSize = options.maxSize || 5000;

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        this.startCleanup();
    }

    generateKey(...parts) {
        return parts.join(':');
    }

    set(key, value, ttl = this.ttl) {
        if (this.cache.size >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now()
        });

        this.stats.sets++;
        return value;
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        this.stats.deletes++;
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();

        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate:
                this.stats.hits + this.stats.misses === 0
                    ? 0
                    : (
                          this.stats.hits /
                          (this.stats.hits + this.stats.misses)
                      ).toFixed(2)
        };
    }
}

module.exports = MessageCache;