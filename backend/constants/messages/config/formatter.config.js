// ============================================
// 🎨 Formatter Configuration Ultra
// ============================================

module.exports = {

    numbers: {

        fa(number) {
            return new Intl.NumberFormat('fa-IR')
                .format(number);
        },

        en(number) {
            return new Intl.NumberFormat('en-US')
                .format(number);
        },

        ar(number) {
            return new Intl.NumberFormat('ar-SA')
                .format(number);
        },

        tr(number) {
            return new Intl.NumberFormat('tr-TR')
                .format(number);
        }
    },

    currency: {

        fa(amount, currency = 'IRR') {

            return new Intl.NumberFormat('fa-IR', {
                style: 'currency',
                currency,
                maximumFractionDigits: 0
            }).format(amount);
        },

        en(amount, currency = 'USD') {

            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency
            }).format(amount);
        },

        ar(amount, currency = 'SAR') {

            return new Intl.NumberFormat('ar-SA', {
                style: 'currency',
                currency
            }).format(amount);
        },

        tr(amount, currency = 'TRY') {

            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency
            }).format(amount);
        }
    },

    dates: {

        fa(date) {

            return new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(new Date(date));
        },

        en(date) {

            return new Intl.DateTimeFormat('en-US', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(new Date(date));
        },

        ar(date) {

            return new Intl.DateTimeFormat('ar-SA', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(new Date(date));
        },

        tr(date) {

            return new Intl.DateTimeFormat('tr-TR', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(new Date(date));
        }
    },

    relativeTime: {

        fa: {
            now: 'همین الان',
            minute: 'دقیقه پیش',
            hour: 'ساعت پیش',
            day: 'روز پیش'
        },

        en: {
            now: 'just now',
            minute: 'minutes ago',
            hour: 'hours ago',
            day: 'days ago'
        },

        ar: {
            now: 'الآن',
            minute: 'دقائق مضت',
            hour: 'ساعات مضت',
            day: 'أيام مضت'
        }
    }
};