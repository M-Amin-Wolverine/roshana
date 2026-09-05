// ============================================
// 🌐 Locale Detector Ultra
// ============================================

const SUPPORTED_LANGUAGES = [
    'fa',
    'en',
    'ar',
    'tr',
    'de',
    'fr'
];

class LocaleDetector {

    static detect(req, options = {}) {

        const {
            defaultLanguage = 'fa',
            headerName = 'x-language',
            queryName = 'lang',
            cookieName = 'lang'
        } = options;

        // ============================================
        // 1️⃣ Query Param
        // ============================================

        const queryLang = req.query?.[queryName];

        if (this.isSupported(queryLang)) {
            return queryLang;
        }

        // ============================================
        // 2️⃣ Custom Header
        // ============================================

        const headerLang = req.headers?.[headerName];

        if (this.isSupported(headerLang)) {
            return headerLang;
        }

        // ============================================
        // 3️⃣ Cookie
        // ============================================

        const cookieLang = req.cookies?.[cookieName];

        if (this.isSupported(cookieLang)) {
            return cookieLang;
        }

        // ============================================
        // 4️⃣ Accept-Language
        // ============================================

        const acceptLanguage = req.headers['accept-language'];

        if (acceptLanguage) {

            const languages = acceptLanguage
                .split(',')
                .map(lang => lang.split(';')[0].trim().toLowerCase());

            for (const lang of languages) {

                const short = lang.split('-')[0];

                if (this.isSupported(short)) {
                    return short;
                }
            }
        }

        // ============================================
        // 5️⃣ User Profile
        // ============================================

        const userLang = req.user?.language;

        if (this.isSupported(userLang)) {
            return userLang;
        }

        // ============================================
        // 🔚 Fallback
        // ============================================

        return defaultLanguage;
    }

    static isSupported(lang) {

        if (!lang) return false;

        return SUPPORTED_LANGUAGES.includes(
            lang.toLowerCase()
        );
    }

    static getSupportedLanguages() {
        return [...SUPPORTED_LANGUAGES];
    }

    static addLanguage(lang) {

        if (!SUPPORTED_LANGUAGES.includes(lang)) {
            SUPPORTED_LANGUAGES.push(lang);
        }
    }

    static removeLanguage(lang) {

        const index = SUPPORTED_LANGUAGES.indexOf(lang);

        if (index !== -1) {
            SUPPORTED_LANGUAGES.splice(index, 1);
        }
    }
}

module.exports = LocaleDetector;