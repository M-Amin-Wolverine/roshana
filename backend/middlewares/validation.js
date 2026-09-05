// middleware/validation.js
const Joi = require('joi');
const { logger } = require('./logger');

// ============================================
// ⚙️ تنظیمات و انواع
// ============================================

const VALIDATION_SOURCES = ['body', 'query', 'params', 'headers', 'cookies'];

const VALIDATION_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  UUID: 'uuid',
  ALPHANUMERIC: 'alphanumeric',
  NUMERIC: 'numeric'
};

// ============================================
// 🔧 Validator‌های سفارشی
// ============================================

const customValidators = {
  // شماره موبایل ایران
  mobile: (value) => {
    const mobileRegex = /^(\+98|0)?9[0-9]{9}$/;
    return mobileRegex.test(value);
  },

  // کد ملی ایران
  nationalCode: (value) => {
    if (!/^\d{10}$/.test(value)) return false;
    const digits = value.split('');
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }
    const remainder = sum % 11;
    const checkDigit = parseInt(digits[9]);
    return remainder < 2 ? checkDigit === remainder : checkDigit === 11 - remainder;
  },

  // شماره کارت بانکی
  cardNumber: (value) => {
    const cardRegex = /^\d{16}$/;
    if (!cardRegex.test(value)) return false;
    // الگوریتم Luhn
    let sum = 0;
    const digits = value.split('').reverse();
    for (let i = 0; i < digits.length; i++) {
      let digit = parseInt(digits[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  },

  // رمز عبور قوی
  strongPassword: (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  },

  // نام کاربری
  username: (value) => {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(value);
  },

  // آیپی معتبر
  ip: (value) => {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4.test(value) || ipv6.test(value);
  },

  // آدرس ولت (ETH)
  ethereumAddress: (value) => {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  },

  // آدرس کیف پول (BTC)
  bitcoinAddress: (value) => {
    return /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(value);
  }
};

// ============================================
// 🧹 Sanitizer‌ها
// ============================================

const sanitizers = {
  // حذف تگ‌های HTML
  stripHtml: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '').trim();
  },

  // حذف فضای خالی اضافی
  trim: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
  },

  // تبدیل به حروف کوچک
  toLowerCase: (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  },

  // تبدیل به حروف بزرگ
  toUpperCase: (value) => {
    if (typeof value !== 'string') return value;
    return value.toUpperCase().trim();
  },

  // حذف کاراکترهای خاص (except Persian/Arabic)
  sanitizeText: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[^\u0600-\u06FF\u0750-\u077F\w\s]/g, '').trim();
  },

  // تبدیل به عدد صحیح
  toInteger: (value) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? value : parsed;
  },

  // تبدیل به عدد اعشاری
  toFloat: (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? value : parsed;
  },

  // تبدیل به boolean
  toBoolean: (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    return Boolean(value);
  },

  // حذف XSS
  xss: (value) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

// ============================================
// 🎯 اعتبارسنجی اصلی
// ============================================

/**
 * اعتبارسنجی یک فیلد
 * @param {any} value - مقدار فیلد
 * @param {Object} rules - قوانین اعتبارسنجی
 * @returns {Object} { valid: boolean, error: string, value: any }
 */
