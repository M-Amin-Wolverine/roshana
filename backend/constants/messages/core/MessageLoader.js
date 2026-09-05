const fs = require('fs');
const path = require('path');

class MessageLoader {
    loadLocaleDir(directory) {
        const result = {};

        if (!fs.existsSync(directory)) {
            return result;
        }

        const files = fs.readdirSync(directory);

        for (const file of files) {
            if (!file.endsWith('.js')) continue;

            const fullPath = path.join(directory, file);

            delete require.cache[require.resolve(fullPath)];

            const content = require(fullPath);

            Object.assign(result, content);
        }

        return result;
    }

    loadAllLocales(baseDir) {
        const locales = {};

        if (!fs.existsSync(baseDir)) {
            return locales;
        }

        const langs = fs.readdirSync(baseDir);

        for (const lang of langs) {
            const langPath = path.join(baseDir, lang);

            if (!fs.statSync(langPath).isDirectory()) {
                continue;
            }

            locales[lang] = this.loadLocaleDir(langPath);
        }

        return locales;
    }
}

module.exports = new MessageLoader();