// ============================================
// 📁 3xx.redirection.js
// 🔀 Redirection HTTP Status Codes
// ============================================

const REDIRECTION_STATUS = {
  MOVED_PERMANENTLY: {
    code: 301,
    name: 'MOVED_PERMANENTLY',
    redirect: true,
    message: {
      fa: 'انتقال دائمی',
      en: 'Moved Permanently',
      ar: 'تم النقل بشكل دائم'
    }
  },

  FOUND: {
    code: 302,
    name: 'FOUND',
    redirect: true,
    message: {
      fa: 'یافت شد',
      en: 'Found',
      ar: 'تم العثور'
    }
  },

  NOT_MODIFIED: {
    code: 304,
    name: 'NOT_MODIFIED',
    redirect: true,
    message: {
      fa: 'تغییری نکرده',
      en: 'Not Modified',
      ar: 'لم يتم التعديل'
    }
  },

  TEMPORARY_REDIRECT: {
    code: 307,
    name: 'TEMPORARY_REDIRECT',
    redirect: true,
    message: {
      fa: 'ریدایرکت موقت',
      en: 'Temporary Redirect',
      ar: 'إعادة توجيه مؤقتة'
    }
  },

  PERMANENT_REDIRECT: {
    code: 308,
    name: 'PERMANENT_REDIRECT',
    redirect: true,
    message: {
      fa: 'ریدایرکت دائمی',
      en: 'Permanent Redirect',
      ar: 'إعادة توجيه دائمة'
    }
  }
};

module.exports = REDIRECTION_STATUS;