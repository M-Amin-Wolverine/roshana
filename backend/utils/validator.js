// ═════════════════════════════════════════════════════════════
// 🎭 اعتبارسنجی پیشرفته - نسخه نهایی
// ═════════════════════════════════════════════════════════════

const validator = require('validator');
const Joi = require('joi');

// ═════════════════════════════════════════════════════════════
// 📦 الگوهای رایج (Regex Patterns)
// ═════════════════════════════════════════════════════════════

const PATTERNS = {
  // شماره موبایل ایران
  IRANIAN_MOBILE: /^(\+98|0)?9[0-9]{9}$/,
  
  // شماره تلفن ثابت ایران
  IRANIAN_PHONE: /^(\+98|0)?[0-9]{10,11}$/,
  
  // کد ملی ایران
  NATIONAL_CODE: /^[0-9]{10}$/,
  
  // نام کاربری (فقط حروف لاتین، اعداد و زیرخط)
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
  
  // رمز عبور قوی
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/,
  
  // آیپی ایران
  IRANIAN_IP: /^((185\.143\.)|(5\.202\.)|(5\.234\.)|(89\.165\.)|(91\.243\.)|(92\.242\.)|(92\.243\.)|(94\.101\.)|(178\.22\.)|(46\.245\.)|(5\.144\.))([0-9]{1,3}\.){2}[0-9]{1,3}$/,
  
  // آدرس ولت ارز دیجیتال
  CRYPTO_WALLET: /^(0x)?[0-9a-fA-F]{40}$/,
  
  // شماره کارت بانکی
  BANK_CARD: /^[0-9]{16}$/,
  
  // شماره شبا
  IBAN: /^IR[0-9]{2}[0-9]{22}$/,
  
  // پلاک خودرو
  CAR_PLATE: /^[0-9]{2,3}-[آ-یالف-ی]{1}-[0-9]{3,4}$/,
  
  // کد پستی
  POSTAL_CODE: /^[0-9]{10}$/,
  
  // فقط حروف فارسی
  PERSIAN_TEXT: /^[\u0600-\u06FF\s]+$/,
  
  // متن بدون حروف خاص
  SAFE_TEXT: /^[a-zA-Z0-9\u0600-\u06FF\s\-_.,!?@]+$/
};

// ═════════════════════════════════════════════════════════════
// 🎯 اعتبارسنجی پایه (Basic Validation)
// ═════════════════════════════════════════════════════════════

