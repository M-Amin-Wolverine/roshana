const formatter = require('./MessageFormatter');

class MessageUtils {
    capitalize(str = '') {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    slugify(str = '') {
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
    }

    formatNumber(number, lang) {
        return formatter.formatNumber(number, lang);
    }

    formatCurrency(amount, currency, lang) {
        return formatter.formatCurrency(amount, currency, lang);
    }

    formatDate(date, lang) {
        return formatter.formatDate(date, lang);
    }

    relativeTime(seconds, lang) {
        return formatter.relativeTime(seconds, lang);
    }
}

module.exports = new MessageUtils();