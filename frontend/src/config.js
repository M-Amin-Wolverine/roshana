// ============================================================
// src/config.js - تنظیمات مرکزی فوق خفن 🚀
// نسخه نهایی با تمام قابلیت‌ها
// ============================================================

// ═══════════════════════════════════════════════════════════
// 🌐 API & Network Configuration
// ═══════════════════════════════════════════════════════════
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000; // 30 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// ═══════════════════════════════════════════════════════════
// 🌍 Environment-Specific Configuration
// ═══════════════════════════════════════════════════════════
const currentEnv = import.meta.env.MODE || 'development';

export const ENV_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    WS_URL: 'ws://localhost:5000',
    DEBUG: true,
    MOCK_API: true,
    LOG_LEVEL: 'debug',
    ENABLE_DEVTOOLS: true,
    BYPASS_AUTH: false,
    PERFORMANCE_MONITOR: true,
    HOT_RELOAD: true
  },
  staging: {
    API_BASE_URL: 'https://staging-api.fartak.ir',
    WS_URL: 'wss://staging-ws.fartak.ir',
    DEBUG: true,
    MOCK_API: false,
    LOG_LEVEL: 'info',
    ENABLE_DEVTOOLS: true,
    BYPASS_AUTH: false,
    PERFORMANCE_MONITOR: true,
    HOT_RELOAD: false
  },
  production: {
    API_BASE_URL: 'https://api.fartak.ir',
    WS_URL: 'wss://ws.fartak.ir',
    DEBUG: false,
    MOCK_API: false,
    LOG_LEVEL: 'error',
    ENABLE_DEVTOOLS: false,
    BYPASS_AUTH: false,
    PERFORMANCE_MONITOR: true,
    HOT_RELOAD: false
  },
  test: {
    API_BASE_URL: 'http://localhost:5000',
    WS_URL: 'ws://localhost:5000',
    DEBUG: false,
    MOCK_API: true,
    LOG_LEVEL: 'silent',
    ENABLE_DEVTOOLS: false,
    BYPASS_AUTH: true,
    PERFORMANCE_MONITOR: false,
    HOT_RELOAD: false
  }
}[currentEnv];

// استفاده از URL های محیطی اگر تعریف شده باشند
export const EFFECTIVE_API_URL = ENV_CONFIG.API_BASE_URL || API_BASE_URL;
export const EFFECTIVE_WS_URL = ENV_CONFIG.WS_URL || WS_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_OTP: '/auth/verify-otp',
    ENABLE_2FA: '/auth/enable-2fa',
    DISABLE_2FA: '/auth/disable-2fa'
  },
  
  // User
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    AVATAR: '/users/avatar',
    SETTINGS: '/users/settings',
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
    SESSIONS: '/users/sessions',
    ACTIVITY_LOG: '/users/activity-log'
  },

    SUPPORT: {
    FAQS: '/support/faqs',
    FAQ_HELPFUL: '/support/faqs/:id/helpful',
    GUIDES: '/support/guides',
    TICKETS: '/support/tickets',
    TICKET_DETAIL: '/support/tickets/:id',
    TICKET_REPLY: '/support/tickets/:id/reply',
    AI_ASK: '/support/ai/ask',
    STATS: '/support/stats'
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    LOGS: '/admin/logs',
    BACKUP: '/admin/backup',
    SYSTEM: '/admin/system'
  },
  
  // Courses
  COURSES: {
    LIST: '/courses',
    DETAIL: '/courses/:id',
    ENROLL: '/courses/:id/enroll',
    MATERIALS: '/courses/:id/materials',
    ASSIGNMENTS: '/courses/:id/assignments',
    GRADES: '/courses/:id/grades'
  }
};

// ═══════════════════════════════════════════════════════════
// 📱 App Information
// ═══════════════════════════════════════════════════════════
export const APP_CONFIG = {
  name: 'فرتاک',
  nameEn: 'Fartak',
  fullName: 'سامانه جامع دانشگاهی فرتاک',
  slogan: 'آینده آموزش، امروز',
  version: import.meta.env.VITE_APP_VERSION || '3.0.0',
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  buildNumber: import.meta.env.VITE_BUILD_NUMBER || '1',
  environment: import.meta.env.MODE || 'development',
  description: 'سامانه جامع دانشگاهی فرتاک - مدیریت هوشمند آموزش',
  author: {
    name: 'محمدامین خدادادی',
    email: 'dev@fartak.ir',
    github: 'https://github.com/fartak',
    website: 'https://fartak.ir'
  },
  contact: {
    support: 'support@fartak.ir',
    phone: '021-12345678',
    address: 'تهران، ایران'
  },
  social: {
    telegram: 'https://t.me/fartak',
    instagram: 'https://instagram.com/fartak',
    linkedin: 'https://linkedin.com/company/fartak',
    twitter: 'https://twitter.com/fartak'
  }
};

