class MessagePluralizer {
    constructor() {
        this.rules = {
            fa: n => (n > 1 ? 'other' : 'one'),
            en: n => (n === 1 ? 'one' : 'other'),
            ar: n => {
                if (n === 0) return 'zero';
                if (n === 1) return 'one';
                if (n === 2) return 'two';
                if (n >= 3 && n <= 10) return 'few';
                return 'other';
            }
        };
    }

    getForm(lang, count) {
        const rule = this.rules[lang] || this.rules.en;
        return rule(count);
    }

    apply(messageObject, lang, count) {
        if (typeof messageObject !== 'object') {
            return messageObject;
        }

        const form = this.getForm(lang, count);

        return (
            messageObject[form] ||
            messageObject.other ||
            Object.values(messageObject)[0]
        );
    }

    addRule(lang, fn) {
        this.rules[lang] = fn;
    }
}

module.exports = new MessagePluralizer();