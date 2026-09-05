const MessageCache = require('./MessageCache');
const Interpolator = require('./MessageInterpolator');
const Pluralizer = require('./MessagePluralizer');
const Loader = require('./MessageLoader');
const Validator = require('./MessageValidator');
const Events = require('./MessageEvents');

class MessageManager {
    constructor(options = {}) {
        this.defaultLang = options.defaultLang || 'fa';

        this.fallbackLang = options.fallbackLang || 'en';

        this.messages = {};

        this.cache = new MessageCache();

        this.loaders = Loader;

        this.events = Events;
    }

    load(baseDir) {
        this.messages = this.loaders.loadAllLocales(baseDir);
    }

    add(lang, key, value) {
        if (!Validator.validateLang(lang)) {
            throw new Error('Invalid language');
        }

        if (!Validator.validateKey(key)) {
            throw new Error('Invalid key');
        }

        if (!this.messages[lang]) {
            this.messages[lang] = {};
        }

        this.messages[lang][key] = value;

        this.events.emit('message:add', {
            lang,
            key
        });
    }

    get(key, options = {}) {
        const {
            lang = this.defaultLang,
            params = {},
            count = null
        } = options;

        const cacheKey = `${lang}:${key}:${JSON.stringify(params)}:${count}`;

        const cached = this.cache.get(cacheKey);

        if (cached) {
            return cached;
        }

        let message =
            this.messages?.[lang]?.[key] ||
            this.messages?.[this.fallbackLang]?.[key] ||
            key;

        if (count !== null) {
            message = Pluralizer.apply(message, lang, count);
        }

        message = Interpolator.interpolateAdvanced(message, params);

        this.cache.set(cacheKey, message);

        this.events.emit('message:get', {
            key,
            lang
        });

        return message;
    }

    has(lang, key) {
        return !!this.messages?.[lang]?.[key];
    }

    remove(lang, key) {
        if (this.messages?.[lang]?.[key]) {
            delete this.messages[lang][key];
            return true;
        }

        return false;
    }

    getAll(lang = null) {
        if (lang) {
            return this.messages[lang] || {};
        }

        return this.messages;
    }

    stats() {
        return {
            languages: Object.keys(this.messages).length,
            cache: this.cache.getStats()
        };
    }
}

module.exports = MessageManager;