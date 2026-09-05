// ============================================
// 📁 service.status.js
// ⚙️ Service Custom Status
// ============================================

const SERVICE_STATUS = {
  SERVICE_ERROR: {
    code: 500,
    name: 'SERVICE_ERROR',
    success: false,
    message: {
      fa: 'خطا در سرویس',
      en: 'Service error',
      ar: 'خطأ في الخدمة'
    }
  },

  DATABASE_ERROR: {
    code: 500,
    name: 'DATABASE_ERROR',
    success: false,
    message: {
      fa: 'خطا در پایگاه داده',
      en: 'Database error',
      ar: 'خطأ قاعدة البيانات'
    }
  },

  EXTERNAL_API_FAILED: {
    code: 502,
    name: 'EXTERNAL_API_FAILED',
    success: false,
    message: {
      fa: 'خطا در سرویس خارجی',
      en: 'External API failed',
      ar: 'فشل واجهة برمجة خارجية'
    }
  },

  SERVICE_UNAVAILABLE_TEMPORARY: {
    code: 503,
    name: 'SERVICE_UNAVAILABLE_TEMPORARY',
    success: false,
    message: {
      fa: 'سرویس موقتاً در دسترس نیست',
      en: 'Service temporarily unavailable',
      ar: 'الخدمة غير متاحة مؤقتاً'
    }
  }
};

module.exports = SERVICE_STATUS;
