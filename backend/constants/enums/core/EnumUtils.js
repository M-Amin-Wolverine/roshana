// ============================================
// 🛠️ Enum Utilities
// ============================================

const crypto = require('crypto');

const EnumUtils = {

    toSelectOptions(enumObj, options = {}) {

        const {
            includeAll = false,
            allLabel = 'همه',
            transform = null
        } = options;

        const items = enumObj.toArray().map(item => ({
            value: item.value,
            label: transform
                ? transform(item)
                : item.label,
            key: item.key
        }));

        if (includeAll) {
            items.unshift({
                value: 'all',
                label: allLabel
            });
        }

        return items;
    },

    groupByEnum(array, field, enumObj) {

        const grouped = {};

        enumObj.keys().forEach(key => {
            grouped[key] = [];
        });

        array.forEach(item => {

            const value = item[field];

            if (enumObj.has(value)) {

                const key = enumObj.keyOf(value);

                grouped[key].push(item);
            }
        });

        return grouped;
    },

    validateBulk(values, enumObj) {

        const valid = [];
        const invalid = [];

        values.forEach(value => {

            if (enumObj.has(value)) {
                valid.push(value);
            } else {
                invalid.push(value);
            }
        });

        return {
            valid,
            invalid,
            success: invalid.length === 0
        };
    },

    randomColor(seed) {

        const hash = crypto
            .createHash('md5')
            .update(seed)
            .digest('hex');

        return `#${hash.slice(0, 6)}`;
    },

    freezeDeep(obj) {

        Object.freeze(obj);

        for (const key of Object.keys(obj)) {

            const value = obj[key];

            if (
                value &&
                typeof value === 'object' &&
                !Object.isFrozen(value)
            ) {
                this.freezeDeep(value);
            }
        }

        return obj;
    }
};

module.exports = EnumUtils;