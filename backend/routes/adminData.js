// ============================================
// 📊 پنل مدیریت دیتابیس - نسخه پیشرفته PostgreSQL
// ============================================

const express = require('express');
const router = express.Router();
const logger = require('../middlewares/logger');

// ⚠️ لیست سفید جداول مجاز برای دسترسی (امنیت)
const ALLOWED_TABLES = new Set([
  'users', 'students', 'professors', 'staff', 'courses', 'lms_courses',
  'enrollments', 'grades', 'attendance', 'transcripts', 'academic_terms',
  'faculties', 'departments', 'organizations', 'events', 'news',
  'notifications', 'messages', 'announcements', 'resources', 'faqs',
  'workshops', 'internships', 'skills', 'certificates', 'projects',
  'tasks', 'discussions', 'comments', 'surveys', 'conferences',
  'scientific_papers', 'theses', 'competitions', 'library_books',
  'sports_clubs', 'dining_services', 'transport_services', 'dormitories',
  
  // ========== اضافه کردن جداول ساپورت ==========
'support_tickets',
'support_replies', 
'support_faqs',
'support_guides',
'faq_feedback',
'ai_conversations',
'support_attachments',
'support_audit_log',
'support_response_templates'
]);

// جداول فقط خواندنی رو هم آپدیت کن (اگه لازمه):
const READONLY_TABLES = new Set([
  'migrations', 'knex_migrations', 'knex_migrations_lock',
  'audit_logs', 'system_logs', 'login_logs', 'roshana_access_logs',
  'faq_feedback'  // کاربرا فقط میتونن ثبت کنن، ویرایش نکنن
]);


// ⚠️ جداولی که فقط ادمین اصلی می‌تونه ببینه
const SUPER_ADMIN_TABLES = new Set([
  'roles', 'permissions', 'role_permissions', 'user_roles',
  'api_keys', 'webhooks', 'backups', 'settings'
]);

/**
 * @middleware بررسی وجود دیتابیس
 */
const checkDatabase = (req, res, next) => {
  if (!global.db) {
    return res.status(503).json({
      success: false,
      error: 'دیتابیس در دسترس نیست'
    });
  }
  next();
};

/**
 * @middleware بررسی دسترسی به جدول
 */
const checkTableAccess = (req, res, next) => {
  const { tableName } = req.params;
  
  // تبدیل به lowercase برای مقایسه
  const normalizedTable = tableName.toLowerCase();
  
  // بررسی وجود جدول در لیست سفید
  if (!ALLOWED_TABLES.has(normalizedTable) && !SUPER_ADMIN_TABLES.has(normalizedTable)) {
    logger.logSecurity('table_access_denied', {
      table: tableName,
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    });
    
    return res.status(403).json({
      success: false,
      error: `دسترسی به جدول "${tableName}" مجاز نیست`
    });
  }
  
  // بررسی جداول فقط خواندنی برای متدهای نوشتن
  if (READONLY_TABLES.has(normalizedTable) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      success: false,
      error: `جدول "${tableName}" فقط خواندنی است`
    });
  }
  
  req.tableName = normalizedTable;
  next();
};

/**
 * @middleware بررسی وجود جدول در دیتابیس
 */
