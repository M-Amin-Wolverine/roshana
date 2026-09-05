/**
 * ============================================================================
 * MODELS INDEX - Enhanced Model Management System
 * ============================================================================
 * 
 * Features:
 * - Model relationships (hasOne, hasMany, belongsTo, belongsToMany)
 * - Query builder with chainable methods
 * - Lifecycle hooks (before/after)
 * - Soft delete support
 * - Pagination & Filtering
 * - Transaction management
 * - Caching layer
 * - Event emitter
 * - Model validation
 * - Auto-increment version
 * - And more...
 * 
 * @version 2.0.0
 * @author Your Name
 * ============================================================================
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const db = require('../config/database');
const EventEmitter = require('events');
const crypto = require('crypto');

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

class ModelError extends Error {
    constructor(message, code = 'MODEL_ERROR', statusCode = 500) {
        super(message);
        this.name = 'ModelError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

class ValidationError extends ModelError {
    constructor(message, errors = []) {
        super(message, 'VALIDATION_ERROR', 400);
        this.errors = errors;
    }
}

class NotFoundError extends ModelError {
    constructor(message = 'Resource not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

class RelationshipError extends ModelError {
    constructor(message) {
        super(message, 'RELATIONSHIP_ERROR', 500);
    }
}

// ============================================================================
// BASE MODEL CLASS
// ============================================================================

class BaseModel {
    static tableName = 'unknown';
    static primaryKey = 'id';
    static timestamps = true;
    static softDelete = false;
    static fillable = [];
    static hidden = [];
    static guarded = ['id', 'created_at', 'updated_at'];

    static db = null;
    static cache = null;
    static logger = null;

    // Relationships
    static relations = {};

    // Hooks
    static hooks = {
        beforeCreate: [],
        afterCreate: [],
        beforeUpdate: [],
        afterUpdate: [],
        beforeDelete: [],
        afterDelete: [],
        beforeFind: [],
        afterFind: []
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Initialize model with database connection
     */
    static initialize(database, options = {}) {
        this.db = database;
        this.cache = options.cache || null;
        this.logger = options.logger || this._defaultLogger();
        
        if (options.relations) {
            this.relations = options.relations;
        }

        this._initializeHooks();
        
        return this;
    }

    /**
     * Default logger
     */
    static _defaultLogger() {
        return {
            debug: (...args) => console.debug('[MODEL DEBUG]', ...args),
            info: (...args) => console.info('[MODEL INFO]', ...args),
            warn: (...args) => console.warn('[MODEL WARN]', ...args),
            error: (...args) => console.error('[MODEL ERROR]', ...args)
        };
    }

    /**
     * Initialize default hooks
     */
    static _initializeHooks() {
        // Can be overridden in child classes
    }

    // ============================================================================
    // QUERY BUILDER
    // ============================================================================

    /**
     * Create a new query builder
     */
    static query() {
        return new QueryBuilder(this);
    }

    /**
     * Find all records
     */
    static async all(options = {}) {
        const { limit = 100, offset = 0, orderBy = 'id', orderDir = 'ASC' } = options;
        
        this._runHook('beforeFind', options);
        
        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        this._runHook('afterFind', rows);
        
        return rows;
    }

    /**
     * Find record by ID
     */
    static async find(id, options = {}) {
        const cacheKey = `${this.tableName}:${id}`;
        
        // Try cache first
        if (this.cache && !options.noCache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for ${this.tableName}:${id}`);
                return JSON.parse(cached);
            }
        }

        this._runHook('beforeFind', { id });

        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`,
            [id]
        );

        const result = rows[0] || null;

        if (result && this.cache) {
            await this.cache.setex(cacheKey, 300, JSON.stringify(result));
        }

        this._runHook('afterFind', result);
        
        return result;
    }

    /**
     * Find first record matching conditions
     */
    static async findOne(conditions = {}, options = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} ${where.sql} LIMIT 1`,
            where.params
        );

        return rows[0] || null;
    }

    /**
     * Find records by conditions
     */
    static async findBy(conditions = {}, options = {}) {
        const { limit = 100, offset = 0, orderBy = 'id', orderDir = 'ASC' } = options;
        const where = this._buildWhere(conditions);

        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} ${where.sql} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
            [...where.params, limit, offset]
        );

        return rows;
    }

    /**
     * Create new record
     */
    static async create(data = {}) {
        // Validate data
        const validatedData = this._validate(data);
        
        // Run beforeCreate hooks
        await this._runHook('beforeCreate', validatedData);

        // Filter fillable fields
        const filteredData = this._filterFillable(validatedData);
        
        // Add timestamps
        const timestampData = this.timestamps ? {
            ...filteredData,
            created_at: new Date(),
            updated_at: new Date()
        } : filteredData;

        // Build insert query
        const fields = Object.keys(timestampData);
        const values = Object.values(timestampData);
        const placeholders = fields.map(() => '?').join(', ');

        const [result] = await this.db.query(
            `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );

        const createdId = result.insertId;
        
        // Get created record
        const created = await this.find(createdId);

        // Run afterCreate hooks
        await this._runHook('afterCreate', created);

        this.logger.info(`Created ${this.tableName} with ID: ${createdId}`);

        return created;
    }

    /**
     * Update record(s)
     */
    static async update(id, data = {}, conditions = {}) {
        // If id provided, add to conditions
        if (id) {
            conditions = { ...conditions, [this.primaryKey]: id };
        }

        // Validate data
        const validatedData = this._validate(data, true);
        
        // Run beforeUpdate hooks
        await this._runHook('beforeUpdate', { id, data: validatedData });

        // Filter fillable fields
        const filteredData = this._filterFillable(validatedData);
        
        // Add updated_at
        const updateData = this.timestamps ? {
            ...filteredData,
            updated_at: new Date()
        } : filteredData;

        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        
        const where = this._buildWhere(conditions);
        
        const [result] = await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} ${where.sql}`,
            [...values, ...where.params]
        );

        // Invalidate cache
        if (this.cache && id) {
            await this.cache.del(`${this.tableName}:${id}`);
        }

        // Run afterUpdate hooks
        await this._runHook('afterUpdate', { id, affected: result.affectedRows });

        this.logger.info(`Updated ${this.tableName}: ${result.affectedRows} rows affected`);

        return result.affectedRows;
    }

    /**
     * Delete record(s)
     */
    static async delete(id, conditions = {}) {
        if (id) {
            conditions = { ...conditions, [this.primaryKey]: id };
        }

        // Run beforeDelete hooks
        await this._runHook('beforeDelete', conditions);

        const where = this._buildWhere(conditions);

        let query;
        if (this.softDelete) {
            query = `UPDATE ${this.tableName} SET deleted_at = NOW() ${where.sql}`;
        } else {
            query = `DELETE FROM ${this.tableName} ${where.sql}`;
        }

        const [result] = await this.db.query(query, where.params);

        // Invalidate cache
        if (this.cache && id) {
            await this.cache.del(`${this.tableName}:${id}`);
        }

        // Run afterDelete hooks
        await this._runHook('afterDelete', { conditions, affected: result.affectedRows });

        this.logger.info(`Deleted ${this.tableName}: ${result.affectedRows} rows affected`);

        return result.affectedRows;
    }

    /**
     * Force delete (bypass soft delete)
     */
    static async forceDelete(id, conditions = {}) {
        if (id) {
            conditions = { ...conditions, [this.primaryKey]: id };
        }

        const where = this._buildWhere(conditions);
        
        const [result] = await this.db.query(
            `DELETE FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        if (this.cache && id) {
            await this.cache.del(`${this.tableName}:${id}`);
        }

        return result.affectedRows;
    }

    /**
     * Restore soft deleted record
     */
    static async restore(id) {
        if (!this.softDelete) {
            throw new ModelError('Soft delete is not enabled for this model');
        }

        const [result] = await this.db.query(
            `UPDATE ${this.tableName} SET deleted_at = NULL WHERE ${this.primaryKey} = ?`,
            [id]
        );

        if (this.cache) {
            await this.cache.del(`${this.tableName}:${id}`);
        }

        return result.affectedRows;
    }

    // ============================================================================
    // PAGINATION & FILTERING
    // ============================================================================

    /**
     * Paginate results
     */
    static async paginate(options = {}) {
        const {
            page = 1,
            limit = 20,
            conditions = {},
            orderBy = 'id',
            orderDir = 'ASC'
        } = options;

        const offset = (page - 1) * limit;
        const where = this._buildWhere(conditions);

        // Get total count
        const [countResult] = await this.db.query(
            `SELECT COUNT(*) as total FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get paginated data
        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} ${where.sql} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
            [...where.params, limit, offset]
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            }
        };
    }

    /**
     * Search with multiple filters
     */
    static async search(filters = {}) {
        const {
            query,
            fields = [],
            conditions = {},
            limit = 100,
            offset = 0,
            orderBy = 'id',
            orderDir = 'ASC'
        } = filters;

        let whereClauses = [];
        let params = [];

        // Text search
        if (query && fields.length > 0) {
            const searchConditions = fields.map(f => `${f} LIKE ?`).join(' OR ');
            whereClauses.push(`(${searchConditions})`);
            params.push(...fields.map(() => `%${query}%`));
        }

        // Regular conditions
        if (Object.keys(conditions).length > 0) {
            const where = this._buildWhere(conditions);
            whereClauses.push(where.sql);
            params.push(...where.params);
        }

        const whereClause = whereClauses.length > 0 
            ? 'WHERE ' + whereClauses.join(' AND ')
            : '';

        const [rows] = await this.db.query(
            `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return rows;
    }

    // ============================================================================
    // AGGREGATE METHODS
    // ============================================================================

    /**
     * Count records
     */
    static async count(conditions = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT COUNT(*) as count FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        return rows[0].count;
    }

    /**
     * Sum a field
     */
    static async sum(field, conditions = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT SUM(${field}) as sum FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        return rows[0].sum || 0;
    }

    /**
     * Average of a field
     */
    static async avg(field, conditions = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT AVG(${field}) as avg FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        return rows[0].avg || 0;
    }

    /**
     * Max value of a field
     */
    static async max(field, conditions = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT MAX(${field}) as max FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        return rows[0].max;
    }

    /**
     * Min value of a field
     */
    static async min(field, conditions = {}) {
        const where = this._buildWhere(conditions);
        
        const [rows] = await this.db.query(
            `SELECT MIN(${field}) as min FROM ${this.tableName} ${where.sql}`,
            where.params
        );

        return rows[0].min;
    }

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    /**
     * Define hasOne relationship
     */
    static hasOne(model, foreignKey, localKey = 'id') {
        return {
            type: 'hasOne',
            model,
            foreignKey,
            localKey
        };
    }

    /**
     * Define hasMany relationship
     */
    static hasMany(model, foreignKey, localKey = 'id') {
        return {
            type: 'hasMany',
            model,
            foreignKey,
            localKey
        };
    }

    /**
     * Define belongsTo relationship
     */
    static belongsTo(model, foreignKey, otherKey = 'id') {
        return {
            type: 'belongsTo',
            model,
            foreignKey,
            otherKey
        };
    }

    /**
     * Define belongsToMany relationship
     */
    static belongsToMany(model, pivotTable, foreignKey, otherKey) {
        return {
            type: 'belongsToMany',
            model,
            pivotTable,
            foreignKey,
            otherKey
        };
    }

    /**
     * Load related models
     */
    static async with(relations, id) {
        const record = await this.find(id);
        if (!record) return null;

        for (const [relationName, relationConfig] of Object.entries(relations)) {
            const relatedData = await this._loadRelation(record, relationConfig);
            record[relationName] = relatedData;
        }

        return record;
    }

    /**
     * Load single relation
     */
    static async _loadRelation(record, config) {
        const { type, model, foreignKey, localKey, pivotTable, otherKey } = config;

        switch (type) {
            case 'hasOne':
                return await model.findOne({ [foreignKey]: record[localKey] });

            case 'hasMany':
                return await model.findBy({ [foreignKey]: record[localKey] });

            case 'belongsTo':
                return await model.find(record[foreignKey]);

            case 'belongsToMany':
                return await this._getBelongsToMany(record, model, pivotTable, foreignKey, otherKey);

            default:
                return null;
        }
    }

    /**
     * Get belongsToMany relation
     */
    static async _getBelongsToMany(record, model, pivotTable, foreignKey, otherKey) {
        const [rows] = await this.db.query(
            `SELECT m.* FROM ${model.tableName} m
             INNER JOIN ${pivotTable} p ON m.${model.primaryKey} = p.${otherKey}
             WHERE p.${foreignKey} = ?`,
            [record[this.primaryKey]]
        );

        return rows;
    }

    // ============================================================================
    // HOOKS SYSTEM
    // ============================================================================

    /**
     * Register a hook
     */
    static registerHook(hookName, callback) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = [];
        }
        this.hooks[hookName].push(callback);
    }

    /**
     * Run hooks
     */
    static async _runHook(hookName, data) {
        const hooks = this.hooks[hookName] || [];
        
        for (const hook of hooks) {
            try {
                await hook(data);
            } catch (error) {
                this.logger.error(`Hook ${hookName} failed:`, error);
            }
        }
    }

    // ============================================================================
    // VALIDATION
    // ============================================================================

    /**
     * Validate data
     */
    static _validate(data, isUpdate = false) {
        const errors = [];

        // Check required fields
        if (!isUpdate && this.fillable.length > 0) {
            for (const field of this.fillable) {
                if (data[field] === undefined) {
                    errors.push({ field, message: `${field} is required` });
                }
            }
        }

        // Check guarded fields
        for (const field of this.guarded) {
            if (data[field] !== undefined) {
                errors.push({ field, message: `${field} is not allowed to be set` });
            }
        }

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }

        return data;
    }

    /**
     * Filter fillable fields
     */
    static _filterFillable(data) {
        if (this.fillable.length === 0) {
            return data;
        }

        const filtered = {};
        for (const key of this.fillable) {
            if (data[key] !== undefined) {
                filtered[key] = data[key];
            }
        }
        return filtered;
    }

    // ============================================================================