// ═══════════════════════════════════════════════════════════
// 🎨 Theme & UI Configuration
// ═══════════════════════════════════════════════════════════
export const THEME_CONFIG = {
  defaultTheme: 'system',
  defaultDirection: 'rtl',
  defaultColorScheme: 'default',
  defaultFontFamily: 'Vazirmatn',
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
    full: '9999px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  zIndex: {
    modal: 1000,
    overlay: 900,
    dropdown: 800,
    header: 700,
    footer: 600,
    tooltip: 500,
    toast: 1100
  }
};

// ═══════════════════════════════════════════════════════════
// 🎯 Features Configuration
// ═══════════════════════════════════════════════════════════
export const FEATURES = {
  // Core
  darkMode: true,
  rtlSupport: true,
  offlineSupport: true,
  pwaEnabled: true,
  
  // Auth
  biometricAuth: false,
  twoFactorAuth: true,
  socialLogin: {
    google: true,
    github: false,
    linkedin: false
  },
  
  // Notifications
  pushNotifications: 'Notification' in window,
  emailNotifications: true,
  smsNotifications: false,
  inAppNotifications: true,
  
  // Advanced
  voiceCommands: false,
  screenReader: true,
  highContrast: true,
  dyslexiaFont: false,
  
  // Experimental
  aiAssistant: false,
  arMode: false,
  realtimeCollab: true,
  gamification: true,
  
  // Analytics
  analytics: true,
  errorTracking: true,
  performanceMonitoring: true,
  userBehaviorTracking: false,
  
  // Security
  encryption: true,
  auditLog: true,
  sessionTracking: true,
  ipWhitelist: false
};

// ═══════════════════════════════════════════════════════════
// 🎛️ Feature Flags با قابلیت Override
// ═══════════════════════════════════════════════════════════
export const FEATURE_OVERRIDES = {
  admin: {
    aiAssistant: true,
    realtimeCollab: true,
    voiceCommands: true,
    userBehaviorTracking: true
  },
  professor: {
    realtimeCollab: true,
    analytics: true,
    gamification: false
  },
  student: {
    gamification: true,
    aiAssistant: false,
    realtimeCollab: false
  },
  staff: {
    analytics: false,
    aiAssistant: false
  },
  guest: {
    darkMode: true,
    rtlSupport: true,
    gamification: false
  }
};

export const getFeatureFlag = (flagName, userRole = null) => {
  // بررسی وجود flag در FEATURES
  if (!(flagName in FEATURES)) {
    console.warn(`Feature flag "${flagName}" not found`);
    return false;
  }
  
  const baseFlag = FEATURES[flagName];
  
  // Override بر اساس نقش
  if (userRole && FEATURE_OVERRIDES[userRole]) {
    const override = FEATURE_OVERRIDES[userRole][flagName];
    if (override !== undefined) {
      return override;
    }
  }
  
  // Override از localStorage (برای A/B تست یا تنظیمات موقت)
  try {
    const localOverrides = JSON.parse(localStorage.getItem('feature_overrides') || '{}');
    if (flagName in localOverrides) {
      return localOverrides[flagName];
    }
  } catch {
    // ignore
  }
  
  return baseFlag;
};

export const setFeatureOverride = (flagName, value) => {
  try {
    const overrides = JSON.parse(localStorage.getItem('feature_overrides') || '{}');
    overrides[flagName] = value;
    localStorage.setItem('feature_overrides', JSON.stringify(overrides));
    return true;
  } catch {
    return false;
  }
};

export const resetFeatureOverrides = () => {
  localStorage.removeItem('feature_overrides');
};

