// routes/v2/roshanSci/admin.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Controllers
const adminController = require('../../../controllers/roshanSci/adminController');

// Middlewares
const { authenticate, authorize, checkRole } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validator');
const { auditLog } = require('../../../middlewares/auditLog');
const { cache, clearCache } = require('../../../middlewares/cache');
const { rateLimiter } = require('../../../middlewares/rateLimiter');
const { requestLogger } = require('../../../middlewares/requestLogger');
const { sanitizeInput } = require('../../../middlewares/sanitizer');

// Validators
const {
  createUserSchema,
  updateUserSchema,
  createPostSchema,
  updatePostSchema,
  createCourseSchema,
  updateCourseSchema,
  createNewsSchema,
  loginSchema,
  bulkOperationSchema,
  exportSchema
} = require('../../../validators/adminSchemas');

// Constants
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// ──────────────────────────────────────────────────────────────
// 🎯 Rate Limiters
// ──────────────────────────────────────────────────────────────

const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

const relaxedRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// ──────────────────────────────────────────────────────────────
// 🔐 Public Routes (No Authentication Required)
// ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v2/admin/login
 * @desc    Admin login with 2FA support
 * @access  Public
 */
router.post('/login',
  strictRateLimiter,
  validate(loginSchema),
  requestLogger,
  adminController.adminLogin
);

/**
 * @route   POST /api/v2/admin/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token',
  relaxedRateLimiter,
  adminController.refreshAccessToken
);

/**
 * @route   POST /api/v2/admin/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  strictRateLimiter,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ]),
  adminController.forgotPassword
);

/**
 * @route   POST /api/v2/admin/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  strictRateLimiter,
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
  ]),
  adminController.resetPassword
);

// ──────────────────────────────────────────────────────────────
// 🛡️ Protected Routes (Authentication Required)
// ──────────────────────────────────────────────────────────────

// Apply authentication and authorization to all routes below
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));
router.use(standardRateLimiter);
router.use(auditLog);

// ──────────────────────────────────────────────────────────────
// 👤 Admin Profile Management
// ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v2/admin/profile
 * @desc    Get current admin profile
 * @access  Admin
 */
router.get('/profile',
  cache({ ttl: 60 }),
  adminController.getAdminProfile
);

/**
 * @route   PUT /api/v2/admin/profile
 * @desc    Update admin profile
 * @access  Admin
 */
router.put('/profile',
  validate([
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('avatar').optional().isURL()
  ]),
  adminController.updateAdminProfile
);

/**
 * @route   POST /api/v2/admin/change-password
 * @desc    Change admin password
 * @access  Admin
 */
router.post('/change-password',
  strictRateLimiter,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain at least one uppercase, one lowercase, and one number')
  ]),
  adminController.changePassword
);

/**
 * @route   POST /api/v2/admin/logout
 * @desc    Admin logout
 * @access  Admin
 */
router.post('/logout',
  adminController.adminLogout
);

/**
 * @route   POST /api/v2/admin/setup-2fa
 * @desc    Setup two-factor authentication
 * @access  Admin
 */
router.post('/setup-2fa',
  adminController.setupTwoFactor
);

/**
 * @route   POST /api/v2/admin/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Admin
 */
router.post('/enable-2fa',
  validate([
    body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit code is required')
  ]),
  adminController.verifyAndEnableTwoFactor
);

/**
 * @route   POST /api/v2/admin/disable-2fa
 * @desc    Disable two-factor authentication
 * @access  Admin
 */
router.post('/disable-2fa',
  strictRateLimiter,
  validate([
    body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit code is required')
  ]),
  adminController.disableTwoFactor
);

// ──────────────────────────────────────────────────────────────
// 📊 Dashboard & Analytics
// ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v2/admin/dashboard
 * @desc    Get dashboard data
 * @access  Admin
 */
router.get('/dashboard',
  cache({ ttl: 30 }),
  adminController.getDashboard
);

/**
 * @route   GET /api/v2/admin/dashboard/stats
 * @desc    Get raw dashboard statistics
 * @access  Admin
 */
router.get('/dashboard/stats',
  cache({ ttl: 60 }),
  adminController.getDashboardStats
);

/**
 * @route   GET /api/v2/admin/dashboard/health
 * @desc    Get system health status
 * @access  Super Admin
 */
