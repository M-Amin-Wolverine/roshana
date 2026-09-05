// ============================================
// 🧠 Interpolation Tests
// ============================================

const assert = require('assert');

const {
    manager
} = require('../index');

describe('🧠 Parameter Interpolation', () => {

    before(() => {

        manager.add(
            'INTERPOLATION',
            'WELCOME',
            {
                fa: 'سلام {name}',
                en: 'Hello {name}'
            }
        );

        manager.add(
            'INTERPOLATION',
            'PAYMENT',
            {
                fa: 'مبلغ {amount:number} تومان',
                en: '${amount:number}'
            }
        );

    });

    // ============================================
    // 👤 Basic Replace
    // ============================================

    it('should replace name parameter', () => {

        const result = manager.get(
            'INTERPOLATION.WELCOME',
            {
                params: {
                    name: 'علی'
                }
            }
        );

        assert.strictEqual(
            result,
            'سلام علی'
        );
    });

    // ============================================
    // 🔢 Number Formatting
    // ============================================

    it('should format number parameter', () => {

        const result = manager.get(
            'INTERPOLATION.PAYMENT',
            {
                params: {
                    amount: 1500000
                }
            }
        );

        assert.ok(
            result.includes('۱٬۵۰۰٬۰۰۰')
        );
    });

    // ============================================
    // 🌍 English Interpolation
    // ============================================

    it('should interpolate english', () => {

        const result = manager.get(
            'INTERPOLATION.WELCOME',
            {
                lang: 'en',
                params: {
                    name: 'John'
                }
            }
        );

        assert.strictEqual(
            result,
            'Hello John'
        );
    });

    // ============================================
    // ❌ Missing Params
    // ============================================

    it('should keep placeholder if missing', () => {

        const result = manager.get(
            'INTERPOLATION.WELCOME',
            {
                params: {}
            }
        );

        assert.ok(
            result.includes('{name}')
        );
    });

});