// ============================================================================

    /**
     * Build WHERE clause
     */
    static _buildWhere(conditions = {}) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return { sql: '', params: [] };
        }

        const clauses = [];
        const params = [];

        for (const [key, value] of Object.entries(conditions)) {
            if (value === null) {
                clauses.push(`${key} IS NULL`);
            } else if (Array.isArray(value)) {
                clauses.push(`${key} IN (?)`);
                params.push(value);
            } else if (typeof value === 'object') {
                // Handle operators like { $gt: 10 }, { $like: '%test%' }
                for (const [op, val] of Object.entries(value)) {
                    switch (op) {
                        case '$gt':
                            clauses.push(`${key} > ?`);
                            params.push(val);
                            break;
                        case '$gte':
                            clauses.push(`${key} >= ?`);
                            params.push(val);
                            break;
                        case '$lt':
                            clauses.push(`${key} < ?`);
                            params.push(val);
                            break;
                        case '$lte':
                            clauses.push(`${key} <= ?`);
                            params.push(val);
                            break;
                        case '$ne':
                            clauses.push(`${key} != ?`);
                            params.push(val);
                            break;
                        case '$like':
                            clauses.push(`${key} LIKE ?`);
                            params.push(val);
                            break;
                        case '$in':
                            clauses.push(`${key} IN (?)`);
                            params.push(val);
                            break;
                    }
                }
            } else {
                clauses.push(`${key} = ?`);
                params.push(value);
            }
        }

        return {
            sql: 'WHERE ' + clauses.join(' AND '),
            params
        };
    }

    // ============================================================================
    // TRANSACTION SUPPORT
    // ============================================================================

    /**
     * Execute in transaction
     */
    static async transaction(callback) {
        const connection = await this.db.getConnection();
        
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ============================================================================
    // CACHE METHODS
    // ============================================================================

    /**
     * Clear model cache
     */
    static async clearCache(id) {
        if (this.cache) {
            await this.cache.del(`${this.tableName}:${id}`);
        }
    }

    /**
     * Clear all model cache
     */
    static async clearAllCache() {
        if (this.cache) {
            const keys = await this.cache.keys(`${this.tableName}:*`);
            if (keys.length > 0) {
                await this.cache.del(...keys);
            }
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Check if record exists
     */
    static async exists(id) {
        const [rows] = await this.db.query(
            `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${this.primaryKey} = ?) as exists`,
            [id]
        );
        return rows[0].exists === 1;
    }

    /**
     * Get first record
     */
    static async first(conditions = {}) {
        const [rows] = await this.findBy(conditions, { limit: 1 });
        return rows[0] || null;
    }

    /**
     * Get last record
     */
    static async last(conditions = {}, orderBy = 'id') {
        const [rows] = await this.findBy(conditions, { limit: 1, orderBy, orderDir: 'DESC' });
        return rows[0] || null;
    }

    /**
     * Get model metadata
     */
    static getMeta() {
        return {
            tableName: this.tableName,
            primaryKey: this.primaryKey,
            timestamps: this.timestamps,
            softDelete: this.softDelete,
            fillable: this.fillable,
            hidden: this.hidden,
            guarded: this.guarded,
            relations: Object.keys(this.relations)
        };
    }
}

// ============================================================================
// QUERY BUILDER CLASS
// ============================================================================

class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.query = {
            select: '*',
            from: model.tableName,
            where: [],
            whereParams: [],
            orderBy: [],
            limit: null,
            offset: null,
            joins: [],
            groupBy: null,
            having: null
        };
    }

    /**
     * Select specific fields
     */
    select(...fields) {
        this.query.select = fields.join(', ');
        return this;
    }

    /**
     * Add where condition
     */
    where(field, operator, value) {
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }

        this.query.where.push(`${field} ${operator} ?`);
        this.query.whereParams.push(value);
        return this;
    }

    /**
     * Add OR where condition
     */
    orWhere(field, operator, value) {
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }

        this.query.where.push(`OR ${field} ${operator} ?`);
        this.query.whereParams.push(value);
        return this;
    }

    /**
     * Add where in
     */
    whereIn(field, values) {
        const placeholders = values.map(() => '?').join(', ');
        this.query.where.push(`${field} IN (${placeholders})`);
        this.query.whereParams.push(...values);
        return this;
    }

    /**
     * Add where like
     */
    whereLike(field, value) {
        this.query.where.push(`${field} LIKE ?`);
        this.query.whereParams.push(value);
        return this;
    }

    /**
     * Add where null
     */
    whereNull(field) {
        this.query.where.push(`${field} IS NULL`);
        return this;
    }

    /**
     * Add where not null
     */
    whereNotNull(field) {
        this.query.where.push(`${field} IS NOT NULL`);
        return this;
    }

    /**
     * Order by
     */
    orderBy(field, direction = 'ASC') {
        this.query.orderBy.push(`${field} ${direction}`);
        return this;
    }

    /**
     * Limit
     */
    limit(value) {
        this.query.limit = value;
        return this;
    }

    /**
     * Offset
     */
    offset(value) {
        this.query.offset = value;
        return this;
    }

    /**
     * Join table
     */
    join(table, first, operator, second) {
        this.query.joins.push(`INNER JOIN ${table} ON ${first} ${operator} ${second}`);
        return this;
    }

    /**
     * Left join
     */
    leftJoin(table, first, operator, second) {
        this.query.joins.push(`LEFT JOIN ${table} ON ${first} ${operator} ${second}`);
        return this;
    }

    /**
     * Group by
     */
    groupBy(...fields) {
        this.query.groupBy = fields.join(', ');
        return this;
    }

    /**
     * Having
     */
    having(field, operator, value) {
        this.query.having = `${field} ${operator} ?`;
        this.query.whereParams.push(value);
        return this;
    }

    /**
     * Build and execute query
     */
    async get() {
        const sql = this._buildQuery();
        const [rows] = await this.model.db.query(sql, this.query.whereParams);
        return rows;
    }

    /**
     * Get first result
     */
    async first() {
        this.limit(1);
        const rows = await this.get();
        return rows[0] || null;
    }

    /**
     * Get count
     */
    async count() {
        const originalSelect = this.query.select;
        this.query.select = 'COUNT(*) as count';
        
        const sql = this._buildQuery();
        const [rows] = await this.model.db.query(sql, this.query.whereParams);
        
        this.query.select = originalSelect;
        return rows[0].count;
    }

    /**
     * Build SQL query
     */
    _buildQuery() {
        let sql = `SELECT ${this.query.select} FROM ${this.query.from}`;

        // Joins
        if (this.query.joins.length > 0) {
            sql += ' ' + this.query.joins.join(' ');
        }

        // Where
        if (this.query.where.length > 0) {
            sql += ' WHERE ' + this.query.where.join(' ');
        }

        // Group by
        if (this.query.groupBy) {
            sql += ` GROUP BY ${this.query.groupBy}`;
        }

        // Having
        if (this.query.having) {
            sql += ` HAVING ${this.query.having}`;
        }

        // Order by
        if (this.query.orderBy.length > 0) {
            sql += ' ORDER BY ' + this.query.orderBy.join(', ');
        }

        // Limit
        if (this.query.limit) {
            sql += ` LIMIT ${this.query.limit}`;
        }

        // Offset
        if (this.query.offset) {
            sql += ` OFFSET ${this.query.offset}`;
        }

        return sql;
    }
}

