// ============================================
// 📁 4xx.clientError.js
// ❌ Client Error HTTP Status Codes
// ============================================

const CLIENT_ERROR_STATUS = {
  BAD_REQUEST: {
    code: 400,
    name: 'BAD_REQUEST',
    success: false,
    message: {
      fa: 'درخواست نامعتبر',
      en: 'Bad Request',
      ar: 'طلب سيء'
    }
  },

  UNAUTHORIZED: {
    code: 401,
    name: 'UNAUTHORIZED',
    success: false,
    message: {
      fa: 'احراز هویت لازم است',
      en: 'Unauthorized',
      ar: 'غير مصرح'
    }
  },

  FORBIDDEN: {
    code: 403,
    name: 'FORBIDDEN',
    success: false,
    message: {
      fa: 'دسترسی ممنوع',
      en: 'Forbidden',
      ar: 'ممنوع'
    }
  },

  NOT_FOUND: {
    code: 404,
    name: 'NOT_FOUND',
    success: false,
    message: {
      fa: 'یافت نشد',
      en: 'Not Found',
      ar: 'غير موجود'
    }
  },

  METHOD_NOT_ALLOWED: {
    code: 405,
    name: 'METHOD_NOT_ALLOWED',
    success: false,
    message: {
      fa: 'متد مجاز نیست',
      en: 'Method Not Allowed',
      ar: 'الطريقة غير مسموح بها'
    }
  },

  CONFLICT: {
    code: 409,
    name: 'CONFLICT',
    success: false,
    message: {
      fa: 'تداخل داده',
      en: 'Conflict',
      ar: 'تعارض'
    }
  },

  TOO_MANY_REQUESTS: {
    code: 429,
    name: 'TOO_MANY_REQUESTS',
    success: false,
    message: {
      fa: 'درخواست بیش از حد',
      en: 'Too Many Requests',
      ar: 'طلبات كثيرة جداً'
    }
  }
};

module.exports = CLIENT_ERROR_STATUS;