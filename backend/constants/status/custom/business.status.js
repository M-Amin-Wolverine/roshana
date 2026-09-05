// ============================================
// 📁 business.status.js
// 💼 Business Logic Custom Status
// ============================================

const BUSINESS_STATUS = {
  USER_ALREADY_EXISTS: {
    code: 409,
    name: 'USER_ALREADY_EXISTS',
    success: false,
    message: {
      fa: 'کاربر قبلاً وجود دارد',
      en: 'User already exists',
      ar: 'المستخدم موجود بالفعل'
    }
  },

  PRODUCT_OUT_OF_STOCK: {
    code: 409,
    name: 'PRODUCT_OUT_OF_STOCK',
    success: false,
    message: {
      fa: 'محصول موجود نیست',
      en: 'Product out of stock',
      ar: 'المنتج غير متوفر'
    }
  },

  PAYMENT_FAILED: {
    code: 402,
    name: 'PAYMENT_FAILED',
    success: false,
    message: {
      fa: 'پرداخت ناموفق بود',
      en: 'Payment failed',
      ar: 'فشل الدفع'
    }
  },

  OPERATION_COMPLETED: {
    code: 200,
    name: 'OPERATION_COMPLETED',
    success: true,
    message: {
      fa: 'عملیات با موفقیت انجام شد',
      en: 'Operation completed successfully',
      ar: 'تمت العملية بنجاح'
    }
  }
};

module.exports = BUSINESS_STATUS;