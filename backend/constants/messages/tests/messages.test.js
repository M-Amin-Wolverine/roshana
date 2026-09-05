// ============================================
// 🧪 Message System Tests
// ============================================

const assert = require('assert');

const {
    manager,
    t,
    add,
    update,
    remove,
    search,
    stats
} = require('../index');

describe('📦 Message System', () => {

    // ============================================
    // 🌍 Basic Translation
    // ============================================

    it('should return persian message', () => {
        const result = t('SUCCESS.LOGIN');

        assert.ok(result.includes('ورود'));
    });

    it('should return english translation', () => {
        const result = t(
            'SUCCESS.LOGIN',
            {},
            'en'
        );

        assert.ok(result.includes('Login'));
    });

    // ============================================
    // 🎯 Interpolation
    // ============================================

    it('should interpolate parameters', () => {

        const result = t(
            'SUCCESS.CREATED',
            {
                resource: 'کاربر'
            }
        );

        assert.ok(result.includes('کاربر'));
    });

    // ============================================
    // ➕ Dynamic Add
    // ============================================

    it('should add new message', () => {

        add(
            'TEST',
            'HELLO',
            {
                fa: 'سلام',
                en: 'Hello'
            }
        );

        const result = manager.get(
            'TEST.HELLO'
        );

        assert.strictEqual(
            result,
            'سلام'
        );
    });

    // ============================================
    // 🔄 Update Message
    // ============================================

    it('should update existing message', () => {

        update(
            'TEST',
            'HELLO',
            {
                fa: 'سلام جدید'
            }
        );

        const result = manager.get(
            'TEST.HELLO'
        );

        assert.strictEqual(
            result,
            'سلام جدید'
        );
    });

    // ============================================
    // ❌ Remove Message
    // ============================================

    it('should remove message', () => {

        remove(
            'TEST',
            'HELLO'
        );

        const result = manager.get(
            'TEST.HELLO',
            {
                fallback: true
            }
        );

        assert.ok(
            result.includes('TEST.HELLO')
        );
    });

    // ============================================
    // 🔍 Search
    // ============================================

    it('should search messages', () => {

        const results = search('LOGIN');

        assert.ok(results.length > 0);
    });

    // ============================================
    // 📊 Stats
    // ============================================

    it('should return stats', () => {

        const result = stats();

        assert.ok(result.totalMessages > 0);
    });

});