// ═══════════════════════════════════════════════════════════
// 🧪 A/B Testing Configuration
// ═══════════════════════════════════════════════════════════
// تابع hash ساده برای deterministic assignment
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const AB_TEST_CONFIG = {
  enabled: FEATURES.analytics && ENV_CONFIG.DEBUG === false,
  
  experiments: {
    NEW_LOGIN_PAGE: {
      id: 'exp_001',
      name: 'صفحه ورود جدید',
      variants: ['control', 'variant_a', 'variant_b'],
      weights: [0.5, 0.25, 0.25],
      targetRoles: ['student'],
      targetPercentage: 100,
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      description: 'تست طراحی جدید صفحه ورود'
    },
    DARK_MODE_DEFAULT: {
      id: 'exp_002',
      name: 'تم تاریک پیش‌فرض',
      variants: ['light', 'dark'],
      weights: [0.7, 0.3],
      targetRoles: null, // همه
      targetPercentage: 50,
      description: 'تست تم تاریک به عنوان پیش‌فرض'
    },
    COURSE_CARD_LAYOUT: {
      id: 'exp_003',
      name: 'طراحی کارت دوره',
      variants: ['grid', 'list', 'compact'],
      weights: [0.4, 0.3, 0.3],
      targetRoles: ['student', 'professor'],
      targetPercentage: 100,
      startDate: '2026-01-01',
      description: 'تست چیدمان کارت دوره‌ها'
    },
    ONBOARDING_FLOW: {
      id: 'exp_004',
      name: 'فرآیند ثبت‌نام',
      variants: ['control', 'simplified', 'gamified'],
      weights: [0.5, 0.25, 0.25],
      targetRoles: ['student'],
      targetPercentage: 100,
      description: 'تست فرآیند ثبت‌نام'
    }
  },
  
  getVariant: (experimentId, userId) => {
    const experiment = AB_TEST_CONFIG.experiments[experimentId];
    
    if (!experiment) {
      console.warn(`Experiment "${experimentId}" not found`);
      return 'control';
    }
    
    if (!AB_TEST_CONFIG.enabled) {
      return 'control';
    }
    
    // بررسی تاریخ
    const now = new Date().toISOString().split('T')[0];
    if (experiment.startDate && now < experiment.startDate) {
      return 'control';
    }
    if (experiment.endDate && now > experiment.endDate) {
      return 'control';
    }
    
    // بررسی درصد مشارکت
    const participationHash = hashCode(`${experimentId}_participation_${userId}`);
    const participationRoll = participationHash % 100;
    if (participationRoll >= experiment.targetPercentage) {
      return 'control';
    }
    
    // الگوریتم deterministic برای consistency
    const variantHash = hashCode(`${experimentId}_${userId}_variant`);
    
    // انتخاب variant بر اساس weights
    const totalWeight = experiment.weights.reduce((a, b) => a + b, 0);
    const roll = variantHash % totalWeight;
    
    let cumulative = 0;
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulative += experiment.weights[i];
      if (roll < cumulative) {
        return experiment.variants[i];
      }
    }
    
    return experiment.variants[0];
  },
  
  trackExperiment: (experimentId, userId, variant, action, metadata = {}) => {
    if (!AB_TEST_CONFIG.enabled) return;
    
    const event = {
      experimentId,
      userId,
      variant,
      action,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    // ذخیره در localStorage برای آنالیز بعدی
    try {
      const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
      events.push(event);
      localStorage.setItem('ab_test_events', JSON.stringify(events.slice(-100)));
    } catch {
      // ignore
    }
    
    // ارسال به آنالیتیکس
    if (window.gtag) {
      window.gtag('event', 'ab_test', {
        experiment_id: experimentId,
        variant,
        action
      });
    }
    
    if (ENV_CONFIG.DEBUG) {
      console.log(`[A/B Test] ${experimentId}: ${variant} - ${action}`, metadata);
    }
  },
  
  forceVariant: (experimentId, variant) => {
    try {
      const forced = JSON.parse(localStorage.getItem('ab_test_forced') || '{}');
      forced[experimentId] = variant;
      localStorage.setItem('ab_test_forced', JSON.stringify(forced));
    } catch {
      // ignore
    }
  },
  
  getForcedVariant: (experimentId) => {
    try {
      const forced = JSON.parse(localStorage.getItem('ab_test_forced') || '{}');
      return forced[experimentId] || null;
    } catch {
      return null;
    }
  }
};