const validateField = (value, rules) => {
  // 🔄 Sanitization اولیه
  if (rules.sanitize && value) {
    if (Array.isArray(rules.sanitize)) {
      rules.sanitize.forEach(sanitizer => {
        if (sanitizers[sanitizer]) {
          value = sanitizers[sanitizer](value);
        }
      });
    } else if (sanitizers[rules.sanitize]) {
      value = sanitizers[rules.sanitize](value);
    }
  }

  // ❌ بررسی required
  if (rules.required) {
    if (value === undefined || value === null || value === '') {
      return { 
        valid: false, 
        error: rules.messages?.required || 'این فیلد الزامی است',
        value 
      };
    }
  } else if (value === undefined || value === null || value === '') {
    // اگر required نیست و خالی است، رد می‌شود (معتبر است)
    return { valid: true, value: rules.default || null };
  }

  // 💾 اعمال مقدار پیش‌فرض
  if (rules.default !== undefined && (value === '' || value === undefined)) {
    value = rules.default;
  }

  // 🔍 بررسی نوع
  if (rules.type) {
    const typeChecks = {
      string: () => typeof value === 'string',
      number: () => typeof value === 'number' && !isNaN(value),
      boolean: () => typeof value === 'boolean',
      array: () => Array.isArray(value),
      object: () => typeof value === 'object' && !Array.isArray(value),
      email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      url: () => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      uuid: () => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
      alphanumeric: () => /^[a-zA-Z0-9]+$/.test(value),
      numeric: () => /^\d+$/.test(value),
      date: () => !isNaN(Date.parse(value))
    };

    if (typeChecks[rules.type] && !typeChecks[rules.type]()) {
      return { 
        valid: false, 
        error: rules.messages?.type || `نوع داده باید ${rules.type} باشد`,
        value 
      };
    }
  }

  // 📏 بررسی طول
  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return { 
      valid: false, 
      error: rules.messages?.minLength || `حداقل طول: ${rules.minLength} کاراکتر`,
      value 
    };
  }

  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return { 
      valid: false, 
      error: rules.messages?.maxLength || `حداکثر طول: ${rules.maxLength} کاراکتر`,
      value 
    };
  }

  if (rules.min !== undefined && value < rules.min) {
    return { 
      valid: false, 
      error: rules.messages?.min || `حداقل مقدار: ${rules.min}`,
      value 
    };
  }

  if (rules.max !== undefined && value > rules.max) {
    return { 
      valid: false, 
      error: rules.messages?.max || `حداکثر مقدار: ${rules.max}`,
      value 
    };
  }

  // 🔤 بررسی الگو (Regex)
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(value)) {
      return { 
        valid: false, 
        error: rules.messages?.pattern || 'فرمت نامعتبر',
        value 
      };
    }
  }

  // ✅ بررسی enum
  if (rules.enum) {
    const allowedValues = Array.isArray(rules.enum) ? rules.enum : [rules.enum];
    if (!allowedValues.includes(value)) {
      return { 
        valid: false, 
        error: rules.messages?.enum || `مقدار باید یکی از موارد زیر باشد: ${allowedValues.join(', ')}`,
        value 
      };
    }
  }

  // 🎭 اعتبارسنجی سفارشی
  if (rules.custom) {
    try {
      const isValid = rules.custom(value);
      if (!isValid) {
        return { 
          valid: false, 
          error: rules.messages?.custom || 'اعتبارسنجی ناموفق',
          value 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: rules.messages?.custom || 'خطا در اعتبارسنجی',
        value 
      };
    }
  }

  // 🔗 اعتبارسنجی آرایه
  if (rules.arrayType && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const itemValidation = validateField(value[i], {
        ...rules.arrayType,
        required: true
      });
      if (!itemValidation.valid) {
        return { 
          valid: false, 
          error: `آیتم ${i}: ${itemValidation.error}`,
          value 
        };
      }
    }
  }

  // 📦 اعتبارسنجی شیء تودرتو
  if (rules.properties && typeof value === 'object') {
    for (const [key, fieldRules] of Object.entries(rules.properties)) {
      const nestedValidation = validateField(value[key], fieldRules);
      if (!nestedValidation.valid) {
        return { 
          valid: false, 
          error: `${key}: ${nestedValidation.error}`,
          value 
        };
      }
      value[key] = nestedValidation.value;
    }
  }

  return { valid: true, value };
};

// ============================================
// 🎯 Middleware اصلی اعتبارسنجی
// ============================================

