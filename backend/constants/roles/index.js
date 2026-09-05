// ==========================================
// constants/roles/index.js
// Ultimate RBAC Role Hub
// ==========================================

const registry = require('./registry');

const RoleFactory = require('./roleFactory');
const RoleValidator = require('./roleValidator');
const RoleCompiler = require('./roleCompiler');

const simulationConfig = require('./simulation.config');

// Shared Constants
const { ROLE_CATEGORIES } = require('./shared/roleCategories');
const { ROLE_PRIORITIES } = require('./shared/rolePriorities');
const { RISK_LEVELS } = require('./shared/riskLevels');
const { ACCESS_SCOPES } = require('./shared/accessScopes');
const { BASE_PERMISSIONS } = require('./shared/basePermissions');
const { INHERITANCE_MAP } = require('./shared/inheritanceMap');

// ===============================
// ROLE CACHE
// ===============================

const compiledCache = new Map();

// ===============================
// HELPERS
// ===============================

function getRole(roleId) {
    return registry[roleId] || null;
}

function roleExists(roleId) {
    return !!registry[roleId];
}

function getAllRoles() {
    return Object.values(registry);
}

function getRolesByCategory(category) {
    return Object.values(registry)
        .filter(role => role.category === category);
}

function getRolesByRisk(riskLevel) {
    return Object.values(registry)
        .filter(role => role.riskLevel === riskLevel);
}

function getRolesByPriority(priority) {
    return Object.values(registry)
        .filter(role => role.priority === priority);
}

function getInheritedPermissions(roleId) {

    if (compiledCache.has(roleId)) {
        return compiledCache.get(roleId);
    }

    const permissions = RoleCompiler.compile(roleId);

    compiledCache.set(roleId, permissions);

    return permissions;
}

function hasPermission(roleId, permission) {

    const permissions = getInheritedPermissions(roleId);

    if (permissions.includes('*')) {
        return true;
    }

    if (permissions.includes(permission)) {
        return true;
    }

    // Wildcard Matching
    return permissions.some(p => {

        if (!p.includes('*')) {
            return false;
        }

        const base = p.replace('*', '');

        return permission.startsWith(base);
    });
}

function validateRole(role) {
    return RoleValidator.validate(role);
}

function createRole(config) {

    const role = RoleFactory.create(config);

    const validation = validateRole(role);

    if (!validation.valid) {
        throw new Error(
            `Invalid Role: ${validation.errors.join(', ')}`
        );
    }

    return role;
}

function getRoleHierarchy(roleId, visited = new Set()) {

    if (visited.has(roleId)) {
        return [];
    }

    visited.add(roleId);

    const role = getRole(roleId);

    if (!role) {
        return [];
    }

    let hierarchy = [];

    for (const parent of role.inherits || []) {

        hierarchy.push(parent);

        hierarchy.push(
            ...getRoleHierarchy(parent, visited)
        );
    }

    return [...new Set(hierarchy)];
}

function getChildRoles(roleId) {

    return Object.values(registry)
        .filter(role =>
            (role.inherits || []).includes(roleId)
        );
}

function clearRoleCache() {
    compiledCache.clear();
}

function preloadRoleCache() {

    Object.keys(registry).forEach(roleId => {
        getInheritedPermissions(roleId);
    });

    return {
        success: true,
        cached: compiledCache.size
    };
}

function exportRoleMap() {

    return Object.values(registry).map(role => ({
        id: role.id,
        name: role.name,
        category: role.category,
        priority: role.priority,
        riskLevel: role.riskLevel,
        permissions: getInheritedPermissions(role.id),
        inherits: role.inherits || []
    }));
}

function detectCircularInheritance() {

    const visited = new Set();
    const stack = new Set();

    function dfs(roleId) {

        if (stack.has(roleId)) {
            return true;
        }

        if (visited.has(roleId)) {
            return false;
        }

        visited.add(roleId);
        stack.add(roleId);

        const role = getRole(roleId);

        for (const parent of role?.inherits || []) {

            if (dfs(parent)) {
                return true;
            }
        }

        stack.delete(roleId);

        return false;
    }

    return Object.keys(registry).some(dfs);
}

// ===============================
// INITIALIZATION
// ===============================

if (simulationConfig.performance.preloadRoles) {
    preloadRoleCache();
}

// ===============================
// EXPORTS
// ===============================

module.exports = {

    // Registry
    registry,

    // Shared Constants
    ROLE_CATEGORIES,
    ROLE_PRIORITIES,
    RISK_LEVELS,
    ACCESS_SCOPES,
    BASE_PERMISSIONS,
    INHERITANCE_MAP,

    // Core
    RoleFactory,
    RoleValidator,
    RoleCompiler,

    // Config
    simulationConfig,

    // Methods
    getRole,
    roleExists,
    getAllRoles,
    getRolesByCategory,
    getRolesByRisk,
    getRolesByPriority,

    getInheritedPermissions,
    hasPermission,

    validateRole,
    createRole,

    getRoleHierarchy,
    getChildRoles,

    clearRoleCache,
    preloadRoleCache,

    exportRoleMap,
    detectCircularInheritance
};