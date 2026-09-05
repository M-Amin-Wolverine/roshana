/**
* Profile Routes v1
* Handle user profile endpoints
* @version 1.0.0
*/
const express = require('express');
const router = express.Router();
const { param, query, body, matchedData } = require('express-validator');
const profileController = require('../../controllers/profileController');
const auth = require('../../middlewares/auth');
const validation = require('../../middlewares/validation');
const multer = require('../../utils/multer');
const rateLimit = require('../../middlewares/rateLimiter');
const logger = require('../../utils/logger');

// ========================
// 🛡️ Middleware
// ========================
router.use(auth.verifyToken);

// ========================
// 📝 Validation Rules
// ========================
const validations = {
  // آپدیت پروفایل
  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام باید ۲ تا ۵۰ کاراکتر باشد')
      .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
      .withMessage('نام فقط می‌تواند شامل حروف باشد'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام خانوادگی باید ۲ تا ۵۰ کاراکتر باشد')
      .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
      .withMessage('نام خانوادگی فقط می‌تواند شامل حروف باشد'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('نام کاربری باید ۳ تا ۳۰ کاراکتر باشد')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و underscore باشد'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('بیوگرافی نباید بیش از ۵۰۰ کاراکتر باشد'),
    body('phone')
      .optional()
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('شماره تلفن معتبر نیست'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('جنسیت معتبر نیست'),
    body('birthDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ تولد معتبر نیست')
      .custom(value => {
        const date = new Date(value);
        const now = new Date();
        if (date > now) throw new Error('تاریخ تولد نمی‌تواند در آینده باشد');
        const age = (now - date) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 13) throw new Error('سن باید حداقل ۱۳ سال باشد');
        return true;
      }),
    body('website')
      .optional()
      .isURL()
      .withMessage('آدرس وب‌سایت معتبر نیست'),
    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('مکان نباید بیش از ۱۰۰ کاراکتر باشد'),
    body('language')
      .optional()
      .isIn(['fa', 'en', 'ar', 'tr', 'ru', 'zh', 'es', 'fr'])
      .withMessage('زبان معتبر نیست'),
    body('timezone')
      .optional()
      .matches(/^UTC[+-]\d{2}:\d{2}$/)
      .withMessage('منطقه زمانی معتبر نیست'),
  ],

  // تغییر رمز عبور
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('رمز عبور فعلی الزامی است'),
    body('newPassword')
      .isLength({ min: 8, max: 100 })
      .withMessage('رمز عبور جدید باید ۸ تا ۱۰۰ کاراکتر باشد')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص باشد'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('تکرار رمز عبور الزامی است')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('رمز عبور و تکرار آن مطابقت ندارند');
        }
        return true;
      }),
  ],

  // تنظیمات حریم خصوصی
  privacySettings: [
    body('profileVisibility')
      .optional()
      .isIn(['public', 'friends', 'private'])
      .withMessage('میزان دید پروفایل معتبر نیست'),
    body('showEmail')
      .optional()
      .isBoolean()
      .withMessage('مقدار معتبر نیست'),
    body('showPhone')
      .optional()
      .isBoolean(),
    body('showLastSeen')
      .optional()
      .isBoolean(),
    body('showOnlineStatus')
      .optional()
      .isBoolean(),
    body('allowMessaging')
      .optional()
      .isIn(['everyone', 'friends', 'none'])
      .withMessage('مقدار معتبر نیست'),
    body('showActivity')
      .optional()
      .isBoolean(),
  ],

  // تنظیمات اعلان‌ها
  notificationSettings: [
    body('emailNotifications')
      .optional()
      .isBoolean(),
    body('pushNotifications')
      .optional()
      .isBoolean(),
    body('smsNotifications')
      .optional()
      .isBoolean(),
    body('types')
      .optional()
      .isObject(),
  ],

  // شبکه‌های اجتماعی
  socialLinks: [
    body('twitter')
      .optional()
      .matches(/^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/)
      .withMessage('آدرس Twitter معتبر نیست'),
    body('instagram')
      .optional()
      .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/)
      .withMessage('آدرس Instagram معتبر نیست'),
    body('linkedin')
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/)
      .withMessage('آدرس LinkedIn معتبر نیست'),
    body('github')
      .optional()
      .matches(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+$/)
      .withMessage('آدرس GitHub معتبر نیست'),
    body('telegram')
      .optional()
      .matches(/^@?[a-zA-Z0-9_]{5,32}$/)
      .withMessage('آدرس Telegram معتبر نیست'),
  ],

  // فعال‌سازی 2FA
  enable2FA: [
    body('method')
      .isIn(['email', 'sms', 'authenticator'])
      .withMessage('روش معتبر نیست'),
  ],

  // تایید 2FA
  verify2FA: [
    body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('کد باید ۶ رقمی باشد'),
  ],

  // خروج از همه دستگاه‌ها
  logoutAll: [
    body('password')
      .notEmpty()
      .withMessage('رمز عبور برای تأیید الزامی است'),
  ],

  // حذف اکانت
  deleteAccount: [
    body('password')
      .notEmpty()
      .withMessage('رمز عبور الزامی است'),
    body('reason')
      .optional()
      .isLength({ max: 500 }),
    body('confirmText')
      .matches(/^DELETE_ACCOUNT$/)
      .withMessage('متن تأیید صحیح نیست'),
  ],
};