router.get('/dashboard/health',
  checkRole('super_admin'),
  adminController.getSystemHealth
);

/**
 * @route   GET /api/v2/admin/dashboard/realtime
 * @desc    Get real-time analytics
 * @access  Admin
 */
router.get('/dashboard/realtime',
  adminController.getRealtimeAnalytics
);

// ──────────────────────────────────────────────────────────────
// 👥 User Management
// ──────────────────────────────────────────────────────────────

const usersRouter = express.Router();

usersRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(['student', 'teacher', 'staff', 'admin']),
    query('status').optional().isIn(['active', 'inactive', 'banned', 'deleted']),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isIn(['created_at', 'name', 'email', 'last_login_at']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  sanitizeInput,
  cache({ ttl: 30 }),
  adminController.getUsers
);

usersRouter.get('/:id',
  validate([
    param('id').isUUID().withMessage('Invalid user ID format')
  ]),
  cache({ ttl: 60 }),
  adminController.getUserById
);

usersRouter.post('/',
  validate(createUserSchema),
  sanitizeInput,
  adminController.createUser
);

usersRouter.put('/:id',
  validate([
    param('id').isUUID().withMessage('Invalid user ID format'),
    ...updateUserSchema
  ]),
  sanitizeInput,
  adminController.updateUser
);

usersRouter.patch('/:id',
  validate([
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('status').optional().isIn(['active', 'inactive', 'banned']),
    body('role').optional().isIn(['student', 'teacher', 'staff']),
    body('name').optional().trim().isLength({ min: 2, max: 100 })
  ]),
  sanitizeInput,
  adminController.partialUpdateUser
);

usersRouter.delete('/:id',
  validate([
    param('id').isUUID().withMessage('Invalid user ID format'),
    query('permanent').optional().isBoolean()
  ]),
  adminController.deleteUser
);

usersRouter.post('/bulk',
  validate(bulkOperationSchema),
  adminController.bulkUpdateUsers
);

usersRouter.post('/:id/verify-email',
  validate([param('id').isUUID()]),
  adminController.verifyUserEmail
);

usersRouter.post('/:id/reset-password',
  validate([
    param('id').isUUID(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
  ]),
  adminController.resetUserPassword
);

usersRouter.get('/:id/courses',
  validate([param('id').isUUID()]),
  adminController.getUserCourses
);

usersRouter.get('/:id/activity',
  validate([
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ]),
  adminController.getUserActivity
);

usersRouter.get('/:id/logs',
  validate([param('id').isUUID()]),
  adminController.getUserLogs
);

router.use('/users', usersRouter);

// ──────────────────────────────────────────────────────────────
// 📝 Content Management
// ──────────────────────────────────────────────────────────────

const contentRouter = express.Router();

contentRouter.get('/',
  validate([
    query('type').optional().isIn(['post', 'news', 'educational']),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim()
  ]),
  cache({ ttl: 30 }),
  adminController.getContent
);

contentRouter.get('/:id',
  validate([param('id').isUUID()]),
  adminController.getContentById
);

contentRouter.post('/',
  validate(createPostSchema),
  sanitizeInput,
  adminController.createPost
);

contentRouter.put('/:id',
  validate([
    param('id').isUUID(),
    ...updatePostSchema
  ]),
  sanitizeInput,
  adminController.updatePost
);

contentRouter.delete('/:id',
  validate([param('id').isUUID()]),
  adminController.deletePost
);

contentRouter.post('/:id/publish',
  validate([param('id').isUUID()]),
  adminController.publishContent
);

contentRouter.post('/:id/unpublish',
  validate([param('id').isUUID()]),
  adminController.unpublishContent
);

contentRouter.post('/:id/duplicate',
  validate([param('id').isUUID()]),
  adminController.duplicateContent
);

contentRouter.get('/:id/comments',
  validate([
    param('id').isUUID(),
    query('status').optional().isIn(['pending', 'approved', 'spam', 'deleted'])
  ]),
  adminController.getContentComments
);

contentRouter.post('/comments/:commentId/approve',
  validate([param('commentId').isUUID()]),
  adminController.approveComment
);

contentRouter.delete('/comments/:commentId',
  validate([param('commentId').isUUID()]),
  adminController.deleteComment
);

router.use('/content', contentRouter);

// ──────────────────────────────────────────────────────────────
// 🏫 Course Management
// ──────────────────────────────────────────────────────────────

const coursesRouter = express.Router();

coursesRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('teacherId').optional().isUUID(),
    query('search').optional().isString().trim()
  ]),
  cache({ ttl: 30 }),
  adminController.getCourses
);

