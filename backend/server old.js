// ============================================
// 🎯 نقطه ورود برنامه - نسخه نهایی پیشرفته
// ============================================

'use strict';

// 📦 بارگذاری ماژول‌ها
require('dotenv').config();
const botService = require('./services/botService');
const botRoutes = require('./routes/v1/bot');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cluster = require('cluster');
const os = require('os');

// 📥 وارد کردن middleware‌ها
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const rateLimiter = require('./middlewares/rateLimiter');

// 📥 وارد کردن تنظیمات
const CONFIG = require('./config');
const supportRoutes = require('./routes/support');
// ============================================
// 🗄️ راه‌اندازی Knex.js (PostgreSQL)
// ============================================
const knex = require('knex');
const knexConfig = require('./knexfile');
let db;
let dbReady = false;


const initializeDatabase = async () => {
  try {
    db = knex(knexConfig[process.env.NODE_ENV || 'development']);
    
    // تست اتصال
    await db.raw('SELECT 1 as test, NOW() as time');
    
    dbReady = true;
    logger.info('✅ دیتابیس PostgreSQL با Knex.js راه‌اندازی شد');
    
    // ذخیره در global برای دسترسی سریع
    global.db = db;
    // بعد از این خط: global.db = db;
/*     const DatabaseMonitor = require('./databaseMonitor');
    const dbMonitor = new DatabaseMonitor(db, { 
      interval: 30000, 
      maxReconnectAttempts: 5,
      enableStats: true 
    });
    dbMonitor.start(); */
    const AdvancedDatabaseMonitor = require('./advancedMonitor');
    const dbMonitor = new AdvancedDatabaseMonitor(db, io, {
      enableQueryLogging: false,        // هر کوئری را در لاگ می‌نویسد
      enablePoolMonitoring: true,       // آمار پول را می‌گیرد
      enableCliDashboard: true,         // داشبورد در ترمینال سرور
      enableWebSocketEmit: true,        // ارسال رویدادها به فرانت‌اند از طریق socket.io
      reconnectInterval: 30000,
      maxReconnectAttempts: 5
    });
    // ذخیره monitor در global (اختیاری برای دسترسی در endpointها)
    global.dbMonitor = dbMonitor;
  } catch (err) {
  logger.error('❌ خطا در راه‌اندازی دیتابیس:', err.message);
  botService.sendLog('ERROR', 'راه‌اندازی دیتابیس شکست خورد', { error: err.message });
  console.error('Full error:', err); // یا logger.error(err.stack)
  process.exit(1);
}
};


const PORT = CONFIG.PORT || process.env.PORT || 5000;


// ============================================
// ⚙️ ایجاد اپلیکیشن
// ============================================
const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // آدرس فرانت‌اندت
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    credentials: true
  }
});
global.io = io;

// ============================================
// 📥 وارد کردن مسیرها (بعد از init db)
// ============================================
let authRoutes, userRoutes, profileRoutes, adminDataRoutes, adminRoutes;

const loadRoutes = () => {
  try {
    authRoutes = require('./routes/v1/auth');
    userRoutes = require('./routes/v1/user');
    profileRoutes = require('./routes/v1/profile');
    adminDataRoutes = require('./routes/adminData');
    logger.info('✅ تمام مسیرها با موفقیت بارگذاری شدند');
  } catch (err) {
    logger.warn('⚠️ برخی مسیرها یافت نشدند:', err.message);
  }
  
  try {
    adminRoutes = require('./routes/admin');
  } catch (err) {
    logger.info('ℹ️ پنل مدیریت دیتابیس غیرفعال است (فایل admin.js یافت نشد)');
  }
};

// ============================================
// 🛡️ Middleware‌های امنیتی و پایه
// ============================================

// 📝 اضافه کردن Request ID به هر درخواست
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 📝 Response Time Tracker
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    if (!res.headersSent) {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      if (responseTime > 2000) {
        logger.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
      }
    }
  });
  
  next();
});

// 🔒 هدرهای امنیتی پیشرفته با Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: ['()'],
      microphone: ['()'],
      geolocation: ['()'],
    },
  },
}));