// ========================
// 📌 Main Routes
// ========================

/**
* @route   GET /api/v1/profile
* @desc    Get current user profile
* @access  Private
* @query   { fields: 'basic,extended,full' }
*/
router.get('/',
  query('fields')
    .optional()
    .isIn(['basic', 'extended', 'full'])
    .withMessage('فیلدهای درخواستی معتبر نیست'),
  validation.validate,
  profileController.getProfile
);

/**
* @route   GET /api/v1/profile/public/:username
* @desc    Get public profile by username
* @access  Public
*/
router.get('/public/:username',
  param('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('نام کاربری معتبر نیست'),
  validation.validate,
  profileController.getPublicProfile
);

/**
* @route   PUT /api/v1/profile
* @desc    Update current user profile
* @access  Private
*/
router.put('/',
  rateLimit.profileLimiter,
  validations.updateProfile,
  validation.validate,
  profileController.updateProfile
);

/**
* @route   PATCH /api/v1/profile/username
* @desc    Change username (one time only)
* @access  Private
*/
router.patch('/username',
  rateLimit.profileLimiter,
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و underscore باشد'),
  validation.validate,
  profileController.changeUsername
);

/**
* @route   PATCH /api/v1/profile/email
* @desc    Change email (requires verification)
* @access  Private
*/
router.patch('/email',
  rateLimit.profileLimiter,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('ایمیل معتبر نیست'),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
  validation.validate,
  profileController.changeEmail
);

/**
* @route   POST /api/v1/profile/avatar
* @desc    Upload avatar image
* @access  Private
* @body    { avatar: File }
*/
// آپلود آواتار
router.post('/avatar',
  rateLimit.uploadLimiter,
  multer.uploadProfile,
    (req, res, next) => {
    if (req.file) {
      logger.info('✅ آپلود آواتار موفق', {
        userId: req.user?.id,
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path
      });
    }
    next();
  },                    // ✅ تغییر از upload.single
  profileController.uploadAvatar
);



/**
* @route   DELETE /api/v1/profile/avatar
* @desc    Remove avatar image
* @access  Private
*/
router.delete('/avatar',
  profileController.removeAvatar
);

/**
* @route   POST /api/v1/profile/cover
* @desc    Upload cover image
* @access  Private
*/
// آپلود کاور
router.post('/cover',
  rateLimit.uploadLimiter,
  multer.uploadCover,                      // ✅ تغییر از upload.single
  profileController.uploadCover
);

/**
* @route   DELETE /api/v1/profile/cover
* @desc    Remove cover image
* @access  Private
*/
router.delete('/cover',
  profileController.removeCover
);

/**
* @route   POST /api/v1/profile/change-password
* @desc    Change password
* @access  Private
*/
router.post('/change-password',
  rateLimit.passwordLimiter,
  validations.changePassword,
  validation.validate,
  profileController.changePassword
);

// ========================
// 🔐 امنیت (Security)
// ========================

/**
* @route   GET /api/v1/profile/security
* @desc    Get security settings
* @access  Private
*/
router.get('/security',
  profileController.getSecuritySettings
);

/**
* @route   POST /api/v1/profile/2fa/enable
* @desc    Enable two-factor authentication
* @access  Private
*/
router.post('/2fa/enable',
  rateLimit.securityLimiter,
  validations.enable2FA,
  validation.validate,
  profileController.enable2FA
);

/**
* @route   POST /api/v1/profile/2fa/verify
* @desc    Verify and activate 2FA
* @access  Private
*/
router.post('/2fa/verify',
  rateLimit.securityLimiter,
  validations.verify2FA,
  validation.validate,
  profileController.verify2FA
);

/**
* @route   POST /api/v1/profile/2fa/disable
* @desc    Disable two-factor authentication
* @access  Private
*/
router.post('/2fa/disable',
  rateLimit.securityLimiter,
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('کد ۶ رقمی الزامی است'),
  validation.validate,
  profileController.disable2FA
);

/**
* @route   GET /api/v1/profile/sessions
* @desc    Get active sessions
* @access  Private
*/
router.get('/sessions',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getSessions
);

/**
* @route   DELETE /api/v1/profile/sessions/:sessionId
* @desc    Terminate specific session
* @access  Private
*/
router.delete('/sessions/:sessionId',
  param('sessionId').isMongoId(),
  validation.validate,
  profileController.terminateSession
);

/**
* @route   POST /api/v1/profile/sessions/logout-all
* @desc    Logout from all devices
* @access  Private
*/
router.post('/sessions/logout-all',
  rateLimit.securityLimiter,
  validations.logoutAll,
  validation.validate,
  profileController.logoutAllDevices
);

/**
* @route   GET /api/v1/profile/login-history
* @desc    Get login history
* @access  Private
*/
router.get('/login-history',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getLoginHistory
);

// ========================
// 🔔 تنظیمات (Settings)
// ========================

/**
* @route   GET /api/v1/profile/settings
* @desc    Get all user settings
* @access  Private
*/
router.get('/settings',
  profileController.getSettings
);

/**
* @route   PUT /api/v1/profile/settings
* @desc    Update user settings
* @access  Private
*/
router.put('/settings',
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('تم معتبر نیست'),
  body('language')
    .optional()
    .isIn(['fa', 'en', 'ar', 'tr', 'ru', 'zh', 'es', 'fr']),
  body('timezone')
    .optional()
    .matches(/^UTC[+-]\d{2}:\d{2}$/),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 }),
  body('dateFormat')
    .optional()
    .isIn(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']),
  validation.validate,
  profileController.updateSettings
);

