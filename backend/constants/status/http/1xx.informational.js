// ============================================
// 📁 1xx.informational.js
// 🌐 Informational HTTP Status Codes
// ============================================

const INFORMATIONAL_STATUS = {
  CONTINUE: {
    code: 100,
    name: 'CONTINUE',
    message: {
      fa: 'ادامه درخواست',
      en: 'Continue',
      ar: 'متابعة'
    }
  },

  SWITCHING_PROTOCOLS: {
    code: 101,
    name: 'SWITCHING_PROTOCOLS',
    message: {
      fa: 'تغییر پروتکل',
      en: 'Switching Protocols',
      ar: 'تبديل البروتوكولات'
    }
  },

  PROCESSING: {
    code: 102,
    name: 'PROCESSING',
    message: {
      fa: 'در حال پردازش',
      en: 'Processing',
      ar: 'قيد المعالجة'
    }
  },

  EARLY_HINTS: {
    code: 103,
    name: 'EARLY_HINTS',
    message: {
      fa: 'نکات اولیه',
      en: 'Early Hints',
      ar: 'تلميحات مبكرة'
    }
  }
};

module.exports = INFORMATIONAL_STATUS;

