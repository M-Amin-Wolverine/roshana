// ==========================================
// roleFactory.js
// ==========================================

class RoleFactory {
    static create(roleConfig = {}) {
        return {
            id: roleConfig.id,
            name: roleConfig.name,
            displayName: roleConfig.displayName,

            category: roleConfig.category,
            priority: roleConfig.priority,
            riskLevel: roleConfig.riskLevel,

            scope: roleConfig.scope,

            inherits: roleConfig.inherits || [],

            permissions: [
                ...(roleConfig.permissions || [])
            ],

            restrictions: {
                ...(roleConfig.restrictions || {})
            },

            metadata: {
                ...(roleConfig.metadata || {})
            },

            createdAt: new Date(),
            version: '1.0.0',
            enabled: true
        };
    }
}

module.exports = RoleFactory;