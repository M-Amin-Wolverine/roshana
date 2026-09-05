/**
* Profile Routes v2
* Advanced user profile management
* @version 2.0.0
*/
const express = require('express');
const router = express.Router();
const { param, query, body, matchedData } = require('express-validator');
const profileController = require('../../controllers/profileController');
const auth = require('../../middlewares/auth');
const validation = require('../../middlewares/validation');
const upload = require('../../utils/multer');
const rateLimit = require('../../middlewares/rateLimit');
const logger = require('../../utils/logger');

// ========================
// 🛡️ Middleware
// ========================
router.use(auth.verifyToken);

// ========================
// 📝 Validation Rules
// ========================
const validations = {
  // آپدیت پروفایل کامل
  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام باید ۲ تا ۵۰ کاراکتر باشد'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام خانوادگی باید ۲ تا ۵۰ کاراکتر باشد'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('نام کاربری فقط حروف، اعداد و underscore'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('بیوگرافی نباید بیش از ۵۰۰ کاراکتر باشد'),
    body('phone')
      .optional()
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('birthDate')
      .optional()
      .isISO8601()
      .custom(value => {
        const date = new Date(value);
        if (date > new Date()) throw new Error('تاریخ معتبر نیست');
        return true;
      }),
    body('website')
      .optional()
      .isURL(),
    body('location')
      .optional()
      .isLength({ max: 100 }),
    body('language')
      .optional()
      .isIn(['fa', 'en', 'ar', 'tr', 'ru', 'zh', 'es', 'fr']),
    body('timezone')
      .optional()
      .matches(/^UTC[+-]\d{2}:\d{2}$/),
    body('occupation')
      .optional()
      .isLength({ max: 100 }),
    body('company')
      .optional()
      .isLength({ max: 100 }),
    body('education')
      .optional()
      .isArray({ max: 10 }),
    body('skills')
      .optional()
      .isArray({ max: 20 }),
    body('interests')
      .optional()
      .isArray({ max: 20 }),
  ],

  // تغییر رمز عبور
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('رمز عبور فعلی الزامی است'),
    body('newPassword')
      .isLength({ min: 8, max: 100 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    body('confirmPassword')
      .notEmpty()
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('رمز عبور تکرار شده مطابقت ندارد');
        }
        return true;
      }),
  ],

  // تنظیمات حریم خصوصی
  privacySettings: [
    body('profileVisibility')
      .optional()
      .isIn(['public', 'friends', 'private']),
    body('showEmail')
      .optional()
      .isBoolean(),
    body('showPhone')
      .optional()
      .isBoolean(),
    body('showOnlineStatus')
      .optional()
      .isBoolean(),
    body('showLastSeen')
      .optional()
      .isBoolean(),
    body('allowMessaging')
      .optional()
      .isIn(['everyone', 'friends', 'none']),
    body('showActivity')
      .optional()
      .isBoolean(),
    body('showFollowers')
      .optional()
      .isBoolean(),
    body('showFollowing')
      .optional()
      .isBoolean(),
  ],

  // تنظیمات اعلان‌ها
  notificationSettings: [
    body('emailNotifications')
      .optional()
      .isObject(),
    body('pushNotifications')
      .optional()
      .isObject(),
    body('smsNotifications')
      .optional()
      .isObject(),
    body('quietHours')
      .optional()
      .isObject(),
  ],

  // شبکه‌های اجتماعی
  socialLinks: [
    body('twitter')
      .optional()
      .matches(/^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/),
    body('instagram')
      .optional()
      .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/),
    body('linkedin')
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/),
    body('github')
      .optional()
      .matches(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+$/),
    body('telegram')
      .optional()
      .matches(/^@?[a-zA-Z0-9_]{5,32}$/),
    body('youtube')
      .optional()
      .matches(/^https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9_-]+$/),
  ],

  // تنظیمات ظاهر
  appearanceSettings: [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'auto', 'sepia']),
    body('accentColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/),
    body('fontSize')
      .optional()
      .isIn(['small', 'medium', 'large']),
    body('compactMode')
      .optional()
      .isBoolean(),
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
      .isNumeric(),
  ],

  // خروج از همه دستگاه‌ها
  logoutAll: [
    body('password')
      .notEmpty()
      .withMessage('رمز عبور الزامی است'),
  ],

  // حذف اکانت
  deleteAccount: [
    body('password')
      .notEmpty(),
    body('confirmText')
      .matches(/^DELETE_ACCOUNT$/),
    body('reason')
      .optional()
      .isLength({ max: 500 }),
  ],
};

// ========================
// 📌 Main Routes - پروفایل
// ========================

