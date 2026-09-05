class Metrics {

    constructor() {

        this.data = {
            queries: 0,
            failedQueries: 0,
            slowQueries: 0
        };
    }

    increment(key) {

        if (this.data[key] !== undefined) {

            this.data[key]++;
        }
    }

    getMetrics() {

        return this.data;
    }
}

module.exports = new Metrics();
