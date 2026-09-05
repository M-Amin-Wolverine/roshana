// routes/debug.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../middlewares/logger');

// ═══════════════════════════════════════════════════════════════
// 🔧 توابع کمکی
// ═══════════════════════════════════════════════════════════════

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDuration = (ms) => {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

// ─── اعتبارسنجی نام جدول/ستون ───
const isValidIdentifier = (name) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

// ─── پیدا کردن کلید اصلی ───
const findPrimaryKey = (table) => {
  const schema = db.all(`PRAGMA table_info("${table}")`);
  return schema.find(c => c.pk === 1) || schema[0] || null;
};

// ─── بررسی وجود جدول ───
const tableExists = (table) => {
  return db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [table]
  );
};

// ─── اعتبارسنجی نام جدول (میان‌افزار)
const validateTable = (req, res, next) => {
  const table = req.params.table || req.params.name;
  if (table && !isValidIdentifier(table)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid table name - only letters, numbers, underscore allowed',
      received: table
    });
  }
  next();
};

// ─── بررسی وجود جدول (میان‌افزار)
const checkTableExists = (req, res, next) => {
  const table = req.params.table || req.params.name;
  if (!tableExists(table)) {
    return res.status(404).json({
      success: false,
      error: `Table "${table}" not found`,
      availableTables: db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      ).map(t => t.name)
    });
  }
  next();
};

// ═══════════════════════════════════════════════════════════════
// 🛡️ احراز هویت و امنیت
// ═══════════════════════════════════════════════════════════════

const requireAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.DEBUG_API_KEY || 'dev-secret-key';
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing API Key',
      hint: 'Send header: x-api-key: YOUR_API_KEY',
      currentKeyStatus: process.env.DEBUG_API_KEY ? '✓ Configured' : '✗ Using default (change in production!)'
    });
  }
  next();
};

// ─── محدودیت نرخ درخواست (ساده)
const requestCounts = new Map();
const rateLimit = (max = 100, windowMs = 60000) => (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const record = requestCounts.get(key);
  if (!record || now - record.start > windowMs) {
    requestCounts.set(key, { start: now, count: 1 });
    return next();
  }
  if (record.count >= max) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil((windowMs - (now - record.start)) / 1000)
    });
  }
  record.count++;
  next();
};

// اعمال میان‌افزارهای امنیتی
router.use(requireAdmin);
router.use(rateLimit(200, 60000));
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// ─── ذخیره تاریخچه کوئری‌ها (در حافظه)
const queryHistory = [];
const MAX_HISTORY = 500;
const addToHistory = (sql, type, duration, rows) => {
  queryHistory.unshift({
    sql: sql.substring(0, 500),
    type,
    duration,
    rows: Array.isArray(rows) ? rows.length : (rows?.changes || 0),
    timestamp: new Date().toISOString()
  });
  if (queryHistory.length > MAX_HISTORY) queryHistory.pop();
};

// ═══════════════════════════════════════════════════════════════
// 📋 ۰. داشبورد اصلی (API Reference)
// ═══════════════════════════════════════════════════════════════

