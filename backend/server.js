// ============================================
// 🎯 Roshana Backend Server - نسخه نهایی گسترش یافته و تولیدمحور
// ============================================
// نویسنده: Senior Architect | نسخه: 2.3.0 | تاریخ: ۱۴۰۵/۰۳/۰۸

'use strict';

require('dotenv').config();

// ============================================
// 📦 Dependencies
// ============================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cluster = require('cluster');
const os = require('os');

// ============================================
// 🔧 Imports از پوشه‌بندی فعلی شما
// ============================================
const botService = require('./services/botService');
const { errorHandler } = require('./middlewares/errors/errorHandler');
const logger = require('./utils/logger');
const rateLimiter = require('./middlewares/rateLimiter');

const CONFIG = require('./config');
const supportRoutes = require('./routes/support');

// ============================================
// 🗄️ Database Setup
// ============================================
const knex = require('knex');
const knexConfig = require('./knexfile');

let db;
let dbReady = false;

const initializeDatabase = async () => {
  try {
    db = knex(knexConfig[process.env.NODE_ENV || 'development']);
    
    await db.raw('SELECT 1 as test, NOW() as server_time');
    dbReady = true;
    global.db = db;

    logger.info('✅ PostgreSQL Connected Successfully');

    // Advanced Monitor
    const AdvancedDatabaseMonitor = require('./advancedMonitor');
    const dbMonitor = new AdvancedDatabaseMonitor(db, global.io, {
      enableQueryLogging: process.env.ENABLE_QUERY_LOG === 'true',
      enablePoolMonitoring: true,
      enableCliDashboard: true,
      enableWebSocketEmit: true,
      reconnectInterval: 30000,
      maxReconnectAttempts: 8,
      slowQueryThreshold: 700
    });

    global.dbMonitor = dbMonitor;
    logger.info('📊 Advanced Database Monitor فعال شد');

  } catch (err) {
    logger.error('❌ Database Initialization Failed:', err.message);
    botService.sendLog('CRITICAL', 'Database connection failed', { error: err.message });
    process.exit(1);
  }
};

// ============================================
// ⚙️ Express Application
// ============================================
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

global.io = io;

// ============================================
// 📊 Global Counters
// ============================================
let onlineUsers = 0;
let totalRequests = 0;

// ============================================
// 🛡️ Middlewares
// ============================================

// Request ID
app.use((req, res, next) => {
  req.id = uuidv4();
  totalRequests++;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Response Time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    if (duration > 2000) logger.warn(`Slow request: ${req.method} ${req.path} (${duration}ms)`);
  });
  next();
});

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173',
      'http://192.168.234.1:5173', 'http://192.168.30.1:5173', 'http://192.168.169.160:5173',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    logger.warn(`CORS Blocked: ${origin}`);
    callback(new Error('CORS Not Allowed'));
  },
  credentials: true
}));

app.use(compression({ level: 6 }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate Limiting
app.use(rateLimiter.apiLimiter);
app.use('/api/auth', rateLimiter.authLimiter);
app.use('/api/upload', rateLimiter.uploadLimiter);

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ============================================
// 🔌 Socket.IO
// ============================================
io.on('connection', (socket) => {
  onlineUsers++;
  logger.info(`Client connected | Online: ${onlineUsers}`);
  io.emit('online-users-count', onlineUsers);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('online-users-count', onlineUsers);
  });
});

// ============================================
// 📁 Static Files
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================
// 🛤️ Routes
// ============================================
const API_PREFIX = CONFIG.API_PREFIX || '/api/v1';

const loadRoutes = () => {
  try {
    app.use(`${API_PREFIX}/auth`, require('./routes/v1/auth'));
    app.use(`${API_PREFIX}/users`, require('./routes/v1/user'));
    app.use(`${API_PREFIX}/profile`, require('./routes/v1/profile'));
    app.use('/api/admin/data', require('./routes/adminData'));
    app.use(`${API_PREFIX}/bot`, require('./routes/v1/bot'));
    app.use('/api/admin/support', supportRoutes);

    logger.info('✅ All routes loaded successfully');
  } catch (err) {
    logger.error('Route loading error:', err.message);
  }
};

// ============================================
// Health & Admin Endpoints
// ============================================
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    status: 'healthy',
    version: '2.3.0',
    uptime: process.uptime(),
    onlineUsers,
    totalRequests,
    memory: {
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`
    }
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ success: true, database: 'connected' });
  } catch (e) {
    res.status(503).json({ success: false, database: 'disconnected' });
  }
});

// ============================================
// Start Server
// ============================================
const PORT = CONFIG.PORT || process.env.PORT || 5000;

const startServer = async () => {
  await initializeDatabase();
  loadRoutes();

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           Roshana Backend Server v2.3.0 Started             ║
╟──────────────────────────────────────────────────────────────╢
║ Port        : ${PORT}                                        ║
║ Env         : ${process.env.NODE_ENV || 'development'}       ║
║ Database    : ${dbReady ? 'Connected' : 'Failed'}            ║
║ Online Users: ${onlineUsers}                                 ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
};

// Cluster Mode
if (process.env.ENABLE_CLUSTER === 'true' && cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) cluster.fork();
} else {
  startServer();
}

// Graceful Shutdown
process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { logger.info('SIGINT received'); process.exit(0); });

module.exports = { app, httpServer, io, db };