// ═══════════════════════════════════════════════════════════
// 📊 Performance Budget
// ═══════════════════════════════════════════════════════════
export const PERFORMANCE_BUDGET = {
  // زمان بارگذاری (ms)
  timing: {
    FCP: 1800,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    TTI: 3500,  // Time to Interactive
    TBT: 300,   // Total Blocking Time
    CLS: 0.1,   // Cumulative Layout Shift
    FID: 100,   // First Input Delay
    INP: 200    // Interaction to Next Paint
  },
  
  // حجم فایل‌ها (KB)
  size: {
    total: 1000,
    javascript: 300,
    css: 100,
    images: 500,
    fonts: 100,
    thirdParty: 200
  },
  
  // تعداد درخواست‌ها
  requests: {
    total: 50,
    thirdParty: 10,
    images: 20
  },
  
  // هشدارها
  warnings: {
    timing: 0.8,  // هشدار در ۸۰٪ بودجه
    size: 0.9,
    requests: 0.85
  },
  
  // بررسی بودجه
  checkBudget: (metric, value) => {
    const budget = PERFORMANCE_BUDGET[metric.type]?.[metric.name];
    if (!budget) return { withinBudget: true };
    
    const withinBudget = value <= budget;
    const warningThreshold = budget * PERFORMANCE_BUDGET.warnings[metric.type] || budget;
    const needsWarning = value >= warningThreshold && value <= budget;
    
    return { withinBudget, needsWarning, budget, value };
  }
};

// ═══════════════════════════════════════════════════════════
// 🔒 Security Configuration
// ═══════════════════════════════════════════════════════════
export const SECURITY_CONFIG = {
  // Token
  tokenKey: 'fartak_token',
  refreshTokenKey: 'fartak_refresh_token',
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Password Policy
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: false,
  passwordMaxAttempts: 5,
  passwordLockoutDuration: 15 * 60 * 1000, // 15 minutes
  
  // Session
  sessionTimeout: 60 * 60 * 1000, // 1 hour
  sessionWarningTime: 5 * 60 * 1000, // 5 minutes
  maxConcurrentSessions: 3,
  
  // 2FA
  twoFactorTimeout: 5 * 60 * 1000, // 5 minutes
  twoFactorCodeLength: 6,
  
  // Rate Limiting
  rateLimit: {
    login: { max: 5, window: 15 * 60 * 1000 },
    register: { max: 3, window: 60 * 60 * 1000 },
    passwordReset: { max: 3, window: 60 * 60 * 1000 },
    api: { max: 100, window: 60 * 1000 }
  },
  
  // Encryption
  encryptionAlgorithm: 'AES-GCM',
  keyLength: 256,
  
  // CORS
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fartak.ir',
    'https://app.fartak.ir'
  ]
};