const checkTableExists = async (req, res, next) => {
  try {
    const result = await global.db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ?
    `, [req.tableName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `جدول "${req.tableName}" یافت نشد`
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error checking table existence:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/admin/data/tables
 * @desc    دریافت لیست تمام جداول دیتابیس با آمار
 * @access  Admin
 */
router.get('/tables', checkDatabase, async (req, res) => {
  try {
    const startTime = Date.now();
    
    // دریافت لیست جداول با تعداد رکوردها
    const tablesQuery = `
      SELECT 
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
        obj_description(pc.oid) as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class pc ON pc.relname = t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `;
    
    const tablesResult = await global.db.raw(tablesQuery);
    
    // دریافت تعداد رکوردهای هر جدول (به صورت موازی برای کارایی بهتر)
    const tablesWithCounts = await Promise.all(
      tablesResult.rows.map(async (table) => {
        try {
          const countResult = await global.db(table.table_name).count('* as total').first();
          return {
            name: table.table_name,
            columns: parseInt(table.column_count) || 0,
            rows: parseInt(countResult.total) || 0,
            description: table.table_comment || '',
            allowed: ALLOWED_TABLES.has(table.table_name),
            readOnly: READONLY_TABLES.has(table.table_name),
            superAdminOnly: SUPER_ADMIN_TABLES.has(table.table_name)
          };
        } catch {
          return {
            name: table.table_name,
            columns: parseInt(table.column_count) || 0,
            rows: 0,
            description: table.table_comment || '',
            allowed: ALLOWED_TABLES.has(table.table_name),
            readOnly: READONLY_TABLES.has(table.table_name),
            superAdminOnly: SUPER_ADMIN_TABLES.has(table.table_name)
          };
        }
      })
    );
    
    // فیلتر جداول بر اساس دسترسی
    const accessibleTables = tablesWithCounts.filter(t => 
      ALLOWED_TABLES.has(t.name) || SUPER_ADMIN_TABLES.has(t.name)
    );
    
    const duration = Date.now() - startTime;
    
    logger.logDb('LIST_TABLES', 'SELECT', duration, {
      totalTables: tablesResult.rows.length,
      accessibleTables: accessibleTables.length
    });
    
    res.json({
      success: true,
      data: accessibleTables,
      total: accessibleTables.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error fetching tables:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/data/table/:tableName/schema
 * @desc    دریافت ساختار یک جدول (ستون‌ها، نوع داده، کلیدها)
 * @access  Admin
 */
router.get('/table/:tableName/schema', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName } = req.params;
      
      // دریافت اطلاعات ستون‌ها
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          col_description((table_schema||'.'||table_name)::regclass, ordinal_position) as column_comment
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position
      `;
      
      const columnsResult = await global.db.raw(columnsQuery, [tableName]);
      
      // دریافت کلیدهای خارجی
      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = ?
      `;
      
      const fkResult = await global.db.raw(fkQuery, [tableName]);
      
      // دریافت کلید اصلی
      const pkQuery = `
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ?::regclass
        AND i.indisprimary
      `;
      
      const pkResult = await global.db.raw(pkQuery, [tableName]);
      
      res.json({
        success: true,
        tableName,
        columns: columnsResult.rows,
        primaryKey: pkResult.rows.map(r => r.column_name),
        foreignKeys: fkResult.rows,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error fetching table schema:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/admin/data/table/:tableName
 * @desc    دریافت داده‌های یک جدول با pagination و فیلتر
 * @access  Admin
 */
router.get('/table/:tableName', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 500);
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy || 'id';
      const sortOrder = req.query.sortOrder || 'desc';
      const search = req.query.search;
      const searchFields = req.query.searchFields?.split(',') || [];
      
      const startTime = Date.now();
      
      // ساخت query پایه
      let query = global.db(tableName);
      
      // اعمال جستجو
      if (search && searchFields.length > 0) {
        query = query.where(function() {
          searchFields.forEach(field => {
            this.orWhere(field, 'ilike', `%${search}%`);
          });
        });
      }
      
      // اعمال فیلترهای custom
      Object.keys(req.query).forEach(key => {
        if (key.startsWith('filter_')) {
          const field = key.replace('filter_', '');
          const value = req.query[key];
          
          if (value === 'null') {
            query = query.whereNull(field);
          } else if (value === 'notnull') {
            query = query.whereNotNull(field);
          } else {
            query = query.where(field, value);
          }
        }
      });
      
      // شمارش کل رکوردها
      const countQuery = query.clone();
      const countResult = await countQuery.count('* as total').first();
      const total = parseInt(countResult.total) || 0;
      
      // دریافت داده‌ها با pagination
      const data = await query
        .select('*')
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset);
      
      // دریافت اطلاعات ستون‌ها
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position
      `;
      const columnsResult = await global.db.raw(columnsQuery, [tableName]);
      
      const duration = Date.now() - startTime;
      
      logger.logDb('SELECT', tableName, duration, {
        table: tableName,
        rows: data.length,
        total,
        page,
        limit
      });
      
      res.json({
        success: true,
        tableName,
        columns: columnsResult.rows,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error fetching table data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/admin/data/table/:tableName/:id
 * @desc    دریافت یک رکورد خاص
 * @access  Admin
 */
router.get('/table/:tableName/:id', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName, id } = req.params;
      
      const record = await global.db(tableName)
        .where('id', id)
        .first();
      
      if (!record) {
        return res.status(404).json({
          success: false,
          error: `رکورد با id=${id} در جدول ${tableName} یافت نشد`
        });
      }
      
      res.json({
        success: true,
        data: record,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error fetching record:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/admin/data/table/:tableName
 * @desc    افزودن رکورد جدید
 * @access  Admin
 */
router.post('/table/:tableName', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName } = req.params;
      const data = req.body;
      
      const startTime = Date.now();
      
      // حذف فیلدهای سیستمی
      delete data.id;
      delete data.created_at;
      delete data.updated_at;
      
      // اضافه کردن timestamps
      data.created_at = global.db.fn.now();
      data.updated_at = global.db.fn.now();
      
      const result = await global.db(tableName)
        .insert(data)
        .returning('*');
      
      const duration = Date.now() - startTime;
      
      logger.logDb('INSERT', tableName, duration, {
        table: tableName,
        insertedId: result[0]?.id
      });
      
      // لاگ امنیتی
      logger.logSecurity('record_created', {
        table: tableName,
        data: JSON.stringify(data).substring(0, 500),
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      });
      
      res.status(201).json({
        success: true,
        data: result[0],
        message: 'رکورد با موفقیت اضافه شد',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error inserting record:', error);
      
      // تشخیص نوع خطا
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'رکورد تکراری - مقدار unique قبلاً وجود دارد'
        });
      }
      
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          error: 'خطای کلید خارجی - مقدار ارجاع شده وجود ندارد'
        });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/admin/data/table/:tableName/:id
 * @desc    ویرایش رکورد
 * @access  Admin
 */
router.put('/table/:tableName/:id', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const data = req.body;
      
      const startTime = Date.now();
      
      // حذف فیلدهای سیستمی
      delete data.id;
      delete data.created_at;
      
      // بروزرسانی timestamp
      data.updated_at = global.db.fn.now();
      
      const result = await global.db(tableName)
        .where('id', id)
        .update(data)
        .returning('*');
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: `رکورد با id=${id} در جدول ${tableName} یافت نشد`
        });
      }
      
      const duration = Date.now() - startTime;
      
      logger.logDb('UPDATE', tableName, duration, {
        table: tableName,
        updatedId: id
      });
      
      logger.logSecurity('record_updated', {
        table: tableName,
        id,
        changes: JSON.stringify(data).substring(0, 500),
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      });
      
      res.json({
        success: true,
        data: result[0],
        message: 'رکورد با موفقیت ویرایش شد',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error updating record:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'رکورد تکراری - مقدار unique قبلاً وجود دارد'
        });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PATCH /api/admin/data/table/:tableName/:id
 * @desc    ویرایش جزئی رکورد
 * @access  Admin
 */
router.patch('/table/:tableName/:id',
  checkDatabase,
  checkTableAccess,
  checkTableExists,
  async (req, res) => {
    // مشابه PUT - از همان منطق استفاده می‌کنیم
    try {
      const { tableName, id } = req.params;
      const data = req.body;
      
      delete data.id;
      delete data.created_at;
      
      data.updated_at = global.db.fn.now();
      
      const result = await global.db(tableName)
        .where('id', id)
        .update(data)
        .returning('*');
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: `رکورد با id=${id} یافت نشد`
        });
      }
      
      res.json({
        success: true,
        data: result[0],
        message: 'رکورد با موفقیت ویرایش شد'
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/admin/data/table/:tableName/:id
 * @desc    حذف رکورد
 * @access  Admin
 */
router.delete('/table/:tableName/:id', 
  checkDatabase, 
  checkTableAccess, 
  checkTableExists, 
  async (req, res) => {
    try {
      const { tableName, id } = req.params;
      
      const startTime = Date.now();
      
      // اول رکورد رو پیدا کن برای لاگ
      const record = await global.db(tableName).where('id', id).first();
      
      if (!record) {
        return res.status(404).json({
          success: false,
          error: `رکورد با id=${id} در جدول ${tableName} یافت نشد`
        });
      }
      
      await global.db(tableName).where('id', id).delete();
      
      const duration = Date.now() - startTime;
      
      logger.logDb('DELETE', tableName, duration, {
        table: tableName,
        deletedId: id
      });
      
      logger.logSecurity('record_deleted', {
        table: tableName,
        id,
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      });
      
      res.json({
        success: true,
        message: 'رکورد با موفقیت حذف شد',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error deleting record:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          error: 'این رکورد به دلیل وابستگی‌های کلید خارجی قابل حذف نیست'
        });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/admin/data/table/:tableName/bulk
 * @desc    افزودن چند رکورد همزمان
 * @access  Admin
 */
router.post('/table/:tableName/bulk',
  checkDatabase,
  checkTableAccess,
  checkTableExists,
  async (req, res) => {
    try {
      const { tableName } = req.params;
      const { records } = req.body;
      
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'records باید یک آرایه غیر خالی باشد'
        });
      }
      
      const startTime = Date.now();
      
      // اضافه کردن timestamps
      const recordsWithTimestamp = records.map(record => ({
        ...record,
        created_at: global.db.fn.now(),
        updated_at: global.db.fn.now()
      }));
      
      const result = await global.db(tableName)
        .insert(recordsWithTimestamp)
        .returning('*');
      
      const duration = Date.now() - startTime;
      
      logger.logDb('BULK_INSERT', tableName, duration, {
        table: tableName,
        count: result.length
      });
      
      res.status(201).json({
        success: true,
        data: result,
        count: result.length,
        message: `${result.length} رکورد با موفقیت اضافه شد`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error bulk inserting:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/admin/data/table/:tableName/bulk
 * @desc    حذف چند رکورد همزمان
 * @access  Admin
 */
router.delete('/table/:tableName/bulk',
  checkDatabase,
  checkTableAccess,
  checkTableExists,
  async (req, res) => {
    try {
      const { tableName } = req.params;
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ids باید یک آرایه غیر خالی باشد'
        });
      }
      
      const startTime = Date.now();
      
      const deletedCount = await global.db(tableName)
        .whereIn('id', ids)
        .delete();
      
      const duration = Date.now() - startTime;
      
      logger.logDb('BULK_DELETE', tableName, duration, {
        table: tableName,
        count: deletedCount
      });
      
      logger.logSecurity('records_bulk_deleted', {
        table: tableName,
        count: deletedCount,
        ids,
        ip: req.ip
      });
      
      res.json({
        success: true,
        deletedCount,
        message: `${deletedCount} رکورد با موفقیت حذف شد`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error bulk deleting:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/admin/data/stats
 * @desc    آمار کلی دیتابیس
 * @access  Admin
 */
router.get('/stats', checkDatabase, async (req, res) => {
  try {
    const stats = {};
    
    // تعداد جداول
    const tablesResult = await global.db.raw(`
      SELECT COUNT(*) as total
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    stats.totalTables = parseInt(tablesResult.rows[0].total);
    
    // حجم دیتابیس
    const sizeResult = await global.db.raw(`
      SELECT pg_database_size(current_database()) as size
    `);
    stats.databaseSize = `${(parseInt(sizeResult.rows[0].size) / 1024 / 1024).toFixed(2)} MB`;
    
    // تعداد رکوردهای جداول اصلی
    const mainTables = ['users', 'students', 'professors', 'courses', 'enrollments', 'notifications'];
    for (const table of mainTables) {
      try {
        const count = await global.db(table).count('* as total').first();
        stats[`${table}Count`] = parseInt(count.total) || 0;
      } catch {
        stats[`${table}Count`] = 0;
      }
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;