// 🌐 مدیریت CORS پیشرفته
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',     
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5001',
      'http://localhost:5000',
      'http://localhost:5001',      
      'http://192.168.234.1:5173',
      'http://192.168.30.1:5173',
      'http://192.168.169.160:5173' ,
      'http://192.168.234.1:5000',
      'http://192.168.30.1:5000',
      'http://192.168.169.160:5000',
      '*',

      ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
    ];
    
    if (!origin || allowedOrigins.includes(origin.trim())) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Api-Version',
    'Accept-Language',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Response-Time', 'X-Request-ID'],
  maxAge: 86400,
  preflightContinue: false,
}));
// ============================================
// 🔌 Socket.IO – اتصالات زنده
// ============================================

let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  console.log(`✅ کاربر متصل شد. آنلاین‌ها: ${onlineUsers}`);
  
  // ارسال تعداد آنلاین‌ها به همه کلاینت‌ها
  io.emit('online-users-count', onlineUsers);
  
  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('online-users-count', onlineUsers);
    console.log(`❌ کاربر قطع شد. آنلاین‌ها: ${onlineUsers}`);
  });
});

// هر ۵ ثانیه یکبار هم می‌تونی دوباره بفرستی (اختیاری)
setInterval(() => {
  io.emit('online-users-count', onlineUsers);
}, 5000);

// 📦 فشرده‌سازی پاسخ‌ها
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 📝 پارس JSON با امنیت بالا
app.use(express.json({
  limit: '10mb',
  strict: true,
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

// 📝 پارس URL-encoded
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 100
}));

// Ping endpoint برای چک کردن وضعیت سرور
// Bandwidth test endpoint
// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// Bandwidth test endpoint
app.get('/api/bandwidth-test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Bandwidth test OK',
    timestamp: new Date().toISOString(),
    data: Array(100).fill('test').join(',')
  });
});

// WebSocket fallback - فقط یه پاسخ ساده بده
app.get('/socket.io', (req, res) => {
  res.status(200).json({ success: true, message: 'Socket.IO endpoint placeholder' });
});
// WebSocket (اختیاری - اگه نیاز داری)
// برای WebSocket می‌تونی از socket.io استفاده کنی:

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
// به جای app.listen از server.listen استفاده کن
/* httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 */
// ============================================
// 📝 لاگر درخواست‌ها
// ============================================
//app.use(`${API_PREFIX}/bot`, botRoutes);

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
  );
  
  app.use(morgan('combined', { stream: accessLogStream }));
}

// ============================================
// 📁 سرو فایل‌های استاتیک
// ============================================
app.use('/api/admin/support', supportRoutes);

// ============================================
// 📁 مسیرهای منطقی برای فایل‌های استاتیک (بدون پوشه static فیزیکی)
// ============================================
app.get('/static/css/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'css', 'style.css'));
});

app.get('/static/js/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'js', 'app.js'));
});

