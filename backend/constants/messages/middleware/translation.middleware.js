// ============================================
// 🌍 Translation Middleware Pro
// ============================================

const { manager } = require('../core/MessageManager');

function translationMiddleware(options = {}) {

    const {
        namespace = null,
        strict = false,
        cache = true
    } = options;

    return function(req, res, next) {

        // ============================================
        // 🌐 Translator
        // ============================================

        req.translate = (
            key,
            params = {},
            extra = {}
        ) => {

            const finalKey = namespace
                ? `${namespace}.${key}`
                : key;

            try {

                return manager.get(finalKey, {
                    lang: req.locale || 'fa',
                    params,
                    useCache: cache,
                    ...extra
                });

            } catch (error) {

                if (strict) {
                    throw error;
                }

                return finalKey;
            }
        };

        // ============================================
        // 📚 Bulk Translation
        // ============================================

        req.translateMany = (keys = []) => {

            return keys.reduce((acc, key) => {

                acc[key] = req.translate(key);

                return acc;

            }, {});
        };

        // ============================================
        // 🧠 Translation Exists
        // ============================================

        req.hasTranslation = (key) => {

            try {

                const result = req.translate(key);

                return result !== key;

            } catch {

                return false;
            }
        };

        next();
    };
}

module.exports = translationMiddleware;