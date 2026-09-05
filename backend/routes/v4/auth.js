// ============================================
// 📦 وارد کردن ماژول‌ها
// ============================================
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// وارد کردن کنترلرها
const {
  sendOTP,
  verifyOTPController,
  login,
  forgotPassword,
  resetPassword,
  register,
  logout
} = require('../controllers/authController');

// وارد کردن مدل‌ها و middleware
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

// ============================================
// ⚙️ تنظیمات
// ============================================
const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d'
};

// ============================================
// 🛤️ مسیرهای احراز هویت
// ============================================

/**
 * 📤 ارسال کد OTP
 * @body {string} phone - شماره موبایل
 * @body {string} type - نوع (login, forgot, register)
 */
router.post('/send-otp', 
  validateRequest(['phone']), 
  sendOTP
);

/**
 * ✅ تأیید کد OTP
 * @body {string} phone - شماره موبایل
 * @body {string} code - کد OTP
 * @body {string} type - نوع
 */
router.post('/verify-otp', 
  validateRequest(['phone', 'code', 'type']), 
  verifyOTPController
);

/**
 * 🔑 ورود با رمز عبور
 * @body {string} phone - شماره موبایل
 * @body {string} password - رمز عبور
 */
router.post('/login', 
  validateRequest(['phone', 'password']), 
  login
);

/**
 * 📝 ثبت نام کاربر جدید
 * @body {string} username - نام کاربری
 * @body {string} email - ایمیل
 * @body {string} phone - شماره موبایل
 * @body {string} password - رمز عبور
 * @body {string} firstName - نام
 * @body {string} lastName - نام خانوادگی
 */
router.post('/register', 
  validateRequest(['username', 'email', 'phone', 'password']), 
  register
);

/**
 * 🔐 فراموشی رمز - ارسال کد
 * @body {string} phone - شماره موبایل
 */
router.post('/forgot-password', 
  validateRequest(['phone']), 
  forgotPassword
);

/**
 * 🔄 فراموشی رمز - تغییر رمز
 * @body {string} tempToken - توکن موقت
 * @body {string} newPassword - رمز جدید
 */
router.post('/reset-password', 
  validateRequest(['tempToken', 'newPassword']), 
  resetPassword
);

/**
 * 🚪 خروج از حساب
 * @header {string} Authorization - توکن
 */
router.post('/logout', 
  authMiddleware, 
  logout
);

/**
 * 🔁 تمدید توکن (Refresh Token)
 * @body {string} refreshToken - توکن refresh
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'توکن refresh الزامی است',
        error: 'missing_refresh_token'
      });
    }

    // اعتبارسنجی refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, CONFIG.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: 'توکن refresh نامعتبر یا منقضی',
        error: 'invalid_refresh_token'
      });
    }

    // یافتن کاربر
    const user = User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found'
      });
    }

    // تولید توکن جدید
    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone
      },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'توکن تمدید شد',
      token: newToken
    });

  } catch (error) {
    console.error('❌ Error in refresh-token:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تمدید توکن',
      error: 'server_error'
    });
  }
});

/**
 * 👤 دریافت اطلاعات کاربر فعلی
 * @header {string} Authorization - توکن
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user از middleware می‌آید
    const user = User.findById(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found'
      });
    }

    res.json({
      success: true,
      user: User.getPublicFields(user)
    });

  } catch (error) {
    console.error('❌ Error in /me:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات',
      error: 'server_error'
    });
  }
});

/**
 * ✅ بررسی فعال بودن توکن
 * @header {string} Authorization - توکن
 */
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'توکن معتبر است',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

/**
 * 🔐 تغییر رمز عبور (وقتی لاگین هست)
 * @header {string} Authorization - توکن
 * @body {string} oldPassword - رمز فعلی
 * @body {string} newPassword - رمز جدید
 */
router.post('/change-password', 
  authMiddleware, 
  validateRequest(['oldPassword', 'newPassword']),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      // اعتبارسنجی رمز جدید
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد',
          error: 'weak_password'
        });
      }

      // تغییر رمز
      const result = await User.changePassword(userId, oldPassword, newPassword);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          error: 'password_change_failed'
        });
      }

      // خروج از تمام دستگاه‌ها (اختیاری)
      // await User.invalidateAllSessions(userId);

      res.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد'
      });

    } catch (error) {
      console.error('❌ Error in change-password:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تغییر رمز عبور',
        error: 'server_error'
      });
    }
  }
);

/**
 * ✏️ بروزرسانی پروفایل
 * @header {string} Authorization - توکن
 * @body {Object} userData - اطلاعات جدید
 */
router.put('/profile', 
  authMiddleware, 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userData = req.body;

      // جلوگیری از تغییر فیلدهای حساس
      delete userData.password;
      delete userData.role;
      delete userData.id;
      delete userData.isActive;

      const result = await User.update(userId, userData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          error: 'update_failed'
        });
      }

      // دریافت اطلاعات بروز شده
      const updatedUser = User.findById(userId);

      res.json({
        success: true,
        message: 'پروفایل با موفقیت بروزرسانی شد',
        user: User.getPublicFields(updatedUser)
      });

    } catch (error) {
      console.error('❌ Error in profile update:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی پروفایل',
        error: 'server_error'
      });
    }
  }
);

/**
 * 📧 تأیید ایمیل با لینک
 * @query {string} token - توکن تأیید
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'توکن تأیید الزامی است',
        error: 'missing_token'
      });
    }

    // اعتبارسنجی توکن
    let decoded;
    try {
      decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'توکن نامعتبر یا منقضی',
        error: 'invalid_token'
      });
    }

    if (decoded.purpose !== 'email_verification') {
      return res.status(400).json({
        success: false,
        message: 'نوع توکن نامعتبر',
        error: 'invalid_purpose'
      });
    }

    // بروزرسانی وضعیت ایمیل
    db.prepare(`
      UPDATE users SET emailVerified = 1, updatedAt = datetime('now') 
      WHERE id = ?
    `).run(decoded.userId);

    res.json({
      success: true,
      message: 'ایمیل با موفقیت تأیید شد'
    });

  } catch (error) {
    console.error('❌ Error in verify-email:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تأیید ایمیل',
      error: 'server_error'
    });
  }
});

/**
 * 📧 ارسال مجدد لینک تأیید ایمیل
 * @header {string} Authorization - توکن
 */
router.post('/resend-verification', 
  authMiddleware, 
  async (req, res) => {
    try {
      const user = User.findById(req.user.id);

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'ایمیل قبلاً تأیید شده',
          error: 'already_verified'
        });
      }

      // تولید توکن تأیید
      const verificationToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          purpose: 'email_verification'
        },
        CONFIG.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // ارسال ایمیل (شبیه‌سازی)
      console.log(`\n📧 لینک تأیید ایمیل برای ${user.email}: ${verificationToken}\n`);

      res.json({
        success: true,
        message: 'لینک تأیید ارسال شد'
      });

    } catch (error) {
      console.error('❌ Error in resend-verification:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ارسال لینک تأیید',
        error: 'server_error'
      });
    }
  }
);

// ============================================
// 📤 خروجی ماژول
// ============================================
module.exports = router;