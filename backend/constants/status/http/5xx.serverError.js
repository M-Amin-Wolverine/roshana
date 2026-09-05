// ============================================
// 📁 5xx.serverError.js
// 💥 Server Error HTTP Status Codes
// ============================================

const SERVER_ERROR_STATUS = {
  INTERNAL_SERVER_ERROR: {
    code: 500,
    name: 'INTERNAL_SERVER_ERROR',
    success: false,
    message: {
      fa: 'خطای داخلی سرور',
      en: 'Internal Server Error',
      ar: 'خطأ داخلي في الخادم'
    }
  },

  NOT_IMPLEMENTED: {
    code: 501,
    name: 'NOT_IMPLEMENTED',
    success: false,
    message: {
      fa: 'پیاده‌سازی نشده',
      en: 'Not Implemented',
      ar: 'غير منفذ'
    }
  },

  BAD_GATEWAY: {
    code: 502,
    name: 'BAD_GATEWAY',
    success: false,
    message: {
      fa: 'دروازه نامعتبر',
      en: 'Bad Gateway',
      ar: 'بوابة سيئة'
    }
  },

  SERVICE_UNAVAILABLE: {
    code: 503,
    name: 'SERVICE_UNAVAILABLE',
    success: false,
    message: {
      fa: 'سرویس در دسترس نیست',
      en: 'Service Unavailable',
      ar: 'الخدمة غير متاحة'
    }
  },

  GATEWAY_TIMEOUT: {
    code: 504,
    name: 'GATEWAY_TIMEOUT',
    success: false,
    message: {
      fa: 'اتمام زمان دروازه',
      en: 'Gateway Timeout',
      ar: 'انتهت مهلة البوابة'
    }
  }
};

module.exports = SERVER_ERROR_STATUS;
