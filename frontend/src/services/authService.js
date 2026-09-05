import api from './api'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 کلاس‌های خطای سفارشی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 تنظیمات و کلیدهای ذخیره‌سازی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STORAGE_KEYS = {
  TOKEN: 'roshana-token',
  REFRESH_TOKEN: 'roshana-refresh-token',
  USER: 'roshana-user',
  EXPIRES_AT: 'roshana-token-expires-at',
  REMEMBER_ME: 'roshana-remember-me'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 توابع کمکی (Helpers)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return localStorage.getItem(key)
    }
  },
  set: (key, value) => {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, valueToStore)
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  }
}

const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true
  return Date.now() >= expiresAt
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ اعتبارسنجی ورودی (Validation)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validators = {
  phone: (phone) => {
    const phoneRegex = /^09\d{9}$/
    if (!phone) return 'شماره موبایل الزامی است'
    if (!phoneRegex.test(phone)) return 'شماره موبایل معتبر نیست'
    return null
  },
  
  password: (password) => {
    if (!password) return 'رمز عبور الزامی است'
    if (password.length < 6) return 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    return null
  },
  
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return null // ایمیل اختیاری
    if (!emailRegex.test(email)) return 'ایمیل معتبر نیست'
    return null
  },
  
  nationalCode: (code) => {
    if (!code) return null // اختیاری
    if (!/^\d{10}$/.test(code)) return 'کد ملی باید ۱۰ رقم باشد'
    return null
  },
  
  name: (name, fieldName = 'نام') => {
    if (!name || name.trim().length < 2) return `${fieldName} باید حداقل ۲ کاراکتر باشد`
    if (name.length > 50) return `${fieldName} نباید بیش از ۵۰ کاراکتر باشد`
    return null
  },
  
  passwordStrength: (password) => {
    const checks = {
      length: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    const score = Object.values(checks).filter(Boolean).length
    
    const levels = {
      0: 'بسیار ضعیف',
      1: 'ضعیف',
      2: 'متوسط',
      3: 'قوی',
      4: 'بسیار قوی',
      5: 'عالی'
    }
    
    return { score, level: levels[score], checks }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 اعتبارسنجی داده‌های ثبت‌نام
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateRegisterData = (userData) => {
  const errors = {}
  
  const firstNameError = validators.name(userData.firstName, 'نام')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validators.name(userData.lastName, 'نام خانوادگی')
  if (lastNameError) errors.lastName = lastNameError
  
  const phoneError = validators.phone(userData.phone)
  if (phoneError) errors.phone = phoneError
  
  const passwordError = validators.password(userData.password)
  if (passwordError) errors.password = passwordError
  
  const emailError = validators.email(userData.email)
  if (emailError) errors.email = emailError
  
  const nationalCodeError = validators.nationalCode(userData.nationalCode)
  if (nationalCodeError) errors.nationalCode = nationalCodeError
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('خطا در اعتبارسنجی', errors)
  }
  
  return true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 ذخیره‌سازی توکن‌ها
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const saveTokens = (data, rememberMe = false) => {
  const { accessToken, refreshToken, expiresIn } = data
  
  storage.set(STORAGE_KEYS.TOKEN, accessToken)
  storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  
  if (expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000)
    storage.set(STORAGE_KEYS.EXPIRES_AT, expiresAt)
  }
  
  if (rememberMe) {
    storage.set(STORAGE_KEYS.REMEMBER_ME, true)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 احراز هویت - Authentication Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const authService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 1. لاگین با شماره موبایل و رمز عبور
  // POST /api/v1/auth/login
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  login: async (phone, password, rememberMe = false) => {
    // ✅ اعتبارسنجی ورودی
    const phoneError = validators.phone(phone)
    if (phoneError) throw new AuthError(phoneError, 'INVALID_PHONE')
    
    const passwordError = validators.password(password)
    if (passwordError) throw new AuthError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.post('/auth/login', {
        phone,
        password
      })
      
      const { data } = response
      
      // 💾 ذخیره توکن‌ها
      saveTokens(data, rememberMe)
      
      // 👤 ذخیره اطلاعات کاربر
      if (data.user) {
        storage.set(STORAGE_KEYS.USER, data.user)
      }
      
      return {
        success: true,
        user: data.user,
        accessToken: data.accessToken
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('شماره موبایل یا رمز عبور اشتباه است', 'INVALID_CREDENTIALS')
      }
      
      if (response?.status === 423) {
        throw new AuthError('حساب کاربری شما قفل شده است', 'ACCOUNT_LOCKED')
      }
      
      if (response?.status === 429) {
        throw new AuthError('تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید', 'RATE_LIMITED')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در ورود به سیستم', 'LOGIN_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 2. ثبت‌نام کاربر جدید
  // POST /api/v1/auth/register
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  register: async (userData) => {
    // ✅ اعتبارسنجی داده‌ها
    validateRegisterData(userData)
    
    // 🔐 بررسی قدرت رمز عبور
    const strength = validators.passwordStrength(userData.password)
    if (strength.score < 3) {
      throw new AuthError('رمز عبور ضعیف است. از حروف بزرگ، کوچک، اعداد و نمادها استفاده کنید', 'WEAK_PASSWORD')
    }
    
    try {
      const response = await api.post('/auth/register', {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        phone: userData.phone,
        password: userData.password,
        email: userData.email?.trim() || undefined,
        nationalCode: userData.nationalCode || undefined,
        role: userData.role || 'student'
      })
      
      const { data } = response
      
      // اگر ثبت‌نام با فعال‌سازی خودکار باشد
      if (data.accessToken) {
        saveTokens(data)
        if (data.user) {
          storage.set(STORAGE_KEYS.USER, data.user)
        }
      }
      
      return {
        success: true,
        message: data.message || 'ثبت‌نام موفقیت‌آمیز',
        requiresActivation: !data.accessToken,
        user: data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 409) {
        throw new AuthError('این شماره موبایل قبلاً ثبت شده است', 'PHONE_EXISTS')
      }
      
      if (response?.status === 422) {
        const errors = response.data?.errors || {}
        throw new ValidationError('خطا در اعتبارسنجی', errors)
      }
      
      throw new AuthError(response?.data?.message || 'خطا در ثبت‌نام', 'REGISTER_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📲 3. ارسال کد OTP به موبایل
  // POST /api/v1/auth/send-otp
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sendOTP: async (phone) => {
    const phoneError = validators.phone(phone)
    if (phoneError) throw new AuthError(phoneError, 'INVALID_PHONE')
    
    try {
      const response = await api.post('/auth/send-otp', {
        phone
      })
      
      return {
        success: true,
        message: response.data?.message || 'کد OTP ارسال شد',
        expiresIn: response.data?.expiresIn || 120 // پیش‌فرض ۲ دقیقه
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 429) {
        throw new AuthError('کد OTP قبلاً ارسال شده. لطفاً صبر کنید', 'OTP_ALREADY_SENT')
      }
      
      if (response?.status === 400) {
        throw new AuthError('شماره موبایل یافت نشد', 'PHONE_NOT_FOUND')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در ارسال کد OTP', 'SEND_OTP_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ 4. تأیید کد OTP
  // POST /api/v1/auth/verify-otp
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  verifyOTP: async (phone, code, rememberMe = false) => {
    const phoneError = validators.phone(phone)
    if (phoneError) throw new AuthError(phoneError, 'INVALID_PHONE')
    
    if (!code || !/^\d{4,6}$/.test(code)) {
      throw new AuthError('کد OTP معتبر نیست', 'INVALID_OTP')
    }
    
    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        code
      })
      
      const { data } = response
      
      if (data.accessToken) {
        saveTokens(data, rememberMe)
        
        if (data.user) {
          storage.set(STORAGE_KEYS.USER, data.user)
        }
        
        return {
          success: true,
          isNewUser: data.isNewUser || false,
          user: data.user,
          accessToken: data.accessToken
        }
      }
      
      // اگر کاربر جدید باشد و نیاز به تکمیل اطلاعات داشته باشد
      return {
        success: true,
        isNewUser: true,
        tempToken: data.tempToken
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 400) {
        throw new AuthError('کد OTP نامعتبر یا منقضی شده است', 'INVALID_OTP')
      }
      
      if (response?.status === 401) {
        throw new AuthError('کد OTP اشتباه است', 'WRONG_OTP')
      }
      
      if (response?.status === 429) {
        throw new AuthError('تعداد تلاش‌های شما بیش از حد مجاز است', 'OTP_ATTEMPTS_EXCEEDED')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در تأیید کد OTP', 'VERIFY_OTP_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 5. فراموشی رمز عبور - درخواست بازنشانی
  // POST /api/v1/auth/forgot-password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  forgotPassword: async (phone) => {
    const phoneError = validators.phone(phone)
    if (phoneError) throw new AuthError(phoneError, 'INVALID_PHONE')
    
    try {
      const response = await api.post('/auth/forgot-password', {
        phone
      })
      
      return {
        success: true,
        message: response.data?.message || 'کد بازنشانی ارسال شد',
        method: response.data?.method || 'sms'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new AuthError('کاربری با این شماره موبایل یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در ارسال کد بازنشانی', 'FORGOT_PASSWORD_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 6. بازنشانی رمز عبور با توکن
  // POST /api/v1/auth/reset-password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  resetPassword: async (token, newPassword) => {
    if (!token) {
      throw new AuthError('توکن بازنشانی معتبر نیست', 'INVALID_TOKEN')
    }
    
    const passwordError = validators.password(newPassword)
    if (passwordError) throw new AuthError(passwordError, 'INVALID_PASSWORD')
    
    const strength = validators.passwordStrength(newPassword)
    if (strength.score < 3) {
      throw new AuthError('رمز عبور ضعیف است', 'WEAK_PASSWORD')
    }
    
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      })
      
      return {
        success: true,
        message: response.data?.message || 'رمز عبور با موفقیت تغییر کرد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 400) {
        throw new AuthError('توکن منقضی شده یا نامعتبر است', 'INVALID_TOKEN')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors)
      }
      
      throw new AuthError(response?.data?.message || 'خطا در بازنشانی رمز عبور', 'RESET_PASSWORD_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚪 7. خروج از سیستم
  // POST /api/v1/auth/logout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  logout: async () => {
    try {
      // تلاش برای blacklist کردن توکن
      const token = storage.get(STORAGE_KEYS.TOKEN)
      if (token) {
        await api.post('/v1/auth/logout', { token })
      }
    } catch (error) {
      // خطا مهم نیست، پاک کردن localStorage اولویت دارد
      console.warn('خطا در logout از سرور:', error)
    } finally {
      // پاک کردن تمام اطلاعات کاربر
      storage.clear()
      
      // ریدایرکت به صفحه لاگین
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return { success: true }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 8. refresh توکن
  // POST /api/v1/auth/refresh
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  refreshToken: async () => {
    const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN)
    
    if (!refreshToken) {
      throw new AuthError('توکن refresh یافت نشد', 'NO_REFRESH_TOKEN')
    }
    
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken
      })
      
      const { data } = response
      saveTokens(data)
      
      return {
        success: true,
        accessToken: data.accessToken
      }
    } catch (error) {
      // اگر refresh توکن هم منقضی شده
      storage.clear()
      throw new AuthError('جلسه کاربری منقضی شده است. لطفاً دوباره وارد شوید', 'SESSION_EXPIRED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📧 9. فعال‌سازی حساب با ایمیل
  // POST /api/v1/auth/activate
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  activateAccount: async (token) => {
    if (!token) {
      throw new AuthError('توکن فعال‌سازی معتبر نیست', 'INVALID_TOKEN')
    }
    
    try {
      const response = await api.post('/auth/activate', {
        token
      })
      
      const { data } = response
      
      if (data.accessToken) {
        saveTokens(data)
        if (data.user) {
          storage.set(STORAGE_KEYS.USER, data.user)
        }
      }
      
      return {
        success: true,
        message: data.message || 'حساب کاربری با موفقیت فعال شد',
        user: data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 400) {
        throw new AuthError('توکن فعال‌سازی نامعتبر یا منقضی شده است', 'INVALID_TOKEN')
      }
      
      if (response?.status === 409) {
        throw new AuthError('حساب کاربری قبلاً فعال شده است', 'ALREADY_ACTIVATED')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در فعال‌سازی حساب', 'ACTIVATE_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👤 10. دریافت اطلاعات کاربر جاری
  // GET /api/v1/auth/me
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCurrentUser: async () => {
    const cachedUser = storage.get(STORAGE_KEYS.USER)
    
    try {
      const response = await api.get('/v1/auth/me')
      const user = response.data
      
      // به‌روزرسانی کش
      storage.set(STORAGE_KEYS.USER, user)
      
      return {
        success: true,
        user,
        cached: false
      }
    } catch (error) {
      // اگر خطا داد، کش را برگردان
      if (cachedUser) {
        return {
          success: true,
          user: cachedUser,
          cached: true
        }
      }
      
      throw new AuthError('خطا در دریافت اطلاعات کاربر', 'GET_USER_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 11. بررسی وضعیت احراز هویت
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  isAuthenticated: () => {
    const token = storage.get(STORAGE_KEYS.TOKEN)
    const expiresAt = storage.get(STORAGE_KEYS.EXPIRES_AT)
    
    if (!token) return false
    
    // اگر زمان انقضا داریم و منقضی شده
    if (expiresAt && isTokenExpired(expiresAt)) {
      return false
    }
    
    return true
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👤 12. دریافت کاربر از کش
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedUser: () => {
    return storage.get(STORAGE_KEYS.USER)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 13. دریافت توکن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getToken: () => {
    return storage.get(STORAGE_KEYS.TOKEN)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 14. تغییر رمز عبور
  // POST /api/v1/auth/change-password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  changePassword: async (currentPassword, newPassword) => {
    const currentError = validators.password(currentPassword)
    if (currentError) throw new AuthError(currentError, 'INVALID_CURRENT_PASSWORD')
    
    const newError = validators.password(newPassword)
    if (newError) throw new AuthError(newError, 'INVALID_NEW_PASSWORD')
    
    if (currentPassword === newPassword) {
      throw new AuthError('رمز عبور جدید باید متفاوت از رمز عبور فعلی باشد', 'SAME_PASSWORD')
    }
    
    const strength = validators.passwordStrength(newPassword)
    if (strength.score < 3) {
      throw new AuthError('رمز عبور جدید ضعیف است', 'WEAK_PASSWORD')
    }
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      
      return {
        success: true,
        message: response.data?.message || 'رمز عبور با موفقیت تغییر کرد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('رمز عبور فعلی اشتباه است', 'WRONG_CURRENT_PASSWORD')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در تغییر رمز عبور', 'CHANGE_PASSWORD_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 15. لاگین با شبکه‌های اجتماعی
  // POST /api/v1/auth/social
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  socialLogin: async (provider, accessToken) => {
    const validProviders = ['google', 'apple', 'facebook']
    
    if (!validProviders.includes(provider)) {
      throw new AuthError('ارائه‌دهنده نامعتبر است', 'INVALID_PROVIDER')
    }
    
    try {
      const response = await api.post('/auth/social', {
        provider,
        accessToken
      })
      
      const { data } = response
      
      if (data.accessToken) {
        saveTokens(data)
        
        if (data.user) {
          storage.set(STORAGE_KEYS.USER, data.user)
        }
        
        return {
          success: true,
          isNewUser: data.isNewUser || false,
          user: data.user,
          accessToken: data.accessToken
        }
      }
      
      return {
        success: true,
        isNewUser: true,
        tempToken: data.tempToken
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('احراز هویت با شبکه اجتماعی ناموفق بود', 'SOCIAL_AUTH_FAILED')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در لاگین با شبکه اجتماعی', 'SOCIAL_LOGIN_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 16. فعال‌سازی Two-Factor Authentication
  // POST /api/v1/auth/2fa/enable
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  enable2FA: async (password) => {
    const passwordError = validators.password(password)
    if (passwordError) throw new AuthError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.post('/auth/2fa/enable', {
        password
      })
      
      const { data } = response
      
      // ذخیره secret برای نمایش به کاربر (QR code)
      return {
        success: true,
        secret: data.secret,
        qrCode: data.qrCode,
        backupCodes: data.backupCodes
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('رمز عبور اشتباه است', 'WRONG_PASSWORD')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در فعال‌سازی 2FA', 'ENABLE_2FA_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 17. غیرفعال‌سازی Two-Factor Authentication
  // POST /api/v1/auth/2fa/disable
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  disable2FA: async (code, password) => {
    if (!code || !/^\d{6}$/.test(code)) {
      throw new AuthError('کد 2FA معتبر نیست', 'INVALID_2FA_CODE')
    }
    
    const passwordError = validators.password(password)
    if (passwordError) throw new AuthError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.post('/auth/2fa/disable', {
        code,
        password
      })
      
      return {
        success: true,
        message: response.data?.message || '2FA با موفقیت غیرفعال شد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('کد یا رمز عبور اشتباه است', 'INVALID_CREDENTIALS')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در غیرفعال‌سازی 2FA', 'DISABLE_2FA_FAILED')
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ 18. تأیید کد 2FA
  // POST /api/v1/auth/2fa/verify
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  verify2FA: async (code, rememberMe = false) => {
    if (!code || !/^\d{6}$/.test(code)) {
      throw new AuthError('کد 2FA معتبر نیست', 'INVALID_2FA_CODE')
    }
    
    try {
      const response = await api.post('/auth/2fa/verify', {
        code
      })
      
      const { data } = response
      
      if (data.accessToken) {
        saveTokens(data, rememberMe)
        
        if (data.user) {
          storage.set(STORAGE_KEYS.USER, data.user)
        }
        
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken
        }
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new AuthError('کد 2FA اشتباه است', 'WRONG_2FA_CODE')
      }
      
      if (response?.status === 429) {
        throw new AuthError('تعداد تلاش‌های شما بیش از حد مجاز است', '2FA_ATTEMPTS_EXCEEDED')
      }
      
      throw new AuthError(response?.data?.message || 'خطا در تأیید 2FA', 'VERIFY_2FA_FAILED')
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 Export کلاس‌های خطا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export { AuthError, ValidationError }
export default authService