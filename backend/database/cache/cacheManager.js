class CacheManager {

    constructor() {

        this.cache = new Map();
    }

    set(key, value, ttl = 30000) {

        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }

    get(key) {

        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expires) {

            this.cache.delete(key);

            return null;
        }

        return item.value;
    }

    delete(key) {

        this.cache.delete(key);
    }

    clear() {

        this.cache.clear();
    }
}

module.exports = new CacheManager();
