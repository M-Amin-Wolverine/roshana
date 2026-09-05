// ==========================================
// roleValidator.js
// ==========================================

class RoleValidator {

    static validate(role) {

        const errors = [];

        if (!role.id) {
            errors.push('ROLE_ID_REQUIRED');
        }

        if (!role.name) {
            errors.push('ROLE_NAME_REQUIRED');
        }

        if (!Array.isArray(role.permissions)) {
            errors.push('PERMISSIONS_MUST_BE_ARRAY');
        }

        if (!Array.isArray(role.inherits)) {
            errors.push('INHERITS_MUST_BE_ARRAY');
        }

        if (!role.category) {
            errors.push('ROLE_CATEGORY_REQUIRED');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

}

module.exports = RoleValidator;