// ═══════════════════════════════════════════════════════════
// ❌ Error Codes Mapping
// ═══════════════════════════════════════════════════════════
export const ERROR_CODES = {
  // Auth Errors (AUTH_XXX)
  AUTH_001: 'توکن نامعتبر است',
  AUTH_002: 'توکن منقضی شده است',
  AUTH_003: 'نام کاربری یا رمز عبور اشتباه است',
  AUTH_004: 'حساب کاربری قفل شده است',
  AUTH_005: 'IP شما مسدود شده است',
  AUTH_006: 'احراز هویت دو مرحله‌ای ناموفق بود',
  AUTH_007: 'حساب کاربری تأیید نشده است',
  AUTH_008: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است',
  AUTH_009: 'رمز عبور قبلاً استفاده شده است',
  AUTH_010: 'کد تأیید منقضی شده است',
  
  // Validation Errors (VAL_XXX)
  VAL_001: 'ایمیل معتبر نیست',
  VAL_002: 'شماره موبایل معتبر نیست',
  VAL_003: 'رمز عبور ضعیف است',
  VAL_004: 'کد ملی معتبر نیست',
  VAL_005: 'شماره دانشجویی معتبر نیست',
  VAL_006: 'تاریخ معتبر نیست',
  VAL_007: 'فیلد الزامی تکمیل نشده است',
  VAL_008: 'طول فیلد بیش از حد مجاز است',
  VAL_009: 'فرمت فایل مجاز نیست',
  VAL_010: 'حجم فایل بیش از حد مجاز است',
  
  // Resource Errors (RES_XXX)
  RES_001: 'منبع مورد نظر یافت نشد',
  RES_002: 'دسترسی غیرمجاز',
  RES_003: 'منبع قبلاً حذف شده است',
  RES_004: 'منبع تکراری است',
  RES_005: 'ظرفیت تکمیل شده است',
  RES_006: 'مهلت ثبت‌نام به پایان رسیده است',
  RES_007: 'پیش‌نیازها رعایت نشده است',
  
  // Server Errors (SRV_XXX)
  SRV_001: 'خطای داخلی سرور',
  SRV_002: 'دیتابیس در دسترس نیست',
  SRV_003: 'سرویس موقتاً قطع است',
  SRV_004: 'خطا در پردازش درخواست',
  SRV_005: 'خطای شبکه - لطفاً اتصال خود را بررسی کنید',
  SRV_006: 'نسخه API پشتیبانی نمی‌شود',
  
  // Rate Limit Errors (RATE_XXX)
  RATE_001: 'تعداد درخواست‌ها بیش از حد مجاز است',
  RATE_002: 'لطفاً چند لحظه صبر کنید و مجدداً تلاش کنید',
  RATE_003: 'محدودیت روزانه به پایان رسیده است',
  
  // Payment Errors (PAY_XXX)
  PAY_001: 'پرداخت ناموفق بود',
  PAY_002: 'موجودی کافی نیست',
  PAY_003: 'درگاه پرداخت در دسترس نیست',
  PAY_004: 'تراکنش قبلاً انجام شده است',
  
  // File Errors (FILE_XXX)
  FILE_001: 'آپلود فایل ناموفق بود',
  FILE_002: 'نوع فایل پشتیبانی نمی‌شود',
  FILE_003: 'فایل آسیب دیده است',
  FILE_004: 'فضای ذخیره‌سازی کافی نیست'
};

export const getErrorMessage = (code, fallback = 'خطای ناشناخته رخ داده است') => {
  return ERROR_CODES[code] || fallback;
};

export const getErrorType = (code) => {
  if (!code) return 'UNKNOWN';
  const prefix = code.split('_')[0];
  const types = {
    AUTH: 'Authentication',
    VAL: 'Validation',
    RES: 'Resource',
    SRV: 'Server',
    RATE: 'RateLimit',
    PAY: 'Payment',
    FILE: 'File'
  };
  return types[prefix] || 'UNKNOWN';
};

export const isRetryableError = (code) => {
  const retryablePrefixes = ['SRV', 'RATE', 'AUTH_002'];
  return retryablePrefixes.some(prefix => code?.startsWith(prefix));
};

// ═══════════════════════════════════════════════════════════
// 📂 File Upload Configuration
// ═══════════════════════════════════════════════════════════
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    presentation: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    archive: ['application/zip', 'application/x-rar-compressed'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
  },
  
  imageDimensions: {
    avatar: { width: 400, height: 400 },
    thumbnail: { width: 200, height: 200 },
    cover: { width: 1200, height: 400 },
    gallery: { width: 800, height: 600 }
  }
};