/**
 * اعتبارسنجی درخواست
 * @param {Object} schema - شمای اعتبارسنجی
 * @param {string} source - منبع داده (body, query, params)
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const data = req[source];
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'داده‌ای برای اعتبارسنجی یافت نشد',
        error: 'no_data',
        requestId
      });
    }

    const errors = [];
    const validatedData = {};

    // اعتبارسنجی هر فیلد
    for (const [field, rules] of Object.entries(schema)) {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], data)
        : data[field];

      const result = validateField(value, rules);
      
      if (!result.valid) {
        errors.push({
          field,
          message: result.error,
          value: rules.type === 'string' ? (value || '').substring(0, 50) : value
        });
      } else {
        // تنظیم مقدار اعتبارسنجی شده
        if (field.includes('.')) {
          const parts = field.split('.');
          let target = validatedData;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) target[parts[i]] = {};
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = result.value;
        } else {
          validatedData[field] = result.value;
        }
      }
    }

    // اگر خطا وجود دارد
    if (errors.length > 0) {
      logger.warn({
        message: '❌ خطای اعتبارسنجی',
        requestId,
        source,
        errors: errors.map(e => e.message),
        path: req.path,
        method: req.method
      });

      return res.status(400).json({
        success: false,
        message: 'خطا در اعتبارسنجی داده‌ها',
        error: 'validation_error',
        errors,
        requestId
      });
    }

    // جایگزینی داده‌های اعتبارسنجی شده
    req[source] = { ...data, ...validatedData };
    
    next();
  };
};

// ============================================
// 🎯 اعتبارسنجی با Joi
// ============================================

/**
 * اعتبارسنجی با Joi
 * @param {Joi.Schema} schema - شمای Joi
 * @param {string} source - منبع داده
 * @returns {Function} Express middleware
 */
const validateWithJoi = (schema, source = 'body') => {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: ''
        }
      }
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        type: detail.type
      }));

      logger.warn({
        message: '❌ خطای اعتبارسنجی Joi',
        requestId,
        source,
        errors: errors.map(e => e.message),
        path: req.path
      });

      return res.status(400).json({
        success: false,
        message: 'خطا در اعتبارسنجی داده‌ها',
        error: 'validation_error',
        errors,
        requestId
      });
    }

    req[source] = value;
    next();
  };
};

// ============================================
// 📝 Schema‌های آماده
// ============================================

const schemas = {
  // ثبت‌نام
  register: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/,
      sanitize: ['trim', 'toLowerCase'],
      messages: {
        required: 'نام کاربری الزامی است',
        minLength: 'نام کاربری باید حداقل ۳ کاراکتر باشد',
        maxLength: 'نام کاربری نباید بیش از ۲۰ کاراکتر باشد',
        pattern: 'نام کاربری فقط می‌تواند شامل حروف، اعداد، - و _ باشد'
      }
    },
    email: {
      required: true,
      type: 'email',
      sanitize: ['trim', 'toLowerCase'],
      messages: {
        required: 'ایمیل الزامی است',
        type: 'ایمیل نامعتبر است'
      }
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      custom: customValidators.strongPassword,
      messages: {
        required: 'رمز عبور الزامی است',
        minLength: 'رمز عبور باید حداقل ۸ کاراکتر باشد',
        custom: 'رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص باشد'
      }
    },
    mobile: {
      required: true,
      type: 'string',
      custom: customValidators.mobile,
      messages: {
        required: 'شماره موبایل الزامی است',
        custom: 'شماره موبایل نامعتبر است'
      }
    }
  },

  // ورود
  login: {
    email: {
      required: true,
      type: 'email',
      sanitize: ['trim', 'toLowerCase'],
      messages: {
        required: 'ایمیل الزامی است',
        type: 'ایمیل نامعتبر است'
      }
    },
    password: {
      required: true,
      type: 'string',
      messages: {
        required: 'رمز عبور الزامی است'
      }
    }
  },

  // آپدیت پروفایل
  updateProfile: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/,
      sanitize: ['trim', 'toLowerCase']
    },
    bio: {
      type: 'string',
      maxLength: 500,
      sanitize: ['stripHtml', 'trim']
    },
    mobile: {
      type: 'string',
      custom: customValidators.mobile
    }
  },

  // آپلود فایل
  upload: {
    file: {
      required: true,
      type: 'object',
      messages: {
        required: 'فایل الزامی است'
      }
    },
    folder: {
      type: 'string',
      enum: ['images', 'documents', 'videos', 'audio'],
      messages: {
        enum: 'پوشه نامعتبر است'
      }
    }
  },

  // ارسال پیام
  sendMessage: {
    recipientId: {
      required: true,
      type: 'string',
      pattern: /^[0-9a-fA-F]{24}$/,
      messages: {
        required: 'گیرنده الزامی است',
        pattern: 'شناسه گیرنده نامعتبر است'
      }
    },
    content: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 5000,
      sanitize: ['xss', 'trim'],
      messages: {
        required: 'متن پیام الزامی است',
        maxLength: 'متن پیام نباید بیش از ۵۰۰۰ کاراکتر باشد'
      }
    }
  },

  // پارامترهای URL
  pagination: {
    page: {
      type: 'number',
      min: 1,
      default: 1,
      sanitize: ['toInteger']
    },
    limit: {
      type: 'number',
      min: 1,
      max: 100,
      default: 20,
      sanitize: ['toInteger']
    },
    sort: {
      type: 'string',
      default: '-createdAt'
    },
    search: {
      type: 'string',
      sanitize: ['trim', 'stripHtml']
    }
  }
};

