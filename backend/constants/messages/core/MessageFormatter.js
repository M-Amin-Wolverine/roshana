class MessageFormatter {
    constructor() {
        this.numberLocales = {
            fa: 'fa-IR',
            en: 'en-US',
            ar: 'ar-SA',
            tr: 'tr-TR'
        };
    }

    formatNumber(number, lang = 'fa') {
        const locale = this.numberLocales[lang] || 'en-US';

        return new Intl.NumberFormat(locale).format(number);
    }

    formatCurrency(amount, currency = 'IRR', lang = 'fa') {
        const locale = this.numberLocales[lang] || 'en-US';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    }

    formatDate(date, lang = 'fa') {
        const locale = this.numberLocales[lang] || 'en-US';

        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'full',
            timeStyle: 'short'
        }).format(new Date(date));
    }

    relativeTime(seconds, lang = 'fa') {
        const units = [
            ['year', 31536000],
            ['month', 2592000],
            ['day', 86400],
            ['hour', 3600],
            ['minute', 60],
            ['second', 1]
        ];

        const locale = this.numberLocales[lang] || 'en-US';

        const rtf = new Intl.RelativeTimeFormat(locale, {
            numeric: 'auto'
        });

        for (const [unit, value] of units) {
            if (seconds >= value) {
                return rtf.format(-Math.floor(seconds / value), unit);
            }
        }

        return rtf.format(0, 'second');
    }
}

module.exports = new MessageFormatter();