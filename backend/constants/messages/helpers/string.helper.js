// ============================================
// 🔤 Advanced String Helper
// ============================================

const crypto = require('crypto');

class StringHelper {

    static capitalize(str = '') {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static slugify(str = '') {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }

    static truncate(str = '', length = 100, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    static random(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    static mask(str = '', visible = 4) {
        if (!str) return '';

        const hidden = '*'.repeat(Math.max(0, str.length - visible));
        return hidden + str.slice(-visible);
    }

    static camelCase(str = '') {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    }

    static snakeCase(str = '') {
        return str
            .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            .replace(/^_/, '');
    }

    static kebabCase(str = '') {
        return this.snakeCase(str).replace(/_/g, '-');
    }

    static contains(str = '', search = '') {
        return str.includes(search);
    }

    static replaceAll(str = '', search, replace) {
        return str.split(search).join(replace);
    }

    static removeExtraSpaces(str = '') {
        return str.replace(/\s+/g, ' ').trim();
    }

    static reverse(str = '') {
        return [...str].reverse().join('');
    }

    static isEmail(str = '') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    static isPhone(str = '') {
        return /^(\+98|0)?9\d{9}$/.test(str);
    }

    static generateId(prefix = '') {
        return `${prefix}${Date.now()}${Math.floor(Math.random() * 9999)}`;
    }

    static hash(str, algorithm = 'sha256') {
        return crypto
            .createHash(algorithm)
            .update(str)
            .digest('hex');
    }

    static sanitizeHTML(str = '') {
        return str.replace(/[<>]/g, '');
    }

    static words(str = '') {
        return str.trim().split(/\s+/);
    }

    static wordCount(str = '') {
        return this.words(str).length;
    }
}

module.exports = StringHelper;