/**
* @route   GET /api/v1/profile/settings/privacy
* @desc    Get privacy settings
* @access  Private
*/
router.get('/settings/privacy',
  profileController.getPrivacySettings
);

/**
* @route   PUT /api/v1/profile/settings/privacy
* @desc    Update privacy settings
* @access  Private
*/
router.put('/settings/privacy',
  validations.privacySettings,
  validation.validate,
  profileController.updatePrivacySettings
);

/**
* @route   GET /api/v1/profile/settings/notifications
* @desc    Get notification settings
* @access  Private
*/
router.get('/settings/notifications',
  profileController.getNotificationSettings
);

/**
* @route   PUT /api/v1/profile/settings/notifications
* @desc    Update notification settings
* @access  Private
*/
router.put('/settings/notifications',
  validations.notificationSettings,
  validation.validate,
  profileController.updateNotificationSettings
);

// ========================
// 🔗 شبکه‌های اجتماعی (Social Links)
// ========================

/**
* @route   GET /api/v1/profile/social
* @desc    Get social links
* @access  Private
*/
router.get('/social',
  profileController.getSocialLinks
);

/**
* @route   PUT /api/v1/profile/social
* @desc    Update social links
* @access  Private
*/
router.put('/social',
  validations.socialLinks,
  validation.validate,
  profileController.updateSocialLinks
);