/**
* @route   GET /api/v2/profile
* @desc    Get current user profile
* @access  Private
* @query   { fields: 'basic|extended|full' }
*/
router.get('/',
  query('fields')
    .optional()
    .isIn(['basic', 'extended', 'full'])
    .withMessage('فیلدهای معتبر: basic, extended, full'),
  validation.validate,
  profileController.getProfile
);

/**
* @route   GET /api/v2/profile/public/:username
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
* @route   PUT /api/v2/profile
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
* @route   PATCH /api/v2/profile/username
* @desc    Change username
* @access  Private
*/
router.patch('/username',
  rateLimit.profileLimiter,
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/),
  validation.validate,
  profileController.changeUsername
);

/**
* @route   PATCH /api/v2/profile/email
* @desc    Change email (requires verification)
* @access  Private
*/
router.patch('/email',
  rateLimit.profileLimiter,
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('password')
    .notEmpty(),
  validation.validate,
  profileController.changeEmail
);

/**
* @route   PATCH /api/v2/profile/phone
* @desc    Change phone number
* @access  Private
*/
router.patch('/phone',
  rateLimit.profileLimiter,
  body('phone')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
  body('password')
    .notEmpty(),
  validation.validate,
  profileController.changePhone
);

// ========================
// 🖼️ آپلود فایل
// ========================

/**
* @route   POST /api/v2/profile/avatar
* @desc    Upload avatar image
* @access  Private
* @body    { avatar: File }
*/
router.post('/avatar',
  rateLimit.uploadLimiter,
  upload.single('avatar'),
  profileController.uploadAvatar
);

/**
* @route   DELETE /api/v2/profile/avatar
* @desc    Remove avatar
* @access  Private
*/
router.delete('/avatar',
  profileController.removeAvatar
);

/**
* @route   POST /api/v2/profile/cover
* @desc    Upload cover image
* @access  Private
*/
router.post('/cover',
  rateLimit.uploadLimiter,
  upload.single('cover'),
  profileController.uploadCover
);

/**
* @route   DELETE /api/v2/profile/cover
* @desc    Remove cover image
* @access  Private
*/
router.delete('/cover',
  profileController.removeCover
);

/**
* @route   POST /api/v2/profile/gallery
* @desc    Upload gallery images
* @access  Private
*/
router.post('/gallery',
  rateLimit.uploadLimiter,
  upload.array('images', 10),
  profileController.uploadGallery
);

/**
* @route   DELETE /api/v2/profile/gallery/:imageId
* @desc    Remove gallery image
* @access  Private
*/
router.delete('/gallery/:imageId',
  param('imageId').isMongoId(),
  validation.validate,
  profileController.removeGalleryImage
);

// ========================
// 🔐 امنیت
// ========================

/**
* @route   POST /api/v2/profile/change-password
* @desc    Change password
* @access  Private
*/
router.post('/change-password',
  rateLimit.passwordLimiter,
  validations.changePassword,
  validation.validate,
  profileController.changePassword
);

/**
* @route   GET /api/v2/profile/security
* @desc    Get security settings
* @access  Private
*/
router.get('/security',
  profileController.getSecuritySettings
);

/**
* @route   POST /api/v2/profile/2fa/enable
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
* @route   POST /api/v2/profile/2fa/verify
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
* @route   POST /api/v2/profile/2fa/disable
* @desc    Disable 2FA
* @access  Private
*/
router.post('/2fa/disable',
  rateLimit.securityLimiter,
  body('password').notEmpty(),
  body('code').isLength({ min: 6, max: 6 }),
  validation.validate,
  profileController.disable2FA
);

/**
* @route   GET /api/v2/profile/sessions
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
* @route   DELETE /api/v2/profile/sessions/:sessionId
* @desc    Terminate session
* @access  Private
*/
router.delete('/sessions/:sessionId',
  param('sessionId').isMongoId(),
  validation.validate,
  profileController.terminateSession
);

/**
* @route   POST /api/v2/profile/sessions/logout-all
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
* @route   GET /api/v2/profile/login-history
* @desc    Get login history
* @access  Private
*/
router.get('/login-history',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getLoginHistory
);

/**
* @route   POST /api/v2/profile/backup-codes
* @desc    Generate backup codes
* @access  Private
*/
router.post('/backup-codes',
  rateLimit.securityLimiter,
  profileController.generateBackupCodes
);

// ========================
// ⚙️ تنظیمات
// ========================

/**
* @route   GET /api/v2/profile/settings
* @desc    Get all settings
* @access  Private
*/
router.get('/settings',
  profileController.getSettings
);

