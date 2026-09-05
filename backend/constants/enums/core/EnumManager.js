// ============================================
// 🚀 Enterprise Enum Manager
// ============================================

const EventEmitter = require('events');

const EnumBase = require('./EnumBase');
const EnumError = require('./EnumError');

class EnumManager extends EventEmitter {

    constructor() {

        super();

        this.enums = new Map();

        this.cache = new Map();

        this.history = [];

        this.cacheTTL = 5 * 60 * 1000;

        this.startCleaner();
    }

    // ============================================
    // 📦 Register
    // ============================================

    register(name, values, metadata = {}) {

        if (this.enums.has(name)) {

            throw new EnumError(
                `Enum "${name}" already exists`,
                {
                    enumName: name,
                    code: 'ENUM_ALREADY_EXISTS'
                }
            );
        }

        const enumObject = new EnumBase(
            name,
            values,
            metadata
        );

        this.enums.set(name, enumObject);

        this.history.push({
            action: 'register',
            enum: name,
            timestamp: Date.now()
        });

        this.emit('registered', name);

        return enumObject;
    }

    // ============================================
    // 🔍 Get Enum
    // ============================================

    get(name) {

        const cached = this.cache.get(name);

        if (cached) {

            if (
                Date.now() - cached.timestamp
                < this.cacheTTL
            ) {
                return cached.value;
            }

            this.cache.delete(name);
        }

        const enumObj = this.enums.get(name);

        if (!enumObj) {

            throw new EnumError(
                `Enum "${name}" not found`,
                {
                    enumName: name,
                    code: 'ENUM_NOT_FOUND'
                }
            );
        }

        this.cache.set(name, {
            value: enumObj,
            timestamp: Date.now()
        });

        return enumObj;
    }

    has(name) {
        return this.enums.has(name);
    }

    remove(name) {

        this.cache.delete(name);

        return this.enums.delete(name);
    }

    list() {
        return Array.from(this.enums.keys());
    }

    clear() {

        this.enums.clear();

        this.cache.clear();
    }

    stats() {

        return {
            totalEnums: this.enums.size,
            cachedEnums: this.cache.size,
            historyCount: this.history.length
        };
    }

    // ============================================
    // 🧹 Cache Cleaner
    // ============================================

    startCleaner() {

        this.cleaner = setInterval(() => {

            const now = Date.now();

            for (const [key, value] of this.cache.entries()) {

                if (
                    now - value.timestamp >
                    this.cacheTTL
                ) {
                    this.cache.delete(key);
                }
            }

        }, 60 * 1000);
    }

    destroy() {

        clearInterval(this.cleaner);

        this.removeAllListeners();

        this.clear();
    }
}

module.exports = EnumManager;