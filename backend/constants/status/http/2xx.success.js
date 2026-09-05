// ============================================
// 📁 2xx.success.js
// ✅ Successful HTTP Status Codes
// ============================================

const SUCCESS_STATUS = {
  OK: {
    code: 200,
    name: 'OK',
    success: true,
    message: {
      fa: 'عملیات موفق',
      en: 'OK',
      ar: 'نجاح'
    }
  },

  CREATED: {
    code: 201,
    name: 'CREATED',
    success: true,
    message: {
      fa: 'با موفقیت ایجاد شد',
      en: 'Created',
      ar: 'تم الإنشاء'
    }
  },

  ACCEPTED: {
    code: 202,
    name: 'ACCEPTED',
    success: true,
    message: {
      fa: 'درخواست پذیرفته شد',
      en: 'Accepted',
      ar: 'تم القبول'
    }
  },

  NO_CONTENT: {
    code: 204,
    name: 'NO_CONTENT',
    success: true,
    message: {
      fa: 'بدون محتوا',
      en: 'No Content',
      ar: 'لا يوجد محتوى'
    }
  },

  PARTIAL_CONTENT: {
    code: 206,
    name: 'PARTIAL_CONTENT',
    success: true,
    message: {
      fa: 'محتوای جزئی',
      en: 'Partial Content',
      ar: 'محتوى جزئي'
    }
  }
};

module.exports = SUCCESS_STATUS;