app.use('/', express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));
app.use('/publics', express.static(path.join(__dirname, 'publics'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

app.use('/uploads', express.static(path.join(__dirname, 'publics', 'uploads'), {
  maxAge: '1h',
  dotfiles: 'ignore',
}));

// ============================================
// ⏱️ محدودیت درخواست (Rate Limiting)
// ============================================

if (rateLimiter) {
  app.use('/api', rateLimiter.apiLimiter);
  app.use('/api/auth', rateLimiter.authLimiter);
  app.use('/api/upload', rateLimiter.uploadLimiter);
}

// ============================================
// 🛤️ مسیرهای API
// ============================================

const API_PREFIX = CONFIG.API_PREFIX || '/api/v1';

// بارگذاری مسیرها
loadRoutes();

// احراز هویت
if (authRoutes) app.use(`${API_PREFIX}/auth`, authRoutes);

// مدیریت کاربران
if (userRoutes) app.use(`${API_PREFIX}/users`, userRoutes);

// پروفایل
if (profileRoutes) app.use(`${API_PREFIX}/profile`, profileRoutes);

// پنل ادمین - مدیریت دیتابیس
if (adminDataRoutes) app.use('/api/admin/data', adminDataRoutes);

app.use(`${API_PREFIX}/bot`, botRoutes);
// ============================================
// 🗄️ API های مستقیم PostgreSQL (جدید)
// ============================================

/**
 * @route   GET /api/admin/tables
 * @desc    دریافت لیست تمام جداول دیتابیس
 * @access  Admin
 */
app.get('/api/admin/tables', async (req, res) => {
  try {
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      data: tables.rows.map(r => r.table_name),
      count: tables.rows.length
    });
  } catch (error) {
    logger.error('Error fetching tables:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/table/:tableName
 * @desc    دریافت داده‌های یک جدول با pagination
 * @access  Admin
 */
app.get('/api/admin/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // دریافت اطلاعات ستون‌ها
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ?
      ORDER BY ordinal_position
    `, [tableName]);
    
    // دریافت داده‌ها
    const data = await db(tableName)
      .select('*')
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'desc');
    
    // تعداد کل
    const countResult = await db(tableName).count('* as total').first();
    
    res.json({
      success: true,
      tableName,
      columns: columns.rows,
      data,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.total),
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching table ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/table/:tableName
 * @desc    افزودن رکورد جدید به جدول
 * @access  Admin
 */
app.post('/api/admin/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const data = req.body;
    
    // حذف فیلدهای سیستمی
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    
    const result = await db(tableName).insert(data).returning('*');
    
    res.json({
      success: true,
      data: result[0],
      message: 'رکورد با موفقیت اضافه شد'
    });
  } catch (error) {
    logger.error(`Error inserting into ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/admin/table/:tableName/:id
 * @desc    ویرایش رکورد
 * @access  Admin
 */
app.put('/api/admin/table/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const data = req.body;
    
    delete data.id;
    delete data.created_at;
    
    const result = await db(tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    res.json({
      success: true,
      data: result[0],
      message: 'رکورد با موفقیت ویرایش شد'
    });
  } catch (error) {
    logger.error(`Error updating ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/table/:tableName/:id
 * @desc    حذف رکورد
 * @access  Admin
 */
app.delete('/api/admin/table/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    
    await db(tableName).where('id', id).delete();
    
    res.json({
      success: true,
      message: 'رکورد با موفقیت حذف شد'
    });
  } catch (error) {
    logger.error(`Error deleting from ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    آمار کلی سیستم
 * @access  Admin
 */
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = {
      users: (await db('users').count('* as total').first()).total,
      students: (await db('students').count('* as total').first()).total,
      professors: (await db('professors').count('* as total').first()).total,
      courses: (await db('courses').count('* as total').first()).total,
      lms_courses: (await db('lms_courses').count('* as total').first()).total,
      notifications: (await db('notifications').count('* as total').first()).total,
      active_sessions: (await db('sessions').where('is_active', true).count('* as total').first()).total,
    };
    
    // آمار روزانه
    const today = new Date().toISOString().split('T')[0];
    stats.today = {
      new_users: (await db('users').whereRaw('DATE(created_at) = ?', [today]).count('* as total').first()).total,
      new_notifications: (await db('notifications').whereRaw('DATE(created_at) = ?', [today]).count('* as total').first()).total,
    };
    
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

// ============================================
// 🛡️ مسیرهای Debug (فقط توسعه)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/tables', async (req, res) => {
    try {
      const tables = await db.raw(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      res.json({ success: true, data: tables.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  logger.info('🔧 Debug routes enabled (development only)');
}



// ============================================
// 🏥 مسیرهای سیستمی و مانیتورینگ
// ============================================

app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    },
    nodeVersion: process.version,
    platform: process.platform
  });
});

app.get('/health/db', async (req, res) => {
  const startTime = Date.now();
  try {
    const result = await db.raw('SELECT 1 as test, NOW() as time');
    const responseTime = Date.now() - startTime;
    res.status(200).json({
      success: true,
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: result.rows[0]?.time || new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      database: 'disconnected',
      error: error.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

/**
 * @route   GET /health/db/deep
 * @desc    دریافت آمار عمیق دیتابیس (برای مانیتورینگ پیشرفته)
 */
app.get('/health/db/deep', (req, res) => {
  if (!global.dbMonitor) {
    return res.status(503).json({ error: 'Database monitor not initialized' });
  }
  const stats = global.dbMonitor.getCurrentMetrics(); // <- این خط را عوض کن
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req, res) => {
  const checks = {
    server: true,
    database: false,
    memory: false
  };
  
  try {
    await db.raw('SELECT 1');
    checks.database = true;
  } catch (e) {
    checks.database = false;
  }
  
  const memUsage = process.memoryUsage();
  checks.memory = memUsage.heapUsed < 1024 * 1024 * 512;
  
  const allHealthy = checks.server && checks.database && checks.memory;
  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    success: true,
    message: 'به API خوش آمدید',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbReady ? 'connected' : 'disconnected',
    endpoints: {
      auth: { login: `POST ${API_PREFIX}/auth/login` },
      users: { list: `GET ${API_PREFIX}/users` },
      admin: {
        tables: 'GET /api/admin/tables',
        tableData: 'GET /api/admin/table/:tableName',
        stats: 'GET /api/admin/stats'
      }
    },
    health: '/health',
    healthDb: '/health/db'
  });
});

// ============================================
// 🔄 مسیرهای Fallback و مدیریت خطا
// ============================================

app.use(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر API یافت نشد',
    error: 'endpoint_not_found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'صفحه یافت نشد',
    error: 'not_found',
    requestId: req.id
  });
});

if (errorHandler) {
  app.use(errorHandler);
}



app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `Endpoint ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});


// ═══════════════════════════════════════════════════════════════════
// 🤖 راه‌اندازی ربات بله (رایگان)
// ═══════════════════════════════════════════════════════════════════

// ۱. ثبت پردازش‌گر deep‑link
botService.setDeepLinkHandler(async (token, chatId) => {
    const log = (level, msg, meta) => botService?.sendLog?.(level, msg, meta).catch(() => {});
    logger.info(`🔗 [DeepLink] Processing – token: ${token.substring(0, 8)}... chat: ${chatId}`);

    try {
        // ۱. جستجوی توکن معتبر
        const invite = await db('invite_tokens')
            .where({ token, used: false })
            .where('expires_at', '>', new Date())
            .first();

        if (!invite) {
            const old = await db('invite_tokens').where({ token }).first();
            if (old && old.used) {
                await botService.sendMessage(chatId, '⚠️ این لینک قبلاً استفاده شده است.');
                return { success: false, reason: 'already_used' };
            }
            await botService.sendMessage(chatId, '⏳ این لینک منقضی شده است. لطفاً از دکمهٔ «اتصال حساب کاربری» یک لینک جدید بگیرید.');
            return { success: false, reason: 'expired' };
        }

        // ۲. اگر user_id موجود باشد (کاربر کامل ثبت‌نام کرده)
        if (invite.user_id) {
            const user = await db('users').where({ id: invite.user_id }).first();
            if (!user) {
                logger.error(`User ${invite.user_id} not found for invite`);
                await botService.sendMessage(chatId, '❌ حساب کاربری مرتبط یافت نشد. لطفاً با پشتیبانی تماس بگیرید.');
                return { success: false, reason: 'user_not_found' };
            }

            // اگر کاربر قبلاً به همین chat_id وصل باشد
            if (user.chat_id === String(chatId)) {
                await db('invite_tokens').where({ id: invite.id }).update({ used: true, used_at: db.fn.now() });
                await botService.sendMessage(chatId, 'ℹ️ شما قبلاً به ربات متصل بوده‌اید. همه چیز مرتب است.');
                return { success: true, alreadyLinked: true, userId: invite.user_id };
            }

            // بروزرسانی chat_id (حتی اگر قبلاً متفاوت بوده – تعویض دستگاه)
            await db('users').where({ id: invite.user_id }).update({ chat_id: chatId, updated_at: db.fn.now() });
            await db('invite_tokens').where({ id: invite.id }).update({ used: true, used_at: db.fn.now() });

            await botService.sendMessage(chatId, '🎉 حساب شما با موفقیت به ربات متصل شد.\nاز این پس کدهای تأیید و اعلان‌ها از این طریق ارسال می‌شوند.');
            log('INFO', `User ${invite.user_id} linked with chat ${chatId}`);
            return { success: true, reason: 'linked', userId: invite.user_id, isNewLink: true };
        }
        // ۳. user_id خالی (کاربر از طریق ربات دکمه زده، هنوز شناسایی نشده)
        else {
            await db('invite_tokens').where({ id: invite.id }).update({ chat_id: chatId, used: true, used_at: db.fn.now() });
            await botService.sendMessage(chatId, '✅ اولین قدم با موفقیت انجام شد. برای تکمیل فرآیند، لطفاً وارد سایت شوید و شماره موبایل خود را تأیید کنید.');
            log('INFO', `Chat ${chatId} linked to invite token (pending verification)`);
            return { success: true, reason: 'pending_verification', chatId };
        }

    } catch (error) {
        logger.error('❌ Deep link handler crashed:', error);
        await botService.sendMessage(chatId, '⚠️ خطای سیستمی. لطفاً بعداً تلاش کنید.');
        log('ERROR', 'Deep link system error', { error: error.message });
        return { success: false, reason: 'system_error' };
    }
});

const startServer = () => {
  httpServer.listen(PORT, '0.0.0.0', () => {  // ← فقط '0.0.0.0' رو اضافه کن
    logger.info('═══════════════════════════════════════════════════');
    logger.info('🎉 سرور با موفقیت راه‌اندازی شد!');
    logger.info('═══════════════════════════════════════════════════');
    logger.info(`🚀 پورت: ${PORT}`);
    logger.info(`🌍 محیط: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`💾 دیتابیس: PostgreSQL (Knex.js) - ${dbReady ? '✅ متصل' : '❌ قطع'}`);
    logger.info(`📍 آدرس: http://localhost:${PORT}`);
    logger.info(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
    logger.info(`🏥 Health: http://localhost:${PORT}/health`);
    logger.info(`📊 Admin Stats: http://localhost:${PORT}/api/admin/stats`);
    logger.info(`📋 Admin Tables: http://localhost:${PORT}/api/admin/tables`);
    logger.info(`🆔 Process ID: ${process.pid}`);
    logger.info('═══════════════════════════════════════════════════');
  });
};

// ============================================
// 🔒 مدیریت سیگنال‌ها (Graceful Shutdown)
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`📴 دریافت سیگنال ${signal} - در حال خروج...`);
    // توقف ربات بله
  botService.stopPolling();
  logger.info('🤖 Polling ربات متوقف شد');
  httpServer.close(async () => {
    logger.info('✅ تمام اتصالات HTTP بسته شدند');
    
    if (db) {
      try {
        await db.destroy();
        logger.info('✅ دیتابیس بسته شد');
      } catch (e) {
        logger.error('❌ خطا در بستن دیتابیس:', e.message);
      }
    }
    
    logger.info('👋 خروج موفقیت‌آمیز از برنامه');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('⛔ خروج اجباری بعد از ۱۵ ثانیه');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('❌ خطای catch نشده:', err);
  const errorLogPath = path.join(__dirname, 'logs', 'uncaught.log');
  fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] ${err.stack || err.message}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('❌ Promise رد نشده:', reason);
  const errorLogPath = path.join(__dirname, 'logs', 'unhandled.log');
  fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] ${reason}\n`);
});

// ============================================
// 🌟 اجرای برنامه
// ============================================

const enableClusterMode = process.env.ENABLE_CLUSTER === 'true';

if (enableClusterMode && cluster.isMaster) {
  const numCPUs = os.cpus().length;
  logger.info(`🔄 حالت کلاستر فعال - تعداد هسته‌ها: ${numCPUs}`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    logger.warn(`⚠️ Worker ${worker.process.pid} متوقف شد. در حال راه‌اندازی مجدد...`);
    cluster.fork();
  });
} else {
  // راه‌اندازی دیتابیس و سپس سرور
  (async () => {
    await initializeDatabase();
    startServer();
  })();
}

module.exports = { app, httpServer, db };