// ============================================================================
// MODEL REGISTRY
// ============================================================================

class ModelRegistry {
    constructor() {
        this.models = new Map();
        this.relations = new Map();
    }

    /**
     * Register a model
     */
    register(name, modelClass) {
        this.models.set(name, modelClass);
        return this;
    }

    /**
     * Get registered model
     */
    get(name) {
        const model = this.models.get(name);
        if (!model) {
            throw new ModelError(`Model '${name}' not found`, 'MODEL_NOT_FOUND');
        }
        return model;
    }

    /**
     * Check if model registered
     */
    has(name) {
        return this.models.has(name);
    }

    /**
     * Get all models
     */
    all() {
        return Object.fromEntries(this.models);
    }

    /**
     * Register relationship
     */
    registerRelation(name, config) {
        this.relations.set(name, config);
    }

    /**
     * Get relation
     */
    getRelation(name) {
        return this.relations.get(name);
    }
}

// ============================================================================
// EVENT EMITTER FOR MODELS
// ============================================================================

class ModelEvents extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);
    }
}

const modelEvents = new ModelEvents();

// Event types
const MODEL_EVENTS = {
    BEFORE_CREATE: 'model:beforeCreate',
    AFTER_CREATE: 'model:afterCreate',
    BEFORE_UPDATE: 'model:beforeUpdate',
    AFTER_UPDATE: 'model:afterUpdate',
    BEFORE_DELETE: 'model:beforeDelete',
    AFTER_DELETE: 'model:afterDelete',
    BEFORE_FIND: 'model:beforeFind',
    AFTER_FIND: 'model:afterFind',
    ERROR: 'model:error'
};