coursesRouter.get('/:id',
  validate([param('id').isUUID()]),
  adminController.getCourseById
);

coursesRouter.post('/',
  validate(createCourseSchema),
  sanitizeInput,
  adminController.createCourse
);

coursesRouter.put('/:id',
  validate([
    param('id').isUUID(),
    ...updateCourseSchema
  ]),
  sanitizeInput,
  adminController.updateCourse
);

coursesRouter.delete('/:id',
  validate([param('id').isUUID()]),
  adminController.deleteCourse
);

coursesRouter.get('/:id/students',
  validate([
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ]),
  adminController.getCourseStudents
);

coursesRouter.post('/:id/enroll',
  validate([
    param('id').isUUID(),
    body('studentId').isUUID().withMessage('Valid student ID is required'),
    body('enrolledBy').optional().isUUID()
  ]),
  adminController.enrollStudent
);

coursesRouter.delete('/:id/enroll/:studentId',
  validate([
    param('id').isUUID(),
    param('studentId').isUUID()
  ]),
  adminController.removeStudent
);

coursesRouter.get('/:id/lessons',
  validate([param('id').isUUID()]),
  adminController.getCourseLessons
);

coursesRouter.post('/:id/lessons',
  validate([
    param('id').isUUID(),
    body('title').trim().notEmpty().withMessage('Lesson title is required'),
    body('content').optional(),
    body('duration').optional().isInt({ min: 1 }),
    body('order').optional().isInt({ min: 0 })
  ]),
  adminController.createLesson
);

coursesRouter.put('/:id/lessons/:lessonId',
  validate([
    param('id').isUUID(),
    param('lessonId').isUUID()
  ]),
  adminController.updateLesson
);

coursesRouter.delete('/:id/lessons/:lessonId',
  validate([
    param('id').isUUID(),
    param('lessonId').isUUID()
  ]),
  adminController.deleteLesson
);

coursesRouter.get('/:id/analytics',
  validate([param('id').isUUID()]),
  adminController.getCourseAnalytics
);

coursesRouter.post('/:id/certificate/generate',
  validate([param('id').isUUID()]),
  adminController.generateCertificates
);

router.use('/courses', coursesRouter);

// ──────────────────────────────────────────────────────────────
// 📁 File Management
// ──────────────────────────────────────────────────────────────

const filesRouter = express.Router();

filesRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isString(),
    query('search').optional().isString().trim()
  ]),
  adminController.listFiles
);

filesRouter.post('/upload',
  upload.single('file'),
  adminController.uploadFile
);

filesRouter.post('/upload-multiple',
  upload.array('files', 10),
  adminController.uploadMultipleFiles
);

filesRouter.get('/:id/download',
  validate([param('id').isUUID()]),
  adminController.downloadFile
);

filesRouter.delete('/:id',
  validate([param('id').isUUID()]),
  adminController.deleteFile
);

filesRouter.post('/cleanup-temp',
  checkRole('super_admin'),
  adminController.cleanupTempFiles
);

router.use('/files', filesRouter);

// ──────────────────────────────────────────────────────────────
// 📰 News Management
// ──────────────────────────────────────────────────────────────

const newsRouter = express.Router();

newsRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('status').optional().isIn(['draft', 'published', 'archived'])
  ]),
  cache({ ttl: 60 }),
  adminController.getNews
);

newsRouter.get('/:id',
  validate([param('id').isUUID()]),
  adminController.getNewsById
);

newsRouter.post('/',
  validate(createNewsSchema),
  sanitizeInput,
  adminController.createNews
);

newsRouter.put('/:id',
  validate([
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('summary').optional().trim(),
    body('content').optional(),
    body('image').optional().isURL(),
    body('status').optional().isIn(['draft', 'published', 'archived'])
  ]),
  sanitizeInput,
  adminController.updateNews
);

newsRouter.delete('/:id',
  validate([param('id').isUUID()]),
  adminController.deleteNews
);

