// ============================================
// ⚡ Cache Configuration Pro
// ============================================

module.exports = {

    enabled: true,

    ttl: {
        messages: 1000 * 60 * 5,
        translations: 1000 * 60 * 10,
        locale: 1000 * 60 * 30
    },

    limits: {
        maxKeys: 5000,
        maxMemory: '50mb'
    },

    strategies: {
        messages: 'LRU',
        translations: 'FIFO',
        locale: 'TTL'
    },

    cleanup: {
        enabled: true,
        interval: 1000 * 60
    },

    compression: {
        enabled: false
    },

    warmup: {
        enabled: true,

        preload: [
            'SUCCESS.LOGIN_SUCCESS',
            'ERROR.UNAUTHORIZED',
            'VALIDATION.REQUIRED'
        ]
    },

    monitoring: {
        enabled: true,

        logHits: false,

        logMisses: true
    }
};