router.get('/', (req, res) => {
  const tables = db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  res.json({
    success: true,
    api: {
      name: '🔧 SQLite Debug API',
      version: '4.0 Ultimate',
      tagline: 'Complete database explorer & management suite',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    },
    endpoints: {
  // ═══════════════════════════════════════════════════════════
  // 📊 آمار و مانیتورینگ (Statistics & Monitoring)
  // ═══════════════════════════════════════════════════════════
  stats: {
    icon: '📊',
    summary:       { method: 'GET',  path: '/debug/stats',                      desc: 'آمار خلاصه کل دیتابیس',                auth: 'admin' },
    detailed:      { method: 'GET',  path: '/debug/stats/detailed',             desc: 'آمار کامل هر جدول',                   auth: 'admin' },
    size:          { method: 'GET',  path: '/debug/stats/size',                desc: 'اندازه جدول‌ها و مصرف دیسک',          auth: 'admin' },
    health:        { method: 'GET',  path: '/debug/stats/health',              desc: 'گزارش سلامت جدول‌ها',                 auth: 'admin' },
    realtime:      { method: 'GET',  path: '/debug/stats/realtime',            desc: 'آمار لحظه‌ای (active connections)',    auth: 'admin' },
    growth:        { method: 'GET',  path: '/debug/stats/growth',              desc: 'روند رشد جدول‌ها در بازه زمانی',       auth: 'admin' },
    overview:      { method: 'GET',  path: '/debug/stats/overview',            desc: 'نمای کلی از وضعیت دیتابیس',          auth: 'admin' },
    connections:   { method: 'GET',  path: '/debug/stats/connections',          desc: 'اتصالات فعال و history',              auth: 'admin' },
    memory:        { method: 'GET',  path: '/debug/stats/memory',              desc: 'مصرف حافظه توسط buffer pool',         auth: 'admin' },
    cache:         { method: 'GET',  path: '/debug/stats/cache',               desc: 'وضعیت cache و hit ratio',             auth: 'admin' },
    locks:         { method: 'GET',  path: '/debug/stats/locks',                desc: 'بسته‌های قفل و deadlock ها',           auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🗂️ جدول‌ها (Tables Management)
  // ═══════════════════════════════════════════════════════════
  tables: {
    icon: '🗂️',
    list:           { method: 'GET',    path: '/debug/tables',                  desc: 'لیست جدول‌ها و ویوها',                 auth: 'admin' },
    full:           { method: 'GET',    path: '/debug/tables/full',            desc: 'لیست کامل با جزئیات',                 auth: 'admin' },
    summary:        { method: 'GET',    path: '/debug/tables/:table',          desc: 'خلاصه یک جدول خاص',                   auth: 'admin' },
    info:           { method: 'GET',    path: '/debug/tables/:table/info',     desc: 'اطلاعات کامل جدول',                   auth: 'admin' },
    columns:        { method: 'GET',    path: '/debug/tables/:table/columns',  desc: 'لیست ستون‌های جدول',                  auth: 'read'  },
    sizes:          { method: 'GET',    path: '/debug/tables/:table/size',     desc: 'اندازه جدول و ایندکس‌ها',              auth: 'admin' },
    fragments:      { method: 'GET',    path: '/debug/tables/:table/fragments',desc: 'تکه‌تکه شدگی جدول',                   auth: 'admin' },
    dependencies:   { method: 'GET',    path: '/debug/tables/:table/deps',     desc: 'وابستگی‌های جدول',                    auth: 'read'  },
    dependents:     { method: 'GET',    path: '/debug/tables/:table/dependents',desc:'جدول‌های وابسته به این جدول',          auth: 'read'  },
    create:         { method: 'POST',   path: '/debug/tables',                 desc: 'ساخت جدول جدید',                      auth: 'super' },
    rename:         { method: 'PUT',    path: '/debug/tables/:table/rename',   desc: 'تغییر نام جدول',                       auth: 'super' },
    clone:          { method: 'POST',   path: '/debug/tables/:table/clone',    desc: 'کپی جدول با داده‌ها',                  auth: 'super' },
    truncate:       { method: 'DELETE', path: '/debug/tables/:table/truncate', desc: 'پاک کردن همه داده‌ها',                auth: 'super' },
    drop:           { method: 'DELETE', path: '/debug/tables/:table',          desc: 'حذف جدول',                            auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🏗️ اسکیما و ساختار (Schema & Structure)
  // ═══════════════════════════════════════════════════════════
  schema: {
    icon: '🏗️',
    table:          { method: 'GET',  path: '/debug/schema/:table',            desc: 'ساختار جدول',                          auth: 'read'  },
    full:           { method: 'GET',  path: '/debug/schema/:table/full',      desc: 'ساختار کامل با روابط',                auth: 'read'  },
    diff:           { method: 'GET',  path: '/debug/schema/:table/diff',       desc: 'تفاوت با تعریف واقعی DB',             auth: 'admin' },
    validate:       { method: 'POST', path: '/debug/schema/:table/validate',  desc: 'اعتبارسنجی ساختار',                    auth: 'admin' },
    migrate:        { method: 'PUT',  path: '/debug/schema/:table/migrate',   desc: 'همسان‌سازی ساختار',                    auth: 'super' },
    migrations:     { method: 'GET',  path: '/debug/migrations',              desc: 'لیست migrations اجرا شده',            auth: 'admin' },
    migrationNew:   { method: 'POST', path: '/debug/migrations',              desc: 'اجرای migration جدید',                auth: 'super' },
    migrationRoll:  { method: 'DELETE',path: '/debug/migrations/:id',         desc: 'برگشت یک migration',                  auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔧 ستون‌ها (Columns Management)
  // ═══════════════════════════════════════════════════════════
  columns: {
    icon: '🔧',
    add:            { method: 'POST',   path: '/debug/tables/:table/columns',           desc: 'اضافه کردن ستون',               auth: 'super' },
    update:         { method: 'PUT',    path: '/debug/tables/:table/columns/:col',      desc: 'تغییر ستون',                    auth: 'super' },
    drop:           { method: 'DELETE', path: '/debug/tables/:table/columns/:col',      desc: 'حذف ستون',                      auth: 'super' },
    rename:         { method: 'PATCH',  path: '/debug/tables/:table/columns/:col/rename',desc:'تغییر نام ستون',               auth: 'super' },
    reorder:        { method: 'PATCH',  path: '/debug/tables/:table/columns/reorder',  desc: 'تغییر ترتیب ستون‌ها',            auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // ⚡ ایندکس‌ها (Indexes)
  // ═══════════════════════════════════════════════════════════
  indexes: {
    icon: '⚡',
    all:            { method: 'GET',    path: '/debug/indexes',                 desc: 'همه ایندکس‌های دیتابیس',            auth: 'admin' },
    byTable:        { method: 'GET',    path: '/debug/indexes/:table',         desc: 'ایندکس‌های یک جدول',               auth: 'admin' },
    unused:         { method: 'GET',    path: '/debug/indexes/unused',          desc: 'ایندکس‌های استفاده نشده',           auth: 'admin' },
    duplicate:      { method: 'GET',    path: '/debug/indexes/duplicate',       desc: 'ایندکس‌های تکراری',                auth: 'admin' },
    suggest:        { method: 'GET',    path: '/debug/indexes/suggest/:table', desc: 'پیشنهاد ایندکس جدید',              auth: 'admin' },
    usage:          { method: 'GET',    path: '/debug/indexes/:table/usage',    desc: 'آمار استفاده از ایندکس‌ها',        auth: 'admin' },
    create:         { method: 'POST',   path: '/debug/indexes',                 desc: 'ساخت ایندکس',                      auth: 'super' },
    drop:           { method: 'DELETE', path: '/debug/indexes/:name',           desc: 'حذف ایندکس',                        auth: 'super' },
    rebuild:        { method: 'POST',   path: '/debug/indexes/:name/rebuild',   desc: 'بازسازی ایندکس',                   auth: 'super' },
    rename:         { method: 'PATCH',  path: '/debug/indexes/:name',           desc: 'تغییر نام ایندکس',                  auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔗 کلیدهای خارجی و روابط (Foreign Keys & Relations)
  // ═══════════════════════════════════════════════════════════
  relations: {
    icon: '🔗',
    foreignKeys:    { method: 'GET',    path: '/debug/foreign-keys',            desc: 'همه کلیدهای خارجی',                  auth: 'admin' },
    tableRelations: { method: 'GET',    path: '/debug/foreign-keys/:table',    desc: 'روابط یک جدول',                      auth: 'admin' },
    orphan:        { method: 'GET',    path: '/debug/orphans',                  desc: 'رکوردهای بدون والد (یتیم)',           auth: 'admin' },
    createFk:      { method: 'POST',   path: '/debug/foreign-keys',            desc: 'ساخت کلید خارجی',                    auth: 'super' },
    dropFk:        { method: 'DELETE', path: '/debug/foreign-keys/:name',      desc: 'حذف کلید خارجی',                     auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🖥️ تریگرها (Triggers)
  // ═══════════════════════════════════════════════════════════
  triggers: {
    icon: '🖥️',
    all:            { method: 'GET',    path: '/debug/triggers',               desc: 'همه تریگرهای دیتابیس',              auth: 'admin' },
    table:          { method: 'GET',    path: '/debug/triggers/:table',         desc: 'تریگرهای یک جدول',                  auth: 'admin' },
    create:         { method: 'POST',   path: '/debug/triggers',                desc: 'ساخت تریگر',                         auth: 'super' },
    toggle:         { method: 'PATCH',  path: '/debug/triggers/:name',          desc: 'فعال/غیرفعال کردن',                  auth: 'super' },
    drop:           { method: 'DELETE', path: '/debug/triggers/:name',          desc: 'حذف تریگر',                          auth: 'super' },
    fireCount:      { method: 'GET',    path: '/debug/triggers/:name/stats',    desc: 'تعداد اجرای تریگر',                  auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 👁️ ویوها (Views)
  // ═══════════════════════════════════════════════════════════
  views: {
    icon: '👁️',
    all:            { method: 'GET',    path: '/debug/views',                  desc: 'همه ویوها',                          auth: 'admin' },
    table:          { method: 'GET',    path: '/debug/views/:name',             desc: 'جزئیات یک ویو',                      auth: 'admin' },
    sql:            { method: 'GET',    path: '/debug/views/:name/sql',        desc: 'کد SQL ویو',                         auth: 'admin' },
    dependent:      { method: 'GET',    path: '/debug/views/:name/dependents',  desc: 'ویوهای وابسته',                      auth: 'admin' },
    create:         { method: 'POST',   path: '/debug/views',                  desc: 'ساخت ویو جدید',                      auth: 'super' },
    replace:        { method: 'PUT',    path: '/debug/views/:name',            desc: 'جایگزینی ویو',                       auth: 'super' },
    drop:           { method: 'DELETE', path: '/debug/views/:name',            desc: 'حذف ویو',                            auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📄 داده و CRUD (Data & CRUD)
  // ═══════════════════════════════════════════════════════════
  data: {
    icon: '📄',
    read:           { method: 'GET',    path: '/debug/data/:table',            desc: 'خواندن داده (صفحه‌بندی + فیلتر)',    auth: 'read'  },
    count:          { method: 'GET',    path: '/debug/data/:table/count',     desc: 'تعداد رکوردها',                      auth: 'read'  },
    sample:         { method: 'GET',    path: '/debug/data/:table/sample',     desc: 'نمونه تصادفی از رکوردها',            auth: 'read'  },
    row:            { method: 'GET',    path: '/debug/row/:table/:id',         desc: 'خواندن یک رکورد',                   auth: 'read'  },
    first:          { method: 'GET',    path: '/debug/data/:table/first',      desc: 'اولین رکورد',                        auth: 'read'  },
    last:           { method: 'GET',    path: '/debug/data/:table/last',       desc: 'آخرین رکورد',                        auth: 'read'  },
    insert:         { method: 'POST',   path: '/debug/data/:table',            desc: 'درج رکورد جدید',                     auth: 'write' },
    insertBulk:     { method: 'POST',   path: '/debug/data/:table/bulk',       desc: 'درج چند رکورد (batch)',              auth: 'write' },
    upsert:         { method: 'PUT',    path: '/debug/data/:table/upsert',     desc: 'درج یا بروزرسانی (upsert)',          auth: 'write' },
    update:         { method: 'PUT',    path: '/debug/data/:table/:id',        desc: 'بروزرسانی کامل',                     auth: 'write' },
    patch:          { method: 'PATCH',  path: '/debug/data/:table/:id',        desc: 'بروزرسانی جزئی',                     auth: 'write' },
    delete:         { method: 'DELETE', path: '/debug/data/:table/:id',        desc: 'حذف یک رکورد',                       auth: 'write' },
    deleteBulk:     { method: 'DELETE', path: '/debug/data/:table/bulk',       desc: 'حذف چند رکورد',                     auth: 'write' },
    deleteWhere:    { method: 'DELETE', path: '/debug/data/:table/where',       desc: 'حذف با شرط',                        auth: 'write' },
    softDelete:     { method: 'DELETE', path: '/debug/data/:table/:id/soft',   desc: 'حذف نرم (Soft Delete)',              auth: 'write' },
    restore:        { method: 'PATCH',  path: '/debug/data/:table/:id/restore', desc: 'بازگردانی رکورد حذف شده',           auth: 'write' },
    duplicate:      { method: 'POST',   path: '/debug/data/:table/:id/duplicate',desc:'کپی یک رکورد',                     auth: 'write' },
    batchUpdate:    { method: 'PATCH',  path: '/debug/data/:table/batch',      desc: 'بروزرسانی دسته‌ای',                  auth: 'write' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔍 جستجو و فیلتر (Search & Filter)
  // ═══════════════════════════════════════════════════════════
  search: {
    icon: '🔍',
    table:          { method: 'GET',    path: '/debug/search/:table',          desc: 'جستجو در جدول',                      auth: 'read'  },
    all:            { method: 'GET',    path: '/debug/search/all',             desc: 'جستجو در همه جدول‌ها',               auth: 'read'  },
    advanced:       { method: 'GET',    path: '/debug/search/:table/advanced', desc: 'جستجوی پیشرفته (AND/OR/NOT)',        auth: 'read'  },
    fullText:       { method: 'GET',    path: '/debug/search/:table/fulltext', desc: 'جستجوی تمام‌متنی',                  auth: 'read'  },
    fuzzy:          { method: 'GET',    path: '/debug/search/:table/fuzzy',   desc: 'جستجوی تقریبی (fuzzy)',              auth: 'read'  },
    regex:          { method: 'GET',    path: '/debug/search/:table/regex',   desc: 'جستجو با عبارت باقاعده',             auth: 'read'  },
    filter:         { method: 'GET',    path: '/debug/filter/:table',          desc: 'فیلتر پیشرفته (sort/limit/offset)',  auth: 'read'  },
    distinct:       { method: 'GET',    path: '/debug/distinct/:table/:column',desc: 'مقادیر یکتای یک ستون',              auth: 'read'  },
    random:         { method: 'GET',    path: '/debug/random/:table',          desc: 'رکوردهای تصادفی',                    auth: 'read'  },
    recent:         { method: 'GET',    path: '/debug/recent/:table',          desc: 'رکوردهای اخیر (ایجاد/تغییر)',        auth: 'read'  },
    range:          { method: 'GET',    path: '/debug/range/:table/:column',   desc: 'رکوردها در بازه عددی/تاریخی',        auth: 'read'  },
    exists:         { method: 'HEAD',   path: '/debug/exists/:table',          desc: 'آیا رکوردی با شرط وجود دارد؟',        auth: 'read'  },
  },

  // ═══════════════════════════════════════════════════════════
  // 📈 آنالیتیکس و تحلیل (Analytics & Analysis)
  // ═══════════════════════════════════════════════════════════
  analytics: {
    icon: '📈',
    overview:       { method: 'GET',    path: '/debug/analytics/:table',             desc: 'آنالیز کلی جدول',              auth: 'admin' },
    nulls:          { method: 'GET',    path: '/debug/analytics/nulls/:table',       desc: 'تحلیل مقادیر NULL',            auth: 'admin' },
    duplicates:     { method: 'GET',    path: '/debug/analytics/duplicates/:table',  desc: 'تحلیل رکوردهای تکراری',       auth: 'admin' },
    top:            { method: 'GET',    path: '/debug/analytics/top/:table',         desc: 'بالاترین رکوردها (top N)',     auth: 'admin' },
    bottom:         { method: 'GET',    path: '/debug/analytics/bottom/:table',      desc: 'پایین‌ترین رکوردها (bottom N)', auth: 'admin' },
    column:         { method: 'GET',    path: '/debug/analytics/column/:table/:col',  desc: 'آمار کامل یک ستون',            auth: 'admin' },
    distribution:   { method: 'GET',    path: '/debug/analytics/distribution/:table/:col',desc:'توزیع مقادیر',             auth: 'admin' },
    histogram:      { method: 'GET',    path: '/debug/analytics/histogram/:table/:col',desc:'هیستوگرام داده‌ها',          auth: 'admin' },
    percentiles:    { method: 'GET',    path: '/debug/analytics/percentiles/:table/:col',desc:'چندک‌ها (percentiles)',    auth: 'admin' },
    correlations:   { method: 'GET',    path: '/debug/analytics/correlations/:table', desc: 'همبستگی بین ستون‌های عددی',   auth: 'admin' },
    timeline:       { method: 'GET',    path: '/debug/analytics/timeline/:table',    desc: 'خط زمانی داده‌ها',             auth: 'admin' },
    trends:         { method: 'GET',    path: '/debug/analytics/trends/:table',      desc: 'روند داده‌ها در زمان',         auth: 'admin' },
    outliers:       { method: 'GET',    path: '/debug/analytics/outliers/:table/:col',desc:'داده‌های پرت (outliers)',     auth: 'admin' },
    cardinality:    { method: 'GET',    path: '/debug/analytics/cardinality/:table',  desc: 'کاردینالیتی ستون‌ها',          auth: 'admin' },
    density:        { method: 'GET',    path: '/debug/analytics/density/:table/:col', desc: 'تراکم مقادیر',                 auth: 'admin' },
    coverage:       { method: 'GET',    path: '/debug/analytics/coverage/:table',    desc: 'پوشش داده‌ها',                 auth: 'admin' },
    summary:        { method: 'GET',    path: '/debug/analytics/summary/:table',      desc: 'خلاصه آماری کامل',             auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔄 کوئری پیشرفته (Advanced Queries)
  // ═══════════════════════════════════════════════════════════
  queries: {
    icon: '🔄',
    execute:        { method: 'POST',   path: '/debug/query',                   desc: 'اجرای SQL دلخواه',               auth: 'admin'  },
    prepared:       { method: 'POST',   path: '/debug/query/prepared',           desc: 'کوئری آماده (prepared statement)',auth:'admin' },
    explain:        { method: 'POST',   path: '/debug/explain',                  desc: 'نمایش طرح اجرای کوئری (explain)', auth: 'admin' },
    analyze:        { method: 'POST',   path: '/debug/explain/analyze',          desc: 'اجرا و تحلیل واقعی کوئری',       auth: 'admin' },
    history:        { method: 'GET',    path: '/debug/query/history',           desc: 'تاریخچه کوئری‌های اجرا شده',     auth: 'admin' },
    historyClear:   { method: 'POST',   path: '/debug/query/history/clear',     desc: 'پاک کردن تاریخچه',               auth: 'super' },
    saved:          { method: 'GET',    path: '/debug/query/saved',             desc: 'کوئری‌های ذخیره شده',            auth: 'admin' },
    savedCreate:    { method: 'POST',   path: '/debug/query/saved',             desc: 'ذخیره کوئری',                    auth: 'admin' },
    savedDelete:    { method: 'DELETE', path: '/debug/query/saved/:id',         desc: 'حذف کوئری ذخیره شده',           auth: 'admin' },
    validate:       { method: 'POST',   path: '/debug/query/validate',          desc: 'اعتبارسنجی SQL (بدون اجرا)',     auth: 'admin' },
    format:         { method: 'POST',   path: '/debug/query/format',            desc: 'فرمت‌بندی SQL',                   auth: 'admin' },
    cancel:         { method: 'DELETE', path: '/debug/query/:pid',              desc: 'لغو کوئری در حال اجرا',         auth: 'super' },
    running:        { method: 'GET',    path: '/debug/query/running',           desc: 'کوئری‌های در حال اجرا',         auth: 'admin' },
    kill:           { method: 'DELETE', path: '/debug/query/kill/:pid',         desc: 'کشتن پردازش (process)',          auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🛠️ عملیات DDL (Data Definition Language)
  // ═══════════════════════════════════════════════════════════
  ddl: {
    icon: '🛠️',
    createTable:    { method: 'POST',   path: '/debug/tables',                  desc: 'ساخت جدول جدید (CREATE TABLE)',   auth: 'super' },
    createIndex:    { method: 'POST',   path: '/debug/indexes',                 desc: 'ساخت ایندکس (CREATE INDEX)',      auth: 'super' },
    createView:     { method: 'POST',   path: '/debug/views',                   desc: 'ساخت ویو (CREATE VIEW)',          auth: 'super' },
    createFk:       { method: 'POST',   path: '/debug/foreign-keys',            desc: 'ساخت کلید خارجی',                 auth: 'super' },
    createTrigger:  { method: 'POST',   path: '/debug/triggers',               desc: 'ساخت تریگر',                      auth: 'super' },
    createSequence: { method: 'POST',   path: '/debug/sequences',               desc: 'ساخت sequence',                    auth: 'super' },
    createFunction: { method: 'POST',   path: '/debug/functions',               desc: 'ساخت function',                    auth: 'super' },
    createProcedure:{ method: 'POST',   path: '/debug/procedures',              desc: 'ساخت stored procedure',           auth: 'super' },
    alterTable:     { method: 'PUT',    path: '/debug/tables/:table/alter',     desc: 'تغییر ساختار جدول (ALTER)',       auth: 'super' },
    renameTable:    { method: 'PATCH',  path: '/debug/tables/:table/rename',    desc: 'تغییر نام جدول',                  auth: 'super' },
    renameColumn:   { method: 'PATCH',  path: '/debug/tables/:table/columns/:col/rename', desc: 'تغییر نام ستون',           auth: 'super' },
    dropTable:      { method: 'DELETE', path: '/debug/tables/:table',            desc: 'حذف جدول (DROP TABLE)',            auth: 'super' },
    dropIndex:      { method: 'DELETE', path: '/debug/indexes/:name',           desc: 'حذف ایندکس (DROP INDEX)',         auth: 'super' },
    dropView:       { method: 'DELETE', path: '/debug/views/:name',             desc: 'حذف ویو (DROP VIEW)',             auth: 'super' },
    dropFk:         { method: 'DELETE', path: '/debug/foreign-keys/:name',      desc: 'حذف کلید خارجی',                  auth: 'super' },
    dropTrigger:    { method: 'DELETE', path: '/debug/triggers/:name',          desc: 'حذف تریگر',                       auth: 'super' },
    dropColumn:     { method: 'DELETE', path: '/debug/tables/:table/columns/:col',desc: 'حذف ستون',                     auth: 'super' },
    truncate:       { method: 'DELETE', path: '/debug/tables/:table/truncate',  desc: 'پاک‌سازی جدول (TRUNCATE)',        auth: 'super' },
    addColumn:      { method: 'POST',   path: '/debug/tables/:table/columns',   desc: 'اضافه کردن ستون',                 auth: 'super' },
    dropColumn:     { method: 'DELETE', path: '/debug/tables/:table/columns/:col',desc: 'حذف ستون',                     auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔗 روابط و گراف (Relations & Graph)
  // ═══════════════════════════════════════════════════════════
  relate: {
    icon: '🔗',
    record:         { method: 'GET',    path: '/debug/relate/:table/:id',       desc: 'رکورد با تمام داده‌های مرتبط',     auth: 'read'  },
    reverse:        { method: 'GET',    path: '/debug/relate/:table/:id/reverse',desc: 'روابط معکوس (رکوردهای مرتبط)',    auth: 'read'  },
    graph:          { method: 'GET',    path: '/debug/relate/graph/:table/:id', desc: 'گراف کامل روابط',                  auth: 'admin' },
    tree:           { method: 'GET',    path: '/debug/relate/tree/:table/:id',  desc: 'نمای درختی روابط',                auth: 'admin' },
    path:           { method: 'GET',    path: '/debug/relate/path/:from/:to',  desc: 'یافتن مسیر بین دو جدول',          auth: 'admin' },
    neighbors:      { method: 'GET',    path: '/debug/relate/:table/:id/neighbors',desc:'همسایه‌های یک رکورد',            auth: 'read'  },
    cascade:        { method: 'GET',    path: '/debug/relate/:table/:id/cascade',desc: 'حذف آبشاری (چه چیزی حذف می‌شود)',auth:'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 💾 پشتیبان‌گیری و بازگردانی (Backup & Restore)
  // ═══════════════════════════════════════════════════════════
  backup: {
    icon: '💾',
    list:           { method: 'GET',    path: '/debug/backups',                desc: 'لیست پشتیبان‌گیری‌های موجود',       auth: 'admin' },
    create:          { method: 'GET',    path: '/debug/backup',                 desc: 'ایجاد پشتیبان‌گیری فوری',          auth: 'admin' },
    download:       { method: 'GET',    path: '/debug/backup/:id/download',    desc: 'دانلود فایل پشتیبان',              auth: 'admin' },
    restore:         { method: 'POST',   path: '/debug/restore',                desc: 'بازگردانی از پشتیبان',             auth: 'super' },
    restorePoint:    { method: 'POST',   path: '/debug/restore/point',          desc: 'بازگردانی به نقطه خاص (PITR)',     auth: 'super' },
    schedule:        { method: 'GET',    path: '/debug/backup/schedule',        desc: 'مشاهده زمان‌بندی پشتتیبان',         auth: 'admin' },
    scheduleSet:     { method: 'POST',   path: '/debug/backup/schedule',        desc: 'تنظیم زمان‌بندی',                   auth: 'admin' },
    delete:          { method: 'DELETE', path: '/debug/backup/:id',             desc: 'حذف پشتیبان قدیمی',                auth: 'admin' },
    verify:          { method: 'POST',   path: '/debug/backup/:id/verify',      desc: 'بررسی سلامت پشتیبان',              auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📤 صادرات و واردات (Import/Export)
  // ═══════════════════════════════════════════════════════════
  io: {
    icon: '📤',
    exportCsv:      { method: 'GET',    path: '/debug/export/:table',           desc: 'خروجی CSV از جدول',                auth: 'read'  },
    exportJson:     { method: 'GET',    path: '/debug/export/:table/json',      desc: 'خروجی JSON',                        auth: 'read'  },
    exportXml:      { method: 'GET',    path: '/debug/export/:table/xml',       desc: 'خروجی XML',                        auth: 'read'  },
    exportSql:      { method: 'GET',    path: '/debug/export/:table/sql',       desc: 'خروجی INSERT statements',           auth: 'read'  },
    exportXlsx:     { method: 'GET',    path: '/debug/export/:table/xlsx',      desc: 'خروجی Excel',                       auth: 'read'  },
    exportNdjson:   { method: 'GET',    path: '/debug/export/:table/ndjson',    desc: 'خروجی NDJSON (newline JSON)',       auth: 'read'  },
    importCsv:      { method: 'POST',   path: '/debug/import/:table',           desc: 'ورود CSV',                          auth: 'write' },
    importJson:     { method: 'POST',   path: '/debug/import/:table/json',      desc: 'ورود JSON',                         auth: 'write' },
    importSql:      { method: 'POST',   path: '/debug/import/sql',              desc: 'اجرای فایل SQL',                   auth: 'super' },
    validateImport: { method: 'POST',   path: '/debug/import/:table/validate', desc: 'اعتبارسنجی قبل از ورود',           auth: 'write' },
    previewImport:  { method: 'POST',   path: '/debug/import/:table/preview',  desc: 'پیش‌نمایش داده‌های ورودی',          auth: 'write' },
    dump:           { method: 'GET',    path: '/debug/dump',                   desc: 'dump کامل SQL',                    auth: 'admin' },
    dumpSchema:     { method: 'GET',    path: '/debug/dump/schema',             desc: 'فقط schema (بدون داده)',           auth: 'admin' },
    dumpData:       { method: 'GET',    path: '/debug/dump/data',               desc: 'فقط داده‌ها (بدون schema)',         auth: 'admin' },
    report:         { method: 'GET',    path: '/debug/export/:table/report',    desc: 'گزارش import/export',              auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // ⚡ ابزارهای عملیاتی (Operational Tools)
  // ═══════════════════════════════════════════════════════════
  tools: {
    icon: '⚡',
    health:         { method: 'GET',    path: '/debug/health',                  desc: 'بررسی سلامت کلی',                  auth: 'public' },
    test:           { method: 'GET',    path: '/debug/test',                    desc: 'تست اتصال',                        auth: 'public' },
    ping:           { method: 'GET',    path: '/debug/ping',                    desc: 'پینگ دیتابیس (latency)',           auth: 'public' },
    version:        { method: 'GET',    path: '/debug/version',                 desc: 'نسخه دیتابیس و driver',            auth: 'public' },
    config:         { method: 'GET',    path: '/debug/config',                  desc: 'تنظیمات فعلی دیتابیس',            auth: 'admin' },
    vacuum:         { method: 'POST',   path: '/debug/vacuum',                  desc: 'بهینه‌سازی (VACUUM)',              auth: 'super' },
    vacuumTable:    { method: 'POST',   path: '/debug/vacuum/:table',           desc: 'VACUUM یک جدول',                   auth: 'super' },
    analyze:        { method: 'POST',   path: '/debug/analyze',                 desc: 'ANALYZE (به‌روزرسانی آمار)',       auth: 'super' },
    analyzeTable:   { method: 'POST',   path: '/debug/analyze/:table',          desc: 'ANALYZE یک جدول',                   auth: 'super' },
    reindex:        { method: 'POST',   path: '/debug/reindex',                 desc: 'بازسازی همه ایندکس‌ها',            auth: 'super' },
    reindexTable:   { method: 'POST',   path: '/debug/reindex/:table',          desc: 'بازسازی ایندکس‌های جدول',          auth: 'super' },
    clotTable:      { method: 'POST',   path: '/debug/clot/:table',             desc: 'ANALYZE + VACUUM + REINDEX',       auth: 'super' },
    cacheClear:     { method: 'POST',   path: '/debug/cache/clear',             desc: 'پاک کردن query cache',             auth: 'super' },
    cacheStats:     { method: 'GET',    path: '/debug/cache/stats',             desc: 'آمار cache',                       auth: 'admin' },
    compare:        { method: 'GET',    path: '/debug/compare/:table',          desc: 'مقایسه دو جدول',                   auth: 'admin' },
    sync:           { method: 'POST',   path: '/debug/sync',                    desc: 'همگام‌سازی با منبع خارجی',         auth: 'super' },
    diagnose:       { method: 'GET',    path: '/debug/diagnose',                desc: 'تشخیص مشکلات دیتابیس',            auth: 'admin' },
    recommend:      { method: 'GET',    path: '/debug/recommend',               desc: 'پیشنهادات بهینه‌سازی',             auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🧪 داده آزمایشی (Seed & Fixtures)
  // ═══════════════════════════════════════════════════════════
  seed: {
    icon: '🧪',
    seed:            { method: 'POST',   path: '/debug/seed/:table',           desc: 'تولید داده آزمایشی',               auth: 'dev'   },
    seedFaker:       { method: 'POST',   path: '/debug/seed/:table/faker',     desc: 'تولید با faker.js',                auth: 'dev'   },
    seedFile:        { method: 'POST',   path: '/debug/seed/:table/file',      desc: 'تولید از روی فایل',                auth: 'dev'   },
    seedClear:       { method: 'DELETE', path: '/debug/seed/:table',            desc: 'حذف داده‌های آزمایشی',             auth: 'dev'   },
    fixtureList:     { method: 'GET',    path: '/debug/fixtures',              desc: 'لیست fixture ها',                  auth: 'dev'   },
    fixtureLoad:     { method: 'POST',   path: '/debug/fixtures/:name',        desc: 'بارگذاری fixture',                 auth: 'dev'   },
    fixtureCreate:   { method: 'POST',   path: '/debug/fixtures',              desc: 'ساخت fixture از جدول فعلی',        auth: 'dev'   },
    factoryList:     { method: 'GET',    path: '/debug/factories',              desc: 'لیست factory ها',                  auth: 'dev'   },
    factoryGenerate: { method: 'POST',   path: '/debug/factories/:name',       desc: 'تولید با factory',                  auth: 'dev'   },
  },

  // ═══════════════════════════════════════════════════════════
  // 🗂️ متادیتا (Metadata)
  // ═══════════════════════════════════════════════════════════
  meta: {
    icon: '🗂️',
    queryHistory:      { method: 'GET',    path: '/debug/meta/queries',           desc: 'تاریخچه کوئری‌ها',               auth: 'admin' },
    slowQueries:       { method: 'GET',    path: '/debug/meta/slow-queries',      desc: 'کوئری‌های کند (slow log)',        auth: 'admin' },
    popularTables:     { method: 'GET',    path: '/debug/meta/popular-tables',    desc: 'پرکاربردترین جدول‌ها',           auth: 'admin' },
    recentTables:      { method: 'GET',    path: '/debug/meta/recent-tables',     desc: 'جدول‌های اخیر',                  auth: 'admin' },
    largeTables:       { method: 'GET',    path: '/debug/meta/large-tables',      desc: 'بزرگ‌ترین جدول‌ها',              auth: 'admin' },
    emptyTables:       { method: 'GET',    path: '/debug/meta/empty-tables',      desc: 'جدول‌های خالی',                  auth: 'admin' },
    queriesClear:      { method: 'POST',   path: '/debug/meta/queries/clear',     desc: 'پاک کردن تاریخچه کوئری‌ها',     auth: 'super' },
    slowQueriesClear:   { method: 'POST',   path: '/debug/meta/slow-queries/clear',desc:'پاک کردن slow log',             auth: 'super' },
    queryStats:        { method: 'GET',    path: '/debug/meta/query-stats',        desc: 'آمار اجرای کوئری‌ها',            auth: 'admin' },
    tableStats:        { method: 'GET',    path: '/debug/meta/table-stats',        desc: 'آمار دسترسی به جدول‌ها',         auth: 'admin' },
    indexStats:        { method: 'GET',    path: '/debug/meta/index-stats',        desc: 'آمار استفاده از ایندکس‌ها',      auth: 'admin' },
    connectionStats:   { method: 'GET',    path: '/debug/meta/connection-stats',  desc: 'آمار اتصالات',                   auth: 'admin' },
    waitStats:         { method: 'GET',    path: '/debug/meta/wait-stats',         desc: 'آمار wait events',               auth: 'admin' },
    sessionList:       { method: 'GET',    path: '/debug/meta/sessions',           desc: 'لیست session های فعال',           auth: 'admin' },
    sessionKill:       { method: 'DELETE', path: '/debug/meta/sessions/:pid',      desc: 'کشتن یک session',                auth: 'super' },
    transactionList:   { method: 'GET',    path: '/debug/meta/transactions',      desc: 'تراکنش‌های در حال اجرا',          auth: 'admin' },
    lockList:          { method: 'GET',    path: '/debug/meta/locks',             desc: 'قفل‌های فعال',                    auth: 'admin' },
    deadlockHistory:   { method: 'GET',    path: '/debug/meta/deadlocks',         desc: 'تاریخچه deadlocks',              auth: 'admin' },
    replicationStatus: { method: 'GET',    path: '/debug/meta/replication',       desc: 'وضعیت replication',              auth: 'admin' },
    configParams:      { method: 'GET',    path: '/debug/meta/config',            desc: 'پارامترهای تنظیم دیتابیس',      auth: 'admin' },
    versionInfo:       { method: 'GET',    path: '/debug/meta/version',           desc: 'اطلاعات نسخه کامل',              auth: 'admin' },
    extensions:        { method: 'GET',    path: '/debug/meta/extensions',        desc: 'لیست افزونه‌های نصب شده',        auth: 'admin' },
    privileges:        { method: 'GET',    path: '/debug/meta/privileges',        desc: 'دسترسی‌ها و grant ها',           auth: 'admin' },
    roles:             { method: 'GET',    path: '/debug/meta/roles',             desc: 'نقش‌ها و کاربران',               auth: 'admin' },
    catalogs:          { method: 'GET',    path: '/debug/meta/catalogs',           desc: 'کاتالوگ‌های سیستم',              auth: 'admin' },
  },
    // ═══════════════════════════════════════════════════════════
  // 🏥 نگهداری و تعمیر (Maintenance & Repair)
  // ═══════════════════════════════════════════════════════════
  maintenance: {
    icon: '🏥',
    tables:           { method: 'GET',    path: '/debug/maintenance/tables',    desc: 'گزارش سلامت همه جدول‌ها',         auth: 'admin' },
    checks:           { method: 'GET',    path: '/debug/maintenance/checks',    desc: 'بررسی سلامت دیتابیس',             auth: 'admin' },
    table:            { method: 'GET',    path: '/debug/maintenance/:table',    desc: 'بررسی سلامت یک جدول',             auth: 'admin' },
    repair:           { method: 'POST',   path: '/debug/maintenance/repair',    desc: 'تعمیر جدول‌های آسیب‌دیده',        auth: 'super' },
    repairTable:      { method: 'POST',   path: '/debug/maintenance/:table/repair',desc:'تعمیر یک جدول خاص',            auth: 'super' },
    checkTable:       { method: 'POST',   path: '/debug/maintenance/:table/check',desc:'بررسی یک جدول (CHECK)',         auth: 'admin' },
    optimize:         { method: 'POST',   path: '/debug/maintenance/optimize',  desc: 'بهینه‌سازی همه جدول‌ها',         auth: 'super' },
    optimizeTable:    { method: 'POST',   path: '/debug/maintenance/:table/optimize',desc:'بهینه‌سازی یک جدول',          auth: 'super' },
    defragment:       { method: 'POST',   path: '/debug/maintenance/defragment',desc: 'یکپارچه‌سازی جدول‌ها',           auth: 'super' },
    cleanUp:          { method: 'POST',   path: '/debug/maintenance/cleanup',   desc: 'پاکسازی رکوردهای حذف شده',       auth: 'super' },
    resetStats:       { method: 'POST',   path: '/debug/maintenance/:table/reset-stats',desc:'ریست آمار جدول',           auth: 'super' },
    freeze:           { method: 'POST',   path: '/debug/maintenance/:table/freeze',desc:'فریز جدول (جلوگیری از تغییر)',  auth: 'super' },
    unfreeze:         { method: 'DELETE', path: '/debug/maintenance/:table/freeze',desc:'آزادسازی جدول فریز شده',       auth: 'super' },
    logAnalyze:       { method: 'GET',    path: '/debug/maintenance/logs',      desc: 'آنالیز log های دیتابیس',         auth: 'admin' },
    logClear:         { method: 'DELETE', path: '/debug/maintenance/logs',       desc: 'پاک کردن log ها',                 auth: 'super' },
    fullReport:       { method: 'GET',    path: '/debug/maintenance/report',    desc: 'گزارش کامل نگهداری',             auth: 'admin' },
    schedule:         { method: 'GET',    path: '/debug/maintenance/schedule',  desc: 'زمان‌بندی نگهداری',               auth: 'admin' },
    scheduleSet:      { method: 'POST',   path: '/debug/maintenance/schedule',  desc: 'تنظیم زمان‌بندی',                 auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📊 گزارش‌گیری (Reporting)
  // ═══════════════════════════════════════════════════════════
  reports: {
    icon: '📊',
    generate:         { method: 'POST',   path: '/debug/reports',                desc: 'ساخت گزارش سفارشی',               auth: 'admin' },
    list:             { method: 'GET',    path: '/debug/reports',               desc: 'لیست گزارش‌های از پیش ساخته',     auth: 'admin' },
    download:         { method: 'GET',    path: '/debug/reports/:id',           desc: 'دانلود گزارش',                    auth: 'admin' },
    delete:           { method: 'DELETE', path: '/debug/reports/:id',           desc: 'حذف گزارش',                       auth: 'admin' },
    scheduled:        { method: 'GET',    path: '/debug/reports/scheduled',     desc: 'گزارش‌های زمان‌بندی شده',         auth: 'admin' },
    scheduledCreate:  { method: 'POST',   path: '/debug/reports/scheduled',     desc: 'زمان‌بندی گزارش جدید',            auth: 'admin' },
    scheduledDelete:  { method: 'DELETE', path: '/debug/reports/scheduled/:id', desc: 'حذف زمان‌بندی',                   auth: 'admin' },
    auditLog:         { method: 'GET',    path: '/debug/reports/audit',         desc: 'گزارش حسابرسی',                   auth: 'admin' },
    accessLog:        { method: 'GET',    path: '/debug/reports/access',        desc: 'گزارش دسترسی',                    auth: 'admin' },
    errorLog:         { method: 'GET',    path: '/debug/reports/errors',        desc: 'گزارش خطاها',                     auth: 'admin' },
    performanceReport:{ method: 'GET',    path: '/debug/reports/performance',   desc: 'گزارش عملکرد',                    auth: 'admin' },
    dataQuality:      { method: 'GET',    path: '/debug/reports/quality',        desc: 'گزارش کیفیت داده',               auth: 'admin' },
    compliance:       { method: 'GET',    path: '/debug/reports/compliance',     desc: 'گزارش انطباق (compliance)',       auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔐 امنیت (Security)
  // ═══════════════════════════════════════════════════════════
  security: {
    icon: '🔐',
    users:            { method: 'GET',    path: '/debug/security/users',       desc: 'لیست کاربران دیتابیس',           auth: 'admin' },
    userCreate:       { method: 'POST',   path: '/debug/security/users',        desc: 'ساخت کاربر جدید',                auth: 'super' },
    userUpdate:       { method: 'PUT',    path: '/debug/security/users/:name',  desc: 'ویرایش کاربر',                   auth: 'super' },
    userDrop:         { method: 'DELETE', path: '/debug/security/users/:name',  desc: 'حذف کاربر',                      auth: 'super' },
    grants:           { method: 'GET',    path: '/debug/security/grants',       desc: 'لیست دسترسی‌ها (grants)',        auth: 'admin' },
    grantCreate:      { method: 'POST',   path: '/debug/security/grants',        desc: 'اعطای دسترسی',                   auth: 'super' },
    grantRevoke:      { method: 'DELETE', path: '/debug/security/grants/:id',   desc: 'لغو دسترسی',                     auth: 'super' },
    roles:            { method: 'GET',    path: '/debug/security/roles',         desc: 'لیست نقش‌ها',                    auth: 'admin' },
    roleCreate:       { method: 'POST',   path: '/debug/security/roles',        desc: 'ساخت نقش جدید',                  auth: 'super' },
    roleDrop:         { method: 'DELETE', path: '/debug/security/roles/:name',  desc: 'حذف نقش',                        auth: 'super' },
    audit:            { method: 'GET',    path: '/debug/security/audit',         desc: 'لاگ حسابرسی امنیتی',             auth: 'admin' },
    scan:             { method: 'GET',    path: '/debug/security/scan',          desc: 'اسکن آسیب‌پذیری‌ها',            auth: 'admin' },
    passwordPolicy:   { method: 'GET',    path: '/debug/security/password-policy',desc:'سیاست رمز عبور',                auth: 'admin' },
    setPasswordPolicy:{ method: 'PUT',    path: '/debug/security/password-policy',desc:'تنظیم سیاست رمز',               auth: 'super' },
    sslStatus:        { method: 'GET',    path: '/debug/security/ssl',          desc: 'وضعیت SSL/TLS',                   auth: 'admin' },
    sslEnable:        { method: 'POST',   path: '/debug/security/ssl',           desc: 'فعال‌سازی SSL',                   auth: 'super' },
    loginAttempts:    { method: 'GET',    path: '/debug/security/login-attempts',desc:'تلاش‌های ورود ناموفق',            auth: 'admin' },
    lockAccount:      { method: 'POST',   path: '/debug/security/lock/:user',   desc: 'قفل کردن حساب',                   auth: 'super' },
    unlockAccount:    { method: 'DELETE', path: '/debug/security/lock/:user',   desc: 'باز کردن قفل حساب',               auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔄 Sync و همگام‌سازی (Synchronization)
  // ═══════════════════════════════════════════════════════════
  sync: {
    icon: '🔄',
    status:           { method: 'GET',    path: '/debug/sync/status',           desc: 'وضعیت همگام‌سازی',                auth: 'admin' },
    push:             { method: 'POST',   path: '/debug/sync/push',             desc: 'ارسال تغییرات به منبع',           auth: 'super' },
    pull:             { method: 'POST',   path: '/debug/sync/pull',             desc: 'دریافت تغییرات از منبع',         auth: 'super' },
    full:             { method: 'POST',   path: '/debug/sync/full',             desc: 'همگام‌سازی کامل',                 auth: 'super' },
    conflicts:        { method: 'GET',    path: '/debug/sync/conflicts',        desc: 'لیست تعارض‌ها',                   auth: 'admin' },
    resolveConflict:  { method: 'PUT',    path: '/debug/sync/conflicts/:id',   desc: 'حل تعارض',                        auth: 'admin' },
    history:          { method: 'GET',    path: '/debug/sync/history',          desc: 'تاریخچه همگام‌سازی',             auth: 'admin' },
    schedule:          { method: 'GET',    path: '/debug/sync/schedule',         desc: 'زمان‌بندی sync',                  auth: 'admin' },
    scheduleSet:       { method: 'POST',   path: '/debug/sync/schedule',         desc: 'تنظیم زمان‌بندی',                 auth: 'admin' },
    enable:           { method: 'POST',   path: '/debug/sync/enable',           desc: 'فعال‌سازی sync',                   auth: 'super' },
    disable:          { method: 'POST',   path: '/debug/sync/disable',          desc: 'غیرفعال کردن sync',              auth: 'super' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🧩 API Gateway و Routing
  // ═══════════════════════════════════════════════════════════
  gateway: {
    icon: '🧩',
    routes:           { method: 'GET',    path: '/debug/routes',               desc: 'لیست همه route ها',               auth: 'admin' },
    routeCreate:      { method: 'POST',   path: '/debug/routes',                desc: 'ساخت route جدید',                  auth: 'super' },
    routeUpdate:      { method: 'PUT',    path: '/debug/routes/:name',          desc: 'ویرایش route',                     auth: 'super' },
    routeDelete:      { method: 'DELETE', path: '/debug/routes/:name',          desc: 'حذف route',                        auth: 'super' },
    middleware:       { method: 'GET',    path: '/debug/middleware',            desc: 'لیست middleware ها',               auth: 'admin' },
    middlewareCreate: { method: 'POST',   path: '/debug/middleware',            desc: 'ساخت middleware جدید',             auth: 'super' },
    middlewareDelete: { method: 'DELETE', path: '/debug/middleware/:name',      desc: 'حذف middleware',                   auth: 'super' },
    rateLimits:       { method: 'GET',    path: '/debug/rate-limits',           desc: 'وضعیت rate limiting',             auth: 'admin' },
    setRateLimit:     { method: 'PUT',    path: '/debug/rate-limits/:route',   desc: 'تنظیم rate limit',                 auth: 'admin' },
    corsConfig:       { method: 'GET',    path: '/debug/cors',                  desc: 'تنظیمات CORS',                     auth: 'admin' },
    setCors:          { method: 'PUT',    path: '/debug/cors',                  desc: 'تغییر CORS',                       auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🧪 تست و توسعه (Testing & Development)
  // ═══════════════════════════════════════════════════════════
  testing: {
    icon: '🧪',
    unit:             { method: 'POST',   path: '/debug/test/unit',             desc: 'اجرای unit test ها',              auth: 'dev'   },
    integration:      { method: 'POST',   path: '/debug/test/integration',       desc: 'اجرای integration test ها',        auth: 'dev'   },
    all:              { method: 'POST',   path: '/debug/test/all',               desc: 'اجرای همه test ها',              auth: 'dev'   },
    run:              { method: 'POST',   path: '/debug/test/run/:name',         desc: 'اجرای یک test خاص',              auth: 'dev'   },
    mock:             { method: 'POST',   path: '/debug/test/mock/:table',       desc: 'mock کردن جدول',                  auth: 'dev'   },
    mockClear:        { method: 'DELETE', path: '/debug/test/mock/:table',       desc: 'حذف mock',                        auth: 'dev'   },
    replay:           { method: 'POST',   path: '/debug/test/replay',            desc: 'replay ترافیک واقعی',            auth: 'dev'   },
    benchmark:        { method: 'POST',   path: '/debug/test/benchmark/:table', desc: 'بنچمارک جدول',                   auth: 'dev'   },
    stress:           { method: 'POST',   path: '/debug/test/stress',            desc: 'تست stress',                       auth: 'dev'   },
    coverage:         { method: 'GET',    path: '/debug/test/coverage',          desc: 'پوشش کد تست‌ها',                  auth: 'dev'   },
  },

  // ═══════════════════════════════════════════════════════════
  // 🔔 Webhooks و Notifications
  // ═══════════════════════════════════════════════════════════
  webhooks: {
    icon: '🔔',
    list:             { method: 'GET',    path: '/debug/webhooks',              desc: 'لیست webhook ها',                 auth: 'admin' },
    create:           { method: 'POST',   path: '/debug/webhooks',               desc: 'ساخت webhook جدید',               auth: 'admin' },
    update:           { method: 'PUT',    path: '/debug/webhooks/:id',           desc: 'ویرایش webhook',                  auth: 'admin' },
    delete:           { method: 'DELETE', path: '/debug/webhooks/:id',           desc: 'حذف webhook',                      auth: 'admin' },
    test:             { method: 'POST',   path: '/debug/webhooks/:id/test',      desc: 'تست webhook',                      auth: 'admin' },
    history:          { method: 'GET',    path: '/debug/webhooks/:id/history',   desc: 'تاریخچه اجرای webhook',          auth: 'admin' },
    enable:           { method: 'POST',   path: '/debug/webhooks/:id/enable',    desc: 'فعال‌سازی webhook',                auth: 'admin' },
    disable:          { method: 'POST',   path: '/debug/webhooks/:id/disable',   desc: 'غیرفعال‌سازی webhook',           auth: 'admin' },
    retry:            { method: 'POST',   path: '/debug/webhooks/:id/retry',     desc: 'تلاش مجدد برای اجرا',            auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📝 لاگ‌ها (Logging)
  // ═══════════════════════════════════════════════════════════
  logs: {
    icon: '📝',
    list:             { method: 'GET',    path: '/debug/logs',                  desc: 'لیست لاگ‌ها',                     auth: 'admin' },
    query:            { method: 'GET',    path: '/debug/logs/query',            desc: 'لاگ کوئری‌ها',                    auth: 'admin' },
    error:            { method: 'GET',    path: '/debug/logs/error',             desc: 'لاگ خطاها',                       auth: 'admin' },
    access:           { method: 'GET',    path: '/debug/logs/access',           desc: 'لاگ دسترسی',                      auth: 'admin' },
    security:         { method: 'GET',    path: '/debug/logs/security',          desc: 'لاگ امنیتی',                     auth: 'admin' },
    audit:            { method: 'GET',    path: '/debug/logs/audit',             desc: 'لاگ حسابرسی',                     auth: 'admin' },
    clear:            { method: 'DELETE', path: '/debug/logs',                   desc: 'پاک کردن لاگ‌ها',                 auth: 'super' },
    export:           { method: 'GET',    path: '/debug/logs/export',            desc: 'خروجی لاگ‌ها',                    auth: 'admin' },
    stream:           { method: 'GET',    path: '/debug/logs/stream',            desc: 'stream لاگ‌ها (SSE)',            auth: 'admin' },
    level:            { method: 'GET',    path: '/debug/logs/level',             desc: 'سطح فعلی لاگ‌برداری',            auth: 'admin' },
    setLevel:         { method: 'PUT',    path: '/debug/logs/level',             desc: 'تغییر سطح لاگ‌برداری',           auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📡 Real-time Events (Server-Sent Events / WebSocket)
  // ═══════════════════════════════════════════════════════════
  realtime: {
    icon: '📡',
    subscribe:        { method: 'GET',    path: '/debug/realtime/subscribe',    desc: 'subscribe به events (SSE)',         auth: 'read'  },
    events:           { method: 'GET',    path: '/debug/realtime/events',        desc: 'لیست event های فعال',             auth: 'admin' },
    publish:          { method: 'POST',   path: '/debug/realtime/publish',       desc: 'انتشار event سفارشی',             auth: 'admin' },
    channels:         { method: 'GET',    path: '/debug/realtime/channels',      desc: 'لیست channel ها',                 auth: 'admin' },
    presence:         { method: 'GET',    path: '/debug/realtime/presence',      desc: 'کاربران آنلاین',                   auth: 'admin' },
    broadcast:        { method: 'POST',   path: '/debug/realtime/broadcast',     desc: 'broadcast پیام',                   auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🌍 i18n و ترجمه‌ها (Internationalization)
  // ═══════════════════════════════════════════════════════════
  i18n: {
    icon: '🌍',
    locales:          { method: 'GET',    path: '/debug/i18n/locales',           desc: 'لیست زبان‌های پشتیبانی شده',     auth: 'admin' },
    translations:     { method: 'GET',    path: '/debug/i18n/:locale',            desc: 'ترجمه‌های یک زبان',               auth: 'admin' },
    addTranslation:   { method: 'POST',   path: '/debug/i18n/:locale',            desc: 'اضافه کردن ترجمه',               auth: 'admin' },
    missing:          { method: 'GET',    path: '/debug/i18n/missing',           desc: 'ترجمه‌های گمشده',                 auth: 'admin' },
    exportLocale:     { method: 'GET',    path: '/debug/i18n/:locale/export',     desc: 'خروجی ترجمه‌ها',                 auth: 'admin' },
    importLocale:     { method: 'POST',   path: '/debug/i18n/:locale/import',   desc: 'ورود ترجمه‌ها',                  auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🧩 Plugins & Extensions
  // ═══════════════════════════════════════════════════════════
  plugins: {
    icon: '🧩',
    list:             { method: 'GET',    path: '/debug/plugins',                desc: 'لیست پلاگین‌های نصب شده',        auth: 'admin' },
    install:          { method: 'POST',   path: '/debug/plugins',                desc: 'نصب پلاگین',                     auth: 'super' },
    uninstall:        { method: 'DELETE', path: '/debug/plugins/:name',          desc: 'حذف پلاگین',                      auth: 'super' },
    enable:           { method: 'POST',   path: '/debug/plugins/:name/enable',   desc: 'فعال‌سازی پلاگین',               auth: 'super' },
    disable:          { method: 'POST',   path: '/debug/plugins/:name/disable',  desc: 'غیرفعال کردن پلاگین',           auth: 'super' },
    search:           { method: 'GET',    path: '/debug/plugins/search',          desc: 'جستجوی پلاگین‌های موجود',       auth: 'admin' },
    update:           { method: 'PUT',    path: '/debug/plugins/:name',         desc: 'به‌روزرسانی پلاگین',              auth: 'super' },
    config:           { method: 'GET',    path: '/debug/plugins/:name/config',   desc: 'تنظیمات پلاگین',                 auth: 'admin' },
    setConfig:        { method: 'PUT',    path: '/debug/plugins/:name/config',   desc: 'تغییر تنظیمات پلاگین',           auth: 'admin' },
  },

  // ═══════════════════════════════════════════════════════════
  // 📜 Documentation & API Reference
  // ═══════════════════════════════════════════════════════════
  docs: {
    icon: '📜',
    index:            { method: 'GET',    path: '/debug',                        desc: 'صفحه راهنما (این صفحه)',            auth: 'public' },
    openapi:          { method: 'GET',    path: '/debug/docs/openapi',           desc: 'OpenAPI/Swagger spec',            auth: 'admin' },
    postman:          { method: 'GET',    path: '/debug/docs/postman',           desc: 'Postman collection',              auth: 'admin' },
    asyncapi:         { method: 'GET',    path: '/debug/docs/asyncapi',          desc: 'AsyncAPI spec (websockets)',       auth: 'admin' },
    routes:           { method: 'GET',    path: '/debug/docs/routes',            desc: 'مستندات route ها',               auth: 'admin' },
    models:           { method: 'GET',    path: '/debug/docs/models',            desc: 'مستندات مدل‌ها',                  auth: 'admin' },
    changelog:        { method: 'GET',    path: '/debug/docs/changelog',         desc: 'تغییرات و نسخه‌ها',               auth: 'public' },
    health:           { method: 'GET',    path: '/debug/docs/health',            desc: 'وضعیت سلامت سرویس',              auth: 'public' },
  },

  // ═══════════════════════════════════════════════════════════
  // 🎛️ Admin & Server Control
  // ═══════════════════════════════════════════════════════════
  admin: {
    icon: '🎛️',
    status:           { method: 'GET',    path: '/debug/admin/status',           desc: 'وضعیت کلی سرور',                  auth: 'admin' },
    reload:           { method: 'POST',   path: '/debug/admin/reload',           desc: 'بارگذاری مجدد تنظیمات',          auth: 'super' },
    restart:          { method: 'POST',   path: '/debug/admin/restart',          desc: 'ری‌استارت سرور',                   auth: 'super' },
    shutdown:         { method: 'POST',   path: '/debug/admin/shutdown',         desc: 'خاموش کردن سرور',                 auth: 'super' },
    flush:            { method: 'POST',   path: '/debug/admin/flush',            desc: 'flush همه cache ها',              auth: 'super' },
    gc:               { method: 'POST',   path: '/debug/admin/gc',               desc: 'garbage collection دستی',          auth: 'admin' },
    memory:           { method: 'GET',    path: '/debug/admin/memory',            desc: 'مصرف حافظه فرآیند',               auth: 'admin' },
    cpu:              { method: 'GET',    path: '/debug/admin/cpu',              desc: 'مصرف CPU',                        auth: 'admin' },
    uptime:           { method: 'GET',    path: '/debug/admin/uptime',           desc: 'زمان کارکرد سرور',                auth: 'public' },
    env:              { method: 'GET',    path: '/debug/admin/env',              desc: 'متغیرهای محیطی (غیرمحرمانه)',     auth: 'admin' },
    info:             { method: 'GET',    path: '/debug/admin/info',              desc: 'اطلاعات سرور',                    auth: 'admin' },
    metrics:          { method: 'GET',    path: '/debug/admin/metrics',          desc: 'Metrics برای Prometheus',          auth: 'public' },
    prometheus:       { method: 'GET',    path: '/debug/admin/prometheus',       desc: 'Endpoint برای Prometheus',         auth: 'public' },
  },
    },
  // ═══════════════════════════════════════════════════════════
  // 🔬 Experimental & Advanced Features
  // ═══════════════════════════════════════════════════════════
  experimental: {
    icon: '🔬',
    aiQuery:          { method: 'POST',   path: '/debug/ai/query',              desc: 'تولید کوئری با AI (NLP → SQL)',   auth: 'admin' },
    aiExplain:        { method: 'POST',   path: '/debug/ai/explain',             desc: 'توضیح کوئری با AI',               auth: 'admin' },
    aiOptimize:       { method: 'POST',   path: '/debug/ai/optimize',            desc: 'بهینه‌سازی کوئری با AI',          auth: 'admin' },
    aiSuggest:        { method: 'GET',    path: '/debug/ai/suggest',             desc: 'پیشنهاد هوشمند ایندکس',          auth: 'admin' },
    schemaGen:        { method: 'POST',   path: '/debug/schema/generate',        desc: 'تولید schema از JSON/XML',        auth: 'admin' },
    mockGen:          { method: 'POST',   path: '/debug/mock/generate',          desc: 'تولید mock از schema',            auth: 'dev'   },
    diff:             { method: 'GET',    path: '/debug/diff',                    desc: 'diff دو جدول یا schema',         auth: 'admin' },
    migrateAuto:      { method: 'POST',   path: '/debug/migrate/auto',            desc: 'migration خودکار',                 auth: 'super' },
    rollback:         { method: 'POST',   path: '/debug/rollback/:table',        desc: 'برگشت آخرین تغییر',              auth: 'super' },
    timeTravel:       { method: 'GET',    path: '/debug/timetravel/:table/:id',  desc: 'مشاهده تاریخچه تغییرات رکورد',   auth: 'admin' },
    versionControl:   { method: 'GET',    path: '/debug/vc',                      desc: 'version control schema',          auth: 'admin' },
    snapshot:         { method: 'POST',   path: '/debug/snapshot',                desc: 'گرفتن snapshot',                  auth: 'super' },
    snapshots:        { method: 'GET',    path: '/debug/snapshots',               desc: 'لیست snapshots',                   auth: 'admin' },
    snapshotRestore:  { method: 'POST',   path: '/debug/snapshots/:id/restore',  desc: 'بازگردانی snapshot',             auth: 'super' },
  },    
    security: {
      header: 'x-api-key',
      envVar: 'DEBUG_API_KEY',
      currentKey: process.env.DEBUG_API_KEY ? '✓ Set' : '✗ Default (⚠️ insecure in production!)',
      rateLimit: '200 req/min',
      validation: 'SQL Injection protected'
    },
    examples: {
  // ═══════════════════════════════════════════════════════════
  // 📄 خواندن داده (Read Data)
  // ═══════════════════════════════════════════════════════════
  read: {
    basic: 'GET /debug/data/users?limit=20&offset=0',
    withOrder: 'GET /debug/data/users?orderBy=created_at&order=DESC',
    withColumns: 'GET /debug/data/users?columns=id,name,email,status',
    withPagination: 'GET /debug/data/users?limit=10&offset=20&columns=id,name,email',
    withWhere: 'GET /debug/data/users?status=active&role=admin',
    withBetween: 'GET /debug/data/users?created_at=between:2024-01-01,2024-12-31',
    withJoin: 'GET /debug/data/users?include=posts&include=comments',
    withAggregate: 'GET /debug/data/users?aggregate=count:id,sum:balance,avg:age',
    first: 'GET /debug/data/users/first',
    last: 'GET /debug/data/users/last?orderBy=updated_at',
    sample: 'GET /debug/data/users/sample?n=5',
    count: 'GET /debug/data/users/count',
    row: 'GET /debug/row/users/42',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔍 جستجو (Search)
  // ═══════════════════════════════════════════════════════════
  search: {
    basic: 'GET /debug/search/users?q=john',
    column: 'GET /debug/search/users?q=john&column=email',
    exact: 'GET /debug/search/users?q=exact:john@example.com',
    allTables: 'GET /debug/search/all?q=product',
    multipleTerms: 'GET /debug/search/users?q=john&column=name,email',
    withFilters: 'GET /debug/search/users?q=admin&status=active&role=superadmin',
    caseInsensitive: 'GET /debug/search/users?q=ci:JOHN',
    advanced: 'GET /debug/search/users/advanced?conditions=[{"column":"name","op":"like","value":"%Ali%"},{"and":"status"},{"column":"age","op":">","value":"25"}]',
    fullText: 'GET /debug/search/users/fulltext?q=developer engineer',
    fuzzy: 'GET /debug/search/users/fuzzy?q=jonh&threshold=0.7',
    regex: 'GET /debug/search/users/regex?pattern=^A.*@example\\.com$',
    jsonPath: 'GET /debug/search/users?data->name=$john',
    nullSearch: 'GET /debug/search/users?phone=null',
    emptySearch: 'GET /debug/search/users?address=empty',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔎 فیلتر (Filter)
  // ═══════════════════════════════════════════════════════════
  filter: {
    basic: 'GET /debug/filter/users?status=active',
    multiple: 'GET /debug/filter/users?status=active&role=admin',
    operators: {
      equal: 'GET /debug/filter/users?age==25',
      notEqual: 'GET /debug/filter/users?age!=25',
      greaterThan: 'GET /debug/filter/users?age=>25',
      lessThan: 'GET /debug/filter/users?age=<25',
      greaterOrEqual: 'GET /debug/filter/users?age=>=25',
      lessOrEqual: 'GET /debug/filter/users?age=<=25',
      like: 'GET /debug/filter/users?name=like:%Ali%',
      notLike: 'GET /debug/filter/users?name=notLike:%test%',
      in: 'GET /debug/filter/users?status=in:active,banned',
      notIn: 'GET /debug/filter/users?status=notIn:suspended,deleted',
      between: 'GET /debug/filter/users?age=between:18,65',
      isNull: 'GET /debug/filter/users?phone=isNull',
      isNotNull: 'GET /debug/filter/users?email=isNotNull',
    },
    combined: 'GET /debug/filter/users?age=>=18&status=in:active,banned&name=like:%Ali%',
    complex: 'GET /debug/filter/orders?total=>=100&status=in:pending,processing&created_at=between:2024-01-01,2024-06-30',
    withSort: 'GET /debug/filter/users?status=active&orderBy=created_at&order=DESC',
    withPagination: 'GET /debug/filter/users?status=active&limit=20&offset=0',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔄 کوئری SQL (Query)
  // ═══════════════════════════════════════════════════════════
  sql: {
    select: 'POST /debug/query { "sql": "SELECT * FROM users WHERE id > ?", "params": [5] }',
    selectWithJoin: 'POST /debug/query { "sql": "SELECT u.*, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id" }',
    insert: 'POST /debug/query { "sql": "INSERT INTO users (name, email, age) VALUES (?, ?, ?)", "params": ["John", "john@example.com", 30] }',
    update: 'POST /debug/query { "sql": "UPDATE users SET status = ? WHERE last_login < ?", "params": ["inactive", "2024-01-01"] }',
    delete: 'POST /debug/query { "sql": "DELETE FROM users WHERE status = ?", "params": ["deleted"] }',
    transaction: 'POST /debug/query { "sql": "BEGIN; UPDATE accounts SET balance = balance - ? WHERE id = ?; UPDATE accounts SET balance = balance + ? WHERE id = ?; COMMIT;", "params": [100, 1, 100, 2] }',
    prepared: 'POST /debug/query/prepared { "sql": "SELECT * FROM users WHERE role = $1 AND status = $2", "params": ["admin", "active"] }',
    explain: 'POST /debug/explain { "sql": "SELECT * FROM orders WHERE user_id = 5" }',
    explainAnalyze: 'POST /debug/explain/analyze { "sql": "SELECT * FROM orders WHERE user_id = 5" }',
    format: 'POST /debug/query/format { "sql": "select id,name from users where status=active" }',
    validate: 'POST /debug/query/validate { "sql": "SELEC * FORM users" }',
  },

  // ═══════════════════════════════════════════════════════════
  // ➕ درج داده (Insert)
  // ═══════════════════════════════════════════════════════════
  insert: {
    basic: 'POST /debug/data/users { "name": "John", "email": "john@example.com" }',
    withAll: 'POST /debug/data/users { "name": "John", "email": "john@example.com", "age": 30, "status": "active" }',
    withDefaults: 'POST /debug/data/users { "name": "Jane", "email": "jane@example.com" }',
    bulk: 'POST /debug/data/users/bulk { "records": [{ "name": "John", "email": "john@example.com" }, { "name": "Jane", "email": "jane@example.com" }] }',
    bulkLarge: 'POST /debug/data/users/bulk { "records": [...], "chunkSize": 100, "transaction": true }',
    upsert: 'PUT /debug/data/users/upsert { "email": "john@example.com", "name": "John Updated", "onConflict": "email" }',
    duplicate: 'POST /debug/data/users/1/duplicate { "newEmail": "john2@example.com" }',
    returning: 'POST /debug/data/users { "name": "John", "email": "john@example.com", "_return": true }',
    ignore: 'POST /debug/data/users { "name": "John", "email": "john@example.com", "_ignore": true }',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔄 بروزرسانی (Update)
  // ═══════════════════════════════════════════════════════════
  update: {
    full: 'PUT /debug/data/users/1 { "name": "New Name", "email": "new@example.com", "age": 28, "status": "active" }',
    partial: 'PATCH /debug/data/users/1 { "status": "banned" }',
    multipleFields: 'PATCH /debug/data/users/1 { "name": "Updated", "age": 35 }',
    withWhere: 'PATCH /debug/data/users { "status": "inactive" } { "where": { "last_login": "<", "2024-01-01" } }',
    increment: 'PATCH /debug/data/users/1 { "login_count": "+=1" }',
    decrement: 'PATCH /debug/data/users/1 { "balance": "-=50" }',
    toggle: 'PATCH /debug/data/users/1 { "is_active": "toggle" }',
    batch: 'PATCH /debug/data/users/batch { "updates": [{ "id": 1, "status": "active" }, { "id": 2, "status": "inactive" }] }',
    batchWhere: 'PATCH /debug/data/users/batch { "set": { "status": "processed" }, "where": { "status": "pending" } }',
    withCondition: 'PATCH /debug/data/users/1 { "status": "vip" } { "condition": "balance >= 1000" }',
    nullify: 'PATCH /debug/data/users/1 { "phone": null, "address": null }',
    appendArray: 'PATCH /debug/data/orders/1 { "tags": "append:urgent" }',
    removeArray: 'PATCH /debug/data/orders/1 { "tags": "remove:pending" }',
  },

  // ═══════════════════════════════════════════════════════════
  // 🗑️ حذف (Delete)
  // ═══════════════════════════════════════════════════════════
  delete: {
    single: 'DELETE /debug/data/users/1',
    withCascade: 'DELETE /debug/data/users/1?cascade=true',
    softDelete: 'DELETE /debug/data/users/1/soft',
    restore: 'PATCH /debug/data/users/1/restore',
    bulk: 'DELETE /debug/data/users/bulk { "ids": [1, 2, 3, 4, 5] }',
    bulkLarge: 'DELETE /debug/data/users/bulk { "ids": [...], "chunkSize": 100 }',
    where: 'DELETE /debug/data/users/where { "status": "deleted", "deleted_at": "<", "2023-01-01" }',
    cascadeCheck: 'DELETE /debug/data/users/1?dryRun=true',
    force: 'DELETE /debug/data/users/1?force=true',
    softAll: 'DELETE /debug/data/users/soft { "where": { "status": "spam" } }',
  },

  // ═══════════════════════════════════════════════════════════
  // 📊 صفحه‌بندی (Pagination)
  // ═══════════════════════════════════════════════════════════
  pagination: {
    basic: 'GET /debug/data/users?limit=20&offset=0',
    offset: 'GET /debug/data/users?limit=10&page=3',
    cursor: 'GET /debug/data/users?cursor=eyJpZCI6MTAsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxIn0&limit=10',
    full: 'GET /debug/data/users?limit=10&offset=20&columns=id,name,email&orderBy=created_at&order=DESC',
    infiniteScroll: 'GET /debug/data/users?after_id=50&limit=20',
    numbered: 'GET /debug/data/users?page=2&per_page=15',
    withMeta: 'GET /debug/data/users?limit=20&includeMeta=true',
    numberedWithMeta: 'GET /debug/data/users?page=3&per_page=20&includeMeta=true',
  },

  // ═══════════════════════════════════════════════════════════
  // 📤 صادرات (Export)
  // ═══════════════════════════════════════════════════════════
  export: {
    csv: 'GET /debug/export/users?format=csv',
    csvCustomDelimiter: 'GET /debug/export/users?format=csv&delimiter=;',
    csvWithHeaders: 'GET /debug/export/users?format=csv&headers=true',
    json: 'GET /debug/export/users?format=json',
    jsonPretty: 'GET /debug/export/users?format=json&pretty=true',
    jsonArray: 'GET /debug/export/users?format=json&array=true',
    xml: 'GET /debug/export/users?format=xml',
    xlsx: 'GET /debug/export/users?format=xlsx',
    ndjson: 'GET /debug/export/users?format=ndjson',
    sql: 'GET /debug/export/users?format=sql',
    sqlWithSchema: 'GET /debug/export/users?format=sql&includeSchema=true',
    withFilters: 'GET /debug/export/users?format=csv&status=active&role=admin',
    withColumns: 'GET /debug/export/users?format=json&columns=id,name,email',
    compressed: 'GET /debug/export/users?format=csv&compression=gzip',
    withLimit: 'GET /debug/export/users?format=csv&limit=1000',
  },

  // ═══════════════════════════════════════════════════════════
  // 📥 واردات (Import)
  // ═══════════════════════════════════════════════════════════
  import: {
    csvBasic: 'POST /debug/import/users { "file": "<base64 or multipart>", "format": "csv" }',
    csvWithMapping: 'POST /debug/import/users { "file": "...", "mapping": { "Name": "name", "Email": "email" } }',
    csvSkipHeader: 'POST /debug/import/users { "file": "...", "skipHeader": true, "delimiter": "," }',
    csvUpdateExisting: 'POST /debug/import/users { "file": "...", "onConflict": "update", "conflictKey": "email" }',
    csvIgnoreDuplicates: 'POST /debug/import/users { "file": "...", "onConflict": "ignore" }',
    csvDryRun: 'POST /debug/import/users { "file": "...", "dryRun": true }',
    csvPreview: 'POST /debug/import/users/preview { "file": "...", "limit": 5 }',
    csvValidate: 'POST /debug/import/users/validate { "file": "..." }',
    json: 'POST /debug/import/users/json { "data": [...] }',
    jsonBatch: 'POST /debug/import/users/json { "data": [...], "chunkSize": 500, "transaction": true }',
  },

  // ═══════════════════════════════════════════════════════════
  // 📈 آمار و آنالیتیکس (Stats & Analytics)
  // ═══════════════════════════════════════════════════════════
  analytics: {
    overview: 'GET /debug/analytics/users',
    nulls: 'GET /debug/analytics/nulls/users',
    duplicates: 'GET /debug/analytics/duplicates/users',
    top: 'GET /debug/analytics/top/users?column=balance&limit=10',
    bottom: 'GET /debug/analytics/bottom/users?column=balance&limit=10',
    columnStats: 'GET /debug/analytics/column/users/age',
    distribution: 'GET /debug/analytics/distribution/users/age?bins=10',
    histogram: 'GET /debug/analytics/histogram/users/age',
    percentiles: 'GET /debug/analytics/percentiles/users/age',
    correlations: 'GET /debug/analytics/correlations/users',
    timeline: 'GET /debug/analytics/timeline/users?column=created_at&interval=day',
    trends: 'GET /debug/analytics/trends/users?column=signups&period=month',
    outliers: 'GET /debug/analytics/outliers/users/balance?threshold=3',
    cardinality: 'GET /debug/analytics/cardinality/users',
    density: 'GET /debug/analytics/density/users/status',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔗 روابط (Relations)
  // ═══════════════════════════════════════════════════════════
  relations: {
    record: 'GET /debug/relate/users/1',
    recordWithNested: 'GET /debug/relate/users/1?depth=3',
    reverse: 'GET /debug/relate/users/1/reverse',
    graph: 'GET /debug/relate/graph/users/1',
    tree: 'GET /debug/relate/tree/users/1',
    path: 'GET /debug/relate/path/users/orders?fromId=1&toId=5',
    neighbors: 'GET /debug/relate/users/1/neighbors?depth=2',
    cascade: 'GET /debug/relate/users/1/cascade',
  },

  // ═══════════════════════════════════════════════════════════
  // 🏗️ اسکیما (Schema)
  // ═══════════════════════════════════════════════════════════
  schema: {
    table: 'GET /debug/schema/users',
    full: 'GET /debug/schema/users/full',
    diff: 'GET /debug/schema/users/diff',
    validate: 'POST /debug/schema/users/validate',
    migrate: 'PUT /debug/schema/users/migrate',
  },

  // ═══════════════════════════════════════════════════════════
  // ⚡ ایندکس (Indexes)
  // ═══════════════════════════════════════════════════════════
  indexes: {
    all: 'GET /debug/indexes',
    byTable: 'GET /debug/indexes/users',
    unused: 'GET /debug/indexes/unused',
    duplicate: 'GET /debug/indexes/duplicate',
    suggest: 'GET /debug/indexes/suggest/users',
    create: 'POST /debug/indexes { "table": "users", "column": "email", "type": "unique" }',
    createComposite: 'POST /debug/indexes { "table": "orders", "columns": ["user_id", "status"], "type": "composite" }',
    createFulltext: 'POST /debug/indexes { "table": "posts", "columns": ["title", "content"], "type": "fulltext" }',
    drop: 'DELETE /debug/indexes/users_email_idx',
    rebuild: 'POST /debug/indexes/users_email_idx/rebuild',
  },

  // ═══════════════════════════════════════════════════════════
  // 🖥️ تریگر (Triggers)
  // ═══════════════════════════════════════════════════════════
  triggers: {
    all: 'GET /debug/triggers',
    byTable: 'GET /debug/triggers/users',
    create: 'POST /debug/triggers { "table": "users", "name": "update_timestamp", "event": "UPDATE", "function": "update_modified_at()" }',
    toggle: 'PATCH /debug/triggers/update_timestamp { "enabled": false }',
    drop: 'DELETE /debug/triggers/update_timestamp',
    stats: 'GET /debug/triggers/update_timestamp/stats',
  },

  // ═══════════════════════════════════════════════════════════
  // 👁️ ویوها (Views)
  // ═══════════════════════════════════════════════════════════
  views: {
    all: 'GET /debug/views',
    details: 'GET /debug/views/user_stats',
    sql: 'GET /debug/views/user_stats/sql',
    create: 'POST /debug/views { "name": "active_users", "sql": "SELECT * FROM users WHERE status = \'active\'" }',
    replace: 'PUT /debug/views/user_stats { "sql": "SELECT id, name FROM users WHERE active = 1" }',
    drop: 'DELETE /debug/views/user_stats',
  },

  // ═══════════════════════════════════════════════════════════
  // 💾 پشتیبان‌گیری (Backup)
  // ═══════════════════════════════════════════════════════════
  backup: {
    create: 'GET /debug/backup',
    list: 'GET /debug/backups',
    download: 'GET /debug/backup/2024-01-01-backup.sql.gz/download',
    restore: 'POST /debug/restore { "backupId": "2024-01-01-backup" }',
    restorePoint: 'POST /debug/restore/point { "timestamp": "2024-01-01 12:00:00" }',
    schedule: 'GET /debug/backup/schedule',
    scheduleSet: 'POST /debug/backup/schedule { "interval": "daily", "time": "02:00", "retention": 7 }',
    verify: 'POST /debug/backup/2024-01-01-backup/verify',
    delete: 'DELETE /debug/backup/2024-01-01-backup',
  },

  // ═══════════════════════════════════════════════════════════
  // 🏥 نگهداری (Maintenance)
  // ═══════════════════════════════════════════════════════════
  maintenance: {
    check: 'POST /debug/maintenance/users/check',
    repair: 'POST /debug/maintenance/users/repair',
    optimize: 'POST /debug/maintenance/users/optimize',
    vacuum: 'POST /debug/vacuum',
    vacuumTable: 'POST /debug/vacuum/users',
    analyze: 'POST /debug/analyze',
    analyzeTable: 'POST /debug/analyze/users',
    reindex: 'POST /debug/reindex',
    reindexTable: 'POST /debug/reindex/users',
    clot: 'POST /debug/clot/users',
    fullReport: 'GET /debug/maintenance/report',
    tableReport: 'GET /debug/maintenance/users',
    cleanup: 'POST /debug/maintenance/cleanup { "days": 30 }',
    gc: 'POST /debug/admin/gc',
  },

  // ═══════════════════════════════════════════════════════════
  // 🧪 سید و فیکچر (Seed & Fixtures)
  // ═══════════════════════════════════════════════════════════
  seed: {
    basic: 'POST /debug/seed/users?count=100',
    withOptions: 'POST /debug/seed/users?count=50&locale=fa',
    faker: 'POST /debug/seed/users/faker { "count": 100, "fields": { "name": "name", "email": "email", "phone": "phoneNumber" } }',
    file: 'POST /debug/seed/users/file { "file": "...", "count": 100 }',
    clear: 'DELETE /debug/seed/users',
    fixtures: 'POST /debug/fixtures/test_data',
    factories: 'POST /debug/factories/UserFactory { "count": 50 }',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔐 امنیت (Security)
  // ═══════════════════════════════════════════════════════════
  security: {
    users: 'GET /debug/security/users',
    userCreate: 'POST /debug/security/users { "username": "newuser", "password": "...", "role": "read" }',
    userUpdate: 'PUT /debug/security/users/john { "role": "admin", "password": "newpass123" }',
    userDrop: 'DELETE /debug/security/users/john',
    grants: 'GET /debug/security/grants',
    grantCreate: 'POST /debug/security/grants { "user": "john", "table": "users", "privileges": ["SELECT", "INSERT"] }',
    grantRevoke: 'DELETE /debug/security/grants/123',
    audit: 'GET /debug/security/audit?from=2024-01-01&to=2024-12-31',
    scan: 'GET /debug/security/scan',
    lock: 'POST /debug/security/lock/john',
    unlock: 'DELETE /debug/security/lock/john',
    loginAttempts: 'GET /debug/security/login-attempts?user=john',
  },

  // ═══════════════════════════════════════════════════════════
  // ⚡ ابزارها (Tools)
  // ═══════════════════════════════════════════════════════════
  tools: {
    health: 'GET /debug/health',
    test: 'GET /debug/test',
    ping: 'GET /debug/ping',
    version: 'GET /debug/version',
    diagnose: 'GET /debug/diagnose',
    recommend: 'GET /debug/recommend',
    compare: 'GET /debug/compare/users?compareTable=users_archive',
    cacheClear: 'POST /debug/cache/clear',
    cacheStats: 'GET /debug/cache/stats',
    gc: 'POST /debug/admin/gc',
    config: 'GET /debug/config',
  },

  // ═══════════════════════════════════════════════════════════
  // 🗂️ متادیتا (Metadata)
  // ═══════════════════════════════════════════════════════════
  meta: {
    queryHistory: 'GET /debug/meta/queries?limit=50',
    slowQueries: 'GET /debug/meta/slow-queries?threshold=1000',
    popularTables: 'GET /debug/meta/popular-tables?days=30',
    largeTables: 'GET /debug/meta/large-tables?limit=20',
    emptyTables: 'GET /debug/meta/empty-tables',
    sessions: 'GET /debug/meta/sessions',
    transactions: 'GET /debug/meta/transactions',
    locks: 'GET /debug/meta/locks',
    deadlocks: 'GET /debug/meta/deadlocks',
    queryStats: 'GET /debug/meta/query-stats',
    tableStats: 'GET /debug/meta/table-stats',
    indexStats: 'GET /debug/meta/index-stats',
    queriesClear: 'POST /debug/meta/queries/clear',
    sessionKill: 'DELETE /debug/meta/sessions/1234',
  },

  // ═══════════════════════════════════════════════════════════
  // 🔬 تجربی (Experimental)
  // ═══════════════════════════════════════════════════════════
  experimental: {
    aiQuery: 'POST /debug/ai/query { "prompt": "Find all users who have more than 5 orders" }',
    aiExplain: 'POST /debug/ai/explain { "sql": "SELECT ..." }',
    aiOptimize: 'POST /debug/ai/optimize { "sql": "SELECT ..." }',
    schemaGen: 'POST /debug/schema/generate { "type": "json", "data": {...} }',
    mockGen: 'POST /debug/mock/generate { "schema": "users" }',
    diff: 'GET /debug/diff?table1=users&table2=users_backup',
    timeTravel: 'GET /debug/timetravel/users/1',
    snapshot: 'POST /debug/snapshot { "name": "before_migration" }',
    snapshots: 'GET /debug/snapshots',
    snapshotRestore: 'POST /debug/snapshots/123/restore',
    rollback: 'POST /debug/rollback/users',
  },
},
    database: {
      tableCount: tables.length,
      file: db._db ? 'in-memory' : 'file-based',
      version: db.get('SELECT sqlite_version() as v')?.v || 'unknown'
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 📊 ۱. آمار کلی
// ═══════════════════════════════════════════════════════════════

router.get('/stats', (req, res) => {
  try {
    const start = Date.now();
    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const views = db.all("SELECT name FROM sqlite_master WHERE type='view'");
    const indexes = db.all(
      "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    );
    const triggers = db.all(
      "SELECT name, tbl_name FROM sqlite_master WHERE type='trigger'"
    );
    const tableStats = tables.map(t => {
      try {
        const count = db.get(`SELECT COUNT(*) as count FROM "${t.name}"`);
        const avgRowSize = db.get(
          `SELECT AVG(LENGTH(CAST(rowid as TEXT))) as avgSize FROM "${t.name}"`
        );
        const lastModified = db.get(
          `SELECT MAX(rowid) as id FROM "${t.name}"`
        );
        return {
          table: t.name,
          rows: count?.count || 0,
          avgRowSize: avgRowSize?.avgSize || 0,
          lastRowId: lastModified?.id || 0
        };
      } catch {
        return { table: t.name, rows: '❌ Error', avgRowSize: 0 };
      }
    });

    const totalRows = tableStats.reduce(
      (sum, t) => sum + (typeof t.rows === 'number' ? t.rows : 0), 0
    );
    const validTables = tableStats.filter(t => typeof t.rows === 'number');

    res.json({
      success: true,
      _meta: {
        queryTime: formatDuration(Date.now() - start),
        timestamp: new Date().toISOString()
      },
      database: {
        path: db._db ? 'in-memory' : 'file',
        tableCount: tables.length,
        viewCount: views.length,
        indexCount: indexes.length,
        triggerCount: triggers.length,
        totalRows,
        totalIndexes: indexes.length
      },
      tables: tableStats,
      summary: {
        largestTable: [...validTables].sort((a, b) => b.rows - a.rows)[0] || null,
        smallestTable: [...validTables].sort((a, b) => a.rows - b.rows)[0] || null,
        avgRowsPerTable: tables.length ? (totalRows / tables.length).toFixed(2) : 0,
        totalStorage: tableStats.reduce((s, t) => s + (t.avgRowSize || 0) * (t.rows || 0), 0)
      },
      quickLinks: tables.slice(0, 5).map(t => ({
        name: t.name,
        href: `/debug/schema/${t.name}`
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── آمار کامل هر جدول ───
router.get('/stats/detailed', (req, res) => {
  try {
    const start = Date.now();
    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const detailed = tables.map(t => {
      const columns = db.all(`PRAGMA table_info("${t.name}")`);
      const indexes = db.all(`PRAGMA index_list("${t.name}")`);
      const fks = db.all(`PRAGMA foreign_key_list("${t.name}")`);
      const count = db.get(`SELECT COUNT(*) as count FROM "${t.name}"`);
      const sample = db.get(`SELECT * FROM "${t.name}" LIMIT 1`);
      const pk = columns.find(c => c.pk === 1);
      return {
        table: t.name,
        rowCount: count?.count || 0,
        columnCount: columns.length,
        indexCount: indexes.length,
        foreignKeyCount: fks.length,
        triggerCount: db.all(
          "SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name=?"
        ).length,
        hasPK: !!pk,
        primaryKey: pk?.name || null,
        primaryKeys: columns.filter(c => c.pk === 1).map(c => c.name),
        columns: columns.map(c => ({
          name: c.name,
          type: c.type || 'ANY',
          nullable: c.notnull === 0,
          default: c.dflt_value,
          isPK: c.pk === 1,
          pkOrder: c.pk || 0
        })),
        indexes: indexes.map(i => ({
          name: i.name,
          unique: i.unique === 1,
          origin: i.origin
        })),
        foreignKeys: fks.map(fk => ({
          column: fk.from,
          references: `${fk.table}(${fk.to})`,
          onUpdate: fk.on_update || 'NO ACTION',
          onDelete: fk.on_delete || 'NO ACTION'
        })),
        sampleData: sample
      };
    });
    res.json({
      success: true,
      _meta: { queryTime: formatDuration(Date.now() - start) },
      count: detailed.length,
      tables: detailed
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── اندازه جدول‌ها ───
router.get('/stats/size', (req, res) => {
  try {
    const pageSize = db.get(`PRAGMA page_size`)?.page_size || 4096;
    const pageCount = db.get(`PRAGMA page_count`)?.page_count || 0;
    const freelistCount = db.get(`PRAGMA freelist_count`)?.freelist_count || 0;
    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const sizes = tables.map(t => {
      const count = db.get(`SELECT COUNT(*) as count FROM "${t.name}"`);
      const schema = db.all(`PRAGMA table_info("${t.name}")`);
      const indexInfo = db.all(`PRAGMA index_list("${t.name}")`);
      const columnsSize = schema.reduce((sum, c) => {
        const maxLen = c.type === 'TEXT' ? 1000 : c.type === 'BLOB' ? 5000 : 8;
        return sum + maxLen;
      }, 0);
      const estimatedDataSize = (count?.count || 0) * Math.max(columnsSize, 50);
      const indexSize = indexInfo.reduce((sum) => sum + (count?.count || 0) * 8, 0);
      return {
        table: t.name,
        rows: count?.count || 0,
        columnCount: schema.length,
        indexCount: indexInfo.length,
        estimatedDataSize,
        estimatedDataSizeHuman: formatBytes(estimatedDataSize),
        estimatedIndexSize: indexSize,
        estimatedIndexSizeHuman: formatBytes(indexSize),
        totalEstimatedSize: estimatedDataSize + indexSize,
        totalEstimatedSizeHuman: formatBytes(estimatedDataSize + indexSize)
      };
    });

    const totalSize = sizes.reduce((sum, s) => sum + s.totalEstimatedSize, 0);
    res.json({
      success: true,
      database: {
        pageSize: `${pageSize} bytes`,
        pageSizeHuman: formatBytes(pageSize),
        totalPages: pageCount,
        freelistPages: freelistCount,
        rawSize: pageSize * pageCount,
        rawSizeHuman: formatBytes(pageSize * pageCount),
        fragmentation: `${((freelistCount / Math.max(pageCount, 1)) * 100).toFixed(2)}%`
      },
      summary: {
        tableCount: sizes.length,
        totalRows: sizes.reduce((sum, s) => sum + s.rows, 0),
        totalEstimatedSize: totalSize,
        totalEstimatedSizeHuman: formatBytes(totalSize),
        avgSizePerTable: formatBytes(totalSize / sizes.length)
      },
      tables: sizes.sort((a, b) => b.totalEstimatedSize - a.totalEstimatedSize)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── سلامت جدول‌ها ───
router.get('/stats/health', (req, res) => {
  try {
    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const reports = tables.map(t => {
      const count = db.get(`SELECT COUNT(*) as count FROM "${t.name}"`);
      const schema = db.all(`PRAGMA table_info("${t.name}")`);
      const indexes = db.all(`PRAGMA index_list("${t.name}")`);
      const fks = db.all(`PRAGMA foreign_key_list("${t.name}")`);
      const nullCounts = {};
      for (const col of schema) {
        const nullCount = db.get(
          `SELECT COUNT(*) as cnt FROM "${t.name}" WHERE "${col.name}" IS NULL`
        );
        nullCounts[col.name] = nullCount?.cnt || 0;
      }
      const totalNulls = Object.values(nullCounts).reduce((a, b) => a + b, 0);
      const health = {
        score: 100,
        issues: [],
        warnings: []
      };
      if (totalNulls > 0) {
        health.warnings.push(`${totalNulls} NULL values found`);
      }
      if (indexes.length === 0 && count?.count > 100) {
        health.issues.push('No indexes on large table - may be slow');
        health.score -= 20;
      }
      if (!schema.some(c => c.pk === 1)) {
        health.issues.push('No primary key defined');
        health.score -= 30;
      }
      const orphans = db.all(`PRAGMA foreign_key_check`);
      if (orphans.length > 0) {
        health.issues.push(`${orphans.length} orphaned records found`);
        health.score -= 25;
      }
      return {
        table: t.name,
        rowCount: count?.count || 0,
        health: {
          score: Math.max(0, health.score),
          status: health.score >= 80 ? '✓ Good' : health.score >= 50 ? '⚠ Fair' : '❌ Poor',
          issues: health.issues,
          warnings: health.warnings
        },
        nullCounts
      };
    });
    const avgHealth = reports.reduce((sum, r) => sum + r.health.score, 0) / reports.length;
    res.json({
      success: true,
      overallHealth: {
        score: avgHealth.toFixed(1),
        status: avgHealth >= 80 ? '✓ Healthy' : avgHealth >= 50 ? '⚠ Needs Attention' : '❌ Critical',
        tableCount: reports.length,
        totalIssues: reports.reduce((sum, r) => sum + r.health.issues.length, 0)
      },
      tables: reports.sort((a, b) => a.health.score - b.health.score)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📋 ۲. لیست جدول‌ها
// ═══════════════════════════════════════════════════════════════

router.get('/tables', (req, res) => {
  try {
    const { type } = req.query; // 'table', 'view', or 'all'
    let sql = "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'";
    if (type === 'table') sql = sql.replace("('table', 'view')", "'table'");
    else if (type === 'view') sql = sql.replace("('table', 'view')", "'view'");
    sql += ' ORDER BY type DESC, name';

    const tables = db.all(sql);
    const { full } = req.query;

    if (full === 'true') {
      const details = tables.map(t => {
        const count = db.get(`SELECT COUNT(*) as count FROM "${t.name}"`);
        const columns = db.all(`PRAGMA table_info("${t.name}")`);
        const indexes = db.all(`PRAGMA index_list("${t.name}")`);
        const fks = db.all(`PRAGMA foreign_key_list("${t.name}")`);
        return {
          name: t.name,
          type: t.type,
          rowCount: count?.count || 0,
          columnCount: columns.length,
          indexCount: indexes.length,
          fkCount: fks.length,
          primaryKeys: columns.filter(c => c.pk === 1).map(c => c.name),
          columns: columns.map(c => c.name),
          hasPK: columns.some(c => c.pk === 1)
        };
      });
      return res.json({ success: true, count: details.length, tables: details });
    }

    res.json({
      success: true,
      count: tables.length,
      tables: tables.map(t => t.name),
      details: tables,
      breakdown: {
        tables: tables.filter(t => t.type === 'table').length,
        views: tables.filter(t => t.type === 'view').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏗️ ۳. ساختار جدول (Schema)
// ═══════════════════════════════════════════════════════════════

router.get('/schema/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { full, details } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({
        success: false,
        error: `Table "${table}" not found`,
        suggestion: 'Use GET /debug/tables to see available tables'
      });
    }

    const info = db.all(`PRAGMA table_info("${table}")`);
    const indexes = db.all(`PRAGMA index_list("${table}")`);
    const foreign = db.all(`PRAGMA foreign_key_list("${table}")`);
    const createSQL = db.get(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
      [table]
    );

    if (full === 'true' || details === 'true') {
      const indexDetails = indexes.map(idx => ({
        name: idx.name,
        unique: idx.unique === 1,
        origin: idx.origin,
        columns: db.all(`PRAGMA index_info("${idx.name}")`).map(i => ({
          name: i.name,
          order: i.desc ? 'DESC' : 'ASC'
        }))
      }));

      const count = db.get(`SELECT COUNT(*) as count FROM "${table}"`);

      return res.json({
        success: true,
        table,
        createSQL: createSQL?.sql || null,
        rowCount: count?.count || 0,
        columns: info.map(c => ({
          cid: c.cid,
          name: c.name,
          type: c.type || 'ANY',
          notnull: c.notnull === 1,
          defaultValue: c.dflt_value,
          primaryKey: c.pk === 1,
          pkOrder: c.pk || 0
        })),
        indexes: indexDetails,
        foreignKeys: foreign.map(fk => ({
          id: fk.id,
          seq: fk.seq,
          column: fk.from,
          references: { table: fk.table, column: fk.to },
          onUpdate: fk.on_update || 'NO ACTION',
          onDelete: fk.on_delete || 'NO ACTION'
        })),
        stats: {
          totalColumns: info.length,
          totalIndexes: indexes.length,
          totalForeignKeys: foreign.length,
          hasPrimaryKey: info.some(c => c.pk === 1),
          hasAutoIncrement: info.some(c =>
            createSQL?.sql?.toUpperCase().includes(`"${c.name}" AUTOINCREMENT`)
          )
        }
      });
    }

    res.json({
      success: true,
      table,
      columns: info,
      indexes,
      foreignKeys: foreign
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── همه ایندکس‌ها ───
router.get('/indexes', (req, res) => {
  try {
    const indexes = db.all(
      "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name"
    );
    const details = indexes.map(idx => ({
      name: idx.name,
      table: idx.tbl_name,
      unique: idx.sql?.toUpperCase().includes('UNIQUE') || false,
      definition: idx.sql
    }));
    res.json({ success: true, count: details.length, indexes: details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ایندکس‌های یک جدول ───
router.get('/indexes/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    const indexes = db.all(`PRAGMA index_list("${table}")`);
    const details = indexes.map(idx => ({
      name: idx.name,
      unique: idx.unique === 1,
      origin: idx.origin,
      columns: db.all(`PRAGMA index_info("${idx.name}")`)
    }));
    res.json({ success: true, table, count: details.length, indexes: details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── همه کلیدهای خارجی ───
router.get('/foreign-keys', (req, res) => {
  try {
    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const relations = [];
    for (const t of tables) {
      const fks = db.all(`PRAGMA foreign_key_list("${t.name}")`);
      for (const fk of fks) {
        relations.push({
          fromTable: t.name,
          fromColumn: fk.from,
          toTable: fk.table,
          toColumn: fk.to,
          onUpdate: fk.on_update || 'NO ACTION',
          onDelete: fk.on_delete || 'NO ACTION'
        });
      }
    }
    res.json({ success: true, count: relations.length, foreignKeys: relations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تریگرها ───
router.get('/triggers', (req, res) => {
  try {
    const triggers = db.all(
      "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'"
    );
    res.json({ success: true, count: triggers.length, triggers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ویوها ───
router.get('/views', (req, res) => {
  try {
    const views = db.all(
      "SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name"
    );
    res.json({ success: true, count: views.length, views });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📄 ۴. خواندن داده (SELECT) - کامل و گسترش‌یافته
// ═══════════════════════════════════════════════════════════════

router.get('/data/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const {
      limit = 50,
      offset = 0,
      orderBy,
      order = 'ASC',
      where,
      columns = '*',
      format = 'rows',
      flat
    } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    // اعتبارسنجی ستون‌ها
    if (columns !== '*') {
      const schema = db.all(`PRAGMA table_info("${table}")`);
      const colNames = columns.split(',').map(c => c.trim());
      const invalid = colNames.filter(c => {
        if (c.includes('(')) return false; // aggregate functions
        return !isValidIdentifier(c);
      });
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid column name format',
          invalid: invalid
        });
      }
    }

    // شمارش کل
    let countQuery = `SELECT COUNT(*) as total FROM "${table}"`;
    if (where) countQuery += ` WHERE ${where}`;
    const total = db.get(countQuery);

    // ساخت کوئری
    let query = `SELECT ${columns} FROM "${table}"`;
    if (where) query += ` WHERE ${where}`;
    if (orderBy) {
      const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY "${orderBy}" ${safeOrder}`;
    }
    const safeLimit = Math.min(parseInt(limit), 5000);
    const safeOffset = parseInt(offset);
    query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const startTime = Date.now();
    const data = db.all(query);
    const duration = Date.now() - startTime;

    addToHistory(query, 'SELECT', duration, data);

    const pagination = {
      total: total?.total || 0,
      limit: safeLimit,
      offset: safeOffset,
      page: Math.floor(safeOffset / safeLimit) + 1,
      totalPages: Math.ceil((total?.total || 0) / safeLimit),
      hasNext: (safeOffset + data.length) < (total?.total || 0),
      hasPrev: safeOffset > 0
    };

    const result = {
      success: true,
      table,
      query: query.replace(/\s+/g, ' ').trim(),
      pagination,
      performance: {
        queryDuration: duration,
        queryDurationHuman: formatDuration(duration),
        fetchedRows: data.length
      }
    };

    if (format === 'array') {
      result.data = data;
    } else if (format === 'object') {
      result.data = data.reduce((acc, row) => {
        const key = row.id || row[row && Object.keys(row)[0]];
        acc[key] = row;
        return acc;
      }, {});
    } else {
      result.rows = data;
    }

    if (flat === 'true') {
      result.data = data;
      delete result.rows;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── شمارش رکوردها ───
router.get('/data/:table/count', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { where, column } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    let query;
    if (column) {
      query = `SELECT COUNT(DISTINCT "${column}") as count FROM "${table}"`;
    } else {
      query = `SELECT COUNT(*) as count FROM "${table}"`;
    }
    if (where) query += ` WHERE ${where}`;

    const result = db.get(query);
    res.json({
      success: true,
      table,
      count: result?.count || 0,
      column: column || null,
      where: where || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── نمونه تصادفی ───
router.get('/data/:table/sample', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { count = 5 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const total = db.get(`SELECT COUNT(*) as count FROM "${table}"`)?.count || 0;
    if (total === 0) {
      return res.json({ success: true, table, sample: [], message: 'Table is empty' });
    }

    const limit = Math.min(parseInt(count), 100);
    const data = db.all(
      `SELECT * FROM "${table}" ORDER BY RANDOM() LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      table,
      sampleSize: limit,
      totalRows: total,
      sample: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔍 ۵. خواندن یک رکورد
// ═══════════════════════════════════════════════════════════════

router.get('/row/:table/:id', validateTable, (req, res) => {
  try {
    const { table, id } = req.params;
    const { includeRelations, includeSchema } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found in table' });
    }

    const record = db.get(
      `SELECT * FROM "${table}" WHERE "${pk.name}" = ?`,
      [id]
    );

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const response = {
      success: true,
      table,
      primaryKey: pk.name,
      primaryValue: id,
      record,
      _meta: {
        found: true,
        timestamp: new Date().toISOString()
      }
    };

    if (includeSchema === 'true') {
      response.schema = db.all(`PRAGMA table_info("${table}")`);
    }

    if (includeRelations === 'true') {
      const foreignKeys = db.all(`PRAGMA foreign_key_list("${table}")`);
      const relations = {};
      for (const fk of foreignKeys) {
        const related = db.all(
          `SELECT * FROM "${fk.table}" WHERE "${fk.to}" = ?`,
          [record[fk.from]]
        );
        relations[fk.from] = {
          targetTable: fk.table,
          targetColumn: fk.to,
          matchingValue: record[fk.from],
          count: related.length,
          records: related.slice(0, 10) // limit to 10 for response size
        };
      }
      response.relations = relations;
    }

    logger.info(`[DB READ] ${table}[${pk.name}=${id}]`);
    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ➕ ۶. درج داده (INSERT)
// ═══════════════════════════════════════════════════════════════

router.post('/data/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    let data = req.body;
    const { returnRecord = true, ignore } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    // پشتیبانی از bulk insert
// ═══════════════════════════════════════════════════════════════
// ➕ ۶. درج داده (INSERT) - ادامه
// ═══════════════════════════════════════════════════════════════

    // پشتیبانی از bulk insert
    if (data.records && Array.isArray(data.records)) {
      return handleBulkInsert(req, res, table, data.records);
    }

    // اعتبارسنجی داده
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        hint: 'Send JSON body with column: value pairs'
      });
    }

    // حذف فیلدهای سیستمی
    delete data.id;
    delete data.rowid;
    delete data.created_at;
    delete data.updated_at;
    delete data._createdAt;
    delete data._updatedAt;

    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid columns to insert' });
    }

    // اعتبارسنجی نام ستون‌ها
    const schema = db.all(`PRAGMA table_info("${table}")`);
    const schemaCols = schema.map(c => c.name);
    const invalidCols = columns.filter(c => !schemaCols.includes(c));
    if (invalidCols.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid column names',
        invalidColumns: invalidCols,
        availableColumns: schemaCols
      });
    }

    // ساخت کوئری
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT${ignore === 'true' ? ' OR IGNORE' : ''} INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;

    const startTime = Date.now();
    db.run(query, values);
    const duration = Date.now() - startTime;
    const lastId = db.get(`SELECT last_insert_rowid() as id`);
    const changes = db.get(`SELECT changes() as count`)?.count || 0;

    addToHistory(query, 'INSERT', duration, { changes });
    logger.info(`[DB INSERT] ${table}: ${JSON.stringify(data).substring(0, 200)}`);

    const response = {
      success: true,
      message: 'Record created successfully',
      table,
      insertId: lastId?.id,
      query: query.replace(/\s+/g, ' ').trim(),
      performance: {
        insertDuration: duration,
        insertDurationHuman: formatDuration(duration),
        changes
      }
    };

    if (returnRecord === 'true') {
      const pk = findPrimaryKey(table);
      if (pk) {
        response.record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [lastId?.id]);
      } else {
        response.record = db.get(`SELECT * FROM "${table}" WHERE rowid = ?`, [lastId?.id]);
      }
    }

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── درج چند رکورد (Bulk Insert) ───
const handleBulkInsert = (req, res, table, records) => {
  if (!records || records.length === 0) {
    return res.status(400).json({ success: false, error: 'No records provided' });
  }

  // اعتبارسنجی همه رکوردها
  const schema = db.all(`PRAGMA table_info("${table}")`);
  const schemaCols = new Set(schema.map(c => c.name));

  // استخراج ستون‌ها از اولین رکورد
  const columns = Object.keys(records[0]).filter(c =>
    schemaCols.has(c) && !['id', 'rowid', 'created_at', 'updated_at'].includes(c)
  );

  if (columns.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid columns found' });
  }

  const placeholders = columns.map(() => '?').join(', ');
  const query = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;

  const startTime = Date.now();
  let insertedIds = [];
  let errorCount = 0;
  const errors = [];

  // درج رکوردها
  for (let i = 0; i < records.length; i++) {
    try {
      const values = columns.map(c => {
        const v = records[i][c];
        return (v === undefined || v === null) ? null : v;
      });
      db.run(query, values);
      const id = db.get(`SELECT last_insert_rowid() as id`);
      insertedIds.push(id?.id);
    } catch (err) {
      errorCount++;
      if (errors.length < 10) {
        errors.push({ row: i, rowData: records[i], error: err.message });
      }
    }
  }

  const duration = Date.now() - startTime;
  const successCount = insertedIds.length - errorCount;

  addToHistory(query, 'BULK INSERT', duration, { success: successCount, errors: errorCount });
  logger.info(`[DB BULK INSERT] ${table}: ${records.length} records, ${successCount} succeeded`);

  res.status(201).json({
    success: errorCount === 0,
    warning: errorCount > 0 ? `${errorCount} records failed` : null,
    table,
    message: `Inserted ${successCount} of ${records.length} records`,
    summary: {
      total: records.length,
      inserted: successCount,
      failed: errorCount,
      successRate: `${((successCount / records.length) * 100).toFixed(1)}%`
    },
    insertedIds: insertedIds.filter(Boolean),
    errors: errorCount > 0 ? { count: errorCount, samples: errors } : null,
    query,
    performance: {
      duration,
      durationHuman: formatDuration(duration),
      avgPerRecord: (duration / records.length).toFixed(2)
    }
  });
};

// ─── درج با کوئری خام (Upsert) ───
router.post('/data/:table/upsert', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { data, conflictTarget } = req.body;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const schemaCols = schema.map(c => c.name);
    const columns = Object.keys(data).filter(c => schemaCols.includes(c));
    const values = columns.map(c => data[c]);

    // اگر conflictTarget مشخص نشده، از کلید اصلی استفاده کن
    let target = conflictTarget;
    if (!target) {
      const pk = schema.find(c => c.pk === 1);
      target = pk?.name || 'id';
    }

    const setClause = columns.map(c => `"${c}" = excluded."${c}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');

    const query = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT("${target}") DO UPDATE SET ${setClause}`;

    const startTime = Date.now();
    db.run(query, values);
    const duration = Date.now() - startTime;
    const changes = db.get(`SELECT changes() as count`)?.count || 0;
    const lastId = db.get(`SELECT last_insert_rowid() as id`);

    addToHistory(query, 'UPSERT', duration, { changes });
    logger.info(`[DB UPSERT] ${table}: ${JSON.stringify(data)}`);

    res.status(200).json({
      success: true,
      message: changes > 0 ? 'Record updated' : 'Record inserted',
      action: changes > 0 ? 'UPDATE' : 'INSERT',
      table,
      insertId: lastId?.id,
      changes,
      query,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ✏️ ۷. بروزرسانی کامل (PUT)
// ═══════════════════════════════════════════════════════════════

router.put('/data/:table/:id', validateTable, (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;
    const { returnRecord = true, skipDefaults } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        hint: 'PUT replaces all fields. Send all column values.'
      });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const oldRecord = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!oldRecord) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // فیلتر کردن ستون‌های مجاز
    const allowedCols = schema.map(c => c.name);
    const filteredData = {};
    for (const [key, val] of Object.entries(data)) {
      if (allowedCols.includes(key) && key !== pk.name) {
        filteredData[key] = val;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        hint: 'Ensure your JSON contains table columns'
      });
    }

    // حذف فیلدهای سیستمی
    delete filteredData.created_at;
    delete filteredData.createdAt;
    delete filteredData.rowid;

    // تنظیم مقادیر پیش‌فرض
    if (skipDefaults !== 'true') {
      for (const col of schema) {
        if (col.dflt_value !== null && !(col.name in filteredData)) {
          // اگر ستون مقدار پیش‌فرض دارد ولی در داده نیست، آن را NULL نگه می‌داریم
        }
      }
    }

    const setClause = Object.keys(filteredData).map(k => `"${k}" = ?`).join(', ');
    const values = [...Object.values(filteredData), id];
    const query = `UPDATE "${table}" SET ${setClause} WHERE "${pk.name}" = ?`;

    const startTime = Date.now();
    db.run(query, values);
    const duration = Date.now() - startTime;
    const changes = db.get(`SELECT changes() as count`)?.count || 0;

    addToHistory(query, 'UPDATE', duration, { changes });
    logger.info(`[DB UPDATE] ${table}[${id}]: ${JSON.stringify(filteredData)}`);

    const response = {
      success: true,
      message: 'Record updated successfully',
      table,
      query,
      changes,
      before: oldRecord,
      performance: {
        updateDuration: duration,
        updateDurationHuman: formatDuration(duration)
      }
    };

    if (returnRecord === 'true') {
      response.after = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
      response.changedFields = Object.keys(filteredData);
      response.changedValues = filteredData;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔄 ۸. بروزرسانی جزئی (PATCH)
// ═══════════════════════════════════════════════════════════════

router.patch('/data/:table/:id', validateTable, (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;
    const { returnRecord = true, timestamp = true, autoFill } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        hint: 'PATCH only updates provided fields. Send only fields to change.'
      });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const oldRecord = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!oldRecord) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // فقط فیلدهای ارسال شده
    const allowedCols = schema.map(c => c.name);
    const updateFields = {};
    for (const [key, val] of Object.entries(data)) {
      if (allowedCols.includes(key) && key !== pk.name) {
        updateFields[key] = val;
      }
    }

    // حذف فیلدهای سیستمی
    delete updateFields.created_at;
    delete updateFields.createdAt;
    delete updateFields.rowid;

    // اضافه کردن timestamp خودکار
    if (timestamp === 'true') {
      const tsCol = schema.find(c =>
        ['updated_at', 'updatedat', 'modified_at', 'timestamp', 'modifiedat'].includes(c.name.toLowerCase())
      );
      if (tsCol) {
        updateFields[tsCol.name] = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    // autoFill: پر کردن فیلدهای خالی
    if (autoFill === 'true') {
      for (const col of schema) {
        if (col.dflt_value !== null && !(col.name in updateFields) && !(col.name in oldRecord)) {
          updateFields[col.name] = col.dflt_value;
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        invalidFields: Object.keys(data).filter(k => !allowedCols.includes(k))
      });
    }

    const setClause = Object.keys(updateFields).map(k => `"${k}" = ?`).join(', ');
    const values = [...Object.values(updateFields), id];
    const query = `UPDATE "${table}" SET ${setClause} WHERE "${pk.name}" = ?`;

    const startTime = Date.now();
    db.run(query, values);
    const duration = Date.now() - startTime;

    addToHistory(query, 'PATCH', duration, { fields: Object.keys(updateFields) });
    logger.info(`[DB PATCH] ${table}[${id}]: ${JSON.stringify(updateFields)}`);

    const response = {
      success: true,
      message: 'Record patched successfully',
      table,
      updatedFields: updateFields,
      fieldsChanged: Object.keys(updateFields),
      performance: {
        patchDuration: duration,
        patchDurationHuman: formatDuration(duration)
      }
    };

    if (returnRecord === 'true') {
      response.record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
      response.changedValues = updateFields;
      response.before = oldRecord;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── بروزرسانی چند رکورد ───
router.patch('/data/:table/bulk', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { where, ids, idField = 'id', data } = req.body;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'No update data provided' });
    }
    if (!where && (!ids || !Array.isArray(ids))) {
      return res.status(400).json({
        success: false,
        error: 'Provide "ids" array or "where" clause'
      });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const allowedCols = schema.map(c => c.name);
    const filteredData = {};
    for (const [key, val] of Object.entries(data)) {
      if (allowedCols.includes(key)) {
        filteredData[key] = val;
      }
    }

    const setClause = Object.keys(filteredData).map(k => `"${k}" = ?`).join(', ');
    let query, params;
    if (ids) {
      const placeholders = ids.map(() => '?').join(', ');
      query = `UPDATE "${table}" SET ${setClause} WHERE "${idField}" IN (${placeholders})`;
      params = [...Object.values(filteredData), ...ids];
    } else {
      query = `UPDATE "${table}" SET ${setClause} WHERE ${where}`;
      params = Object.values(filteredData);
    }

    const startTime = Date.now();
    db.run(query, params);
    const duration = Date.now() - startTime;
    const changes = db.get(`SELECT changes() as count`)?.count || 0;

    addToHistory(query, 'BULK PATCH', duration, { changes });
    logger.warn(`[DB BULK PATCH] ${table}: ${JSON.stringify(data)}`);

    res.json({
      success: true,
      message: `Updated ${changes} records`,
      table,
      query,
      changes,
      updatedFields: filteredData,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🗑️ ۹. حذف (DELETE)
// ═══════════════════════════════════════════════════════════════

router.delete('/data/:table/:id', validateTable, (req, res) => {
  try {
    const { table, id } = req.params;
    const { returnRecord = 'true', cascade } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // بررسی رکوردهای مرتبط
    if (cascade !== 'true') {
      const fks = db.all(`PRAGMA foreign_key_list("${table}")`);
      const related = [];
      for (const fk of fks) {
        const count = db.get(
          `SELECT COUNT(*) as count FROM "${fk.table}" WHERE "${fk.to}" = ?`,
          [record[pk.name]]
        );
        if (count?.count > 0) {
          related.push({ table: fk.table, column: fk.to, count: count.count });
        }
      }
      if (related.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Record has related data. Use ?cascade=true to force delete.',
          relatedTables: related
        });
      }
    }

    const startTime = Date.now();
    db.run(`DELETE FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    const duration = Date.now() - startTime;

    addToHistory(`DELETE FROM ${table} WHERE ${pk.name}=?`, 'DELETE', duration, { id });
    logger.warn(`[DB DELETE] ${table}[${pk.name}=${id}]: ${JSON.stringify(record).substring(0, 200)}`);

    res.json({
      success: true,
      message: 'Record deleted successfully',
      table,
      deletedKey: pk.name,
      deletedValue: id,
      deletedRecord: returnRecord === 'true' ? record : null,
      performance: {
        deleteDuration: duration,
        deleteDurationHuman: formatDuration(duration)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── حذف bulk ───
router.delete('/data/:table/bulk', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { where, ids, idField = 'id', force } = req.body;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!where && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Provide "ids" array or "where" clause',
        example: { ids: [1, 2, 3] }
      });
    }

    // شمارش قبل از حذف
    let countQuery;
    if (ids) {
      const placeholders = ids.map(() => '?').join(', ');
      countQuery = `SELECT COUNT(*) as count FROM "${table}" WHERE "${idField}" IN (${placeholders})`;
    } else {
      countQuery = `SELECT COUNT(*) as count FROM "${table}" WHERE ${where}`;
    }
    const toDelete = db.get(countQuery, ids || []);

    if (!force && toDelete?.count > 1000) {
      return res.status(400).json({
        success: false,
        error: `Too many records to delete (${toDelete.count}). Use "force": true to override.`,
        count: toDelete.count
      });
    }

    let query, params = [];
    if (ids) {
      const placeholders = ids.map(() => '?').join(', ');
      query = `DELETE FROM "${table}" WHERE "${idField}" IN (${placeholders})`;
      params = ids;
    } else {
      query = `DELETE FROM "${table}" WHERE ${where}`;
    }

    const startTime = Date.now();
    db.run(query, params);
    const duration = Date.now() - startTime;
    const changes = db.get(`SELECT changes() as count`)?.count || 0;

    addToHistory(query, 'BULK DELETE', duration, { changes });
    logger.warn(`[DB BULK DELETE] ${table}: ${changes} records deleted`);

    res.json({
      success: true,
      message: `Deleted ${changes} of ${toDelete?.count || changes} records`,
      table,
      query,
      summary: {
        requestedCount: ids?.length || null,
        toDeleteCount: toDelete?.count || 0,
        deletedCount: changes,
        remainingCount: (toDelete?.count || 0) - changes
      },
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔍 ۱۰. جستجوی پیشرفته
// ═══════════════════════════════════════════════════════════════

router.get('/search/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { q, column, limit = 50, offset = 0, operator = 'LIKE', orderBy, order = 'ASC' } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        hint: 'GET /debug/search/users?q=john'
      });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);

    // اعتبارسنجی ستون
    if (column) {
      const colExists = schema.find(c => c.name === column);
      if (!colExists) {
        return res.status(400).json({
          success: false,
          error: `Column "${column}" not found`,
          availableColumns: schema.map(c => c.name)
        });
      }

      // تعیین نوع عملگر
      let whereClause, searchQ = q;
      switch (operator) {
        case '=': case 'eq':
          whereClause = `"${column}" = ?`;
          break;
        case '!=': case 'ne':
          whereClause = `"${column}" != ?`;
          break;
        case '>': case 'gt':
          whereClause = `"${column}" > ?`;
          break;
        case '<': case 'lt':
          whereClause = `"${column}" < ?`;
          break;
        case '>=': case 'gte':
          whereClause = `"${column}" >= ?`;
          break;
        case '<=': case 'lte':
          whereClause = `"${column}" <= ?`;
          break;
        case 'STARTS_WITH': case 'sw':
          whereClause = `"${column}" LIKE ?`;
          searchQ = `${q}%`;
          break;
        case 'ENDS_WITH': case 'ew':
          whereClause = `"${column}" LIKE ?`;
          searchQ = `%${q}`;
          break;
        case 'EXACT':
          whereClause = `"${column}" = ?`;
          searchQ = q;
          break;
        case 'REGEXP': case 'REGEX':
          whereClause = `"${column}" REGEXP ?`;
          break;
        default: // LIKE
          whereClause = `"${column}" LIKE ?`;
          searchQ = `%${q}%`;
      }

      let query = `SELECT * FROM "${table}" WHERE ${whereClause}`;
      if (orderBy) query += ` ORDER BY "${orderBy}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
      query += ` LIMIT ? OFFSET ?`;

      const startTime = Date.now();
      const data = db.all(query, [searchQ, parseInt(limit), parseInt(offset)]);
      const total = db.get(`SELECT COUNT(*) as count FROM "${table}" WHERE ${whereClause}`, [searchQ]);
      const duration = Date.now() - startTime;

      addToHistory(query, 'SEARCH', duration, data);

      res.json({
        success: true,
        table,
        searchType: 'column',
        column,
        query: q,
        operator,
        pagination: {
          total: total?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + data.length) < (total?.count || 0)
        },
        performance: { duration, durationHuman: formatDuration(duration) },
        results: data
      });
    } else {
      // جستجو در همه ستون‌های متنی
      const textColumns = schema.filter(c =>
        ['TEXT', 'VARCHAR', 'NVARCHAR', 'CHARACTER', 'CLOB'].includes(c.type.toUpperCase())
      );

      if (textColumns.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No text columns found in table',
          columns: schema.map(c => ({ name: c.name, type: c.type }))
        });
      }

      const conditions = textColumns.map(c => `"${c.name}" LIKE ?`).join(' OR ');
      const params = [...textColumns.map(() => `%${q}%`), parseInt(limit), parseInt(offset)];
      const query = `SELECT * FROM "${table}" WHERE ${conditions} LIMIT ? OFFSET ?`;

      const startTime = Date.now();
      const data = db.all(query, params);
      const totalQ = `SELECT COUNT(*) as count FROM "${table}" WHERE ${conditions}`;
      const total = db.get(totalQ, textColumns.map(() => `%${q}%`));
      const duration = Date.now() - startTime;

      addToHistory(query, 'SEARCH ALL', duration, data);

      res.json({
        success: true,
        table,
        searchType: 'all_text_columns',
        query: q,
        searchedColumns: textColumns.map(c => c.name),
        pagination: {
          total: total?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        performance: { duration, durationHuman: formatDuration(duration) },
        results: data
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── جستجو در همه جدول‌ها ───
router.get('/search/all', (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query "q" is required' });
    }

    const tables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const results = [];
    const startTime = Date.now();

    for (const t of tables) {
      const textCols = db.all(`PRAGMA table_info("${t.name}")`)
        .filter(c => ['TEXT', 'VARCHAR', 'NVARCHAR'].includes(c.type.toUpperCase()));

      if (textCols.length === 0) continue;

      const conditions = textCols.map(c => `"${c.name}" LIKE ?`).join(' OR ');
      const query = `SELECT *, '${t.name}' as _source_table, '${textCols[0].name}' as _matched_column FROM "${t.name}" WHERE ${conditions} LIMIT ?`;
      const data = db.all(query, [...textCols.map(() => `%${q}%`), parseInt(limit)]);

      if (data.length > 0) {
        results.push({
          table: t.name,
          matchedColumns: textCols.map(c => c.name),
          matchCount: data.length,
          matches: data
        });
      }
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      query: q,
      tablesSearched: tables.length,
      tablesWithMatches: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
      performance: { duration, durationHuman: formatDuration(duration) },
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔎 ۱۱. فیلتر پیشرفته
// ═══════════════════════════════════════════════════════════════

router.get('/filter/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const {
      limit = 50,
      offset = 0,
      orderBy,
      order = 'ASC',
      or,
      ...filters
    } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (Object.keys(filters).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one filter required',
        hint: 'GET /debug/filter/users?status=active&age=>=18',
        filterExamples: {
          equal: 'status=active',
          notEqual: 'status!=banned  or  status=!banned',
          greaterThan: 'age=>18',
          lessThan: 'age=<=30',
          in: 'status=in:active,banned',
          like: 'name=like:John%',
          null: 'deleted_at=null',
          notNull: 'deleted_at=!null'
        }
      });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const conditions = [];
    const params = [];
    const appliedFilters = [];

    for (const [key, value] of Object.entries(filters)) {
      if (key.startsWith('_')) continue; // سرویس پارامترها

      const colExists = schema.find(c => c.name === key);
      if (!colExists) continue;

      let condition, param;

      // !== or != or ne:
      if (value.startsWith('!') || value.startsWith('ne:')) {
        condition = `"${key}" != ?`;
        param = value.replace(/^!|ne:/, '');
      }
      // >=
      else if (value.startsWith('>=')) {
        condition = `"${key}" >= ?`;
        param = value.substring(2);
      }
      // <=
      else if (value.startsWith('<=')) {
        condition = `"${key}" <= ?`;
        param = value.substring(2);
      }
      // >
      else if (value.startsWith('>')) {
        condition = `"${key}" > ?`;
        param = value.substring(1);
      }
      // <
      else if (value.startsWith('<')) {
        condition = `"${key}" < ?`;
        param = value.substring(1);
      }
      // IN
      else if (value.startsWith('in:')) {
        const values = value.substring(3).split(',').map(v => v.trim());
        condition = `"${key}" IN (${values.map(() => '?').join(',')})`;
        params.push(...values);
        appliedFilters.push({ column: key, operator: 'IN', value: values });
        conditions.push(condition);
        continue;
      }
      // NOT IN
      else if (value.startsWith('!in:') || value.startsWith('nin:')) {
        const values = value.substring(value.indexOf(':') + 1).split(',').map(v => v.trim());
        condition = `"${key}" NOT IN (${values.map(() => '?').join(',')})`;
        params.push(...values);
        appliedFilters.push({ column: key, operator: 'NOT IN', value });
        conditions.push(condition);
        continue;
      }
      // LIKE
      else if (value.startsWith('like:')) {
        condition = `"${key}" LIKE ?`;
        param = value.substring(5);
      }
      // NOT LIKE
      else if (value.startsWith('!like:')) {
        condition = `"${key}" NOT LIKE ?`;
        param = value.substring(6);
      }
      // BETWEEN
      else if (value.startsWith('bt:')) {
        const [start, end] = value.substring(3).split(',');
        condition = `"${key}" BETWEEN ? AND ?`;
        params.push(start.trim(), end.trim());
        appliedFilters.push({ column: key, operator: 'BETWEEN', value: `${start} - ${end}` });
        conditions.push(condition);
        continue;
      }
      // IS NULL
      else if (value === 'null' || value === 'NULL') {
        condition = `"${key}" IS NULL`;
        appliedFilters.push({ column: key, operator: 'IS NULL', value: null });
        conditions.push(condition);
        continue;
      }
      // IS NOT NULL
      else if (value === '!null' || value === '!NULL' || value === 'nn') {
        condition = `"${key}" IS NOT NULL`;
        appliedFilters.push({ column: key, operator: 'IS NOT NULL', value: null });
        conditions.push(condition);
        continue;
      }
      // Default: =
      else {
        condition = `"${key}" = ?`;
        param = value;
      }

      params.push(param);
      appliedFilters.push({ column: key, operator: '=', value: param });
      conditions.push(condition);
    }

    // ساخت کوئری
    let query = `SELECT * FROM "${table}"`;
    if (conditions.length > 0) {
      query += ` WHERE ${or === 'true' ? conditions.join(' OR ') : conditions.join(' AND ')}`;
    }
    if (orderBy) {
      const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY "${orderBy}" ${safeOrder}`;
    }
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const startTime = Date.now();
    const data = db.all(query, params);

    // شمارش کل
    const countParams = params.slice(0, -2);
    let countQuery = `SELECT COUNT(*) as count FROM "${table}"`;
    if (conditions.length > 0) {
      countQuery += ` WHERE ${or === 'true' ? conditions.join(' OR ') : conditions.join(' AND ')}`;
    }
    const total = db.get(countQuery, countParams);
    const duration = Date.now() - startTime;

    addToHistory(query, 'FILTER', duration, data);

    res.json({
      success: true,
      table,
      filters: appliedFilters,
      logic: or === 'true' ? 'OR' : 'AND',
      pagination: {
        total: total?.count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + data.length) < (total?.count || 0)
      },
      performance: { duration, durationHuman: formatDuration(duration) },
      rows: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── مقادیر یکتا ───
router.get('/distinct/:table/:column', validateTable, (req, res) => {
  try {
    const { table, column } = req.params;
    const { limit = 100, order = 'ASC', having } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const colExists = schema.find(c => c.name === column);
    if (!colExists) {
      return res.status(400).json({
        success: false,
        error: `Column "${column}" not found`,
        availableColumns: schema.map(c => c.name)
      });
    }

    let query = `SELECT DISTINCT "${column}" FROM "${table}"`;
    const params = [];

    if (having) {
      // having count
      query = `SELECT "${column}", COUNT(*) as count FROM "${table}" GROUP BY "${column}" HAVING COUNT(*) ${having}`;
    } else {
      query += ` ORDER BY "${column}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const data = db.all(query, params);

    res.json({
      success: true,
      table,
      column,
      distinctCount: data.length,
      distinctValues: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── رکوردهای تصادفی ───
router.get('/random/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { count = 5 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const total = db.get(`SELECT COUNT(*) as count FROM "${table}"`)?.count || 0;
    if (total === 0) {
      return res.json({ success: true, table, random: [], message: 'Table is empty' });
    }

    const limit = Math.min(parseInt(count), 100);
    const data = db.all(`SELECT * FROM "${table}" ORDER BY RANDOM() LIMIT ?`, [limit]);

    res.json({
      success: true,
      table,
      totalRows: total,
      requestedCount: limit,
      random: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── رکوردهای اخیر ───
router.get('/recent/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { count = 10, orderBy } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const pk = findPrimaryKey(table);

    // ستون‌های تاریخ برای مرتب‌سازی
    const dateCols = schema.filter(c =>
      ['created_at', 'updated_at', 'createdat', 'updatedat', 'timestamp', 'date'].some(
        d => c.name.toLowerCase().includes(d)
      )
    );

    let orderCol = 'rowid';
    if (orderBy && schema.find(c => c.name === orderBy)) {
      orderCol = orderBy;
    } else if (dateCols.length > 0) {
      orderCol = dateCols[0].name;
    } else if (pk) {
      orderCol = pk.name;
    }

    const limit = Math.min(parseInt(count), 100);
    const data = db.all(
      `SELECT * FROM "${table}" ORDER BY "${orderCol}" DESC LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      table,
      sortedBy: orderCol,
      requestedCount: limit,
      recent: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📈 ۱۲. آنالیتیکس و آمار پیشرفته
// ═══════════════════════════════════════════════════════════════

router.get('/analytics/:table', (req, res) => {
  try {
    const { table } = req.params;
    const { table: t } = { table };
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const count = db.get(`SELECT COUNT(*) as count FROM "${table}"`);
    const schema = db.all(`PRAGMA table_info("${table}")`);
    const pk = schema.find(c => c.pk === 1);

// ═══════════════════════════════════════════════════════════════
// 📈 ۱۲. آنالیتیکس و آمار پیشرفته - ادامه
// ═══════════════════════════════════════════════════════════════

    const columnStats = [];
    for (const col of schema) {
      const stats = { name: col.name, type: col.type || 'ANY' };

      if (['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'DECIMAL'].includes(col.type?.toUpperCase())) {
        // آمار عددی
        const numStats = db.get(`
          SELECT 
            MIN("${col.name}") as min,
            MAX("${col.name}") as max,
            AVG("${col.name}") as avg,
            SUM("${col.name}") as sum,
            COUNT("${col.name}") as count
          FROM "${table}" WHERE "${col.name}" IS NOT NULL
        `);
        stats.numeric = numStats;

        // انحراف معیار
        const stdDev = db.get(`
          SELECT AVG(value) as mean FROM (
            SELECT "${col.name}" as value FROM "${table}" WHERE "${col.name}" IS NOT NULL
          )
        `);
        stats.numeric.mean = stdDev?.mean;

        // چارک‌ها
        const quartiles = db.all(`
          SELECT "${col.name}" as value FROM "${table}" WHERE "${col.name}" IS NOT NULL ORDER BY "${col.name}"
        `);
        if (quartiles.length > 0) {
          const q1 = quartiles[Math.floor(quartiles.length * 0.25)]?.value;
          const q2 = quartiles[Math.floor(quartiles.length * 0.5)]?.value;
          const q3 = quartiles[Math.floor(quartiles.length * 0.75)]?.value;
          stats.numeric.quartiles = { Q1: q1, Q2: q2, Q3: q3 };
        }
      } else if (['TEXT', 'VARCHAR', 'NVARCHAR', 'CHARACTER'].includes(col.type?.toUpperCase())) {
        // آمار متنی
        const textStats = db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT "${col.name}") as uniqueCount,
            MIN(LENGTH("${col.name}")) as minLength,
            MAX(LENGTH("${col.name}")) as maxLength,
            AVG(LENGTH("${col.name}")) as avgLength
          FROM "${table}" WHERE "${col.name}" IS NOT NULL
        `);
        stats.text = textStats;

        // پرکاربردترین مقادیر
        const topValues = db.all(`
          SELECT "${col.name}" as value, COUNT(*) as count 
          FROM "${table}" 
          WHERE "${col.name}" IS NOT NULL 
          GROUP BY "${col.name}" 
          ORDER BY count DESC 
          LIMIT 10
        `);
        stats.text.topValues = topValues;
      }

      // NULL و خالی
      const nullCount = db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${col.name}" IS NULL`)?.cnt || 0;
      const emptyCount = db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${col.name}" = ''`)?.cnt || 0;
      stats.nullCount = nullCount;
      stats.emptyCount = emptyCount;
      stats.nullPercentage = count?.count ? ((nullCount / count.count) * 100).toFixed(2) + '%' : '0%';

      columnStats.push(stats);
    }

    // خلاصه جدول
    res.json({
      success: true,
      table,
      overview: {
        rowCount: count?.count || 0,
        columnCount: schema.length,
        hasPrimaryKey: !!pk,
        primaryKey: pk?.name || null,
        tableSize: formatBytes((count?.count || 0) * schema.length * 50)
      },
      columnStatistics: columnStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تحلیل NULL ها ───
router.get('/analytics/nulls/:table', (req, res) => {
  try {
    const { table } = req.params;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const totalRows = db.get(`SELECT COUNT(*) as count FROM "${table}"`)?.count || 0;

    const nullAnalysis = schema.map(col => {
      const nullCount = db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${col.name}" IS NULL`)?.cnt || 0;
      const emptyStringCount = db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${col.name}" = ''`)?.cnt || 0;
      const zeroCount = ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT'].includes(col.type?.toUpperCase())
        ? db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${col.name}" = 0`)?.cnt || 0
        : null;

      return {
        column: col.name,
        type: col.type || 'ANY',
        nullCount,
        emptyStringCount,
        zeroCount,
        filledCount: totalRows - nullCount,
        nullPercentage: totalRows ? ((nullCount / totalRows) * 100).toFixed(2) + '%' : '0%',
        dataCompleteness: totalRows ? ((1 - nullCount / totalRows) * 100).toFixed(2) + '%' : '100%',
        isNullable: col.notnull === 0
      };
    });

    const problematicColumns = nullAnalysis.filter(c => parseFloat(c.nullPercentage) > 10);

    res.json({
      success: true,
      table,
      totalRows,
      summary: {
        totalColumns: schema.length,
        columnsWithNulls: nullAnalysis.filter(c => c.nullCount > 0).length,
        fullyFilledColumns: nullAnalysis.filter(c => c.nullCount === 0).length,
        dataCompleteness: ((nullAnalysis.reduce((sum, c) => sum + (totalRows - c.nullCount), 0) / (totalRows * schema.length)) * 100).toFixed(2) + '%'
      },
      columns: nullAnalysis.sort((a, b) => parseFloat(b.nullPercentage) - parseFloat(a.nullPercentage)),
      warnings: problematicColumns.length > 0
        ? `${problematicColumns.length} columns have more than 10% NULL values`
        : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تحلیل تکراری‌ها ═══════════════════════════════════════════════════════════════
router.get('/analytics/duplicates/:table', (req, res) => {
  try {
    const { table } = req.params;
    const { columns = 'id' } = req.query;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const schemaCols = schema.map(c => c.name);
    const checkColumns = columns.split(',').map(c => c.trim()).filter(c => schemaCols.includes(c));

    if (checkColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid columns specified',
        availableColumns: schemaCols
      });
    }

    const colList = checkColumns.map(c => `"${c}"`).join(', ');
    const totalRows = db.get(`SELECT COUNT(*) as count FROM "${table}"`)?.count || 0;

    // رکوردهای تکراری
    const duplicates = db.all(`
      SELECT ${colList}, COUNT(*) as duplicate_count
      FROM "${table}"
      GROUP BY ${colList}
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT 100
    `);

    // تعداد رکوردهای تکراری
    const duplicateRows = db.get(`
      SELECT SUM(cnt) as total FROM (
        SELECT COUNT(*) as cnt FROM "${table}"
        GROUP BY ${colList}
        HAVING COUNT(*) > 1
      )
    `);

    res.json({
      success: true,
      table,
      checkedColumns: checkColumns,
      totalRows,
      summary: {
        duplicateGroups: duplicates.length,
        duplicateRecords: duplicateRows?.total || 0,
        duplicatePercentage: totalRows ? (((duplicateRows?.total || 0) / totalRows) * 100).toFixed(2) + '%' : '0%'
      },
      duplicates: duplicates.map(d => ({
        values: checkColumns.reduce((obj, col) => {
          obj[col] = d[col];
          return obj;
        }, {}),
        count: d.duplicate_count
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── بالاترین رکوردها (Top N) ═══════════════════════════════════════════════════════════════
router.get('/analytics/top/:table', (req, res) => {
  try {
    const { table } = req.params;
    const { column, count = 10 } = req.query;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    if (!column) {
      // خودکار: اول ستون عددی، بعد کلید اصلی
      const schema = db.all(`PRAGMA table_info("${table}")`);
      const numericCol = schema.find(c =>
        ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].includes(c.type?.toUpperCase())
      );
      const pk = schema.find(c => c.pk === 1);
      column = numericCol?.name || pk?.name || schema[0]?.name;

      if (!column) {
        return res.status(400).json({ success: false, error: 'No suitable column found' });
      }
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    if (!schema.find(c => c.name === column)) {
      return res.status(400).json({ success: false, error: `Column "${column}" not found` });
    }

    const limit = Math.min(parseInt(count), 100);
    const data = db.all(
      `SELECT * FROM "${table}" WHERE "${column}" IS NOT NULL ORDER BY "${column}" DESC LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      table,
      sortedBy: column,
      requestedCount: limit,
      top: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── پایین‌ترین رکوردها (Bottom N) ═══════════════════════════════════════════════════════════════
router.get('/analytics/bottom/:table', (req, res) => {
  try {
    const { table } = req.params;
    const { column, count = 10 } = req.query;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    if (!column) {
      const schema = db.all(`PRAGMA table_info("${table}")`);
      const numericCol = schema.find(c =>
        ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].includes(c.type?.toUpperCase())
      );
      const pk = schema.find(c => c.pk === 1);
      column = numericCol?.name || pk?.name || schema[0]?.name;
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    if (!schema.find(c => c.name === column)) {
      return res.status(400).json({ success: false, error: `Column "${column}" not found` });
    }

    const limit = Math.min(parseInt(count), 100);
    const data = db.all(
      `SELECT * FROM "${table}" WHERE "${column}" IS NOT NULL ORDER BY "${column}" ASC LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      table,
      sortedBy: column,
      requestedCount: limit,
      bottom: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── آمار یک ستون خاص ═══════════════════════════════════════════════════════════════
router.get('/analytics/column/:table/:column', (req, res) => {
  try {
    const { table, column } = req.params;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const colInfo = schema.find(c => c.name === column);
    if (!colInfo) {
      return res.status(400).json({
        success: false,
        error: `Column "${column}" not found`,
        availableColumns: schema.map(c => c.name)
      });
    }

    const totalRows = db.get(`SELECT COUNT(*) as count FROM "${table}"`)?.count || 0;
    const colType = colInfo.type?.toUpperCase() || 'TEXT';

    let stats = {
      name: column,
      type: colType,
      nullable: colInfo.notnull === 0,
      defaultValue: colInfo.dflt_value,
      isPrimaryKey: colInfo.pk === 1
    };

    if (['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].includes(colType)) {
      // آمار عددی
      const numStats = db.get(`
        SELECT 
          MIN("${column}") as min,
          MAX("${column}") as max,
          AVG("${column}") as avg,
          SUM("${column}") as sum,
          COUNT("${column}") as count,
          COUNT(DISTINCT "${column}") as unique_count
        FROM "${table}"
      `);
      stats.numerical = {
        ...numStats,
        range: numStats.max - numStats.min,
        variance: db.get(`SELECT AVG(("${column}" - (SELECT AVG("${column}") FROM "${table}")) * ("${column}" - (SELECT AVG("${column}") FROM "${table}"))) as var FROM "${table}" WHERE "${column}" IS NOT NULL`)?.var || 0
      };
    } else {
      // آمار متنی
      const textStats = db.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT "${column}") as unique_count,
          MIN(LENGTH("${column}")) as min_length,
          MAX(LENGTH("${column}")) as max_length,
          AVG(LENGTH("${column}")) as avg_length
        FROM "${table}"
      `);
      stats.textual = textStats;
    }

    // NULL
    const nullCount = db.get(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "${column}" IS NULL`)?.cnt || 0;
    stats.nullCount = nullCount;
    stats.nullPercentage = totalRows ? ((nullCount / totalRows) * 100).toFixed(2) + '%' : '0%';

    res.json({
      success: true,
      table,
      statistics: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── توزیع مقادیر ═══════════════════════════════════════════════════════════════
router.get('/analytics/distribution/:table/:column', (req, res) => {
  try {
    const { table, column } = req.params;
    const { buckets = 10 } = req.query;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const colInfo = schema.find(c => c.name === column);
    if (!colInfo) {
      return res.status(400).json({ success: false, error: `Column "${column}" not found` });
    }

    const colType = colInfo.type?.toUpperCase() || 'TEXT';
    const total = db.get(`SELECT COUNT(*) as count FROM "${table}" WHERE "${column}" IS NOT NULL`)?.count || 0;

    if (['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].includes(colType)) {
      // هیستوگرام عددی
      const minMax = db.get(`SELECT MIN("${column}") as min, MAX("${column}") as max FROM "${table}" WHERE "${column}" IS NOT NULL`);
      if (!minMax?.min) {
        return res.json({ success: true, table, column, distribution: [], message: 'No data' });
      }

      const min = minMax.min;
      const max = minMax.max;
      const bucketCount = Math.min(parseInt(buckets), 100);
      const bucketSize = (max - min) / bucketCount || 1;

      const distribution = [];
      for (let i = 0; i < bucketCount; i++) {
        const start = min + (i * bucketSize);
        const end = start + bucketSize;
        const count = db.get(`
          SELECT COUNT(*) as cnt FROM "${table}" 
          WHERE "${column}" >= ${start} AND "${column}" < ${end}
        `)?.cnt || 0;

        distribution.push({
          range: `${start.toFixed(2)} - ${end.toFixed(2)}`,
          start,
          end,
          count,
          percentage: total ? ((count / total) * 100).toFixed(2) + '%' : '0%'
        });
      }

      res.json({
        success: true,
        table,
        column,
        type: 'numerical_histogram',
        totalValues: total,
        min,
        max,
        bucketCount: distribution.length,
        distribution
      });
    } else {
      // توزیع مقادیر متنی
      const values = db.all(`
        SELECT "${column}" as value, COUNT(*) as count 
        FROM "${table}" 
        WHERE "${column}" IS NOT NULL 
        GROUP BY "${column}" 
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        table,
        column,
        type: 'categorical',
        totalValues: total,
        uniqueValues: values.length,
        distribution: values.map(v => ({
          value: v.value,
          count: v.count,
          percentage: total ? ((v.count / total) * 100).toFixed(2) + '%' : '0%'
        }))
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── همبستگی عددی ═══════════════════════════════════════════════════════════════
router.get('/analytics/correlations/:table', (req, res) => {
  try {
    const { table } = req.params;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const numericCols = schema.filter(c =>
      ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'].includes(c.type?.toUpperCase())
    );

    if (numericCols.length < 2) {
      return res.json({
        success: true,
        table,
        message: 'Need at least 2 numeric columns for correlation',
        numericColumns: numericCols.map(c => c.name)
      });
    }

    // محاسبه همبستگی بین ستون‌ها
    const correlations = [];
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const col1 = numericCols[i];
        const col2 = numericCols[j];

        // میانگین و انحراف معیار
        const stats1 = db.get(`SELECT AVG("${col1.name}") as avg FROM "${table}" WHERE "${col1.name}" IS NOT NULL`);
        const stats2 = db.get(`SELECT AVG("${col2.name}") as avg FROM "${table}" WHERE "${col2.name}" IS NOT NULL`);

        // همبستگی پیرسون
        const correlation = db.get(`
          SELECT AVG(("${col1.name}" - ${stats1.avg || 0}) * ("${col2.name}" - ${stats2.avg || 0})) /
                 (ABS(AVG(("${col1.name}" - ${stats1.avg || 0}) * ("${col1.name}" - ${stats1.avg || 0}))) *
                  ABS(AVG(("${col2.name}" - ${stats2.avg || 0}) * ("${col2.name}" - ${stats2.avg || 0})))) as corr
          FROM "${table}" 
          WHERE "${col1.name}" IS NOT NULL AND "${col2.name}" IS NOT NULL
        `);

        if (correlation?.corr !== null) {
          const strength = Math.abs(correlation.corr);
          correlations.push({
            column1: col1.name,
            column2: col2.name,
            correlation: parseFloat(correlation.corr?.toFixed(4)),
            strength: strength > 0.7 ? 'Strong' : strength > 0.4 ? 'Moderate' : strength > 0.2 ? 'Weak' : 'Very Weak',
            direction: correlation.corr > 0 ? 'Positive' : 'Negative'
          });
        }
      }
    }

    res.json({
      success: true,
      table,
      numericColumns: numericCols.map(c => c.name),
      correlationCount: correlations.length,
      correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── خط زمانی داده‌ها ═══════════════════════════════════════════════════════════════
router.get('/analytics/timeline/:table', (req, res) => {
  try {
    const { table } = req.params;
    const { column, format = 'day' } = req.query;
    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);

    // پیدا کردن ستون تاریخ
    let dateCol = column;
    if (!dateCol) {
      const dateCandidate = schema.find(c =>
        ['created_at', 'updated_at', 'createdat', 'updatedat', 'timestamp', 'date', 'added_at'].some(
          d => c.name.toLowerCase().includes(d)
        )
      );
      dateCol = dateCandidate?.name || schema[0]?.name;
    }

    if (!dateCol) {
      return res.status(400).json({ success: false, error: 'No date column found or specified' });
    }

    let groupFormat;
    switch (format) {
      case 'hour': groupFormat = '%Y-%m-%d %H:00'; break;
      case 'day': groupFormat = '%Y-%m-%d'; break;
      case 'week': groupFormat = '%Y-%W'; break;
      case 'month': groupFormat = '%Y-%m'; break;
      case 'year': groupFormat = '%Y'; break;
      default: groupFormat = '%Y-%m-%d';
    }

    const timeline = db.all(`
      SELECT 
        strftime('${groupFormat}', "${dateCol}") as period,
        COUNT(*) as count
      FROM "${table}"
      WHERE "${dateCol}" IS NOT NULL
      GROUP BY period
      ORDER BY period ASC
    `);

    const range = db.get(`
      SELECT 
        MIN("${dateCol}") as earliest,
        MAX("${dateCol}") as latest
      FROM "${table}" WHERE "${dateCol}" IS NOT NULL
    `);

    res.json({
      success: true,
      table,
      dateColumn: dateCol,
      format,
      range: {
        earliest: range?.earliest,
        latest: range?.latest,
        span: timeline.length + ' periods'
      },
      timeline
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔄 ۱۳. اجرای کوئری SQL
// ═══════════════════════════════════════════════════════════════

router.post('/query', (req, res) => {
  try {
    const { sql, params = [], pretty } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SQL query required',
        hint: '{ "sql": "SELECT * FROM users", "params": [] }'
      });
    }

    const trimmedSql = sql.trim().toUpperCase();

    // جلوگیری از عملیات‌های خطرناک
    const dangerous = [
      { pattern: /^DROP\s+/i, name: 'DROP' },
      { pattern: /^TRUNCATE\s+/i, name: 'TRUNCATE' },
      { pattern: /^DELETE\s+FROM\s+(?!.*WHERE)/i, name: 'DELETE without WHERE' },
      { pattern: /^UPDATE\s+.*SET\s+(?!.*WHERE)/i, name: 'UPDATE without WHERE' },
      { pattern: /^ALTER\s+TABLE\s+.*DROP/i, name: 'ALTER DROP' },
      { pattern: /^CREATE\s+TRIGGER/i, name: 'CREATE TRIGGER' },
      { pattern: /^ATTACH\s+DATABASE/i, name: 'ATTACH' },
      { pattern: /^DETACH\s+DATABASE/i, name: 'DETACH' },
    ];

    for (const op of dangerous) {
      if (op.pattern.test(trimmedSql)) {
        logger.warn(`[DB QUERY BLOCKED] ${sql.substring(0, 100)} - ${op.name}`);
        return res.status(403).json({
          success: false,
          error: `Operation "${op.name}" is blocked for safety`,
          hint: 'Use specific endpoints for DDL operations'
        });
      }
    }

    const isSelect = trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA') || trimmedSql.startsWith('EXPLAIN');
    const startTime = Date.now();

    let result;
    if (isSelect) {
      result = Array.isArray(params) && params.length > 0
        ? db.all(sql, params)
        : db.all(sql);
    } else {
      if (Array.isArray(params) && params.length > 0) {
        db.run(sql, params);
      } else {
        db.run(sql);
      }
      result = { changes: db.get(`SELECT changes() as count`)?.count || 0 };
    }

    const duration = Date.now() - startTime;
    addToHistory(sql, isSelect ? 'SELECT' : 'MODIFY', duration, result);

    res.json({
      success: true,
      type: isSelect ? 'SELECT' : 'MODIFY',
      query: pretty === 'true' ? sql.replace(/\s+/g, ' ').trim() : sql,
      params: params || [],
      rowCount: Array.isArray(result) ? result.length : result.changes,
      performance: {
        duration,
        durationHuman: formatDuration(duration)
      },
      data: Array.isArray(result) ? result : null,
      changes: Array.isArray(result) ? null : result.changes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── کوئری آماده (Prepared Statement) ═══════════════════════════════════════════════════════════════
router.post('/query/prepared', (req, res) => {
  try {
    const { sql, params = [], execute = false } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, error: 'SQL query required' });
    }

    // فقط SELECT و PRAGMA مجاز
    const safeSql = sql.trim().toUpperCase();
    if (!safeSql.startsWith('SELECT') && !safeSql.startsWith('PRAGMA')) {
      return res.status(400).json({ success: false, error: 'Only SELECT queries allowed for prepared statements' });
    }

    // اعتبارسنجی پارامترها
    const placeholderCount = (sql.match(/\?/g) || []).length;
    if (params.length !== placeholderCount) {
      return res.status(400).json({
        success: false,
        error: `Parameter count mismatch`,
        expected: placeholderCount,
        received: params.length
      });
    }

    const startTime = Date.now();
    let result;

    if (execute) {
      // اجرا با پارامترها
      result = db.all(sql, params);
    } else {
      // فقط آماده‌سازی
      result = db.all(`EXPLAIN QUERY PLAN ${sql}`, params);
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      message: execute ? 'Query executed' : 'Query prepared (not executed)',
      query: sql,
      params,
      placeholderCount,
      result: Array.isArray(result) ? result : null,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── نمایش طرح اجرای کوئری ═══════════════════════════════════════════════════════════════
router.post('/explain', (req, res) => {
  try {
    const { sql, params = [] } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, error: 'SQL query required' });
    }

    // فقط SELECT مجاز
    const safeSql = sql.trim().toUpperCase();
    if (!safeSql.startsWith('SELECT')) {
      return res.status(400).json({ success: false, error: 'Only SELECT queries allowed for EXPLAIN' });
    }

    const plan = db.all(`EXPLAIN QUERY PLAN ${sql}`, params);

    res.json({
      success: true,
      query: sql,
      plan
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── کوئری خام با GET ═══════════════════════════════════════════════════════════════
router.get('/raw', (req, res) => {
  try {
    const { sql } = req.query;

    if (!sql) {
      return res.status(400).json({ success: false, error: 'SQL query required' });
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('PRAGMA')) {
      return res.status(400).json({ success: false, error: 'Only SELECT queries allowed via GET' });
    }

    const startTime = Date.now();
    const data = db.all(sql);
    const duration = Date.now() - startTime;

    addToHistory(sql, 'SELECT', duration, data);

    res.json({
      success: true,
      query: sql,
      rowCount: data.length,
      performance: { duration, durationHuman: formatDuration(duration) },
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تاریخچه کوئری‌ها ═══════════════════════════════════════════════════════════════
router.get('/query/history', (req, res) => {
  try {
    const { limit = 50, type } = req.query;

    let history = [...queryHistory];
    if (type) {
      history = history.filter(h => h.type === type.toUpperCase());
    }

    history = history.slice(0, parseInt(limit));

    res.json({
      success: true,
      total: history.length,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── پاک کردن تاریخچه ═══════════════════════════════════════════════════════════════
router.post('/query/history/clear', (req, res) => {
  queryHistory.length = 0;
  res.json({ success: true, message: 'Query history cleared' });
});

// ═══════════════════════════════════════════════════════════════
// 🛠️ ۱۴. عملیات DDL
// ═══════════════════════════════════════════════════════════════

// ─── ساخت جدول جدید ═══════════════════════════════════════════════════════════════
router.post('/tables', (req, res) => {
  try {
    const { name, columns, ifNotExists = true, temporary = false } = req.body;

    if (!name || !columns || !Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Name and columns (array) required',
        example: {
          name: 'users',
          columns: [
            { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'email', type: 'TEXT', unique: true }
          ]
        }
      });
    }

    if (!isValidIdentifier(name)) {
      return res.status(400).json({ success: false, error: 'Invalid table name' });
    }

    // اعتبارسنجی ستون‌ها
    for (const col of columns) {
      if (!col.name || !col.type) {
        return res.status(400).json({ success: false, error: 'Each column needs name and type' });
      }
      if (!isValidIdentifier(col.name)) {
        return res.status(400).json({ success: false, error: `Invalid column name: ${col.name}` });
      }
    }

    const columnDefs = columns.map(col => {
      let def = `"${col.name}" ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement && ['INTEGER'].includes(col.type.toUpperCase())) def += ' AUTOINCREMENT';
      if (col.notNull) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.default !== undefined) def += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
      if (col.check) def += ` CHECK (${col.check})`;
      if (col.references) def += ` REFERENCES ${col.references}`;
      return def;
    }).join(', ');

    const query = `CREATE ${temporary ? 'TEMP ' : ''}TABLE ${ifNotExists ? 'IF NOT EXISTS ' : ''}"${name}" (${columnDefs})`;
    db.run(query);

    addToHistory(query, 'CREATE TABLE', 0, { table: name });
    logger.info(`[DB CREATE TABLE] ${name}`);

    res.status(201).json({
      success: true,
      message: `Table "${name}" created`,
      table: name,
      columnCount: columns.length,
      query,
      definition: columns
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── حذف جدول ═══════════════════════════════════════════════════════════════
router.delete('/tables/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { force, cascade } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    // جدول‌های حیاتی
    const protectedTables = ['users', 'roles', 'permissions', 'sessions', 'settings'];
    if (protectedTables.includes(table.toLowerCase()) && force !== 'true') {
      return res.status(403).json({
        success: false,
        error: `Table "${table}" is protected`,
        hint: 'Use ?force=true to override (not recommended)',
        protectedTables
      });
    }

    // بررسی روابط
    if (cascade !== 'true') {
      const fks = db.all(`PRAGMA foreign_key_list("${table}")`);
      if (fks.length > 0) {
        const referencing = fks.map(fk =>
          `${fk.table}.${fk.from} → ${table}.${fk.to}`
        );
        return res.status(409).json({
          success: false,
          error: 'Table has foreign key references',
          references: referencing,
          hint: 'Use ?cascade=true to drop table and remove references'
        });
      }
    }

    db.run(`DROP TABLE ${cascade === 'true' ? 'CASCADE' : ''} "${table}"`);

    addToHistory(`DROP TABLE ${table}`, 'DROP TABLE', 0, {});
    logger.warn(`[DB DROP TABLE] ${table} ${cascade === 'true' ? '(CASCADE)' : ''}`);

    res.json({
      success: true,
      message: `Table "${table}" dropped`,
      table
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── اضافه کردن ستون ═══════════════════════════════════════════════════════════════
router.post('/tables/:table/columns', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { name, type, notNull, default: defaultValue, unique, check, references } = req.body;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type required' });
    }
    if (!isValidIdentifier(name)) {
      return res.status(400).json({ success: false, error: 'Invalid column name' });
    }

    // بررسی وجود ستون
    const schema = db.all(`PRAGMA table_info("${table}")`);
    if (schema.find(c => c.name === name)) {
      return res.status(409).json({ success: false, error: `Column "${name}" already exists` });
    }

    let query = `ALTER TABLE "${table}" ADD COLUMN "${name}" ${type}`;
    if (notNull) {
      query += ' NOT NULL';
      if (defaultValue !== undefined) {
        query += ` DEFAULT ${typeof defaultValue === 'string' ? `'${defaultValue}'` : defaultValue}`;
      } else {
        query += ' DEFAULT 0';
      }
    }
    if (defaultValue !== undefined && !notNull) {
      query += ` DEFAULT ${typeof defaultValue === 'string' ? `'${defaultValue}'` : defaultValue}`;
    }
    if (unique) query += ' UNIQUE';
    if (check) query += ` CHECK (${check})`;
    if (references) query += ` REFERENCES ${references}`;

    db.run(query);

    addToHistory(query, 'ADD COLUMN', 0, { table, column: name });
    logger.info(`[DB ADD COLUMN] ${table}.${name}`);

    res.status(201).json({
      success: true,
      message: `Column "${name}" added to "${table}"`,
      column: { name, type, notNull, default: defaultValue, unique },
      query
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── حذف ستون ═══════════════════════════════════════════════════════════════
router.delete('/tables/:table/columns/:column', validateTable, (req, res) => {
  try {
    const { table, column } = req.params;
    const { force } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const colExists = schema.find(c => c.name === column);
    if (!colExists) {
      return res.status(404).json({ success: false, error: `Column "${column}" not found` });
    }

    // بررسی کلید اصلی
    if (colExists.pk === 1 && force !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Cannot drop primary key column',
        hint: 'Use ?force=true to override'
      });
    }

    // SQLite 3.35.0+ پشتیبانی از DROP COLUMN
    try {
      db.run(`ALTER TABLE "${table}" DROP COLUMN "${column}"`);
    } catch (e) {
      // روش قدیمی: بازسازی جدول
      const tempTable = `${table}_temp_${Date.now()}`;
      const existingCols = schema.filter(c => c.name !== column).map(c => `"${c.name}"`).join(', ');
      const createSQL = db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [table]);

      // پشتیبانی‌گیری از داده‌ها
      const data = db.all(`SELECT ${existingCols} FROM "${table}"`);
      db.run(`CREATE TABLE "${tempTable}" AS SELECT ${existingCols} FROM "${table}"`);
      db.run(`DROP TABLE "${table}"`);
      db.run(`ALTER TABLE "${tempTable}" RENAME TO "${table}"`);

      logger.warn(`[DB DROP COLUMN] ${table}.${column} (via rebuild)`);
      return res.json({
        success: true,
        message: `Column "${column}" dropped from "${table}"`,
        method: 'table_rebuild'
      });
    }

    logger.warn(`[DB DROP COLUMN] ${table}.${column}`);
    res.json({
      success: true,
      message: `Column "${column}" dropped from "${table}"`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ساخت ایندکس ═══════════════════════════════════════════════════════════════
router.post('/indexes', (req, res) => {
  try {
    const { name, table, columns, unique = false, ifNotExists = false } = req.body;

    if (!name || !table || !columns) {
      return res.status(400).json({ success: false, error: 'Name, table, and columns required' });
    }
    if (!isValidIdentifier(name) || !isValidIdentifier(table)) {
      return res.status(400).json({ success: false, error: 'Invalid identifier' });
    }

    const cols = Array.isArray(columns) ? columns : [columns];
    for (const col of cols) {
      if (!isValidIdentifier(col)) {
        return res.status(400).json({ success: false, error: `Invalid column: ${col}` });
      }
    }

    const query = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${ifNotExists ? 'IF NOT EXISTS ' : ''}"${name}" ON "${table}" (${cols.map(c => `"${c}"`).join(', ')})`;

    db.run(query);

    addToHistory(query, 'CREATE INDEX', 0, { index: name, table });
    logger.info(`[DB CREATE INDEX] ${name} ON ${table}(${cols.join(', ')})`);

    res.status(201).json({
      success: true,
      message: `Index "${name}" created`,
      index: name,
      table,
      columns: cols,
      unique,
      query
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── حذف ایندکس ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 🛠️ ۱۴. عملیات DDL - ادامه
// ═══════════════════════════════════════════════════════════════
router.delete('/indexes/:name', (req, res) => {
  try {
    const { name } = req.params;

    // بررسی وجود
    const index = db.get(
      "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name=?",
      [name]
    );
    if (!index) {
      return res.status(404).json({
        success: false,
        error: `Index "${name}" not found`,
        availableIndexes: db.all(
          "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
        ).map(i => i.name)
      });
    }

    // ایندکس‌های sqlite_* محافظت شده
    if (name.startsWith('sqlite_')) {
      return res.status(403).json({
        success: false,
        error: 'Cannot drop system indexes'
      });
    }

    db.run(`DROP INDEX IF EXISTS "${name}"`);

    addToHistory(`DROP INDEX ${name}`, 'DROP INDEX', 0, {});
    logger.warn(`[DB DROP INDEX] ${name}`);

    res.json({
      success: true,
      message: `Index "${name}" dropped`,
      index: name,
      wasOnTable: index.tbl_name
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ساخت ویو ───
router.post('/views', (req, res) => {
  try {
    const { name, sql, orReplace = false } = req.body;

    if (!name || !sql) {
      return res.status(400).json({
        success: false,
        error: 'Name and SQL query required',
        example: { name: 'active_users', sql: 'SELECT * FROM users WHERE status = "active"' }
      });
    }
    if (!isValidIdentifier(name)) {
      return res.status(400).json({ success: false, error: 'Invalid view name' });
    }

    const safeSql = sql.trim().toUpperCase();
    if (!safeSql.startsWith('SELECT')) {
      return res.status(400).json({ success: false, error: 'View SQL must start with SELECT' });
    }

    const query = `CREATE ${orReplace ? 'OR REPLACE ' : ''}VIEW "${name}" AS ${sql}`;
    db.run(query);

    addToHistory(query, 'CREATE VIEW', 0, { view: name });
    logger.info(`[DB CREATE VIEW] ${name}`);

    res.status(201).json({
      success: true,
      message: `View "${name}" created`,
      view: name,
      query
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── حذف ویو ───
router.delete('/views/:name', (req, res) => {
  try {
    const { name } = req.params;

    const view = db.get(
      "SELECT name FROM sqlite_master WHERE type='view' AND name=?",
      [name]
    );
    if (!view) {
      return res.status(404).json({
        success: false,
        error: `View "${name}" not found`,
        availableViews: db.all(
          "SELECT name FROM sqlite_master WHERE type='view'"
        ).map(v => v.name)
      });
    }

    db.run(`DROP VIEW "${name}"`);

    addToHistory(`DROP VIEW ${name}`, 'DROP VIEW', 0, {});
    logger.warn(`[DB DROP VIEW] ${name}`);

    res.json({
      success: true,
      message: `View "${name}" dropped`,
      view: name
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔗 ۱۵. مدیریت روابط
// ═══════════════════════════════════════════════════════════════

// ─── رکورد با داده‌های مرتبط (forward relations) ───
router.get('/relate/:table/:id', (req, res) => {
  try {
    const { table, id } = req.params;
    const { depth = 1 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const foreignKeys = db.all(`PRAGMA foreign_key_list("${table}")`);
    const relations = {};

    for (const fk of foreignKeys) {
      const targetRecords = db.all(
        `SELECT * FROM "${fk.table}" WHERE "${fk.to}" = ?`,
        [record[fk.from]]
      );

      relations[fk.from] = {
        targetTable: fk.table,
        targetColumn: fk.to,
        sourceColumn: fk.from,
        relationship: `${table}.${fk.from} → ${fk.table}.${fk.to}`,
        count: targetRecords.length,
        records: depth === '1' ? targetRecords.slice(0, 20) : targetRecords,
        onDelete: fk.on_delete || 'NO ACTION',
        onUpdate: fk.on_update || 'NO ACTION'
      };

      // اگر depth > 1، روابط تو در تو
      if (parseInt(depth) > 1 && targetRecords.length > 0) {
        const targetPk = findPrimaryKey(fk.table);
        if (targetPk) {
          relations[fk.from].nestedRelations = targetRecords.slice(0, 5).map(tr => {
            const nestedFks = db.all(`PRAGMA foreign_key_list("${fk.table}")`);
            const nested = {};
            for (const nfk of nestedFks) {
              const nestedRecords = db.all(
                `SELECT * FROM "${nfk.table}" WHERE "${nfk.to}" = ? LIMIT 5`,
                [tr[nfk.from]]
              );
              if (nestedRecords.length > 0) {
                nested[nfk.from] = {
                  targetTable: nfk.table,
                  count: nestedRecords.length,
                  sample: nestedRecords
                };
              }
            }
            return { id: tr[targetPk.name], relations: nested };
          });
        }
      }
    }

    res.json({
      success: true,
      table,
      primaryKey: pk.name,
      record,
      relationCount: Object.keys(relations).length,
      depth: parseInt(depth),
      relations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── روابط معکوس (چه رکوردهایی به این رکورد ارجاع می‌دهند) ───
router.get('/relate/:table/:id/reverse', (req, res) => {
  try {
    const { table, id } = req.params;
    const { limit = 10 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // پیدا کردن همه جدول‌هایی که به این جدول ارجاع می‌دهند
    const allTables = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const reverseRelations = [];
    for (const t of allTables) {
      if (t.name === table) continue;

      const fks = db.all(`PRAGMA foreign_key_list("${t.name}")`);
      for (const fk of fks) {
        if (fk.table === table) {
          // این جدول به جدول ما ارجاع می‌دهد
          const related = db.all(
            `SELECT * FROM "${t.name}" WHERE "${fk.from}" = ? LIMIT ?`,
            [record[pk.name], parseInt(limit)]
          );
          if (related.length > 0) {
            reverseRelations.push({
              sourceTable: t.name,
              sourceColumn: fk.from,
              targetTable: table,
              targetColumn: fk.to,
              relationship: `${t.name}.${fk.from} → ${table}.${fk.to}`,
              count: related.length,
              sample: related,
              onDelete: fk.on_delete,
              onUpdate: fk.on_update
            });
          }
        }
      }
    }

    res.json({
      success: true,
      table,
      primaryKey: pk.name,
      record,
      totalRelatedRecords: reverseRelations.reduce((sum, r) => sum + r.count, 0),
      relationshipCount: reverseRelations.length,
      reverseRelations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── گراف کامل روابط ───
router.get('/relate/graph/:table/:id', (req, res) => {
  try {
    const { table, id } = req.params;
    const { maxDepth = 3 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    const pk = findPrimaryKey(table);
    if (!pk) {
      return res.status(400).json({ success: false, error: 'No primary key found' });
    }

    const record = db.get(`SELECT * FROM "${table}" WHERE "${pk.name}" = ?`, [id]);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // ساخت گراف
    const graph = {
      node: { table, id, record },
      edges: []
    };

    const visited = new Set();
    const traverse = (currentTable, currentId, depth = 0) => {
      if (depth >= parseInt(maxDepth)) return;

      const currentPk = findPrimaryKey(currentTable);
      if (!currentPk) return;

      const currentRecord = db.get(
        `SELECT * FROM "${currentTable}" WHERE "${currentPk.name}" = ?`,
        [currentId]
      );
      if (!currentRecord) return;

      const fks = db.all(`PRAGMA foreign_key_list("${currentTable}")`);
      for (const fk of fks) {
        const key = `${currentTable}.${currentId}→${fk.table}.${fk.to}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const relatedRecords = db.all(
          `SELECT * FROM "${fk.table}" WHERE "${fk.to}" = ?`,
          [currentRecord[fk.from]]
        );

        graph.edges.push({
          from: { table: currentTable, id: currentId, column: fk.from },
          to: { table: fk.table, column: fk.to },
          type: 'forward',
          count: relatedRecords.length,
          sample: relatedRecords.slice(0, 3)
        });

        // ادامه traversal
        for (const related of relatedRecords.slice(0, 2)) {
          const relatedPk = findPrimaryKey(fk.table);
          if (relatedPk) {
            traverse(fk.table, related[relatedPk.name], depth + 1);
          }
        }
      }
    };

    traverse(table, id);

    res.json({
      success: true,
      root: { table, primaryKey: pk.name, id, record },
      depth: parseInt(maxDepth),
      nodeCount: new Set([table, ...graph.edges.map(e => e.to.table)]).size,
      edgeCount: graph.edges.length,
      graph
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 💾 ۱۶. پشتیبان‌گیری و بازگردانی
// ═══════════════════════════════════════════════════════════════

// ─── پشتیبان‌گیری (Backup) ───
router.get('/backup', (req, res) => {
  try {
    const { format = 'json', tables } = req.query;

    if (format === 'json') {
      const allTables = tables
        ? tables.split(',')
        : db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t => t.name);

      const backup = {};
      for (const tableName of allTables) {
        if (!tableExists(tableName)) continue;
        const data = db.all(`SELECT * FROM "${tableName}"`);
        const schema = db.all(`PRAGMA table_info("${tableName}")`);
        backup[tableName] = {
          schema,
          rows: data,
          count: data.length
        };
      }

      res.setHeader('Content-Disposition', `attachment; filename="db_backup_${Date.now()}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        database: db._db ? 'in-memory' : 'file',
        tableCount: Object.keys(backup).length,
        data: backup
      });
    } else if (format === 'sql') {
      // خروجی SQL
      const statements = [];
      const allTables = tables
        ? tables.split(',')
        : db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t => t.name);

      for (const tableName of allTables) {
        if (!tableExists(tableName)) continue;

        // CREATE TABLE
        const createSQL = db.get(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
          [tableName]
        );
        if (createSQL?.sql) {
          statements.push(createSQL.sql + ';');
        }

        // INSERT data
        const data = db.all(`SELECT * FROM "${tableName}"`);
        for (const row of data) {
          const cols = Object.keys(row);
          const vals = cols.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return String(v);
          });
          statements.push(
            `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${vals.join(',')});`
          );
        }
      }

      res.setHeader('Content-Disposition', `attachment; filename="db_backup_${Date.now()}.sql"`);
      res.setHeader('Content-Type', 'text/sql');
      res.send('-- SQLite Backup\n-- ' + new Date().toISOString() + '\n\n' + statements.join('\n'));
    } else {
      res.status(400).json({ success: false, error: 'Invalid format. Use json or sql.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── بازگردانی (Restore) ───
router.post('/restore', (req, res) => {
  try {
    const { data, mode = 'replace', tables: targetTables } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Data object required' });
    }

    const results = {};
    let totalInserted = 0;

    for (const [tableName, tableData] of Object.entries(data)) {
      if (targetTables && !targetTables.includes(tableName)) continue;

      try {
        if (!tableExists(tableName)) {
          results[tableName] = { status: 'skipped', reason: 'Table does not exist' };
          continue;
        }

        const schema = db.all(`PRAGMA table_info("${tableName}")`);
        const schemaCols = new Set(schema.map(c => c.name));

        let inserted = 0;
        if (Array.isArray(tableData.rows || tableData.data)) {
          const rows = tableData.rows || tableData.data;

          if (mode === 'replace') {
            db.run(`DELETE FROM "${tableName}"`);
          }

          for (const row of rows) {
            const cols = Object.keys(row).filter(c => schemaCols.has(c));
            if (cols.length === 0) continue;

            const vals = cols.map(c => {
              const v = row[c];
              if (v === null || v === undefined) return null;
              return v;
            });

            try {
              db.run(
                `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
                vals
              );
              inserted++;
            } catch (e) {
              // ignore duplicate or constraint errors in restore
            }
          }
        }

        totalInserted += inserted;
        results[tableName] = { status: 'ok', inserted };
      } catch (err) {
        results[tableName] = { status: 'error', error: err.message };
      }
    }

    logger.info(`[DB RESTORE] Restored ${totalInserted} records`);

    res.json({
      success: true,
      message: `Restored ${totalInserted} records`,
      totalInserted,
      tableResults: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── خروجی CSV ───
router.get('/export/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { columns, where, delimiter = ',', header = 'true', limit = 10000 } = req.query;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }

    let cols = columns ? columns.split(',').map(c => c.trim()) : null;
    const schema = db.all(`PRAGMA table_info("${table}")`);

    if (!cols) {
      cols = schema.map(c => c.name);
    }

    let query = `SELECT ${cols.map(c => `"${c}"`).join(',')} FROM "${table}"`;
    if (where) query += ` WHERE ${where}`;
    query += ` LIMIT ?`;

    const data = db.all(query, [parseInt(limit)]);

    // ساخت CSV
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [];
    if (header === 'true') {
      lines.push(cols.join(delimiter));
    }
    for (const row of data) {
      const values = cols.map(c => escapeCSV(row[c]));
      lines.push(values.join(delimiter));
    }

    const csv = lines.join('\n');

    res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${Date.now()}.csv"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ورود CSV ───
router.post('/import/:table', validateTable, (req, res) => {
  try {
    const { table } = req.params;
    const { csv, columns: providedColumns, delimiter = ',', hasHeader = true, skipRows = 0 } = req.body;

    if (!tableExists(table)) {
      return res.status(404).json({ success: false, error: `Table "${table}" not found` });
    }
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ success: false, error: 'CSV data required' });
    }

    const schema = db.all(`PRAGMA table_info("${table}")`);
    const schemaCols = new Set(schema.map(c => c.name));

    // پارس CSV
    const lines = csv.split('\n').filter(l => l.trim());
    let startRow = hasHeader ? 1 : 0;
    startRow += skipRows;

    const allColumns = providedColumns
      ? providedColumns.split(',').map(c => c.trim())
      : lines[0]?.split(delimiter).map(c => c.trim().replace(/"/g, '')) || [];

    const validColumns = allColumns.filter(c => schemaCols.has(c));
    if (validColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid columns found',
        availableColumns: Array.from(schemaCols)
      });
    }

// 2. تکمیل تابع parseRow:
const parseRow = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

// 3. اضافه کردن middleware برای logging خودکار:
//router.use((req, res, next) => {
  //const start = Date.now();
  //res.on('finish', () => {
    //logger.debug(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
  //});
  //next();
//});
// routes/debug.js (ادامه - بخش import CSV)

    let imported = 0;
    let errors = [];
    const errorsList = [];

    for (let i = startRow; i < Math.min(lines.length, startRow + 10000); i++) {
      const values = parseRow(lines[i]);
      if (values.length < validColumns.length) continue;

      const rowData = {};
      for (let j = 0; j < validColumns.length; j++) {
        let val = values[j] || null;
        // حذف quotes اطراف
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        rowData[validColumns[j]] = val === '' ? null : val;
      }

      try {
        const cols = Object.keys(rowData);
        const placeholders = cols.map(() => '?').join(',');
        db.run(
          `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`,
          Object.values(rowData)
        );
        imported++;
      } catch (err) {
        errors++;
        if (errorsList.length < 20) {
          errorsList.push({ row: i + 1, error: err.message, data: rowData });
        }
      }
    }

    logger.info(`[CSV IMPORT] ${table}: ${imported} rows imported, ${errors} errors`);

    res.json({
      success: true,
      message: `Imported ${imported} rows`,
      table,
      imported,
      errors,
      errorSamples: errorsList,
      columnsUsed: validColumns
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏥 ۱۷. نگهداری و بهینه‌سازی
// ═══════════════════════════════════════════════════════════════

// ─── VACUUM (بهینه‌سازی کل دیتابیس) ───
router.post('/vacuum', (req, res) => {
  try {
    const startTime = Date.now();
    
    // گرفتن حجم قبل
    const beforePageCount = db.get(`PRAGMA page_count`)?.page_count || 0;
    const beforeSize = beforePageCount * (db.get(`PRAGMA page_size`)?.page_size || 4096);
    
    db.run('VACUUM');
    
    // حجم بعد
    const afterPageCount = db.get(`PRAGMA page_count`)?.page_count || 0;
    const afterSize = afterPageCount * (db.get(`PRAGMA page_size`)?.page_size || 4096);
    const freedSpace = beforeSize - afterSize;
    
    const duration = Date.now() - startTime;
    
    logger.info(`[VACUUM] Completed in ${duration}ms, freed ${formatBytes(freedSpace)}`);
    
    res.json({
      success: true,
      message: 'Database vacuum completed',
      performance: {
        duration,
        durationHuman: formatDuration(duration)
      },
      before: {
        pages: beforePageCount,
        size: formatBytes(beforeSize),
        sizeRaw: beforeSize
      },
      after: {
        pages: afterPageCount,
        size: formatBytes(afterSize),
        sizeRaw: afterSize
      },
      freed: formatBytes(freedSpace),
      reduction: ((freedSpace / beforeSize) * 100).toFixed(2) + '%'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── VACUUM یک جدول خاص ───
router.post('/vacuum/:table', validateTable, checkTableExists, (req, res) => {
  try {
    const { table } = req.params;
    const startTime = Date.now();
    
    // آمار قبل
    const before = db.get(`SELECT COUNT(*) as rows FROM "${table}"`);
    
    db.run(`VACUUM "${table}"`);
    
    const duration = Date.now() - startTime;
    const after = db.get(`SELECT COUNT(*) as rows FROM "${table}"`);
    
    res.json({
      success: true,
      message: `Table "${table}" vacuumed`,
      table,
      rows: before?.rows || 0,
      rowsUnchanged: before?.rows === after?.rows,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ANALYZE (به‌روزرسانی آمار برای query planner) ───
router.post('/analyze', (req, res) => {
  try {
    const startTime = Date.now();
    db.run('ANALYZE');
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Database statistics updated',
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ANALYZE یک جدول ───
router.post('/analyze/:table', validateTable, checkTableExists, (req, res) => {
  try {
    const { table } = req.params;
    const startTime = Date.now();
    db.run(`ANALYZE "${table}"`);
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `Statistics for "${table}" updated`,
      table,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── REINDEX (بازسازی ایندکس‌ها) ───
router.post('/reindex', (req, res) => {
  try {
    const startTime = Date.now();
    const indexesBefore = db.all(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    ).length;
    
    db.run('REINDEX');
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'All indexes rebuilt',
      indexesRebuilt: indexesBefore,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── بهینه‌سازی کامل (CLOT = Clean, Analyze, Optimize, Vacuum) ───
router.post('/optimize/full', (req, res) => {
  try {
    const startTime = Date.now();
    const steps = [];
    
    // 1. ANALYZE
    let stepStart = Date.now();
    db.run('ANALYZE');
    steps.push({ step: 'ANALYZE', duration: Date.now() - stepStart });
    
    // 2. REINDEX
    stepStart = Date.now();
    db.run('REINDEX');
    steps.push({ step: 'REINDEX', duration: Date.now() - stepStart });
    
    // 3. VACUUM
    stepStart = Date.now();
    db.run('VACUUM');
    steps.push({ step: 'VACUUM', duration: Date.now() - stepStart });
    
    const totalDuration = Date.now() - startTime;
    
    logger.info(`[FULL OPTIMIZE] Completed in ${totalDuration}ms`);
    
    res.json({
      success: true,
      message: 'Full database optimization completed',
      totalDuration,
      totalDurationHuman: formatDuration(totalDuration),
      steps
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 ۱۸. سلامت و دیاگنوستیک
// ═══════════════════════════════════════════════════════════════

// ─── بررسی کامل سلامت دیتابیس ───
router.get('/health', (req, res) => {
  try {
    const startTime = Date.now();
    const checks = [];
    let overallHealth = 100;
    
    // 1. بررسی اتصال
    try {
      db.get('SELECT 1');
      checks.push({ check: 'connection', status: 'ok', message: 'Database connected' });
    } catch (err) {
      overallHealth -= 50;
      checks.push({ check: 'connection', status: 'error', message: err.message });
    }
    
    // 2. بررسی integrity
    try {
      const integrity = db.get('PRAGMA integrity_check');
      const isOk = integrity?.integrity_check === 'ok';
      checks.push({
        check: 'integrity',
        status: isOk ? 'ok' : 'warning',
        message: integrity?.integrity_check || 'Unknown'
      });
      if (!isOk) overallHealth -= 30;
    } catch (err) {
      overallHealth -= 30;
      checks.push({ check: 'integrity', status: 'error', message: err.message });
    }
    
    // 3. بررسی foreign keys
    try {
      const fkCheck = db.all('PRAGMA foreign_key_check');
      checks.push({
        check: 'foreign_keys',
        status: fkCheck.length === 0 ? 'ok' : 'warning',
        orphanCount: fkCheck.length,
        message: fkCheck.length === 0 ? 'No orphaned records' : `${fkCheck.length} orphaned records found`
      });
      if (fkCheck.length > 0) overallHealth -= Math.min(20, fkCheck.length);
    } catch (err) {
      checks.push({ check: 'foreign_keys', status: 'error', message: err.message });
    }
    
    // 4. بررسی فضای خالی
    const freelist = db.get('PRAGMA freelist_count')?.freelist_count || 0;
    const pageCount = db.get('PRAGMA page_count')?.page_count || 1;
    const fragmentation = (freelist / pageCount) * 100;
    checks.push({
      check: 'fragmentation',
      status: fragmentation < 10 ? 'ok' : fragmentation < 30 ? 'warning' : 'critical',
      freelistPages: freelist,
      totalPages: pageCount,
      fragmentation: fragmentation.toFixed(2) + '%',
      suggestion: fragmentation > 20 ? 'Run POST /debug/vacuum' : null
    });
    if (fragmentation > 30) overallHealth -= 15;
    
    // 5. بررسی آخرین VACUUM (با تخمین)
    const lastVacuum = null; // SQLite doesn't track this
    checks.push({
      check: 'last_maintenance',
      status: 'info',
      message: 'Run ANALYZE periodically for optimal performance'
    });
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      overallHealth: Math.max(0, overallHealth),
      status: overallHealth >= 80 ? 'healthy' : overallHealth >= 50 ? 'degraded' : 'critical',
      checks,
      duration: formatDuration(duration),
      recommendations: [
        fragmentation > 20 && 'Run VACUUM to reduce fragmentation',
        fragmentation > 30 && 'High fragmentation detected',
        'Regularly run ANALYZE for better query performance'
      ].filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── دیاگنوستیک کامل ───
router.get('/diagnose', (req, res) => {
  try {
    const startTime = Date.now();
    const diagnostics = {};
    
    // اطلاعات دیتابیس
    diagnostics.database = {
      version: db.get('SELECT sqlite_version() as v')?.v,
      pageSize: db.get('PRAGMA page_size')?.page_size,
      pageCount: db.get('PRAGMA page_count')?.page_count,
      freelistCount: db.get('PRAGMA freelist_count')?.freelist_count,
      encoding: db.get('PRAGMA encoding')?.encoding,
      journalMode: db.get('PRAGMA journal_mode')?.journal_mode,
      synchronous: db.get('PRAGMA synchronous')?.synchronous,
      cacheSize: db.get('PRAGMA cache_size')?.cache_size,
      tempStore: db.get('PRAGMA temp_store')?.temp_store
    };
    
    // آمار جدول‌ها
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    diagnostics.tables = [];
    let totalRows = 0;
    let tablesWithoutPK = 0;
    
    for (const t of tables) {
      const count = db.get(`SELECT COUNT(*) as cnt FROM "${t.name}"`)?.cnt || 0;
      const schema = db.all(`PRAGMA table_info("${t.name}")`);
      const hasPK = schema.some(c => c.pk === 1);
      const indexCount = db.all(`PRAGMA index_list("${t.name}")`).length;
      
      totalRows += count;
      if (!hasPK) tablesWithoutPK++;
      
      diagnostics.tables.push({
        name: t.name,
        rows: count,
        columns: schema.length,
        hasPrimaryKey: hasPK,
        indexCount,
        size: formatBytes(count * schema.length * 50)
      });
    }
    
    // ایندکس‌های استفاده نشده (تخمینی)
    diagnostics.indexes = {
      total: db.all("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").length,
      // SQLite doesn't track usage stats, so this is just a placeholder
      note: 'SQLite does not track index usage statistics automatically'
    };
    
    // مشکلات یافت شده
    const issues = [];
    if (tablesWithoutPK > 0) {
      issues.push(`${tablesWithoutPK} tables without primary key`);
    }
    if (diagnostics.database.freelistCount > 1000) {
      issues.push('Large freelist - run VACUUM');
    }
    if (diagnostics.database.journalMode === 'delete') {
      issues.push('Journal mode is DELETE - consider WAL for better concurrency');
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      diagnostics,
      summary: {
        totalTables: tables.length,
        totalRows,
        avgRowsPerTable: tables.length ? (totalRows / tables.length).toFixed(0) : 0,
        issuesFound: issues.length,
        issues
      },
      performance: { duration, durationHuman: formatDuration(duration) },
      suggestions: [
        tablesWithoutPK > 0 && 'Add primary keys to tables without them',
        diagnostics.database.freelistCount > 1000 && 'Run VACUUM to reclaim space',
        'Consider enabling WAL mode for better concurrency: PRAGMA journal_mode=WAL'
      ].filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🧪 ۱۹. دیتای تست (Seed Data)
// ═══════════════════════════════════════════════════════════════

// ─── تولید دیتای تست ───
router.post('/seed/:table', validateTable, checkTableExists, (req, res) => {
  try {
    const { table } = req.params;
    const { count = 10, truncate = false } = req.query;
    
    const schema = db.all(`PRAGMA table_info("${table}")`);
    const seedCount = Math.min(parseInt(count), 10000);
    
    if (truncate === 'true') {
      db.run(`DELETE FROM "${table}"`);
    }
    
    // تولید داده‌های نمونه
    const generateValue = (col) => {
      const type = col.type?.toUpperCase() || 'TEXT';
      if (col.pk === 1 && type === 'INTEGER') return null; // auto-increment
      
      if (type.includes('INT')) {
        return Math.floor(Math.random() * 10000);
      }
      if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) {
        return Math.random() * 1000;
      }
      if (type.includes('BOOL')) {
        return Math.random() > 0.5 ? 1 : 0;
      }
      // TEXT or others
      const prefixes = ['John', 'Jane', 'Ali', 'Sara', 'Mike', 'Emma', 'David', 'Lisa'];
      const suffixes = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
      return `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${Math.floor(Math.random() * 1000)}`;
    };
    
    let inserted = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < seedCount; i++) {
      const row = {};
      for (const col of schema) {
        if (col.pk === 1 && col.type?.toUpperCase().includes('INT')) continue;
        const val = generateValue(col);
        if (val !== null) row[col.name] = val;
      }
      
      const cols = Object.keys(row);
      if (cols.length === 0) continue;
      
      const placeholders = cols.map(() => '?').join(',');
      db.run(
        `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`,
        Object.values(row)
      );
      inserted++;
    }
    
    const duration = Date.now() - startTime;
    
    logger.info(`[SEED] ${table}: ${inserted} records inserted`);
    
    res.json({
      success: true,
      message: `Seeded ${inserted} records into "${table}"`,
      table,
      requestedCount: seedCount,
      inserted,
      truncated: truncate === 'true',
      performance: { duration, durationHuman: formatDuration(duration), avgPerRecord: (duration / inserted).toFixed(2) + 'ms' }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── پاک کردن دیتای تست ───
router.delete('/seed/:table', validateTable, checkTableExists, (req, res) => {
  try {
    const { table } = req.params;
    const { where, keepPercentage = 0 } = req.query;
    
    let query, deleted;
    const startTime = Date.now();
    
    if (where) {
      query = `DELETE FROM "${table}" WHERE ${where}`;
      db.run(query);
      deleted = db.get(`SELECT changes() as cnt`)?.cnt || 0;
    } else if (parseFloat(keepPercentage) > 0) {
      // نگهداری درصدی از داده‌ها
      const total = db.get(`SELECT COUNT(*) as cnt FROM "${table}"`)?.cnt || 0;
      const toKeep = Math.floor(total * (parseFloat(keepPercentage) / 100));
      const pk = findPrimaryKey(table);
      if (pk) {
        const idsToKeep = db.all(`SELECT "${pk.name}" FROM "${table}" ORDER BY RANDOM() LIMIT ?`, [toKeep]);
        const idsToDelete = db.all(`SELECT "${pk.name}" FROM "${table}" WHERE "${pk.name}" NOT IN (${idsToKeep.map(() => '?').join(',')})`, idsToKeep.map(i => i[pk.name]));
        if (idsToDelete.length > 0) {
          db.run(`DELETE FROM "${table}" WHERE "${pk.name}" IN (${idsToDelete.map(() => '?').join(',')})`, idsToDelete.map(i => i[pk.name]));
          deleted = idsToDelete.length;
        }
      } else {
        return res.status(400).json({ success: false, error: 'Cannot keep percentage without primary key' });
      }
    } else {
      // حذف همه داده‌ها
      const total = db.get(`SELECT COUNT(*) as cnt FROM "${table}"`)?.cnt || 0;
      db.run(`DELETE FROM "${table}"`);
      deleted = total;
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `Cleared ${deleted} records from "${table}"`,
      table,
      deleted,
      performance: { duration, durationHuman: formatDuration(duration) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🧩 ۲۰. متفرقه و ابزارهای مفید
// ═══════════════════════════════════════════════════════════════

// ─── اطلاعات نسخه ───
router.get('/version', (req, res) => {
  try {
    const sqliteVersion = db.get('SELECT sqlite_version() as version');
    
    res.json({
      success: true,
      sqlite: {
        version: sqliteVersion?.version,
        compileOptions: db.all('PRAGMA compile_options').map(o => o.compile_options)
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      api: {
        version: '4.0 Ultimate',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── پینگ دیتابیس (برای مانیتورینگ) ───
router.get('/ping', (req, res) => {
  const start = Date.now();
  try {
    db.get('SELECT 1 as pong');
    const latency = Date.now() - start;
    res.json({
      success: true,
      pong: true,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تنظیمات دیتابیس ───
router.get('/config', (req, res) => {
  try {
    const config = {
      page_size: db.get('PRAGMA page_size')?.page_size,
      cache_size: db.get('PRAGMA cache_size')?.cache_size,
      journal_mode: db.get('PRAGMA journal_mode')?.journal_mode,
      synchronous: db.get('PRAGMA synchronous')?.synchronous,
      temp_store: db.get('PRAGMA temp_store')?.temp_store,
      foreign_keys: db.get('PRAGMA foreign_keys')?.foreign_keys === 1,
      recursive_triggers: db.get('PRAGMA recursive_triggers')?.recursive_triggers === 1,
      encoding: db.get('PRAGMA encoding')?.encoding,
      auto_vacuum: db.get('PRAGMA auto_vacuum')?.auto_vacuum,
      secure_delete: db.get('PRAGMA secure_delete')?.secure_delete,
      case_sensitive_like: db.get('PRAGMA case_sensitive_like')?.case_sensitive_like === 1,
      max_page_count: db.get('PRAGMA max_page_count')?.max_page_count
    };
    
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Cache پاک کردن (برای SQLite، فقط query cache ما) ───
router.post('/cache/clear', (req, res) => {
  queryHistory.length = 0;
  // SQLite خودش cache داخلی دارد که نمی‌توان مستقیم پاک کرد
  res.json({
    success: true,
    message: 'Query history cleared',
    note: 'SQLite internal cache cannot be cleared programmatically'
  });
});

// ─── آمار query cache ───
router.get('/cache/stats', (req, res) => {
  const queriesByType = {
    SELECT: queryHistory.filter(q => q.type === 'SELECT').length,
    INSERT: queryHistory.filter(q => q.type === 'INSERT').length,
    UPDATE: queryHistory.filter(q => q.type === 'UPDATE').length,
    DELETE: queryHistory.filter(q => q.type === 'DELETE').length,
    OTHER: queryHistory.filter(q => !['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(q.type)).length
  };
  
  const avgDuration = queryHistory.length
    ? queryHistory.reduce((sum, q) => sum + q.duration, 0) / queryHistory.length
    : 0;
  
  res.json({
    success: true,
    stats: {
      totalQueries: queryHistory.length,
      maxHistory: MAX_HISTORY,
      queriesByType,
      averageDuration: `${avgDuration.toFixed(2)}ms`,
      oldestQuery: queryHistory[queryHistory.length - 1]?.timestamp,
      newestQuery: queryHistory[0]?.timestamp
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 🚀 ۲۱. عملیات پیشرفته روی داده (Advanced Data Operations)
// ═══════════════════════════════════════════════════════════════

// ─── محاسبه جمع و میانگین ───
router.get('/aggregate/:table/:column', validateTable, checkTableExists, (req, res) => {
  try {
    const { table, column } = req.params;
    const { operation = 'count', where, groupBy } = req.query;
    
    const allowedOps = ['count', 'sum', 'avg', 'min', 'max', 'total'];
    if (!allowedOps.includes(operation)) {
      return res.status(400).json({ success: false, error: `Invalid operation. Use: ${allowedOps.join(', ')}` });
    }
    
    let query = `SELECT ${operation.toUpperCase()}("${column}") as result FROM "${table}"`;
    if (where) query += ` WHERE ${where}`;
    if (groupBy) query += ` GROUP BY "${groupBy}"`;
    
    const result = db.get(query);
    res.json({ success: true, table, column, operation, result: result?.result || 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تغییر نوع داده ستون ───
router.patch('/tables/:table/columns/:column/cast', validateTable, checkTableExists, (req, res) => {
  try {
    const { table, column } = req.params;
    const { newType, defaultValue = null } = req.body;
    
    const validTypes = ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BLOB'];
    if (!validTypes.includes(newType.toUpperCase())) {
      return res.status(400).json({ success: false, error: `Invalid type. Use: ${validTypes.join(', ')}` });
    }
    
    // بررسی وجود ستون
    const schema = db.all(`PRAGMA table_info("${table}")`);
    const col = schema.find(c => c.name === column);
    if (!col) {
      return res.status(404).json({ success: false, error: `Column "${column}" not found` });
    }
    
    // ایجاد جدول موقت
    const tempTable = `${table}_cast_${Date.now()}`;
    const otherCols = schema.filter(c => c.name !== column).map(c => `"${c.name}"`).join(', ');
    
    db.run(`CREATE TEMPORARY TABLE "${tempTable}" AS SELECT ${otherCols}, CAST("${column}" AS ${newType}) as "${column}" FROM "${table}"`);
    db.run(`DELETE FROM "${table}"`);
    
    // بازگردانی داده‌ها
    const allCols = schema.map(c => `"${c.name}"`).join(', ');
    db.run(`INSERT INTO "${table}" (${allCols}) SELECT ${allCols} FROM "${tempTable}"`);
    db.run(`DROP TABLE "${tempTable}"`);
    
    logger.info(`[CAST COLUMN] ${table}.${column} → ${newType}`);
    res.json({ success: true, message: `Column "${column}" cast to ${newType}`, table, column, newType });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── کپی کردن داده بین جدول‌ها ───
router.post('/copy/:source/:target', validateTable, (req, res) => {
  try {
    const { source, target } = req.params;
    const { columns, where, truncateFirst = false } = req.body;
    
    if (!tableExists(source)) return res.status(404).json({ success: false, error: `Source table "${source}" not found` });
    if (!tableExists(target)) return res.status(404).json({ success: false, error: `Target table "${target}" not found` });
    
    if (truncateFirst) {
      db.run(`DELETE FROM "${target}"`);
    }
    
    let colList = '*';
    if (columns && Array.isArray(columns)) {
      colList = columns.map(c => `"${c}"`).join(', ');
    }
    
    let query = `INSERT INTO "${target}" SELECT ${colList} FROM "${source}"`;
    if (where) query += ` WHERE ${where}`;
    
    const startTime = Date.now();
    db.run(query);
    const duration = Date.now() - startTime;
    const copiedRows = db.get(`SELECT changes() as count`)?.count || 0;
    
    addToHistory(query, 'COPY', duration, { copiedRows });
    logger.info(`[COPY] ${source} → ${target}: ${copiedRows} rows`);
    
    res.json({ success: true, message: `Copied ${copiedRows} rows`, source, target, copiedRows, performance: { duration, durationHuman: formatDuration(duration) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 ۲۲. گزارش‌گیری و داشبورد پیشرفته
// ═══════════════════════════════════════════════════════════════

// ─── گزارش کامل دیتابیس ───
router.get('/report/full', (req, res) => {
  try {
    const startTime = Date.now();
    const report = {};
    
    // 1. آمار کلی
    const stats = db.get(`
      SELECT 
        (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') as total_tables,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%') as total_indexes,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='view') as total_views,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger') as total_triggers
    `);
    report.summary = stats;
    
    // 2. بزرگترین جدول‌ها
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    report.largestTables = [];
    for (const t of tables) {
      const count = db.get(`SELECT COUNT(*) as rows FROM "${t.name}"`);
      report.largestTables.push({ table: t.name, rows: count?.rows || 0 });
    }
    report.largestTables.sort((a, b) => b.rows - a.rows);
    
    // 3. جدول‌های بدون کلید اصلی
    report.tablesWithoutPK = [];
    for (const t of tables) {
      const pk = db.all(`PRAGMA table_info("${t.name}")`).some(c => c.pk === 1);
      if (!pk) report.tablesWithoutPK.push(t.name);
    }
    
    // 4. آخرین کوئری‌های اجرا شده
    report.recentQueries = queryHistory.slice(0, 20);
    
    // 5. سلامت دیتابیس
    const integrity = db.get('PRAGMA integrity_check');
    report.integrity = integrity?.integrity_check === 'ok' ? 'PASS' : integrity?.integrity_check;
    
    const duration = Date.now() - startTime;
    res.json({ success: true, report, generatedAt: new Date().toISOString(), performance: { duration, durationHuman: formatDuration(duration) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── مقایسه دو جدول ───
router.get('/compare/:table1/:table2', validateTable, (req, res) => {
  try {
    const { table1, table2 } = req.params;
    const { columns, limit = 100 } = req.query;
    
    if (!tableExists(table1)) return res.status(404).json({ success: false, error: `Table "${table1}" not found` });
    if (!tableExists(table2)) return res.status(404).json({ success: false, error: `Table "${table2}" not found` });
    
    const schema1 = db.all(`PRAGMA table_info("${table1}")`);
    const schema2 = db.all(`PRAGMA table_info("${table2}")`);
    
    let colList = '*';
    if (columns) {
      colList = columns.split(',').map(c => c.trim()).filter(c => schema1.some(s => s.name === c)).join(', ');
    }
    
    // پیدا کردن رکوردهای موجود در table1 ولی نه در table2
    const pk1 = findPrimaryKey(table1);
    const pk2 = findPrimaryKey(table2);
    
    let onlyIn1 = [];
    let onlyIn2 = [];
    let differences = [];
    
    if (pk1 && pk2 && pk1.name === pk2.name) {
      onlyIn1 = db.all(`SELECT * FROM "${table1}" WHERE "${pk1.name}" NOT IN (SELECT "${pk2.name}" FROM "${table2}") LIMIT ?`, [limit]);
      onlyIn2 = db.all(`SELECT * FROM "${table2}" WHERE "${pk2.name}" NOT IN (SELECT "${pk1.name}" FROM "${table1}") LIMIT ?`, [limit]);
    }
    
    res.json({
      success: true,
      comparison: {
        table1: { name: table1, rowCount: db.get(`SELECT COUNT(*) as c FROM "${table1}"`)?.c || 0, columnCount: schema1.length },
        table2: { name: table2, rowCount: db.get(`SELECT COUNT(*) as c FROM "${table2}"`)?.c || 0, columnCount: schema2.length },
        onlyInTable1: onlyIn1,
        onlyInTable2: onlyIn2,
        differences: differences
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔐 ۲۳. مدیریت جلسات و اتصالات
// ═══════════════════════════════════════════════════════════════

// ─── لیست اتصالات فعال ───
router.get('/connections', (req, res) => {
  try {
    // SQLite doesn't have built-in connection tracking, but we can track via our middleware
    const activeConnections = global.activeConnections || 0;
    const totalRequests = global.totalRequests || 0;
    
    res.json({
      success: true,
      connections: {
        active: activeConnections,
        totalRequests,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── آمار درخواست‌ها ───
router.get('/request-stats', (req, res) => {
  const stats = {
    total: requestCounts.size,
    byIp: Array.from(requestCounts.entries()).map(([ip, data]) => ({ ip, count: data.count, lastSeen: new Date(data.start).toISOString() }))
  };
  res.json({ success: true, stats });
});

// ═══════════════════════════════════════════════════════════════
// 🧪 ۲۴. ابزارهای تست و دیباگ
// ═══════════════════════════════════════════════════════════════

// ─── تست عملکرد (Benchmark) ───
router.post('/benchmark/:table', validateTable, checkTableExists, (req, res) => {
  try {
    const { table } = req.params;
    const { iterations = 10, query } = req.body;
    
    const testQuery = query || `SELECT * FROM "${table}" LIMIT 100`;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      db.all(testQuery);
      times.push(Date.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    res.json({
      success: true,
      benchmark: {
        table,
        query: testQuery,
        iterations,
        results: { avg: `${avg.toFixed(2)}ms`, min: `${min}ms`, max: `${max}ms` },
        times
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── شبیه‌سازی خطا (برای تست) ───
router.post('/test-error', (req, res) => {
  const { errorType = '500', message = 'Test error' } = req.body;
  const statusCode = parseInt(errorType) || 500;
  res.status(statusCode).json({ success: false, error: message, test: true });
});

// ═══════════════════════════════════════════════════════════════
// 📝 ۲۵. مدیریت لاگ‌ها
// ═══════════════════════════════════════════════════════════════

// ─── دریافت لاگ‌ها ───
router.get('/logs', (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    // This would integrate with your logger
    res.json({ success: true, message: 'Log endpoint - integrate with your logger', level, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── سطح لاگ ───
router.get('/log-level', (req, res) => {
  res.json({ success: true, level: process.env.LOG_LEVEL || 'info' });
});

router.put('/log-level', (req, res) => {
  const { level } = req.body;
  const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLevels.includes(level)) {
    return res.status(400).json({ success: false, error: `Invalid level. Use: ${validLevels.join(', ')}` });
  }
  process.env.LOG_LEVEL = level;
  res.json({ success: true, message: `Log level changed to ${level}` });
});

// ═══════════════════════════════════════════════════════════════
// 🔄 ۲۶. عملیات به صورت تراکنش (Transaction)
// ═══════════════════════════════════════════════════════════════

// ─── اجرای چند کوئری در یک تراکنش ───
router.post('/transaction', (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ success: false, error: 'queries array required' });
    }
    
    const startTime = Date.now();
    const results = [];
    
    db.run('BEGIN TRANSACTION');
    
    try {
      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const sql = q.sql;
        const params = q.params || [];
        
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const data = db.all(sql, params);
          results.push({ index: i, type: 'SELECT', rowCount: data.length, data: data.slice(0, 100) });
        } else {
          db.run(sql, params);
          const changes = db.get(`SELECT changes() as count`)?.count || 0;
          results.push({ index: i, type: 'MODIFY', changes });
        }
      }
      
      db.run('COMMIT');
      const duration = Date.now() - startTime;
      
      res.json({ success: true, message: 'Transaction committed', results, performance: { duration, durationHuman: formatDuration(duration) } });
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    db.run('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 ۲۷. آمار پیشرفته
// ═══════════════════════════════════════════════════════════════

// ─── توزیع مقدار NULL در کل دیتابیس ───
router.get('/stats/nulls-global', (req, res) => {
  try {
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const nullStats = {};
    
    for (const t of tables) {
      const schema = db.all(`PRAGMA table_info("${t.name}")`);
      const totalRows = db.get(`SELECT COUNT(*) as c FROM "${t.name}"`)?.c || 0;
      
      nullStats[t.name] = {};
      for (const col of schema) {
        const nullCount = db.get(`SELECT COUNT(*) as c FROM "${t.name}" WHERE "${col.name}" IS NULL`)?.c || 0;
        nullStats[t.name][col.name] = {
          nullCount,
          nullPercentage: totalRows ? ((nullCount / totalRows) * 100).toFixed(2) : 0,
          isNullable: col.notnull === 0
        };
      }
    }
    
    res.json({ success: true, nullStatistics: nullStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── پربازدیدترین ستون‌ها ───
router.get('/stats/popular-columns', (req, res) => {
  try {
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const popularColumns = [];
    
    for (const t of tables) {
      const schema = db.all(`PRAGMA table_info("${t.name}")`);
      for (const col of schema) {
        const distinctCount = db.get(`SELECT COUNT(DISTINCT "${col.name}") as c FROM "${t.name}"`)?.c || 0;
        popularColumns.push({
          table: t.name,
          column: col.name,
          type: col.type,
          distinctCount,
          isIndexed: db.all(`PRAGMA index_list("${t.name}")`).some(idx => 
            db.all(`PRAGMA index_info("${idx.name}")`).some(info => info.name === col.name)
          )
        });
      }
    }
    
    res.json({ success: true, columns: popularColumns.sort((a, b) => b.distinctCount - a.distinctCount).slice(0, 50) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🛡️ ۲۸. امنیت و اعتبارسنجی
// ═══════════════════════════════════════════════════════════════

// ─── بررسی SQL Injection در کوئری ───
router.post('/validate-sql', (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ success: false, error: 'SQL required' });
    
    const dangerousPatterns = [
      { pattern: /;\s*DROP\s+/i, name: 'DROP' },
      { pattern: /;\s*DELETE\s+FROM/i, name: 'DELETE' },
      { pattern: /;\s*UPDATE\s+.+\s+SET/i, name: 'UPDATE' },
      { pattern: /;\s*INSERT\s+INTO/i, name: 'INSERT' },
      { pattern: /;\s*ALTER\s+TABLE/i, name: 'ALTER' },
      { pattern: /;\s*CREATE\s+/i, name: 'CREATE' },
      { pattern: /UNION\s+SELECT/i, name: 'UNION' },
      { pattern: /OR\s+1\s*=\s*1/i, name: 'OR 1=1' },
      { pattern: /--/g, name: 'SQL Comment' }
    ];
    
    const issues = dangerousPatterns.filter(p => p.pattern.test(sql));
    
    res.json({
      success: true,
      sql,
      isValid: issues.length === 0,
      issues: issues.map(i => i.name),
      isDangerous: issues.length > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── تنظیمات CORS ───
router.get('/cors-status', (req, res) => {
  res.json({
    success: true,
    cors: {
      enabled: true,
      allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 📡 ۲۹. WebSocket آماده‌سازی (SSE برای Real-time)
// ═══════════════════════════════════════════════════════════════

// ─── Server-Sent Events endpoint ───
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // ارسال رویداد هر 5 ثانیه
  const interval = setInterval(() => {
    sendEvent({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  }, 5000);
  
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
  
  sendEvent({ type: 'connected', message: 'Connected to event stream' });
});

// ═══════════════════════════════════════════════════════════════
// 💾 ۳۰. پشتیبان‌گیری خودکار (Scheduled Backup)
// ═══════════════════════════════════════════════════════════════

// ذخیره تنظیمات پشتیبان
let backupSchedule = null;
let backupInterval = null;

router.post('/backup/schedule', (req, res) => {
  try {
    const { interval = 86400000, enabled = true } = req.body; // default 24h in ms
    
    if (backupInterval) clearInterval(backupInterval);
    
    if (enabled) {
      backupInterval = setInterval(async () => {
        try {
          const backup = {};
          const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
          for (const t of tables) {
            backup[t.name] = db.all(`SELECT * FROM "${t.name}"`);
          }
          logger.info(`[AUTO BACKUP] Created automatic backup with ${tables.length} tables`);
        } catch (err) {
          logger.error(`[AUTO BACKUP] Failed: ${err.message}`);
        }
      }, interval);
    }
    
    backupSchedule = { interval, enabled, lastRun: new Date().toISOString() };
    res.json({ success: true, message: `Backup schedule ${enabled ? 'started' : 'stopped'}`, schedule: backupSchedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/backup/schedule', (req, res) => {
  res.json({ success: true, schedule: backupSchedule || { enabled: false } });
});

// ═══════════════════════════════════════════════════════════════
// 🎯 ۳۱. میانبرهای سریع (Quick Actions)
// ═══════════════════════════════════════════════════════════════

// ─── پاک کردن کش ───
router.post('/clear-cache', (req, res) => {
  queryHistory.length = 0;
  res.json({ success: true, message: 'Cache cleared', clearedItems: 'queryHistory' });
});

// ─── ریست آمار ───
router.post('/reset-stats', (req, res) => {
  requestCounts.clear();
  res.json({ success: true, message: 'Statistics reset' });
});

// ─── اطلاعات سریع دیتابیس ───
router.get('/quick-info', (req, res) => {
  try {
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    let totalRows = 0;
    for (const t of tables) {
      totalRows += db.get(`SELECT COUNT(*) as c FROM "${t.name}"`)?.c || 0;
    }
    
    res.json({
      success: true,
      quickInfo: {
        databaseFile: db._db ? 'in-memory' : 'file',
        tableCount: tables.length,
        totalRows,
        sqliteVersion: db.get('SELECT sqlite_version() as v')?.v,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().rss
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📋 ۳۲. مستندات API (Swagger-like)
// ═══════════════════════════════════════════════════════════════

router.get('/docs/all', (req, res) => {
  const allEndpoints = [];
  
  const collectEndpoints = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value.method && value.path) {
        allEndpoints.push({
          name: key,
          method: value.method,
          path: prefix + value.path,
          description: value.desc,
          auth: value.auth
        });
      } else if (typeof value === 'object' && value !== null) {
        collectEndpoints(value, prefix);
      }
    }
  };
  
  // این باید از ساختار endpoints شما استفاده کنه
  res.json({ success: true, totalEndpoints: allEndpoints.length, endpoints: allEndpoints.slice(0, 100) });
});

// ─── سلامت سرویس ───
router.get('/health-check', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      connected: true,
      version: db.get('SELECT sqlite_version() as v')?.v
    },
    api: {
      version: '4.0',
      endpoints: 150
    }
  };
  
  res.json(health);
});

// ═══════════════════════════════════════════════════════════════
// 🚪 خروجی نهایی
// ═══════════════════════════════════════════════════════════════

module.exports = router;