// ═══════════════════════════════════════════════════════════
// 📱 Menu Configuration
// ═══════════════════════════════════════════════════════════
export const MENU_CONFIG = {
  admin: [
    { 
      path: '/admin/dashboard', 
      icon: 'dashboard', 
      label: 'داشبورد',
      badge: null
    },
    { 
      path: '/admin/users', 
      icon: 'users', 
      label: 'کاربران',
      permissions: ['VIEW_USERS']
    },
    { 
      path: '/admin/courses', 
      icon: 'courses', 
      label: 'دوره‌ها',
      permissions: ['VIEW_COURSES']
    },
    { 
      label: 'گزارشات', 
      icon: 'reports',
      permissions: ['VIEW_REPORTS'],
      children: [
        { path: '/admin/reports/users', label: 'گزارش کاربران', icon: 'user-report' },
        { path: '/admin/reports/courses', label: 'گزارش دوره‌ها', icon: 'course-report' },
        { path: '/admin/reports/finance', label: 'گزارش مالی', icon: 'finance-report' },
        { path: '/admin/reports/performance', label: 'عملکرد سیستم', icon: 'performance' }
      ]
    },
    { 
      label: 'مدیریت سیستم', 
      icon: 'system',
      children: [
        { path: '/admin/logs', label: 'لاگ‌ها', icon: 'logs' },
        { path: '/admin/backup', label: 'پشتیبان‌گیری', icon: 'backup' },
        { path: '/admin/system', label: 'وضعیت سیستم', icon: 'status' }
      ]
    },
    { 
      path: '/admin/settings', 
      icon: 'settings', 
      label: 'تنظیمات',
      permissions: ['VIEW_SETTINGS']
    },
    { 
      path: '/admin/support', 
      icon: 'support', 
      label: 'پشتیبانی'
    }
  ],
  
  professor: [
    { path: '/professor/dashboard', icon: 'dashboard', label: 'داشبورد' },
    { path: '/professor/courses', icon: 'courses', label: 'دوره‌های من' },
    { path: '/professor/students', icon: 'students', label: 'دانشجویان' },
    { path: '/professor/grades', icon: 'grades', label: 'نمرات' },
    { path: '/professor/assignments', icon: 'assignments', label: 'تکالیف' },
    { path: '/professor/attendance', icon: 'attendance', label: 'حضور و غیاب' },
    { 
      label: 'ابزارها', 
      icon: 'tools',
      children: [
        { path: '/professor/quiz', label: 'آزمون‌ساز', icon: 'quiz' },
        { path: '/professor/content', label: 'محتوای آموزشی', icon: 'content' }
      ]
    }
  ],
  
  student: [
    { path: '/student/dashboard', icon: 'dashboard', label: 'داشبورد' },
    { path: '/student/courses', icon: 'courses', label: 'دوره‌های من' },
    { path: '/student/grades', icon: 'grades', label: 'نمرات' },
    { path: '/student/schedule', icon: 'schedule', label: 'برنامه هفتگی' },
    { path: '/student/assignments', icon: 'assignments', label: 'تکالیف' },
    { path: '/student/exams', icon: 'exams', label: 'آزمون‌ها' },
    { path: '/student/finance', icon: 'finance', label: 'امور مالی' },
    { path: '/student/messages', icon: 'messages', label: 'پیام‌ها' }
  ],
  
  staff: [
    { path: '/staff/dashboard', icon: 'dashboard', label: 'داشبورد' },
    { path: '/staff/requests', icon: 'requests', label: 'درخواست‌ها' },
    { path: '/staff/documents', icon: 'documents', label: 'مدارک' }
  ],
  
  guest: [
    { path: '/', icon: 'home', label: 'خانه' },
    { path: '/courses', icon: 'courses', label: 'دوره‌ها' },
    { path: '/about', icon: 'about', label: 'درباره ما' },
    { path: '/contact', icon: 'contact', label: 'تماس با ما' }
  ]
};

export const getMenuByRole = (role) => {
  return MENU_CONFIG[role] || MENU_CONFIG.guest;
};

export const filterMenuByPermissions = (menu, userPermissions = []) => {
  return menu.filter(item => {
    if (item.permissions && !item.permissions.some(p => userPermissions.includes(p))) {
      return false;
    }
    if (item.children) {
      item.children = filterMenuByPermissions(item.children, userPermissions);
      return item.children.length > 0;
    }
    return true;
  });
};