// ============================================================================
// IMPORT MODELS
// ============================================================================

const User = require('./user');
const OTP = require('./otp');

// ============================================================================
// CONFIGURE MODELS
// ============================================================================

// Configure User model
User.tableName = 'users';
User.primaryKey = 'id';
User.timestamps = true;
User.softDelete = true;
User.fillable = ['name', 'email', 'password', 'phone', 'avatar', 'status'];
User.hidden = ['password', 'deleted_at'];
User.guarded = ['id', 'created_at', 'updated_at', 'deleted_at'];

// Configure OTP model
OTP.tableName = 'otps';
OTP.primaryKey = 'id';
OTP.timestamps = true;
OTP.softDelete = false;
OTP.fillable = ['user_id', 'code', 'type', 'expires_at', 'ip_address', 'user_agent', 'device_fingerprint'];
OTP.hidden = [];
OTP.guarded = ['id', 'is_used', 'used_at', 'created_at', 'updated_at'];

// ============================================================================
// MODEL REGISTRY INSTANCE
// ============================================================================

const registry = new ModelRegistry();

// Register models
registry.register('User', User);
registry.register('OTP', OTP);

// ============================================================================
// INITIALIZE MODELS
// ============================================================================

/**
 * Initialize all models with database connection
 */
const initializeModels = (database, options = {}) => {
    const { cache = null, logger = null } = options;

    // Initialize each model
    for (const [name, ModelClass] of registry.all()) {
        ModelClass.initialize(database, { cache, logger });
        
        // Register model events
        modelEvents.emit(MODEL_EVENTS.AFTER_FIND, { model: name });
    }

    logger?.info('All models initialized successfully');

    return registry;
};

