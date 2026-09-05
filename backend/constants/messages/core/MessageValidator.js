class MessageValidator {
    validateKey(key) {
        return /^[A-Z0-9_.-]+$/i.test(key);
    }

    validateTranslations(translations) {
        return typeof translations === 'object';
    }

    validateLang(lang) {
        return /^[a-z]{2}$/i.test(lang);
    }

    validateMessage(message) {
        return typeof message === 'string' || typeof message === 'object';
    }
}

module.exports = new MessageValidator();