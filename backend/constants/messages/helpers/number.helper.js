// ============================================
// 🔢 Advanced Number Helper
// ============================================

class NumberHelper {

    static format(number, locale = 'fa-IR') {
        return new Intl.NumberFormat(locale).format(number);
    }

    static compact(number, locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            notation: 'compact'
        }).format(number);
    }

    static random(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    static percentage(value, total) {
        if (!total) return 0;
        return (value / total) * 100;
    }

    static average(numbers = []) {
        if (!numbers.length) return 0;

        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    static sum(numbers = []) {
        return numbers.reduce((a, b) => a + b, 0);
    }

    static median(numbers = []) {
        const sorted = [...numbers].sort((a, b) => a - b);

        const mid = Math.floor(sorted.length / 2);

        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    static isEven(number) {
        return number % 2 === 0;
    }

    static isOdd(number) {
        return number % 2 !== 0;
    }

    static round(number, precision = 2) {
        return Number(number.toFixed(precision));
    }

    static factorial(n) {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }

    static fibonacci(n) {
        const seq = [0, 1];

        for (let i = 2; i <= n; i++) {
            seq[i] = seq[i - 1] + seq[i - 2];
        }

        return seq[n];
    }

    static bytes(bytes) {

        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
            ' ' +
            sizes[i]
        );
    }

    static uid(length = 8) {
        return Math.random()
            .toString(36)
            .substring(2, 2 + length);
    }
}

module.exports = NumberHelper;