/**
* @route   PUT /api/v2/profile/settings
* @desc    Update general settings
* @access  Private
*/
router.put('/settings',
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
  body('timeFormat')
    .optional()
    .isIn(['12h', '24h']),
  validation.validate,
  profileController.updateSettings
);

/**
* @route   GET /api/v2/profile/settings/appearance
* @desc    Get appearance settings
* @access  Private
*/
router.get('/settings/appearance',
  profileController.getAppearanceSettings
);

/**
* @route   PUT /api/v2/profile/settings/appearance
* @desc    Update appearance settings
* @access  Private
*/
router.put('/settings/appearance',
  validations.appearanceSettings,
  validation.validate,
  profileController.updateAppearanceSettings
);

/**
* @route   GET /api/v2/profile/settings/privacy
* @desc    Get privacy settings
* @access  Private
*/
router.get('/settings/privacy',
  profileController.getPrivacySettings
);

/**
* @route   PUT /api/v2/profile/settings/privacy
* @desc    Update privacy settings
* @access  Private
*/
router.put('/settings/privacy',
  validations.privacySettings,
  validation.validate,
  profileController.updatePrivacySettings
);

/**
* @route   GET /api/v2/profile/settings/notifications
* @desc    Get notification settings
* @access  Private
*/
router.get('/settings/notifications',
  profileController.getNotificationSettings
);

/**
* @route   PUT /api/v2/profile/settings/notifications
* @desc    Update notification settings
* @access  Private
*/
router.put('/settings/notifications',
  validations.notificationSettings,
  validation.validate,
  profileController.updateNotificationSettings
);

// ========================
// 🔗 شبکه‌های اجتماعی
// ========================

/**
* @route   GET /api/v2/profile/social
* @desc    Get social links
* @access  Private
*/
router.get('/social',
  profileController.getSocialLinks
);

/**
* @route   PUT /api/v2/profile/social
* @desc    Update social links
* @access  Private
*/
router.put('/social',
  validations.socialLinks,
  validation.validate,
  profileController.updateSocialLinks
);

/**
* @route   POST /api/v2/profile/social/connect/:provider
* @desc    Connect social account
* @access  Private
*/
router.post('/social/connect/:provider',
  param('provider')
    .isIn(['google', 'github', 'twitter', 'facebook', 'linkedin', 'apple']),
  validation.validate,
  profileController.connectSocialAccount
);

/**
* @route   DELETE /api/v2/profile/social/disconnect/:provider
* @desc    Disconnect social account
* @access  Private
*/
router.delete('/social/disconnect/:provider',
  param('provider')
    .isIn(['google', 'github', 'twitter', 'facebook', 'linkedin', 'apple']),
  body('password').notEmpty(),
  validation.validate,
  profileController.disconnectSocialAccount
);

// ========================
// 📊 آمار و فعالیت
// ========================

/**
* @route   GET /api/v2/profile/stats
* @desc    Get profile statistics
* @access  Private
*/
router.get('/stats',
  profileController.getProfileStats
);

