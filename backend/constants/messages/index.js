// ============================================
// 🌍 Roshana Advanced Message System
// ============================================

const path = require('path');
const { EventEmitter } = require('events');

// ============================================
// 📦 Core
// ============================================

const {
    AdvancedMessageManager
} = require('./core/AdvancedMessageManager');

// ============================================
// 🌐 Locales
// ============================================

const fa = require('./locales/fa');
const en = require('./locales/en');
const ar = require('./locales/ar');
const tr = require('./locales/tr');

// ============================================
// 🧠 Helpers
// ============================================

const timeHelper = require('./helpers/time.helper');
const numberHelper = require('./helpers/number.helper');
const currencyHelper = require('./helpers/currency.helper');
const stringHelper = require('./helpers/string.helper');

// ============================================
// ⚙️ Configs
// ============================================

const languagesConfig = require('./config/languages.config');
const pluralConfig = require('./config/plural.config');
const formatterConfig = require('./config/formatter.config');
const cacheConfig = require('./config/cache.config');

// ============================================
// 🧩 Middleware
// ============================================

const i18nMiddleware = require('./middleware/i18n.middleware');
const localeDetector = require('./middleware/localeDetector');
const translationMiddleware = require('./middleware/translation.middleware');

// ============================================
// 📬 Templates
// ============================================

const EmailTemplates = require('./templates/email.templates');
const SmsTemplates = require('./templates/sms.templates');
const PushTemplates = require('./templates/push.templates');
const NotificationTemplates = require('./templates/notification.templates');

// ============================================
// 🚀 Create Manager
// ============================================

const messageManager = new AdvancedMessageManager({
    defaultLang: 'fa',
    fallbackLang: 'en',

    supportedLangs: languagesConfig.supported,

    cache: {
        enabled: cacheConfig.enabled,
        ttl: cacheConfig.ttl,
        max: cacheConfig.max
    },

    formatter: formatterConfig,

    localesPath: path.join(__dirname, 'locales')
});

// ============================================
// 🌍 Load Locales
// ============================================

messageManager.loadMessagesFromObject({
    ...fa,
    ...en,
    ...ar,
    ...tr
});

// ============================================
// 🎯 Events
// ============================================

const events = new EventEmitter();

messageManager.on('message:get', payload => {
    events.emit('message:get', payload);
});

messageManager.on('message:added', payload => {
    events.emit('message:added', payload);
});

messageManager.on('cache:cleared', () => {
    events.emit('cache:cleared');
});

// ============================================
// 🧠 Smart Translation API
// ============================================

const t = (
    key,
    params = {},
    lang = 'fa',
    options = {}
) => {
    return messageManager.get(key, {
        lang,
        params,
        ...options
    });
};

// ============================================
// 📚 Batch Translation
// ============================================

const batch = (
    keys = [],
    lang = 'fa'
) => {
    const result = {};

    for (const key of keys) {
        result[key] = t(key, {}, lang);
    }

    return result;
};

// ============================================
// 🌍 Scoped Translator
// ============================================

const createTranslator = (
    lang = 'fa',
    baseOptions = {}
) => {
    return (
        key,
        params = {},
        options = {}
    ) => {
        return t(
            key,
            params,
            lang,
            {
                ...baseOptions,
                ...options
            }
        );
    };
};

// ============================================
// 🎨 Formatting API
// ============================================

const format = {

    number: (
        value,
        lang = 'fa'
    ) => numberHelper.format(value, lang),

    currency: (
        amount,
        currency = 'IRR',
        lang = 'fa'
    ) => currencyHelper.format(
        amount,
        currency,
        lang
    ),

    relativeTime: (
        value,
        lang = 'fa'
    ) => timeHelper.relative(value, lang),

    dateTime: (
        value,
        lang = 'fa'
    ) => timeHelper.dateTime(value, lang),

    truncate: (
        text,
        length
    ) => stringHelper.truncate(text, length),

    slug: (
        text
    ) => stringHelper.slugify(text),

    capitalize: (
        text
    ) => stringHelper.capitalize(text)
};

// ============================================
// 🔍 Search Messages
// ============================================

const search = (
    query,
    options = {}
) => {
    return messageManager.search(
        query,
        options
    );
};

// ============================================
// 📊 System Stats
// ============================================

const stats = () => {

    return {
        version: '4.0.0',

        messages: messageManager.getStats(),

        cache: {
            size: messageManager.messageCache.size,
            enabled: cacheConfig.enabled
        },

        languages: languagesConfig.supported,

        templates: {
            email: Object.keys(EmailTemplates).length,
            sms: Object.keys(SmsTemplates).length,
            push: Object.keys(PushTemplates).length
        },

        uptime: process.uptime(),

        memory: process.memoryUsage()
    };
};

// ============================================
// 🔥 Hot Reload
// ============================================

const reload = async () => {

    messageManager.clearCache();

    await messageManager.loadMessagesFromDirectory(
        path.join(__dirname, 'locales')
    );

    return true;
};

// ============================================
// 📤 Export API
// ============================================

module.exports = {

    // ========================================
    // 🎛️ Core
    // ========================================

    manager: messageManager,

    t,
    batch,
    createTranslator,

    // ========================================
    // 🌍 Middleware
    // ========================================

    middleware: {
        i18nMiddleware,
        localeDetector,
        translationMiddleware
    },

    // ========================================
    // 🎨 Helpers
    // ========================================

    helpers: {
        time: timeHelper,
        number: numberHelper,
        currency: currencyHelper,
        string: stringHelper
    },

    // ========================================
    // 📬 Templates
    // ========================================

    templates: {
        email: EmailTemplates,
        sms: SmsTemplates,
        push: PushTemplates,
        notification: NotificationTemplates
    },

    // ========================================
    // ⚙️ Configs
    // ========================================

    config: {
        languages: languagesConfig,
        plural: pluralConfig,
        formatter: formatterConfig,
        cache: cacheConfig
    },

    // ========================================
    // 🧠 Formatter API
    // ========================================

    format,

    // ========================================
    // 🔄 CRUD
    // ========================================

    add: (
        category,
        key,
        translations
    ) => messageManager.add(
        category,
        key,
        translations
    ),

    update: (
        category,
        key,
        translations
    ) => messageManager.update(
        category,
        key,
        translations
    ),

    remove: (
        category,
        key
    ) => messageManager.remove(
        category,
        key
    ),

    search,

    reload,

    // ========================================
    // 📊 Monitoring
    // ========================================

    stats,

    events,

    // ========================================
    // 🌐 Languages
    // ========================================

    languages: languagesConfig.supported,

    defaultLanguage:
        languagesConfig.default,

    // ========================================
    // 🚀 Metadata
    // ========================================

    version: '4.0.0',

    author: 'Roshana Core Team',

    description:
        'Enterprise Multilingual Message Engine'
};