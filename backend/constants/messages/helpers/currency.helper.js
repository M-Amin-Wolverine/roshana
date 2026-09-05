// ============================================
// 💰 Advanced Currency Helper
// ============================================

class CurrencyHelper {

    static currencies = {
        IRR: 'fa-IR',
        USD: 'en-US',
        EUR: 'de-DE',
        TRY: 'tr-TR',
        AED: 'ar-AE'
    };

    static format(amount, currency = 'IRR', locale = null) {

        const loc =
            locale ||
            this.currencies[currency] ||
            'en-US';

        return new Intl.NumberFormat(loc, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static compact(amount, locale = 'en') {
        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(amount);
    }

    static percentage(value, locale = 'en') {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            maximumFractionDigits: 2
        }).format(value);
    }

    static tax(amount, percent = 9) {
        return amount * (percent / 100);
    }

    static discount(amount, percent = 0) {
        return amount - (amount * percent / 100);
    }

    static profit(cost, sell) {
        return sell - cost;
    }

    static margin(cost, sell) {
        if (!sell) return 0;
        return ((sell - cost) / sell) * 100;
    }

    static parse(value) {
        return Number(
            String(value).replace(/[^\d.-]/g, '')
        );
    }

    static isCurrency(code) {
        return Object.keys(this.currencies).includes(code);
    }
}

module.exports = CurrencyHelper;