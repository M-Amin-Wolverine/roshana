const express = require('express');
const router = express.Router();
const { param, body, validationResult } = require('express-validator');
const userController = require('../../controllers/userController');
const auth = require('../../middlewares/auth');
const role = require('../../constants/role');
const rateLimit = require('../../middlewares/rateLimit');
const logger = require('../../utils/logger');

// ========================
// 🎯 Middleware Factory برای Role-based Access
// ========================
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'لطفا ابتدا وارد شوید' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied: User ${req.user.id} tried to access ${req.originalUrl}`);
      return res.status(403).json({ 
        success: false, 
        message: 'شما دسترسی لازم را ندارید' 
      });
    }
    
    next();
  };
};

// ========================
// 📝 Validation Rules
// ========================
const userValidation = {
  create: [
    body('username').isLength({ min: 3 }).withMessage('نام کاربری باید حداقل ۳ کاراکتر باشد'),
    body('email').isEmail().withMessage('ایمیل معتبر نیست'),
    body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  ],
  update: [
    param('id').isMongoId().withMessage('آیدی معتبر نیست'),
    body('username').optional().isLength({ min: 3 }),
    body('email').optional().isEmail(),
  ],
  idParam: [
    param('id').isMongoId().withMessage('آیدی معتبر نیست'),
  ]
};

// ========================
// 🛡️ Validation Handler
// ========================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// ========================
// 📌 مسیرهای عمومی (بدون احراز هویت)
// ========================
router.post('/register', 
  rateLimit.authLimiter,
  userValidation.create,
  validate,
  userController.register
);

router.post('/login', 
  rateLimit.authLimiter,
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  userController.login
);

// ========================
// 🔐 مسیرهای نیازمند احراز هویت
// ========================
router.use(auth.verifyToken);

// ========================
// 👤 پروفایل کاربر جاری
// ========================
router.get('/me', userController.getCurrentUser);
router.put('/me', 
  userValidation.update,
  validate,
  userController.updateProfile
);
router.put('/me/password', 
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
  userController.changePassword
);

// ========================
// 🖼️ آپلود عکس پروفایل
// ========================
router.post('/me/avatar',
  require('multer')().single('avatar'),
  userController.uploadAvatar
);

// ========================
// 📊 آمار و گزارش‌ها (فقط ادمین)
// ========================
router.get('/stats', 
  requireRoles(role.ADMIN),
  userController.getUserStats
);

router.get('/export', 
  requireRoles(role.ADMIN),
  userController.exportUsers
);

// ========================
// 👥 مدیریت کاربران (ادمین + مدیر)
// ========================
router.get('/', 
  requireRoles(role.ADMIN, role.MANAGER),
  userValidation.idParam,
  validate,
  userController.getAllUsers
);

router.get('/:id', 
  requireRoles(role.ADMIN, role.MANAGER),
  userValidation.idParam,
  validate,
  userController.getUserById
);

router.post('/', 
  requireRoles(role.ADMIN),
  userValidation.create,
  validate,
  userController.createUser
);

router.put('/:id', 
  requireRoles(role.ADMIN),
  userValidation.update,
  validate,
  userController.updateUser
);

router.delete('/:id', 
  requireRoles(role.ADMIN),
  userValidation.idParam,
  validate,
  userController.deleteUser
);

// ========================
// 🔄 فعال/غیرفعال کردن کاربر
// ========================
router.patch('/:id/toggle-status',
  requireRoles(role.ADMIN),
  userValidation.idParam,
  validate,
  userController.toggleUserStatus
);

module.exports = router;