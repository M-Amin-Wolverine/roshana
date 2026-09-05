// ============================================
// 🌍 Languages Configuration Pro
// ============================================

module.exports = {
    default: 'fa',

    fallback: 'en',

    supported: [
        'fa',
        'en',
        'ar',
        'tr',
        'de',
        'fr'
    ],

    rtl: [
        'fa',
        'ar'
    ],

    locales: {
        fa: {
            name: 'Persian',
            nativeName: 'فارسی',
            iso: 'fa-IR',
            direction: 'rtl',
            flag: '🇮🇷',
            currency: 'IRR',
            timezone: 'Asia/Tehran',
            dateFormat: 'jYYYY/jMM/jDD',
            firstDayOfWeek: 6
        },

        en: {
            name: 'English',
            nativeName: 'English',
            iso: 'en-US',
            direction: 'ltr',
            flag: '🇺🇸',
            currency: 'USD',
            timezone: 'UTC',
            dateFormat: 'YYYY/MM/DD',
            firstDayOfWeek: 0
        },

        ar: {
            name: 'Arabic',
            nativeName: 'العربية',
            iso: 'ar-SA',
            direction: 'rtl',
            flag: '🇸🇦',
            currency: 'SAR',
            timezone: 'Asia/Riyadh',
            dateFormat: 'YYYY/MM/DD',
            firstDayOfWeek: 6
        },

        tr: {
            name: 'Turkish',
            nativeName: 'Türkçe',
            iso: 'tr-TR',
            direction: 'ltr',
            flag: '🇹🇷',
            currency: 'TRY',
            timezone: 'Europe/Istanbul',
            dateFormat: 'DD.MM.YYYY',
            firstDayOfWeek: 1
        }
    },

    detection: {
        order: [
            'query',
            'header',
            'cookie',
            'session',
            'accept-language',
            'user'
        ],

        queryKey: 'lang',

        cookieKey: 'locale',

        headerKey: 'x-language'
    },

    persistence: {
        cookie: true,
        session: true,
        database: true
    }
};