/**
 * Get model by name
 */
const getModel = (name) => {
    return registry.get(name);
};

/**
 * Check if model exists
 */
const hasModel = (name) => {
    return registry.has(name);
};

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Create new record
 */
const create = async (modelName, data) => {
    const Model = registry.get(modelName);
    return await Model.create(data);
};

/**
 * Find record by ID
 */
const find = async (modelName, id, options = {}) => {
    const Model = registry.get(modelName);
    return await Model.find(id, options);
};

/**
 * Find records by conditions
 */
const findBy = async (modelName, conditions, options = {}) => {
    const Model = registry.get(modelName);
    return await Model.findBy(conditions, options);
};

/**
 * Update record
 */
const update = async (modelName, id, data) => {
    const Model = registry.get(modelName);
    return await Model.update(id, data);
};

/**
 * Delete record
 */
const remove = async (modelName, id) => {
    const Model = registry.get(modelName);
    return await Model.delete(id);
};

/**
 * Paginate records
 */
const paginate = async (modelName, options = {}) => {
    const Model = registry.get(modelName);
    return await Model.paginate(options);
};

/**
 * Count records
 */
const count = async (modelName, conditions = {}) => {
    const Model = registry.get(modelName);
    return await Model.count(conditions);
};

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Execute raw query
 */
