class MessageInterpolator {
    interpolate(message, params = {}) {
        if (!message || typeof message !== 'string') {
            return message;
        }

        return message.replace(/\{(.*?)\}/g, (match, key) => {
            const value = params[key.trim()];

            if (value === undefined || value === null) {
                return match;
            }

            return value;
        });
    }

    interpolateAdvanced(message, params = {}) {
        return message.replace(/\{(.*?)(?::(.*?))?\}/g, (_, key, type) => {
            let value = params[key];

            if (value === undefined || value === null) {
                return `{${key}}`;
            }

            switch (type) {
                case 'upper':
                    return String(value).toUpperCase();

                case 'lower':
                    return String(value).toLowerCase();

                case 'number':
                    return Number(value).toLocaleString();

                case 'json':
                    return JSON.stringify(value);

                default:
                    return value;
            }
        });
    }
}

module.exports = new MessageInterpolator();