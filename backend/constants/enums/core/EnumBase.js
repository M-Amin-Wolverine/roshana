// ============================================
// 🧠 Enterprise Enum Base
// ============================================

const EnumError = require('./EnumError');

class EnumBase {
    constructor(name, values = {}, metadata = {}) {
        this.name = name;

        this._values = Object.freeze({ ...values });

        this.metadata = Object.freeze({
            createdAt: new Date().toISOString(),
            version: '1.0.0',
            ...metadata
        });

        this._reverseMap = new Map();

        for (const [key, value] of Object.entries(this._values)) {

            Object.defineProperty(this, key, {
                value,
                enumerable: true,
                writable: false,
                configurable: false
            });

            if (
                typeof value !== 'object' &&
                typeof value !== 'function'
            ) {
                this._reverseMap.set(value, key);
            }
        }

        Object.freeze(this);
    }

    // ============================================
    // 📦 Basic Access
    // ============================================

    get(key) {
        return this._values[key];
    }

    has(value) {
        return this._reverseMap.has(value);
    }

    keyOf(value) {
        return this._reverseMap.get(value);
    }

    values() {
        return Object.values(this._values);
    }

    keys() {
        return Object.keys(this._values);
    }

    entries() {
        return Object.entries(this._values);
    }

    count() {
        return this.keys().length;
    }

    first() {
        return this.values()[0];
    }

    last() {
        return this.values()[this.count() - 1];
    }

    random() {
        const values = this.values();
        return values[Math.floor(Math.random() * values.length)];
    }

    // ============================================
    // 🔍 Validation
    // ============================================

    validate(value) {
        if (!this.has(value)) {
            throw new EnumError(
                `Invalid value "${value}" for enum "${this.name}"`,
                {
                    enumName: this.name,
                    invalidValue: value,
                    code: 'INVALID_ENUM_VALUE'
                }
            );
        }

        return true;
    }

    safeValidate(value) {
        return this.has(value);
    }

    // ============================================
    // 🎨 Formatting
    // ============================================

    label(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    toArray() {
        return this.entries().map(([key, value]) => ({
            key,
            value,
            label: this.label(key)
        }));
    }

    // ============================================
    // 🔄 Serialization
    // ============================================

    toJSON() {
        return {
            name: this.name,
            values: this._values,
            metadata: this.metadata
        };
    }
}

module.exports = EnumBase;