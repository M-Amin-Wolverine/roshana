// ============================================
// 🔢 Pluralization Rules Config
// ============================================

module.exports = {

    fa(count) {

        return count === 1
            ? 'one'
            : 'other';
    },

    en(count) {

        return count === 1
            ? 'one'
            : 'other';
    },

    ar(count) {

        if (count === 0) return 'zero';

        if (count === 1) return 'one';

        if (count === 2) return 'two';

        if (count >= 3 && count <= 10) {
            return 'few';
        }

        if (count >= 11 && count <= 99) {
            return 'many';
        }

        return 'other';
    },

    tr(count) {

        return count === 1
            ? 'one'
            : 'other';
    },

    de(count) {

        return count === 1
            ? 'one'
            : 'other';
    },

    fr(count) {

        return count === 0 || count === 1
            ? 'one'
            : 'other';
    },

    get(lang, count) {

        if (!this[lang]) {
            return 'other';
        }

        return this[lang](count);
    }
};