/**
* @route   GET /api/v2/profile/activity
* @desc    Get recent activity
* @access  Private
* @query   { page, limit, type }
*/
router.get('/activity',
  query('type')
    .optional()
    .isIn(['all', 'login', 'profile', 'settings', 'content', 'social']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getActivity
);

/**
* @route   GET /api/v2/profile/achievements
* @desc    Get user achievements
* @access  Private
*/
router.get('/achievements',
  profileController.getAchievements
);

/**
* @route   GET /api/v2/profile/analytics
* @desc    Get profile analytics
* @access  Private
* @query   { period: '7d|30d|90d|1y' }
*/
router.get('/analytics',
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('دوره زمانی معتبر نیست'),
  validation.validate,
  profileController.getAnalytics
);

// ========================
// 👥 ارتباطات اجتماعی
// ========================

/**
* @route   GET /api/v2/profile/followers
* @desc    Get followers list
* @access  Private
*/
router.get('/followers',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getFollowers
);

/**
* @route   GET /api/v2/profile/following
* @desc    Get following list
* @access  Private
*/
router.get('/following',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  profileController.getFollowing
);

/**
* @route   POST /api/v2/profile/follow/:userId
* @desc    Follow user
* @access  Private
*/
router.post('/follow/:userId',
  param('userId').isMongoId(),
  validation.validate,
  profileController.followUser
);

/**
* @route   DELETE /api/v2/profile/follow/:userId
* @desc    Unfollow user
* @access  Private
*/
router.delete('/follow/:userId',
  param('userId').isMongoId(),
  validation.validate,
  profileController.unfollowUser
);

/**
* @route   POST /api/v2/profile/block/:userId
* @desc    Block user
* @access  Private
*/
router.post('/block/:userId',
  param('userId').isMongoId(),
  validation.validate,
  profileController.blockUser
);

/**
* @route   DELETE /api/v2/profile/block/:userId
* @desc    Unblock user
* @access  Private
*/
router.delete('/block/:userId',
  param('userId').isMongoId(),
  validation.validate,
  profileController.unblockUser
);

/**
* @route   GET /api/v2/profile/blocked
* @desc    Get blocked users
* @access  Private
*/
router.get('/blocked',
  query('page').optional().isInt({ min: 1 }),
  validation.validate,
  profileController.getBlockedUsers
);

// ========================
// 📦 مدیریت داده
// ========================

/**
* @route   GET /api/v2/profile/export
* @desc    Export user data
* @access  Private
* @query   { format: 'json|csv|pdf' }
*/
router.get('/export',
  rateLimit.exportLimiter,
  query('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('فرمت معتبر نیست'),
  validation.validate,
  profileController.exportData
);

/**
* @route   GET /api/v2/profile/export/status
* @desc    Get export status
* @access  Private
*/
router.get('/export/status',
  profileController.getExportStatus
);

/**
* @route   POST /api/v2/profile/import
* @desc    Import profile data
* @access  Private
*/
router.post('/import',
  rateLimit.uploadLimiter,
  upload.single('file'),
  profileController.importData
);

// ========================
// ⚠️ مدیریت اکانت
// ========================

/**
* @route   POST /api/v2/profile/deactivate
* @desc    Deactivate account
* @access  Private
*/
router.post('/deactivate',
  rateLimit.accountLimiter,
  body('password').notEmpty(),
  body('reason').optional().isLength({ max: 500 }),
  validation.validate,
  profileController.deactivateAccount
);

/**
* @route   POST /api/v2/profile/reactivate
* @desc    Reactivate account
* @access  Private
*/
router.post('/reactivate',
  rateLimit.accountLimiter,
  body('token').notEmpty(),
  validation.validate,
  profileController.reactivateAccount
);

/**
* @route   DELETE /api/v2/profile
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
* @route   GET /api/v2/profile/delete-status
* @desc    Get account deletion status
* @access  Private
*/
router.get('/delete-status',
  profileController.getDeleteStatus
);

/**
* @route   POST /api/v2/profile/cancel-delete
* @desc    Cancel account deletion
* @access  Private
*/
router.post('/cancel-delete',
  profileController.cancelDelete
);

// ========================
// ✅ تایید حساب
// ========================

/**
* @route   POST /api/v2/profile/verify-email
* @desc    Send email verification
* @access  Private
*/
router.post('/verify-email',
  rateLimit.verificationLimiter,
  profileController.sendEmailVerification
);

/**
* @route   POST /api/v2/profile/verify-email/confirm
* @desc    Confirm email verification
* @access  Private
*/
router.post('/verify-email/confirm',
  body('token').notEmpty(),
  validation.validate,
  profileController.confirmEmailVerification
);

/**
* @route   POST /api/v2/profile/verify-phone
* @desc    Send phone verification
* @access  Private
*/
router.post('/verify-phone',
  rateLimit.verificationLimiter,
  body('phone')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
  validation.validate,
  profileController.sendPhoneVerification
);

/**
* @route   POST /api/v2/profile/verify-phone/confirm
* @desc    Confirm phone verification
* @access  Private
*/
router.post('/verify-phone/confirm',
  body('code').isLength({ min: 4, max: 6 }),
  validation.validate,
  profileController.confirmPhoneVerification
);

/**
* @route   POST /api/v2/profile/verify-identity
* @desc    Submit identity verification
* @access  Private
*/
router.post('/verify-identity',
  rateLimit.uploadLimiter,
  upload.single('document'),
  profileController.submitIdentityVerification
);

/**
* @route   GET /api/v2/profile/verification-status
* @desc    Get verification status
* @access  Private
*/
router.get('/verification-status',
  profileController.getVerificationStatus
);

// ========================
// 🎯 علاقه‌مندی‌ها و ترجیحات
// ========================

/**
* @route   GET /api/v2/profile/preferences
* @desc    Get user preferences
* @access  Private
*/
router.get('/preferences',
  profileController.getPreferences
);

/**
* @route   PUT /api/v2/profile/preferences
* @desc    Update user preferences
* @access  Private
*/
router.put('/preferences',
  body('favoriteCategories')
    .optional()
    .isArray({ max: 20 }),
  body('favoriteTags')
    .optional()
    .isArray({ max: 50 }),
  body('contentFilters')
    .optional()
    .isObject(),
  body('languageLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'native']),
  validation.validate,
  profileController.updatePreferences
);

module.exports = router;