/**
* @route   POST /api/v1/profile/social/connect/:provider
* @desc    Connect social account
* @access  Private
*/
router.post('/social/connect/:provider',
  param('provider')
    .isIn(['google', 'github', 'twitter', 'facebook', 'linkedin'])
    .withMessage('سرویس معتبر نیست'),
  validation.validate,
  profileController.connectSocialAccount
);

/**
* @route   DELETE /api/v1/profile/social/disconnect/:provider
* @desc    Disconnect social account
* @access  Private
*/
router.delete('/social/disconnect/:provider',
  param('provider')
    .isIn(['google', 'github', 'twitter', 'facebook', 'linkedin']),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
  validation.validate,
  profileController.disconnectSocialAccount
);

// ========================
// 📊 آمار و فعالیت (Stats & Activity)
// ========================

/**
* @route   GET /api/v1/profile/stats
* @desc    Get profile statistics
* @access  Private
*/
router.get('/stats',
  profileController.getProfileStats
);

/**
* @route   GET /api/v1/profile/activity
* @desc    Get recent activity
* @access  Private
* @query   { page, limit, type }
*/
router.get('/activity',
  query('type')
    .optional()
    .isIn(['all', 'login', 'profile', 'settings', 'content']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getActivity
);

/**
* @route   GET /api/v1/profile/achievements
* @desc    Get user achievements
* @access  Private
*/
router.get('/achievements',
  profileController.getAchievements
);

// ========================
// 📦 داده‌ها (Data Management)
// ========================

/**
* @route   GET /api/v1/profile/export
* @desc    Export user data
* @access  Private
* @query   { format: 'json' | 'csv' }
*/
router.get('/export',
  rateLimit.exportLimiter,
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('فرمت معتبر نیست'),
  validation.validate,
  profileController.exportData
);

/**
* @route   GET /api/v1/profile/export/status
* @desc    Get export status
* @access  Private
*/
router.get('/export/status',
  profileController.getExportStatus
);

// ========================
// ⚠️ مدیریت اکانت (Account Management)
// ========================

/**
* @route   POST /api/v1/profile/deactivate
* @desc    Deactivate account temporarily
* @access  Private
*/
router.post('/deactivate',
  rateLimit.accountLimiter,
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
  body('reason')
    .optional()
    .isLength({ max: 500 }),
  validation.validate,
  profileController.deactivateAccount
);

/**
* @route   POST /api/v1/profile/reactivate
* @desc    Reactivate account
* @access  Private
*/
router.post('/reactivate',
  rateLimit.accountLimiter,
  body('token')
    .notEmpty()
    .withMessage('توکن تأیید الزامی است'),
  validation.validate,
  profileController.reactivateAccount
);

/**
* @route   DELETE /api/v1/profile
* @desc    Permanently delete account
* @access  Private
*/
router.delete('/',
  rateLimit.accountLimiter,
  validations.deleteAccount,
  validation.validate,
  profileController.deleteAccount
);

/**
* @route   POST /api/v1/profile/verify-email
* @desc    Send email verification
* @access  Private
*/
router.post('/verify-email',
  rateLimit.verificationLimiter,
  profileController.sendEmailVerification
);

/**
* @route   POST /api/v1/profile/verify-phone
* @desc    Send phone verification
* @access  Private
*/
router.post('/verify-phone',
  rateLimit.verificationLimiter,
  body('phone')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('شماره تلفن معتبر نیست'),
  validation.validate,
  profileController.sendPhoneVerification
);

/**
* @route   POST /api/v1/profile/verify-phone/confirm
* @desc    Confirm phone verification
* @access  Private
*/
router.post('/verify-phone/confirm',
  body('code')
    .isLength({ min: 4, max: 6 })
    .withMessage('کد تأیید معتبر نیست'),
  validation.validate,
  profileController.confirmPhoneVerification
);

module.exports = router;