// ═══════════════════════════════════════════════════════════════
//                    🎯 تابع سازگاری validateRequest (نسخه 2.0)
// ═══════════════════════════════════════════════════════════════

/**
 * اعتبارسنجی ساده و پیشرفته درخواست
 * 
 * @param {Object} options - تنظیمات اعتبارسنجی
 * @param {string|string[]} options.fields - فیلدهای الزامی یا شیء تنظیمات
 * @param {string} options.source - منبع داده (body, query, params, headers)
 * @param {boolean} options.required - آیا همه فیلدها الزامی هستند
 * @param {Object} options.messages - پیام‌های خطای سفارشی
 * @param {Function} options.customValidation - تابع اعتبارسنجی سفارشی
 * @param {Object} options.schema - شمای Joi (اختیاری)
 * @returns {Function} Express middleware
 * 
 * @example
 * // روش 1: فقط فیلدهای الزامی
 * validateRequest(['phone', 'password'])
 * 
 * @example
 * // روش 2: با تنظیمات کامل
 * validateRequest({
 *   fields: ['phone', 'password'],
 *   source: 'body',
 *   required: true,
 *   messages: {
 *     phone: 'شماره موبایل الزامی است',
 *     password: 'رمز عبور الزامی است'
 *   }
 * })
 * 
 * @example
 * // روش 3: با قوانین اعتبارسنجی
 * validateRequest({
 *   fields: {
 *     phone: { required: true, type: 'string', minLength: 10 },
 *     password: { required: true, minLength: 6 },
 *     email: { required: false, type: 'email' }
 *   },
 *   source: 'body'
 * })
 */