const rawQuery = async (sql, params = []) => {
    return await db.query(sql, params);
};

/**
 * Execute in transaction
 */
const transaction = async (callback) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Get database info
 */
const getDbInfo = async () => {
    const [rows] = await db.query('SELECT VERSION() as version');
    return {
        version: rows[0].version,
        database: db.config?.database || 'unknown'
    };
};

// ============================================================================
// MODEL RELATIONSHIP HELPERS
// ============================================================================

/**
 * Attach related models
 */
const withRelations = async (modelName, id, relations) => {
    const Model = registry.get(modelName);
    return await Model.with(relations, id);
};

/**
 * Create with relationships
 */
const createWithRelations = async (modelName, data, relations = {}) => {
    const Model = registry.get(modelName);
    
    return await Model.transaction(async (connection) => {
        // Create main record
        const [result] = await connection.query(
            `INSERT INTO ${Model.tableName} SET ?`,
            [data]
        );

        const createdId = result.insertId;

        // Handle relations
        for (const [relationName, relationData] of Object.entries(relations)) {
            const relationConfig = Model.relations[relationName];
            if (!relationConfig) continue;

            if (relationConfig.type === 'hasMany') {
                for (const item of relationData) {
                    await connection.query(
                        `INSERT INTO ${relationConfig.model.tableName} SET ?`,
                        [{ ...item, [relationConfig.foreignKey]: createdId }]
                    );
                }
            }
        }

        return await Model.find(createdId);
    });
};