const baseValidator = {
  /**
   * بررسی خالی نبودن مقدار
   */
  isRequired: (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * بررسی طول رشته
   */
  isLength: (value, min, max) => {
    if (typeof value !== 'string') return false;
    const len = value.trim().length;
    if (min !== undefined && len < min) return false;
    if (max !== undefined && len > max) return false;
    return true;
  },

  /**
   * بررسی نوع داده
   */
  isType: (value, type) => {
    return typeof value === type;
  },

  /**
   * بررسی عدد بودن
   */
  isNumber: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  /**
   * بررسی صحیح بودن عدد
   */
  isInt: (value) => {
    return Number.isInteger(Number(value));
  },

  /**
   * بررسی مثبت بودن عدد
   */
  isPositive: (value) => {
    return baseValidator.isNumber(value) && Number(value) > 0;
  },

  /**
   * بررسی بازه عددی
   */
  isInRange: (value, min, max) => {
    const num = Number(value);
    return baseValidator.isNumber(value) && num >= min && num <= max;
  }
};

// ═════════════════════════════════════════════════════════════
// 📱 اعتبارسنجی داده‌های ایرانی
// ═════════════════════════════════════════════════════════════

const iranianValidator = {
  /**
   * اعتبارسنجی شماره موبایل ایران
   */
  isMobile: (value) => {
    if (!value) return false;
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return PATTERNS.IRANIAN_MOBILE.test(cleaned);
  },

  /**
   * اعتبارسنجی شماره تلفن
   */
  isPhone: (value) => {
    if (!value) return false;
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return PATTERNS.IRANIAN_PHONE.test(cleaned);
  },

  /**
   * اعتبارسنجی کد ملی
   * الگوریتم استاندارد ایران
   */
  isNationalCode: (value) => {
    if (!value || !PATTERNS.NATIONAL_CODE.test(value)) return false;
    
    const code = value.toString();
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += Number(code[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return checkDigit === Number(code[9]);
  },

  /**
   * اعتبارسنجی کد پستی
   */
  isPostalCode: (value) => {
    if (!value) return false;
    return PATTERNS.POSTAL_CODE.test(value);
  },

  /**
   * اعتبارسنجی شماره کارت بانکی
   */
  isBankCard: (value) => {
    if (!value) return false;
    const cleaned = value.replace(/\s/g, '');
    
    if (!PATTERNS.BANK_CARD.test(cleaned)) return false;
    
    // الگوریتم Luhn
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = Number(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  /**
   * اعتبارسنجی شماره شبا
   */
  isIBAN: (value) => {
    if (!value) return false;
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return PATTERNS.IBAN.test(cleaned);
  },

  /**
   * اعتبارسنجی پلاک خودرو
   */
  isCarPlate: (value) => {
    if (!value) return false;
    return PATTERNS.CAR_PLATE.test(value);
  },

  /**
   * اعتبارسنجی نام فارسی
   */
  isPersianName: (value) => {
    if (!value) return false;
    return PATTERNS.PERSIAN_TEXT.test(value) && value.length >= 2;
  },

  /**
   * اعتبارسنجی متن فارسی امن
   */
  isSafePersianText: (value) => {
    if (!value) return false;
    return PATTERNS.SAFE_TEXT.test(value);
  }
};

// ═════════════════════════════════════════════════════════════
// 🌐 اعتبارسنجی داده‌های جهانی
// ═════════════════════════════════════════════════════════════

const globalValidator = {
  /**
   * اعتبارسنجی ایمیل
   */
  isEmail: (value) => {
    if (!value) return false;
    return validator.isEmail(value);
  },

  /**
   * اعتبارسنجی URL
   */
  isURL: (value, options = {}) => {
    if (!value) return false;
    return validator.isURL(value, {
      require_protocol: true,
      require_host: true,
      ...options
    });
  },

  /**
   * اعتبارسنجی آیپی
   */
  isIP: (value, version = '4') => {
    if (!value) return false;
    return version === '6' 
      ? validator.isIP(value, 6) 
      : validator.isIP(value, 4);
  },

  /**
   * اعتبارسنجی UUID
   */
  isUUID: (value, version = '4') => {
    if (!value) return false;
    return validator.isUUID(value, version);
  },

  /**
   * اعتبارسنجی تاریخ
   */
  isDate: (value) => {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * اعتبارسنجی JSON
   */
  isJSON: (value) => {
    if (!value) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * اعتبارسنجی آدرس ولت ارز دیجیتال
   */
  isCryptoWallet: (value) => {
    if (!value) return false;
    return PATTERNS.CRYPTO_WALLET.test(value);
  },

  /**
   * اعتبارسنجی نام کاربری
   */
  isUsername: (value) => {
    if (!value) return false;
    return PATTERNS.USERNAME.test(value);
  },

  /**
   * اعتبارسنجی رمز عبور قوی
   */
  isStrongPassword: (value) => {
    if (!value) return false;
    return PATTERNS.STRONG_PASSWORD.test(value);
  },

  /**
   * اعتبارسنجی هگزادسیمال
   */
  isHexadecimal: (value) => {
    if (!value) return false;
    return validator.isHexadecimal(value);
  },

  /**
   * اعتبارسنجی Base64
   */
  isBase64: (value) => {
    if (!value) return false;
    return validator.isBase64(value);
  },

  /**
   * اعتبارسنجی موبایل بین‌المللی
   */
  isMobileInternational: (value) => {
    if (!value) return false;
    return validator.isMobilePhone(value, 'any');
  }
};

// ═════════════════════════════════════════════════════════════
// 🔒 اعتبارسنجی امنیتی
// ═════════════════════════════════════════════════════════════

const securityValidator = {
  /**
   * بررسی SQL Injection
   */
  isSQLSafe: (value) => {
    if (!value) return true;
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\bOR\b\s+\d+\s*=\s*\d+)/i,
      /(\bAND\b\s+\d+\s*=\s*\d+)/i
    ];
    return !sqlPatterns.some(pattern => pattern.test(value));
  },

  /**
   * بررسی XSS
   */
  isXSSSafe: (value) => {
    if (!value) return true;
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\(/gi,
      /expression\(/gi
    ];
    return !xssPatterns.some(pattern => pattern.test(value));
  },

  /**
   * بررسی مسیر فایل امن
   */
  isSafePath: (value) => {
    if (!value) return true;
    const unsafePatterns = [
      /\.\.\//,  // Directory traversal
      /^\//,     // Absolute path
      /^[a-zA-Z]:/, // Windows absolute path
      /^\~/
    ];
    return !unsafePatterns.some(pattern => pattern.test(value));
  },

  /**
   * بررسی اسکیپ بودن HTML
   */
  isHTMLEscaped: (value) => {
    if (!value) return true;
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return !Object.keys(htmlEntities).some(char => value.includes(char));
  },

  /**
   * بررسی امنیت نام فایل
   */
  isSafeFilename: (value) => {
    if (!value) return false;
    const unsafeChars = /[<>:"/\\|?*\x00-\x1F]/;
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
    const name = value.split('.')[0].toUpperCase();
    
    return !unsafeChars.test(value) && !reservedNames.includes(name);
  }
};

// ═════════════════════════════════════════════════════════════
// 🏗️ اعتبارسنجی با Joi (Schema Validation)
// ═════════════════════════════════════════════════════════════

const schemaValidator = {
  /**
   * اسکیمای ثبت‌نام کاربر
   */
  registerSchema: Joi.object({
    username: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
      .required()
      .messages({
        'string.pattern.base': 'نام کاربری باید با حرف شروع شود',
        'string.min': 'نام کاربری حداقل ۳ کاراکتر',
        'string.max': 'نام کاربری حداکثر ۲۰ کاراکتر'
      }),
    
    email: Joi.string()
      .email()
      .required(),
    
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .required()
      .messages({
        'string.min': 'رمز عبور حداقل ۸ کاراکتر',
        'string.pattern.base': 'رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'
      }),
    
    mobile: Joi.string()
      .pattern(PATTERNS.IRANIAN_MOBILE)
      .required(),
    
    nationalCode: Joi.string()
      .pattern(PATTERNS.NATIONAL_CODE)
      .optional()
  }),

  /**
   * اسکیمای لاگین
   */
  loginSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  /**
   * اسکیمای بروزرسانی پروفایل
   */
  profileSchema: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[\u0600-\u06FF\s]+$/),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[\u0600-\u06FF\s]+$/),
    
    mobile: Joi.string()
      .pattern(PATTERNS.IRANIAN_MOBILE),
    
    postalCode: Joi.string()
      .pattern(PATTERNS.POSTAL_CODE),
    
    address: Joi.string()
      .max(500)
      .pattern(/^[\u0600-\u06FF\s\d,.\-]+$/)
  }),

  /**
   * اسکیمای ارسال پیامک
   */
  smsSchema: Joi.object({
    mobile: Joi.string()
      .pattern(PATTERNS.IRANIAN_MOBILE)
      .required(),
    
    type: Joi.string()
      .valid('register', 'login', 'reset', 'verify')
      .required()
  }),

  /**
   * اعتبارسنجی با Joi
   */
  validate: (schema, data) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return { valid: false, errors };
    }
    
    return { valid: true, value };
  }
};

// ═════════════════════════════════════════════════════════════
// 🧹 پاکسازی و sanitize
// ═════════════════════════════════════════════════════════════

const sanitizer = {
  /**
   * حذف تگ‌های HTML
   */
  stripTags: (value) => {
    if (!value) return '';
    return validator.stripLow(value);
  },

  /**
   * اسکیپ کردن HTML
   */
  escapeHTML: (value) => {
    if (!value) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return value.replace(/[&<>"'/]/g, char => map[char]);
  },

  /**
   * حذف فضای خالی اضافی
   */
  trim: (value) => {
    if (!value) return '';
    return value.trim().replace(/\s+/g, ' ');
  },

  /**
   * نرمالایز کردن شماره موبایل
   */
  normalizeMobile: (value) => {
    if (!value) return '';
    let cleaned = value.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+98')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('98')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return `0${cleaned}`;
  },

  /**
   * حذف کاراکترهای غیرمجاز
   */
  sanitizeFilename: (value) => {
    if (!value) return '';
    return value
      .replace(/[<>:"|?*]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  },

  /**
   * تبدیل به حروف کوچک
   */
  toLowerCase: (value) => {
    if (!value) return '';
    return value.toLowerCase();
  },

  /**
   * تبدیل به حروف بزرگ
   */
  toUpperCase: (value) => {
    if (!value) return '';
    return value.toUpperCase();
  }
};

// ═════════════════════════════════════════════════════════════
// 🎯 اعتبارسنجی یکپارچه
// ═════════════════════════════════════════════════════════════

const validate = (rules, data) => {
  const errors = [];
  
  for (const [field, ruleSet] of Object.entries(rules)) {
    const value = data[field];
    
    for (const [rule, params] of Object.entries(ruleSet)) {
      let isValid = true;
      let errorMessage = null;
      
      switch (rule) {
        case 'required':
          isValid = baseValidator.isRequired(value);
          errorMessage = `فیلد ${field} الزامی است`;
          break;
          
        case 'type':
          isValid = baseValidator.isType(value, params);
          errorMessage = `فیلد ${field} باید از نوع ${params} باشد`;
          break;
          
        case 'min':
          isValid = baseValidator.isLength(value, params);
          errorMessage = `فیلد ${field} حداقل ${params} کاراکتر`;
          break;
          
        case 'max':
          isValid = baseValidator.isLength(value, undefined, params);
          errorMessage = `فیلد ${field} حداکثر ${params} کاراکتر`;
          break;
          
        case 'email':
          isValid = globalValidator.isEmail(value);
          errorMessage = `ایمیل ${field} معتبر نیست`;
          break;
          
        case 'mobile':
          isValid = iranianValidator.isMobile(value);
          errorMessage = `شماره موبایل ${field} معتبر نیست`;
          break;
          
        case 'nationalCode':
          isValid = iranianValidator.isNationalCode(value);
          errorMessage = `کد ملی ${field} معتبر نیست`;
          break;
          
        case 'postalCode':
          isValid = iranianValidator.isPostalCode(value);
          errorMessage = `کد پستی ${field} معتبر نیست`;
          break;
          
        case 'bankCard':
          isValid = iranianValidator.isBankCard(value);
          errorMessage = `شماره کارت ${field} معتبر نیست`;
          break;
          
        case 'iban':
          isValid = iranianValidator.isIBAN(value);
          errorMessage = `شماره شبا ${field} معتبر نیست`;
          break;
          
        case 'url':
          isValid = globalValidator.isURL(value);
          errorMessage = `آدرس ${field} معتبر نیست`;
          break;
          
        case 'ip':
          isValid = globalValidator.isIP(value, params || '4');
          errorMessage = `آیپی ${field} معتبر نیست`;
          break;
          
        case 'uuid':
          isValid = globalValidator.isUUID(value, params || '4');
          errorMessage = `${field} باید UUID معتبر باشد`;
          break;
          
        case 'date':
          isValid = globalValidator.isDate(value);
          errorMessage = `تاریخ ${field} معتبر نیست`;
          break;
          
        case 'json':
          isValid = globalValidator.isJSON(value);
          errorMessage = `${field} باید JSON معتبر باشد`;
          break;
          
        case 'number':
          isValid = baseValidator.isNumber(value);
          errorMessage = `${field} باید عدد باشد`;
          break;
          
        case 'integer':
          isValid = baseValidator.isInt(value);
          errorMessage = `${field} باید عدد صحیح باشد`;
          break;
          
        case 'positive':
          isValid = baseValidator.isPositive(value);
          errorMessage = `${field} باید مثبت باشد`;
          break;
          
        case 'range':
          isValid = baseValidator.isInRange(value, params[0], params[1]);
          errorMessage = `${field} باید بین ${params[0]} و ${params[1]} باشد`;
          break;
          
        case 'username':
          isValid = globalValidator.isUsername(value);
          errorMessage = `نام کاربری ${field} معتبر نیست`;
          break;
          
        case 'strongPassword':
          isValid = globalValidator.isStrongPassword(value);
          errorMessage = `رمز عبور ${field} ضعیف است`;
          break;
          
        case 'persianName':
          isValid = iranianValidator.isPersianName(value);
          errorMessage = `${field} باید نام فارسی معتبر باشد`;
          break;
          
        case 'safeText':
          isValid = iranianValidator.isSafePersianText(value);
          errorMessage = `${field} حاوی کاراکترهای غیرمجاز است`;
          break;
          
        case 'sqlSafe':
          isValid = securityValidator.isSQLSafe(value);
          errorMessage = `${field} حاوی کد خطرناک است`;
          break;
          
        case 'xssSafe':
          isValid = securityValidator.isXSSSafe(value);
          errorMessage = `${field} حاوی کد XSS است`;
          break;
          
        case 'safePath':
          isValid = securityValidator.isSafePath(value);
          errorMessage = `${field} مسیر نامعتبر است`;
          break;
          
        case 'safeFilename':
          isValid = securityValidator.isSafeFilename(value);
          errorMessage = `${field} نام فایل نامعتبر است`;
          break;
          
        case 'custom':
          isValid = params(value, data);
          errorMessage = params.message || `فیلد ${field} معتبر نیست`;
          break;
      }
      
      if (!isValid) {
        errors.push({
          field,
          message: errorMessage,
          value
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ═════════════════════════════════════════════════════════════
// 📤 خروجی ماژول
// ═════════════════════════════════════════════════════════════

module.exports = {
  // پترن‌ها
  PATTERNS,
  
  // اعتبارسنج پایه
  base: baseValidator,
  
  // اعتبارسنج ایرانی
  iranian: iranianValidator,
  
  // اعتبارسنج جهانی
  global: globalValidator,
  
  // اعتبارسنج امنیتی
  security: securityValidator,
  
  // اعتبارسنج با Joi
  schema: schemaValidator,
  
  // پاکساز
  sanitizer,
  
  // اعتبارسنج یکپارچه
  validate,
  
  // نسخه کوتاه
  isEmail: globalValidator.isEmail,
  isMobile: iranianValidator.isMobile,
  isNationalCode: iranianValidator.isNationalCode,
  isURL: globalValidator.isURL,
  isJSON: globalValidator.isJSON,
  isSQLSafe: securityValidator.isSQLSafe,
  isXSSSafe: securityValidator.isXSSSafe
};