const validateRequest = (options = {}) => {
  // ═══════════════════════════════════════════════════════════════
  //                    🔧 پردازش ورودی
  // ═══════════════════════════════════════════════════════════════
  
  let fields, source = 'body', required = true, messages = {}, customValidation, schema;

  // حالت 1: آرایه فیلدها (ساده)
  if (Array.isArray(options)) {
    fields = options;
    source = 'body';
    required = true;
  }
  // حالت 2: شیء تنظیمات کامل
  else if (typeof options === 'object' && options !== null) {
    fields = options.fields || [];
    source = options.source || 'body';
    required = options.required !== undefined ? options.required : true;
    messages = options.messages || {};
    customValidation = options.customValidation;
    schema = options.schema;
  }
  // حالت 3: فقط یک فیلد (رشته)
  else if (typeof options === 'string') {
    fields = [options];
    source = 'body';
    required = true;
  }
  // حالت نامعتبر
  else {
    fields = [];
    source = 'body';
    required = true;
  }

  // ═══════════════════════════════════════════════════════════════
  //                    🏗️ ساخت Schema
  // ═══════════════════════════════════════════════════════════════
  
  let validationSchema;
  
  // اگر Joi schema داده شده
  if (schema) {
    validationSchema = schema;
  }
  // ساخت schema از فیلدها
  else {
    validationSchema = {};
    
    // تبدیل آرایه به شیء
    if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (typeof field === 'string') {
          // فیلد ساده
          validationSchema[field] = { 
            required: required,
            messages: { 
              required: messages[field] || `فیلد ${field} الزامی است` 
            }
          };
        } else if (typeof field === 'object') {
          // فیلد با تنظیمات
          const fieldName = Object.keys(field)[0];
          validationSchema[fieldName] = {
            ...field[fieldName],
            messages: {
              ...field[fieldName].messages,
              required: messages[fieldName] || `فیلد ${fieldName} الزامی است`
            }
          };
        }
      });
    }
    // اگر خودش شیء است
    else if (typeof fields === 'object') {
      validationSchema = fields;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                    🎯 Middleware اصلی
  // ═══════════════════════════════════════════════════════════════
  
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const data = req[source];
    
    // ═══════════════════════════════════════════════════════════════
    //                    ⚠️ بررسی وجود داده
    // ═══════════════════════════════════════════════════════════════
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'داده‌ای برای اعتبارسنجی یافت نشد',
        error: 'no_data',
        requestId
      });
    }

    // ═══════════════════════════════════════════════════════════════
    //                    ✅ اعتبارسنجی با Joi یا سیستم داخلی
    // ═══════════════════════════════════════════════════════════════
    
    let errors = [];
    const validatedData = { ...data };

    // اگر Joi schema داریم
    if (schema) {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          type: detail.type
        }));
      } else {
        req[source] = value;
        validatedData = value;
      }
    }
    // اعتبارسنجی داخلی
    else {
      // اعتبارسنجی هر فیلد
      for (const [field, rules] of Object.entries(validationSchema)) {
        const value = field.includes('.') 
          ? field.split('.').reduce((obj, key) => obj?.[key], data)
          : data[field];
        
        const result = validateField(value, rules);
        
        if (!result.valid) {
          errors.push({
            field,
            message: result.error,
            value: typeof value === 'string' ? (value || '').substring(0, 50) : value
          });
        } else {
          // تنظیم مقدار اعتبارسنجی شده
          if (field.includes('.')) {
            const parts = field.split('.');
            let target = validatedData;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!target[parts[i]]) target[parts[i]] = {};
              target = target[parts[i]];
            }
            target[parts[parts.length - 1]] = result.value;
          } else {
            validatedData[field] = result.value;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //                    🔐 اعتبارسنجی سفارشی
    // ═══════════════════════════════════════════════════════════════
    
    if (!errors.length && customValidation) {
      try {
        const customResult = customValidation(validatedData, req);
        if (customResult && !customResult.valid) {
          errors.push({
            field: customResult.field || 'custom',
            message: customResult.message || 'اعتبارسنجی سفارشی ناموفق بود'
          });
        }
      } catch (error) {
        errors.push({
          field: 'custom',
          message: error.message || 'خطا در اعتبارسنجی سفارشی'
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //                    📤 پاسخ
    // ═══════════════════════════════════════════════════════════════
    
    if (errors.length > 0) {
      // لاگ خطا
      if (logger) {
        logger.warn({
          message: '❌ خطای اعتبارسنجی درخواست',
          requestId,
          source,
          path: req.path,
          method: req.method,
          errors: errors.map(e => e.message)
        });
      }

      return res.status(400).json({
        success: false,
        message: 'خطا در اعتبارسنجی داده‌ها',
        error: 'validation_error',
        errors,
        requestId
      });
    }

    // جایگزینی داده‌های اعتبارسنجی شده
    req[source] = validatedData;
    
    next();
  };
};

// ═══════════════════════════════════════════════════════════════
//                    🎯 توابع کمکی برای اعتبارسنجی سریع
// ═══════════════════════════════════════════════════════════════

/**
 * اعتبارسنجی فیلدهای الزامی
 */
validateRequest.required = (fields, source = 'body') => {
  return validateRequest({ fields, source, required: true });
};

/**
 * اعتبارسنجی فیلدهای اختیاری
 */
validateRequest.optional = (fields, source = 'body') => {
  return validateRequest({ fields, source, required: false });
};

/**
 * اعتبارسنجی با Joi Schema
 */
validateRequest.withJoi = (schema, source = 'body') => {
  return validateRequest({ schema, source });
};

/**
 * اعتبارسنجی سفارشی
 */
validateRequest.custom = (fields, customValidation, source = 'body') => {
  return validateRequest({ fields, source, customValidation });
};

// ═══════════════════════════════════════════════════════════════
//                    📤 خروجی ماژول (به‌روز شده)
// ═══════════════════════════════════════════════════════════════

module.exports = {
  validate,
  validateWithJoi,
  validateField,
  validateRequest,
  customValidators,
  sanitizers,
  schemas,
  VALIDATION_TYPES,
  VALIDATION_SOURCES
};