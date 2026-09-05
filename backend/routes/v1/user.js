/**
* User Routes v1
* Handle user management endpoints (Admin)
* @version 1.0.0
* @author Your Name
*/
const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');
const userController = require('../../controllers/userController');
const auth = require('../../middlewares/auth');
const validation = require('../../middlewares/validation');
const role = require('../../constants/roles');
const rateLimit = require('../../middlewares/rateLimiter');
const logger = require('../../utils/logger');

// ========================
// 🛡️ Admin-only Routes
// ========================
router.use(auth.verifyToken);
router.use(auth.requireRole([role.ADMIN]));

// ========================
// 📋 Validation Rules
// ========================
// ========================
// 📋 Validation Rules
// ========================
const validations = {
  // پارامتر آیدی
  idParam: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست')
  ],
  
  // ایجاد کاربر جدید
  createUser: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('نام کاربری باید ۳ تا ۳۰ کاراکتر باشد')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و underscore باشد'),
    body('email')
      .isEmail()
      .withMessage('ایمیل معتبر نیست')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'),
    body('role')
      .optional()
      .isIn([role.ADMIN, role.MANAGER, role.USER, role.GUEST])
      .withMessage('نقش معتبر نیست'),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام باید ۲ تا ۵۰ کاراکتر باشد')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام خانوادگی باید ۲ تا ۵۰ کاراکتر باشد')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone('fa-IR')
      .withMessage('شماره موبایل معتبر نیست'),
  ],
  
  // فیلتر و جستجو
  listQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('شماره صفحه باید عدد مثبت باشد'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('تعداد آیتم باید بین ۱ تا ۱۰۰ باشد'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('عبارت جستجو باید ۲ تا ۵۰ کاراکتر باشد'),
    query('role')
      .optional()
      .isIn(['ADMIN', 'MANAGER', 'USER', 'GUEST'])
      .withMessage('نقش معتبر نیست'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('وضعیت معتبر نیست'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'username', 'email'])
      .withMessage('فیلد مرتب‌سازی معتبر نیست'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('ترتیب مرتب‌سازی معتبر نیست'),
  ],
  
  // آیدی برای آپدیت
  updateIdParam: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('نام کاربری باید ۳ تا ۳۰ کاراکتر باشد')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و underscore باشد'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('ایمیل معتبر نیست')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn([role.ADMIN, role.MANAGER, role.USER, role.GUEST])
      .withMessage('نقش معتبر نیست'),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام باید ۲ تا ۵۰ کاراکتر باشد')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام خانوادگی باید ۲ تا ۵۰ کاراکتر باشد')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone('fa-IR')
      .withMessage('شماره موبایل معتبر نیست'),
  ],
  
  // تغییر وضعیت
  toggleStatus: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('دلیل تغییر وضعیت نباید بیش از ۵۰۰ کاراکتر باشد'),
  ],
  
  // تغییر نقش
  changeRole: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    body('role')
      .isIn([role.ADMIN, role.MANAGER, role.USER, role.GUEST])
      .withMessage('نقش معتبر نیست')
      .notEmpty()
      .withMessage('نقش الزامی است'),
  ],
  
  // ریست رمز عبور
  resetPassword: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'),
  ],
  
  // جستجوی پیشرفته
  searchUsers: [
    query('q')
      .isLength({ min: 2 })
      .withMessage('عبارت جستجو باید حداقل ۲ کاراکتر باشد')
      .trim(),
    query('role')
      .optional()
      .isIn(['ADMIN', 'MANAGER', 'USER', 'GUEST'])
      .withMessage('نقش معتبر نیست'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('وضعیت معتبر نیست'),
  ],
  
  // خروجی گرفتن
  exportUsers: [
    query('format')
      .optional()
      .isIn(['csv', 'excel', 'json'])
      .withMessage('فرمت خروجی معتبر نیست'),
  ],
  
  // فعالیت کاربر
  userActivity: [
    param('id')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('شماره صفحه باید عدد مثبت باشد'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('تعداد آیتم باید بین ۱ تا ۵۰ باشد'),
  ],
  
  // عملیات bulk
  bulkAction: [
    body('userIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('لیست آیدی‌ها باید بین ۱ تا ۱۰۰ آیتم باشد'),
    body('userIds.*')
      .isMongoId()
      .withMessage('آیدی کاربر معتبر نیست'),
    body('action')
      .isIn(['delete', 'activate', 'deactivate', 'export'])
      .withMessage('عملیات معتبر نیست'),
  ]
};
// ========================
// 📌 Main Routes
// ========================

/**
* @route   GET /api/v1/users
* @desc    Get all users with pagination, filtering & search
* @access  Admin
* @query   { page, limit, search, role, status, sortBy, sortOrder }
* @example GET /api/v1/users?page=1&limit=10&search=john&role=USER&status=active&sortBy=createdAt&sortOrder=desc
*/
router.get('/',
  rateLimit.adminLimiter,
  validations.listQuery,
  validation.validate,
  userController.getAllUsers
);

/**
* @route   GET /api/v1/users/stats
* @desc    Get user statistics dashboard
* @access  Admin
*/
router.get('/stats',
  rateLimit.adminLimiter,
  userController.getUserStats
);

/**
* @route   GET /api/v1/users/export
* @desc    Export users to CSV/Excel
* @access  Admin
* @query   { format, role, status }
*/
router.get('/export',
  rateLimit.adminLimiter,
  query('format')
    .optional()
    .isIn(['csv', 'excel', 'json'])
    .withMessage('فرمت خروجی معتبر نیست'),
  validations.listQuery,
  validation.validate,
  userController.exportUsers
);

/**
* @route   GET /api/v1/users/search
* @desc    Advanced search users
* @access  Admin
*/
router.get('/search',
  rateLimit.adminLimiter,
  query('q')
    .isLength({ min: 2 })
    .withMessage('عبارت جستجو باید حداقل ۲ کاراکتر باشد'),
  validation.validate,
  userController.searchUsers
);

/**
* @route   GET /api/v1/users/:id
* @desc    Get user by ID
* @access  Admin
*/
router.get('/:id',
  rateLimit.adminLimiter,
  validations.idParam,
  validation.validate,
  userController.getUserById
);

/**
* @route   POST /api/v1/users
* @desc    Create new user
* @access  Admin
* @body    { username, email, password, role, firstName, lastName }
*/
router.post('/',
  rateLimit.adminLimiter,
  validations.createUser,
  validation.validate,
  userController.createUser
);

/**
* @route   PUT /api/v1/users/:id
* @desc    Update user
* @access  Admin
*/
router.put('/:id',
  rateLimit.adminLimiter,
  validations.updateIdParam,
  validation.validate,
  userController.updateUser
);

/**
* @route   PATCH /api/v1/users/:id/role
* @desc    Change user role
* @access  Admin
*/
router.patch('/:id/role',
  rateLimit.adminLimiter,
  validations.changeRole,
  validation.validate,
  userController.changeUserRole
);

/**
* @route   PATCH /api/v1/users/:id/toggle-status
* @desc    Toggle user active status (soft toggle)
* @access  Admin
*/
router.patch('/:id/toggle-status',
  rateLimit.adminLimiter,
  validations.toggleStatus,
  validation.validate,
  userController.toggleUserStatus
);

/**
* @route   PATCH /api/v1/users/:id/reset-password
* @desc    Reset user password (admin action)
* @access  Admin
*/
router.patch('/:id/reset-password',
  rateLimit.adminLimiter,
  validations.idParam,
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'),
  validation.validate,
  userController.resetUserPassword
);

/**
* @route   DELETE /api/v1/users/:id
* @desc    Delete user (soft delete)
* @access  Admin
*/
router.delete('/:id',
  rateLimit.adminLimiter,
  validations.idParam,
  validation.validate,
  userController.deleteUser
);

/**
* @route   POST /api/v1/users/bulk
* @desc    Bulk operations on users
* @access  Admin
* @body    { userIds: [], action: 'delete' | 'activate' | 'deactivate' | 'export' }
*/
router.post('/bulk',
  rateLimit.adminLimiter,
  validations.bulkAction,
  validation.validate,
  userController.bulkAction
);

/**
* @route   GET /api/v1/users/:id/activity
* @desc    Get user activity log
* @access  Admin
*/
router.get('/:id/activity',
  rateLimit.adminLimiter,
  validations.idParam,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  userController.getUserActivity
);

module.exports = router;
