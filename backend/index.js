module.exports = {

    DB: require('./connection'),

    transaction: require('./transaction'),

    queryBuilder: require('./queryBuilder'),

    repositories: {

        UserRepository:
            require('./repositories/UserRepository')
    },

    cache: require('./cache/cacheManager'),

    monitoring: {

        metrics:
            require('./monitoring/metrics'),

        telemetry:
            require('./monitoring/telemetry')
    },

    resilience: {

        retry:
            require('./resilience/retry'),

        circuitBreaker:
            require('./resilience/circuitBreaker')
    }
};
