// ============================================
// 📁 validation.status.js
// 🧪 Validation Custom Status
// ============================================

const VALIDATION_STATUS = {
  VALIDATION_ERROR: {
    code: 422,
    name: 'VALIDATION_ERROR',
    success: false,
    message: {
      fa: 'خطا در اعتبارسنجی داده‌ها',
      en: 'Validation error',
      ar: 'خطأ في التحقق'
    }
  },

  INVALID_INPUT: {
    code: 422,
    name: 'INVALID_INPUT',
    success: false,
    message: {
      fa: 'ورودی نامعتبر است',
      en: 'Invalid input',
      ar: 'إدخال غير صالح'
    }
  },

  REQUIRED_FIELDS_MISSING: {
    code: 400,
    name: 'REQUIRED_FIELDS_MISSING',
    success: false,
    message: {
      fa: 'فیلدهای الزامی ارسال نشده‌اند',
      en: 'Required fields missing',
      ar: 'الحقول المطلوبة مفقودة'
    }
  }
};

module.exports = VALIDATION_STATUS;