// ═══════════════════════════════════════════════════════════
// 🔌 WebSocket Events
// ═══════════════════════════════════════════════════════════
export const WS_EVENTS = {
  // Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
  
  // Notification Events
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_ALL_READ: 'notification_all_read',
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  
  // Live Class Events
  JOIN_CLASS: 'join_class',
  LEAVE_CLASS: 'leave_class',
  CLASS_STARTED: 'class_started',
  CLASS_ENDED: 'class_ended',
  RAISE_HAND: 'raise_hand',
  LOWER_HAND: 'lower_hand',
  CHAT_MESSAGE: 'chat_message',
  WHITEBOARD_UPDATE: 'whiteboard_update',
  WHITEBOARD_CLEAR: 'whiteboard_clear',
  SCREEN_SHARE_START: 'screen_share_start',
  SCREEN_SHARE_STOP: 'screen_share_stop',
  POLL_CREATED: 'poll_created',
  POLL_VOTE: 'poll_vote',
  POLL_ENDED: 'poll_ended',
  BREAKOUT_ROOM_JOIN: 'breakout_room_join',
  BREAKOUT_ROOM_LEAVE: 'breakout_room_leave',
  
  // Real-time Updates
  COURSE_UPDATE: 'course_update',
  COURSE_CREATED: 'course_created',
  COURSE_DELETED: 'course_deleted',
  GRADE_POSTED: 'grade_posted',
  GRADE_UPDATED: 'grade_updated',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ASSIGNMENT_GRADED: 'assignment_graded',
  ATTENDANCE_MARKED: 'attendance_marked',
  
  // User Status
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_AWAY: 'user_away',
  USER_BUSY: 'user_busy',
  PRESENCE_UPDATE: 'presence_update',
  
  // Collaboration
  DOCUMENT_JOIN: 'document_join',
  DOCUMENT_LEAVE: 'document_leave',
  DOCUMENT_CHANGE: 'document_change',
  CURSOR_MOVE: 'cursor_move',
  SELECTION_CHANGE: 'selection_change',
  COMMENT_ADDED: 'comment_added',
  COMMENT_RESOLVED: 'comment_resolved',
  
  // System Events
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  MAINTENANCE_WARNING: 'maintenance_warning',
  VERSION_UPDATE: 'version_update',
  FORCE_LOGOUT: 'force_logout',
  
  // Admin Events
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned',
  ROLE_CHANGED: 'role_changed',
  SETTINGS_UPDATED: 'settings_updated'
};

export const WS_ROOMS = {
  CLASS: (classId) => `class:${classId}`,
  COURSE: (courseId) => `course:${courseId}`,
  USER: (userId) => `user:${userId}`,
  ROLE: (role) => `role:${role}`,
  DEPARTMENT: (deptId) => `department:${deptId}`,
  ADMIN: 'admin:all',
  PUBLIC: 'public'
};

// ═══════════════════════════════════════════════════════════
// 🎮 Gamification Configuration
// ═══════════════════════════════════════════════════════════
export const GAMIFICATION = {
  enabled: FEATURES.gamification,
  
  points: {
    dailyLogin: 10,
    weeklyLogin: 50,
    monthlyLogin: 200,
    courseComplete: 100,
    assignmentSubmit: 25,
    perfectScore: 50,
    helpOthers: 15,
    profileComplete: 30,
    streakBonus: 5, // per day
    firstCourse: 100,
    reviewWrite: 20,
    attendancePresent: 5,
    participationBonus: 10,
    referralBonus: 500
  },
  
  levels: [
    { level: 1, name: 'مبتدی', minPoints: 0, color: '#9ca3af', icon: '🌱' },
    { level: 2, name: 'آموزنده', minPoints: 100, color: '#10b981', icon: '🌿' },
    { level: 3, name: 'پیشرفته', minPoints: 500, color: '#3b82f6', icon: '🌳' },
    { level: 4, name: 'متخصص', minPoints: 1000, color: '#8b5cf6', icon: '⭐' },
    { level: 5, name: 'خبره', minPoints: 2500, color: '#f59e0b', icon: '🌟' },
    { level: 6, name: 'استاد', minPoints: 5000, color: '#ef4444', icon: '👑' },
    { level: 7, name: 'افسانه', minPoints: 10000, color: '#ec4899', icon: '🏆' }
  ],
  
  badges: {
    FIRST_LOGIN: { name: 'اولین قدم', icon: '🎯', points: 0, description: 'اولین ورود به سامانه' },
    WEEK_STREAK: { name: 'یک هفته پیاپی', icon: '🔥', points: 50, description: '۷ روز فعالیت متوالی' },
    MONTH_STREAK: { name: 'یک ماه پیاپی', icon: '⚡', points: 200, description: '۳۰ روز فعالیت متوالی' },
    PERFECT_WEEK: { name: 'هفته کامل', icon: '🏆', points: 150, description: 'تکمیل تمام فعالیت‌های هفته' },
    COURSE_MASTER: { name: 'استاد دوره', icon: '👑', points: 500, description: 'تکمیل ۱۰ دوره' },
    HELPER: { name: 'یاری‌رسان', icon: '🤝', points: 100, description: 'پاسخ به ۵۰ سوال' },
    SPEEDRUNNER: { name: 'سریع‌ترین', icon: '🚀', points: 75, description: 'تکمیل دوره در زمان رکورد' },
    PERFECTIONIST: { name: 'کمال‌گرا', icon: '💯', points: 300, description: '۱۰ نمره کامل متوالی' },
    SOCIAL_BUTTERFLY: { name: 'اجتماعی', icon: '🦋', points: 150, description: 'ارتباط با ۵۰ دانشجو' },
    EARLY_BIRD: { name: 'سحرخیز', icon: '🌅', points: 50, description: 'ورود قبل از ۸ صبح' },
    NIGHT_OWL: { name: 'شب‌زنده‌دار', icon: '🌙', points: 50, description: 'فعالیت بعد از ۱۰ شب' }
  },
  
  getLevel: (points) => {
    return GAMIFICATION.levels
      .slice()
      .reverse()
      .find(level => points >= level.minPoints) || GAMIFICATION.levels[0];
  },
  
  getNextLevel: (points) => {
    return GAMIFICATION.levels.find(level => level.minPoints > points);
  },
  
  getProgress: (points) => {
    const currentLevel = GAMIFICATION.getLevel(points);
    const nextLevel = GAMIFICATION.getNextLevel(points);
    
    if (!nextLevel) return 100;
    
    const levelPoints = points - currentLevel.minPoints;
    const levelRange = nextLevel.minPoints - currentLevel.minPoints;
    
    return Math.floor((levelPoints / levelRange) * 100);
  }
};

