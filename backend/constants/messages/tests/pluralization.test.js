// ============================================
// 🔢 Pluralization Tests
// ============================================

const assert = require('assert');

const {
    manager
} = require('../index');

describe('🔢 Pluralization', () => {

    before(() => {

        manager.add(
            'PLURAL',
            'ITEMS',
            {
                fa: {
                    one: '{count} آیتم',
                    other: '{count} آیتم'
                },

                en: {
                    one: '{count} item',
                    other: '{count} items'
                },

                ar: {
                    zero: 'لا عناصر',
                    one: 'عنصر واحد',
                    two: 'عنصران',
                    few: '{count} عناصر',
                    many: '{count} عنصر',
                    other: '{count} عنصر'
                }
            }
        );

    });

    // ============================================
    // 🇺🇸 English
    // ============================================

    it('should handle english singular', () => {

        const result = manager.get(
            'PLURAL.ITEMS',
            {
                lang: 'en',
                count: 1,
                params: {
                    count: 1
                }
            }
        );

        assert.strictEqual(
            result,
            '1 item'
        );
    });

    it('should handle english plural', () => {

        const result = manager.get(
            'PLURAL.ITEMS',
            {
                lang: 'en',
                count: 5,
                params: {
                    count: 5
                }
            }
        );

        assert.strictEqual(
            result,
            '5 items'
        );
    });

    // ============================================
    // 🇸🇦 Arabic
    // ============================================

    it('should handle arabic zero', () => {

        const result = manager.get(
            'PLURAL.ITEMS',
            {
                lang: 'ar',
                count: 0,
                params: {
                    count: 0
                }
            }
        );

        assert.ok(
            result.includes('لا')
        );
    });

    it('should handle arabic two', () => {

        const result = manager.get(
            'PLURAL.ITEMS',
            {
                lang: 'ar',
                count: 2,
                params: {
                    count: 2
                }
            }
        );

        assert.ok(
            result.includes('عنصران')
        );
    });

    // ============================================
    // 🇮🇷 Persian
    // ============================================

    it('should handle persian plural', () => {

        const result = manager.get(
            'PLURAL.ITEMS',
            {
                lang: 'fa',
                count: 10,
                params: {
                    count: 10
                }
            }
        );

        assert.ok(
            result.includes('۱۰')
        );
    });

});