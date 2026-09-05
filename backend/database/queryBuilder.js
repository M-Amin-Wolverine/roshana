const DB = require('./connection');
const cache = require('./cache/cacheManager');
const retry = require('./resilience/retry');
const breaker = require('./resilience/circuitBreaker');

async function query(sql, bindings = [], options = {}) {

    const cacheKey =
        sql + JSON.stringify(bindings);

    if (options.cache) {

        const cached = cache.get(cacheKey);

        if (cached) {

            console.log('?? Cache Hit');

            return cached;
        }
    }

    const execute = async () => {

        const result = await DB.knex.raw(
            sql,
            bindings
        );

        return result.rows;
    };

    const rows = await breaker.execute(() =>
        retry(() => execute())
    );

    if (options.cache) {

        cache.set(
            cacheKey,
            rows,
            options.ttl || 30000
        );
    }

    return rows;
}

module.exports = {
    query
};