newsRouter.post('/:id/publish',
  validate([param('id').isUUID()]),
  adminController.publishNews
);

router.use('/news', newsRouter);

// ──────────────────────────────────────────────────────────────
// 🎮 Module Management
// ──────────────────────────────────────────────────────────────

const modulesRouter = express.Router();

modulesRouter.get('/',
  cache({ ttl: 30 }),
  adminController.getModuleStatus
);

modulesRouter.get('/:moduleId',
  validate([param('moduleId').isUUID()]),
  adminController.getModuleById
);

modulesRouter.put('/:moduleId',
  validate([
    param('moduleId').isUUID(),
    body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
  ]),
  adminController.updateModuleStatus
);

modulesRouter.post('/:moduleId/toggle',
  validate([param('moduleId').isUUID()]),
  adminController.toggleModule
);

router.use('/modules', modulesRouter);

// ──────────────────────────────────────────────────────────────
# 📊 Data Export
// ──────────────────────────────────────────────────────────────

router.post('/export',
  validate(exportSchema),
  adminController.exportData
);

router.get('/export/download/:fileId',
  validate([param('fileId').isUUID()]),
  adminController.downloadExport
);

// ──────────────────────────────────────────────────────────────
# 🔔 Notifications
// ──────────────────────────────────────────────────────────────

const notificationsRouter = express.Router();

notificationsRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('read').optional().isBoolean()
  ]),
  adminController.getNotifications
);

notificationsRouter.get('/unread-count',
  adminController.getUnreadNotificationsCount
);

notificationsRouter.put('/:id/read',
  validate([param('id').isUUID()]),
  adminController.markNotificationRead
);

notificationsRouter.put('/read-all',
  adminController.markAllNotificationsRead
);

notificationsRouter.delete('/:id',
  validate([param('id').isUUID()]),
  adminController.deleteNotification
);

router.use('/notifications', notificationsRouter);

// ──────────────────────────────────────────────────────────────
# 📋 Support Tickets
// ──────────────────────────────────────────────────────────────

const ticketsRouter = express.Router();

ticketsRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ]),
  adminController.getSupportTickets
);

ticketsRouter.get('/:id',
  validate([param('id').isUUID()]),
  adminController.getTicketById
);

ticketsRouter.put('/:id',
  validate([
    param('id').isUUID(),
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assignedTo').optional().isUUID()
  ]),
  adminController.updateTicket
);

ticketsRouter.post('/:id/reply',
  validate([
    param('id').isUUID(),
    body('message').notEmpty().withMessage('Reply message is required'),
    body('attachment').optional()
  ]),
  adminController.replyToTicket
);

ticketsRouter.post('/:id/assign',
  validate([
    param('id').isUUID(),
    body('adminId').isUUID().withMessage('Valid admin ID is required')
  ]),
  adminController.assignTicket
);

ticketsRouter.post('/:id/resolve',
  validate([param('id').isUUID()]),
  adminController.resolveTicket
);

ticketsRouter.post('/:id/close',
  validate([param('id').isUUID()]),
  adminController.closeTicket
);

router.use('/support-tickets', ticketsRouter);

// ──────────────────────────────────────────────────────────────
# 💾 Backup Management
// ──────────────────────────────────────────────────────────────

const backupsRouter = express.Router();

backupsRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ]),
  adminController.getBackups
);

backupsRouter.post('/create',
  checkRole('super_admin'),
  adminController.createBackup
);

backupsRouter.post('/:id/restore',
  validate([param('id').isUUID()]),
  checkRole('super_admin'),
  adminController.restoreBackup
);

backupsRouter.delete('/:id',
  validate([param('id').isUUID()]),
  checkRole('super_admin'),
  adminController.deleteBackup
);

backupsRouter.get('/:id/download',
  validate([param('id').isUUID()]),
  checkRole('super_admin'),
  adminController.downloadBackup
);

router.use('/backups', backupsRouter);

// ──────────────────────────────────────────────────────────────
# 📈 Reports
// ──────────────────────────────────────────────────────────────

const reportsRouter = express.Router();

reportsRouter.get('/users',
  validate([
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year'])
  ]),
  adminController.userReport
);

