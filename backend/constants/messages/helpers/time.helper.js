// ============================================
// ⏰ Advanced Time Helper ProMax Ultra
// ============================================

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const LOCALES = {
    fa: 'fa-IR',
    en: 'en-US',
    ar: 'ar-SA',
    tr: 'tr-TR'
};

class TimeHelper {

    static now() {
        return new Date();
    }

    static timestamp() {
        return Date.now();
    }

    static toDate(input) {
        if (input instanceof Date) return input;
        return new Date(input);
    }

    static format(date, locale = 'fa', options = {}) {
        return new Intl.DateTimeFormat(
            LOCALES[locale] || LOCALES.en,
            {
                dateStyle: 'medium',
                timeStyle: 'short',
                ...options
            }
        ).format(this.toDate(date));
    }

    static relative(date, locale = 'fa') {
        const now = Date.now();
        const target = this.toDate(date).getTime();
        const diff = now - target;

        const rtf = new Intl.RelativeTimeFormat(
            LOCALES[locale] || LOCALES.en,
            { numeric: 'auto' }
        );

        if (diff < MINUTE) {
            return rtf.format(-Math.floor(diff / SECOND), 'second');
        }

        if (diff < HOUR) {
            return rtf.format(-Math.floor(diff / MINUTE), 'minute');
        }

        if (diff < DAY) {
            return rtf.format(-Math.floor(diff / HOUR), 'hour');
        }

        if (diff < WEEK) {
            return rtf.format(-Math.floor(diff / DAY), 'day');
        }

        if (diff < MONTH) {
            return rtf.format(-Math.floor(diff / WEEK), 'week');
        }

        if (diff < YEAR) {
            return rtf.format(-Math.floor(diff / MONTH), 'month');
        }

        return rtf.format(-Math.floor(diff / YEAR), 'year');
    }

    static add(date, amount, unit = 'day') {
        const d = this.toDate(date);

        const map = {
            second: SECOND,
            minute: MINUTE,
            hour: HOUR,
            day: DAY,
            week: WEEK,
            month: MONTH,
            year: YEAR
        };

        return new Date(d.getTime() + (map[unit] * amount));
    }

    static subtract(date, amount, unit = 'day') {
        return this.add(date, -amount, unit);
    }

    static diff(start, end, unit = 'ms') {
        const diff = this.toDate(end) - this.toDate(start);

        switch (unit) {
            case 'second': return Math.floor(diff / SECOND);
            case 'minute': return Math.floor(diff / MINUTE);
            case 'hour': return Math.floor(diff / HOUR);
            case 'day': return Math.floor(diff / DAY);
            default: return diff;
        }
    }

    static isPast(date) {
        return this.toDate(date) < new Date();
    }

    static isFuture(date) {
        return this.toDate(date) > new Date();
    }

    static startOfDay(date = new Date()) {
        const d = this.toDate(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    static endOfDay(date = new Date()) {
        const d = this.toDate(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TimeHelper;