// ═══════════════════════════════════════════════════════════
// 📤 Export Default Configuration
// ═══════════════════════════════════════════════════════════
export default {
  // Core
  API_BASE_URL,
  WS_URL,
  EFFECTIVE_API_URL,
  EFFECTIVE_WS_URL,
  
  // Environment
  ENV_CONFIG,
  
  // Config Objects
  API_ENDPOINTS,
  APP_CONFIG,
  THEME_CONFIG,
  FEATURES,
  SECURITY_CONFIG,
  ERROR_CODES,
  UPLOAD_CONFIG,
  MENU_CONFIG,
  WS_EVENTS,
  WS_ROOMS,
  GAMIFICATION,
  AB_TEST_CONFIG,
  PERFORMANCE_BUDGET,
  
  // Helper Functions
  getFeatureFlag,
  setFeatureOverride,
  resetFeatureOverrides,
  getErrorMessage,
  getErrorType,
  isRetryableError,
  getMenuByRole,
  filterMenuByPermissions
};

// ═══════════════════════════════════════════════════════════
// 🛠️ Utility Helpers
// ═══════════════════════════════════════════════════════════
export const getConfig = (path) => {
  const config = {
    API_BASE_URL,
    WS_URL,
    EFFECTIVE_API_URL,
    EFFECTIVE_WS_URL,
    ENV_CONFIG,
    API_ENDPOINTS,
    APP_CONFIG,
    THEME_CONFIG,
    FEATURES,
    SECURITY_CONFIG,
    ERROR_CODES,
    UPLOAD_CONFIG,
    MENU_CONFIG,
    WS_EVENTS,
    WS_ROOMS,
    GAMIFICATION,
    AB_TEST_CONFIG,
    PERFORMANCE_BUDGET
  };
  
  return path.split('.').reduce((obj, key) => obj?.[key], config);
};

export const isFeatureEnabled = (featureName, userRole = null) => {
  return getFeatureFlag(featureName, userRole);
};

export const getApiUrl = (endpoint, params = {}) => {
  let url = `${EFFECTIVE_API_URL}/api/${API_VERSION}${endpoint}`;
  
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return url;
};

export const getWsUrl = (room = null) => {
  let url = EFFECTIVE_WS_URL;
  if (room) {
    url += `/${room}`;
  }
  return url;
};

// ═══════════════════════════════════════════════════════════
// 📊 Console Info (Development Only)
// ═══════════════════════════════════════════════════════════
if (ENV_CONFIG.DEBUG) {
  console.log(
    `%c🚀 ${APP_CONFIG.fullName} v${APP_CONFIG.version}`,
    'font-weight: bold; font-size: 14px; color: #3b82f6;'
  );
  console.log(
    `%c📋 Environment: ${currentEnv} | Debug: ${ENV_CONFIG.DEBUG}`,
    'font-size: 12px; color: #6b7280;'
  );
  console.log(
    `%c🔗 API: ${EFFECTIVE_API_URL}`,
    'font-size: 12px; color: #6b7280;'
  );
}