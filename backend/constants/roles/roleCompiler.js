// ==========================================
// roleCompiler.js
// ==========================================

const registry = require('./registry');

class RoleCompiler {

    static compile(roleId, visited = new Set()) {

        if (visited.has(roleId)) {
            return [];
        }

        visited.add(roleId);

        const role = registry[roleId];

        if (!role) {
            return [];
        }

        const inheritedPermissions = [];

        for (const parent of role.inherits || []) {
            inheritedPermissions.push(
                ...this.compile(parent, visited)
            );
        }

        return [
            ...new Set([
                ...inheritedPermissions,
                ...(role.permissions || [])
            ])
        ];
    }

}

module.exports = RoleCompiler;