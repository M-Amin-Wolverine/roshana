// ============================================
// 📁 auth.status.js
// 🔐 Authentication Custom Status
// ============================================

const AUTH_STATUS = {
  TOKEN_EXPIRED: {
    code: 401,
    name: 'TOKEN_EXPIRED',
    success: false,
    message: {
      fa: 'توکن منقضی شده است',
      en: 'Token expired',
      ar: 'انتهت صلاحية الرمز'
    }
  },

  TOKEN_INVALID: {
    code: 401,
    name: 'TOKEN_INVALID',
    success: false,
    message: {
      fa: 'توکن نامعتبر است',
      en: 'Invalid token',
      ar: 'رمز غير صالح'
    }
  },

  LOGIN_REQUIRED: {
    code: 401,
    name: 'LOGIN_REQUIRED',
    success: false,
    message: {
      fa: 'نیاز به ورود دارید',
      en: 'Login required',
      ar: 'تسجيل الدخول مطلوب'
    }
  },

  ACCESS_DENIED: {
    code: 403,
    name: 'ACCESS_DENIED',
    success: false,
    message: {
      fa: 'دسترسی رد شد',
      en: 'Access denied',
      ar: 'تم رفض الوصول'
    }
  }
};

module.exports = AUTH_STATUS;