reportsRouter.get('/courses',
  validate([
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  adminController.courseReport
);

reportsRouter.get('/revenue',
  validate([
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  checkRole('super_admin'),
  adminController.revenueReport
);

reportsRouter.get('/engagement',
  validate([
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  adminController.engagementReport
);

router.use('/reports', reportsRouter);

// ──────────────────────────────────────────────────────────────
# ⚙️ System Settings
// ──────────────────────────────────────────────────────────────

const settingsRouter = express.Router();

settingsRouter.get('/',
  checkRole('super_admin'),
  adminController.getSystemSettings
);

settingsRouter.put('/',
  checkRole('super_admin'),
  validate([
    body('siteName').optional().isString(),
    body('siteDescription').optional().isString(),
    body('maintenanceMode').optional().isBoolean(),
    body('registrationEnabled').optional().isBoolean(),
    body('emailNotifications').optional().isBoolean()
  ]),
  adminController.updateSystemSettings
);

settingsRouter.get('/admin-preferences',
  adminController.getAdminPreferences
);

settingsRouter.put('/admin-preferences',
  validate([
    body('theme').optional().isIn(['light', 'dark', 'auto']),
    body('language').optional().isIn(['fa', 'en', 'ar']),
    body('dashboardLayout').optional().isString(),
    body('itemsPerPage').optional().isInt({ min: 10, max: 100 }),
    body('notificationsEnabled').optional().isBoolean()
  ]),
  adminController.updateAdminPreferences
);

router.use('/settings', settingsRouter);

// ──────────────────────────────────────────────────────────────
# 🔒 Security & Audit
// ──────────────────────────────────────────────────────────────

const securityRouter = express.Router();

securityRouter.get('/audit-logs',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('action').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('adminId').optional().isUUID()
  ]),
  checkRole('super_admin'),
  adminController.getAuditLogs
);

securityRouter.get('/system-logs',
  validate([
    query('level').optional().isIn(['info', 'warn', 'error', 'debug']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  checkRole('super_admin'),
  adminController.getSystemLogs
);

securityRouter.get('/security-audit',
  checkRole('super_admin'),
  adminController.getSecurityAudit
);

securityRouter.post('/clear-cache',
  checkRole('super_admin'),
  adminController.clearSystemCache
);

securityRouter.post('/rotate-logs',
  checkRole('super_admin'),
  adminController.rotateLogs
);

router.use('/security', securityRouter);

// ──────────────────────────────────────────────────────────────
# 🗓️ Scheduled Tasks
// ──────────────────────────────────────────────────────────────

const tasksRouter = express.Router();

tasksRouter.get('/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ]),
  checkRole('super_admin'),
  adminController.getScheduledTasks
);

tasksRouter.post('/',
  validate([
    body('title').notEmpty().withMessage('Task title is required'),
    body('taskType').isIn(['send_email', 'generate_report', 'cleanup', 'backup', 'sync_data']),
    body('schedule').matches(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/).withMessage('Invalid cron schedule'),
    body('payload').optional().isObject(),
    body('enabled').optional().isBoolean()
  ]),
  checkRole('super_admin'),
  adminController.createScheduledTask
);

tasksRouter.put('/:taskId',
  validate([
    param('taskId').isUUID(),
    body('enabled').optional().isBoolean(),
    body('schedule').optional().isString()
  ]),
  checkRole('super_admin'),
  adminController.updateScheduledTask
);

tasksRouter.delete('/:taskId',
  validate([param('taskId').isUUID()]),
  checkRole('super_admin'),
  adminController.deleteScheduledTask
);

tasksRouter.post('/:taskId/run',
  validate([param('taskId').isUUID()]),
  checkRole('super_admin'),
  adminController.runTaskNow
);

router.use('/scheduled-tasks', tasksRouter);

// ──────────────────────────────────────────────────────────────
# 🧪 Development Only Routes
// ──────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  /**
   * @route   POST /api/v2/admin/query
   * @desc    Execute raw SQL query (Development only)
   * @access  Super Admin
   */
  router.post('/query',
    checkRole('super_admin'),
    validate([
      body('query').notEmpty().withMessage('Query is required'),
      body('params').optional().isArray()
    ]),
    adminController.executeQuery
  );

  /**
   * @route   GET /api/v2/admin/debug/info
   * @desc    Get debug information
   * @access  Super Admin
   */
  router.get('/debug/info',
    checkRole('super_admin'),
    adminController.getDebugInfo
  );
}

module.exports = router;