// ============================================================================
// CACHING UTILITIES
// ============================================================================

/**
 * Cache wrapper
 */
const withCache = async (key, callback, ttl = 300) => {
    if (!db.cache) {
        return await callback();
    }

    // Try to get from cache
    const cached = await db.cache.get(key);
    if (cached) {
        return JSON.parse(cached);
    }

    // Execute callback
    const result = await callback();

    // Store in cache
    if (result) {
        await db.cache.setex(key, ttl, JSON.stringify(result));
    }

    return result;
};

/**
 * Invalidate cache
 */
const invalidateCache = async (pattern) => {
    if (!db.cache) return;

    const keys = await db.cache.keys(pattern);
    if (keys.length > 0) {
        await db.cache.del(...keys);
    }
};

// ============================================================================
// MODEL EVENTS
// ============================================================================

/**
 * Subscribe to model events
 */
const onModelEvent = (event, callback) => {
    modelEvents.on(event, callback);
};

/**
 * Unsubscribe from model events
 */
const offModelEvent = (event, callback) => {
    modelEvents.off(event, callback);
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check models health
 */
const healthCheck = async () => {
    const results = {
        database: false,
        cache: null,
        models: {}
    };

    // Check database
    try {
        await db.query('SELECT 1');
        results.database = true;
    } catch (error) {
        results.database = false;
    }

    // Check cache
    if (db.cache) {
        try {
            await db.cache.ping();
            results.cache = true;
        } catch (error) {
            results.cache = false;
        }
    } else {
        results.cache = null;
    }

    // Check each model
    for (const [name, ModelClass] of registry.all()) {
        try {
            await ModelClass.count();
            results.models[name] = { status: 'healthy' };
        } catch (error) {
            results.models[name] = { status: 'error', message: error.message };
        }
    }

    return {
        healthy: results.database,
        ...results
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Core
    db,
    registry,
    modelEvents,
    MODEL_EVENTS,

    // Models
    User,
    OTP,

    // Initialization
    initializeModels,
    getModel,
    hasModel,

    // Convenience methods
    create,
    find,
    findBy,
    update,
    remove,
    paginate,
    count,

    // Database helpers
    rawQuery,
    transaction,
    getDbInfo,

    // Relationship helpers
    withRelations,
    createWithRelations,

    // Cache utilities
    withCache,
    invalidateCache,

    // Events
    onModelEvent,
    offModelEvent,

    // Health check
    healthCheck,

    // Errors
    ModelError,
    ValidationError,
    NotFoundError,
    RelationshipError,

    // Base classes
    BaseModel,
    QueryBuilder,
    ModelRegistry,
    ModelEvents
};