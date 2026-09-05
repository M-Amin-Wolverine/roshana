// ============================================
// 🌍 Roshana I18N Middleware ProMax
// ============================================

const localeDetector = require('./localeDetector');
const { manager } = require('../core/MessageManager');

const DEFAULT_LANG = 'fa';

function i18nMiddleware(options = {}) {
    const {
        defaultLanguage = DEFAULT_LANG,
        attachHelpers = true,
        headerName = 'x-language',
        queryName = 'lang',
        cookieName = 'lang'
    } = options;

    return async function(req, res, next) {
        try {
            // ============================================
            // 🌐 Detect Locale
            // ============================================

            const locale = localeDetector.detect(req, {
                defaultLanguage,
                headerName,
                queryName,
                cookieName
            });

            // ============================================
            // 📌 Attach Locale Info
            // ============================================

            req.locale = locale;
            req.language = locale;
            req.lang = locale;

            // ============================================
            // 🌍 Translator
            // ============================================

            req.t = (key, params = {}, extra = {}) => {
                return manager.get(key, {
                    lang: locale,
                    params,
                    ...extra
                });
            };

            // ============================================
            // 🔁 Change Locale Runtime
            // ============================================

            req.setLocale = (newLocale) => {
                req.locale = newLocale;
                req.language = newLocale;
                req.lang = newLocale;
            };

            // ============================================
            // 📦 Locale Metadata
            // ============================================

            req.i18n = {
                language: locale,
                defaultLanguage,
                supportedLanguages: manager.supportedLangs,
                t: req.t
            };

            // ============================================
            // 📤 Response Helpers
            // ============================================

            if (attachHelpers) {

                res.successMessage = (key, params = {}, data = {}) => {
                    return res.json({
                        success: true,
                        message: req.t(key, params),
                        language: locale,
                        ...data
                    });
                };

                res.errorMessage = (key, params = {}, status = 400) => {
                    return res.status(status).json({
                        success: false,
                        message: req.t(key, params),
                        language: locale
                    });
                };

                res.localized = (payload = {}) => {
                    return res.json({
                        language: locale,
                        ...payload
                    });
                };
            }

            // ============================================
            // 📡 Response Header
            // ============================================

            res.setHeader('Content-Language', locale);

            next();

        } catch (error) {

            console.error('❌ I18N Middleware Error:', error);

            req.locale = defaultLanguage;
            req.t = (key) => key;

            next();
        }
    };
}

module.exports = i18nMiddleware;