import api from './api'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 کلاس‌های خطای سفارشی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ProfileError extends Error {
  constructor(message, code = 'PROFILE_ERROR') {
    super(message)
    this.name = 'ProfileError'
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
  USER: 'roshana-user',
  AVATAR: 'roshana-avatar',
  SETTINGS: 'roshana-settings'
}

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
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove: (key) => localStorage.removeItem(key)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ اعتبارسنجی ورودی (Validation)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validators = {
  firstName: (name) => {
    if (!name || name.trim().length < 2) return 'نام باید حداقل ۲ کاراکتر باشد'
    if (name.length > 50) return 'نام نباید بیش از ۵۰ کاراکتر باشد'
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name)) return 'نام فقط می‌تواند حروف فارسی یا انگلیسی باشد'
    return null
  },
  
  lastName: (name) => {
    if (!name || name.trim().length < 2) return 'نام خانوادگی باید حداقل ۲ کاراکتر باشد'
    if (name.length > 50) return 'نام خانوادگی نباید بیش از ۵۰ کاراکتر باشد'
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name)) return 'نام خانوادگی فقط می‌تواند حروف باشد'
    return null
  },
  
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'ایمیل الزامی است'
    if (!emailRegex.test(email)) return 'ایمیل معتبر نیست'
    return null
  },
  
  nationalCode: (code) => {
    if (!code) return null // اختیاری
    if (!/^\d{10}$/.test(code)) return 'کد ملی باید ۱۰ رقم باشد'
    return null
  },
  
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
  },
  
  bio: (bio) => {
    if (bio && bio.length > 500) return 'بیوگرافی نباید بیش از ۵۰۰ کاراکتر باشد'
    return null
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 اعتبارسنجی داده‌های پروفایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateProfileData = (data) => {
  const errors = {}
  
  if (data.firstName !== undefined) {
    const error = validators.firstName(data.firstName)
    if (error) errors.firstName = error
  }
  
  if (data.lastName !== undefined) {
    const error = validators.lastName(data.lastName)
    if (error) errors.lastName = error
  }
  
  if (data.email !== undefined) {
    const error = validators.email(data.email)
    if (error) errors.email = error
  }
  
  if (data.nationalCode !== undefined) {
    const error = validators.nationalCode(data.nationalCode)
    if (error) errors.nationalCode = error
  }
  
  if (data.phone !== undefined) {
    const error = validators.phone(data.phone)
    if (error) errors.phone = error
  }
  
  if (data.bio !== undefined) {
    const error = validators.bio(data.bio)
    if (error) errors.bio = error
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('خطا در اعتبارسنجی', errors)
  }
  
  return true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 محاسبه درصد تکمیل پروفایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const calculateProfileCompletion = (profile) => {
  const fields = [
    { key: 'firstName', weight: 10 },
    { key: 'lastName', weight: 10 },
    { key: 'email', weight: 10 },
    { key: 'phone', weight: 10 },
    { key: 'nationalCode', weight: 10 },
    { key: 'avatar', weight: 15 },
    { key: 'bio', weight: 5 },
    { key: 'birthDate', weight: 10 },
    { key: 'address', weight: 5 },
    { key: 'emergencyContact', weight: 15 }
  ]
  
  let totalWeight = 0
  let filledWeight = 0
  
  fields.forEach(field => {
    totalWeight += field.weight
    const value = profile[field.key]
    if (value && (typeof value === 'string' ? value.trim() : true)) {
      filledWeight += field.weight
    }
  })
  
  const percentage = Math.round((filledWeight / totalWeight) * 100)
  
  return {
    percentage,
    isComplete: percentage === 100,
    missingFields: fields
      .filter(field => {
        const value = profile[field.key]
        return !value || (typeof value === 'string' && !value.trim())
      })
      .map(field => field.key)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 سرویس پروفایل کاربر
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const profileService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📄 1. دریافت اطلاعات پروفایل کاربر جاری
  // GET /api/v1/profile
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getProfile: async () => {
    try {
      const response = await api.get('/v1/profile')
      const profile = response.data
      
      // 💾 کش کردن پروفایل
      storage.set(STORAGE_KEYS.USER, profile)
      
      // 📊 محاسبه درصد تکمیل
      const completion = calculateProfileCompletion(profile)
      
      return {
        success: true,
        profile,
        completion
      }
    } catch (error) {
      const { response } = error
      
      // اگر خطا داد، کش را برگردان
      const cachedProfile = storage.get(STORAGE_KEYS.USER)
      if (cachedProfile) {
        return {
          success: true,
          profile: cachedProfile,
          cached: true,
          completion: calculateProfileCompletion(cachedProfile)
        }
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در دریافت پروفایل',
        'GET_PROFILE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 2. بروزرسانی اطلاعات پروفایل
  // PUT /api/v1/profile
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  updateProfile: async (data) => {
    // ✅ اعتبارسنجی داده‌ها
    validateProfileData(data)
    
    try {
      const response = await api.put('/v1/profile', data)
      const updatedProfile = response.data
      
      // 💾 به‌روزرسانی کش
      const cachedProfile = storage.get(STORAGE_KEYS.USER)
      const newProfile = { ...cachedProfile, ...updatedProfile }
      storage.set(STORAGE_KEYS.USER, newProfile)
      
      const completion = calculateProfileCompletion(newProfile)
      
      return {
        success: true,
        message: response.data?.message || 'پروفایل با موفقیت بروزرسانی شد',
        profile: updatedProfile,
        completion
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      if (response?.status === 409) {
        throw new ProfileError('این ایمیل قبلاً استفاده شده است', 'EMAIL_EXISTS')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در بروزرسانی پروفایل',
        'UPDATE_PROFILE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 3. تغییر رمز عبور
  // PUT /api/v1/profile/password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  changePassword: async (currentPassword, newPassword) => {
    // ✅ اعتبارسنجی رمز فعلی
    const currentError = validators.password(currentPassword)
    if (currentError) throw new ProfileError(currentError, 'INVALID_CURRENT_PASSWORD')
    
    // ✅ اعتبارسنجی رمز جدید
    const newError = validators.password(newPassword)
    if (newError) throw new ProfileError(newError, 'INVALID_NEW_PASSWORD')
    
    // ✅ بررسی یکسان نبودن رمزها
    if (currentPassword === newPassword) {
      throw new ProfileError(
        'رمز عبور جدید باید متفاوت از رمز عبور فعلی باشد',
        'SAME_PASSWORD'
      )
    }
    
    // ✅ بررسی قدرت رمز عبور جدید
    const strength = validators.passwordStrength(newPassword)
    if (strength.score < 3) {
      throw new ProfileError(
        'رمز عبور جدید ضعیف است. از حروف بزرگ، کوچک، اعداد و نمادها استفاده کنید',
        'WEAK_PASSWORD'
      )
    }
    
    try {
      const response = await api.put('/v1/profile/password', {
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
        throw new ProfileError('رمز عبور فعلی اشتباه است', 'WRONG_CURRENT_PASSWORD')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در تغییر رمز عبور',
        'CHANGE_PASSWORD_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖼️ 4. آپلود عکس پروفایل
  // POST /api/v1/profile/avatar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  uploadAvatar: async (file, onProgress = () => {}) => {
    // ✅ اعتبارسنجی فایل
    if (!file) {
      throw new ProfileError('لطفاً یک فایل انتخاب کنید', 'NO_FILE')
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new ProfileError('فرمت فایل باید jpg، png، gif یا webp باشد', 'INVALID_FILE_TYPE')
    }
    
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize ) {
      throw new ProfileError('حجم عکس نباید بیش از ۵ مگابایت باشد', 'FILE_TOO_LARGE')
    }
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const response = await api.post('/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      })
      
      const { avatar } = response.data
      
      // 💾 به‌روزرسانی کش
      const cachedProfile = storage.get(STORAGE_KEYS.USER)
      if (cachedProfile) {
        cachedProfile.avatar = avatar
        storage.set(STORAGE_KEYS.USER, cachedProfile)
      }
      
      return {
        success: true,
        message: 'عکس پروفایل با موفقیت تغییر کرد',
        avatar
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 413) {
        throw new ProfileError('حجم فایل بیش از حد مجاز است', 'FILE_TOO_LARGE')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در آپلود عکس پروفایل',
        'UPLOAD_AVATAR_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗑️ 5. حذف عکس پروفایل
  // DELETE /api/v1/profile/avatar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deleteAvatar: async () => {
    try {
      const response = await api.delete('/v1/profile/avatar')
      
      // 💾 به‌روزرسانی کش
      const cachedProfile = storage.get(STORAGE_KEYS.USER)
      if (cachedProfile) {
        cachedProfile.avatar = null
        storage.set(STORAGE_KEYS.USER, cachedProfile)
      }
      
      return {
        success: true,
        message: response.data?.message || 'عکس پروفایل حذف شد'
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در حذف عکس پروفایل',
        'DELETE_AVATAR_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔔 6. دریافت تنظیمات اعلان‌ها
  // GET /api/v1/profile/notifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/v1/profile/notifications')
      
      // 💾 کش کردن تنظیمات
      storage.set(STORAGE_KEYS.SETTINGS, response.data)
      
      return {
        success: true,
        settings: response.data
      }
    } catch (error) {
      // برگرداندن کش در صورت خطا
      const cachedSettings = storage.get(STORAGE_KEYS.SETTINGS)
      if (cachedSettings) {
        return {
          success: true,
          settings: cachedSettings,
          cached: true
        }
      }
      
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت تنظیمات اعلان‌ها',
        'GET_NOTIFICATION_SETTINGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✏️ 7. بروزرسانی تنظیمات اعلان‌ها
  // PUT /api/v1/profile/notifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  updateNotificationSettings: async (settings) => {
    // ✅ اعتبارسنجی ساختار تنظیمات
    const validKeys = [
      'emailNotifications',
      'smsNotifications',
      'pushNotifications',
      'marketingEmails',
      'securityAlerts',
      'courseUpdates',
      'newMessages',
      'weeklyDigest'
    ]
    
    const invalidKeys = Object.keys(settings).filter(key => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      throw new ProfileError(`تنظیمات نامعتبر: ${invalidKeys.join(', ')}`, 'INVALID_SETTINGS')
    }
    
    try {
      const response = await api.put('/v1/profile/notifications', settings)
      
      // 💾 به‌روزرسانی کش
      const cachedSettings = storage.get(STORAGE_KEYS.SETTINGS)
      const newSettings = { ...cachedSettings, ...settings }
      storage.set(STORAGE_KEYS.SETTINGS, newSettings)
      
      return {
        success: true,
        message: response.data?.message || 'تنظیمات اعلان‌ها بروزرسانی شد',
        settings: newSettings
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در بروزرسانی تنظیمات اعلان‌ها',
        'UPDATE_NOTIFICATION_SETTINGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📜 8. دریافت فعالیت‌های کاربر (لاگ‌ها)
  // GET /api/v1/profile/activities
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getActivities: async (page = 1, limit = 20) => {
    // ✅ اعتبارسنجی ورودی
    if (page < 1) page = 1
    if (limit < 1) limit = 1
    if (limit > 100) limit = 100
    
    try {
      const response = await api.get('/v1/profile/activities', {
        params: { page, limit }
      })
      
      const { data, meta } = response.data
      
      return {
        success: true,
        activities: data,
        pagination: {
          currentPage: meta?.page || page,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.total || 0,
          itemsPerPage: meta?.limit || limit,
          hasNextPage: meta?.hasNext || false,
          hasPrevPage: meta?.hasPrev || false
        }
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت فعالیت‌ها',
        'GET_ACTIVITIES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 9. دریافت تنظیمات امنیتی
  // GET /api/v1/profile/security
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getSecuritySettings: async () => {
    try {
      const response = await api.get('/v1/profile/security')
      
      return {
        success: true,
        security: response.data
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت تنظیمات امنیتی',
        'GET_SECURITY_SETTINGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 10. فعال‌سازی Two-Factor Authentication
  // POST /api/v1/profile/security/2fa/enable
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  enable2FA: async (password) => {
    const passwordError = validators.password(password)
    if (passwordError) throw new ProfileError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.post('/v1/profile/security/2fa/enable', {
        password
      })
      
      return {
        success: true,
        secret: response.data.secret,
        qrCode: response.data.qrCode,
        backupCodes: response.data.backupCodes,
        message: '2FA با موفقیت فعال شد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new ProfileError('رمز عبور اشتباه است', 'WRONG_PASSWORD')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در فعال‌سازی 2FA',
        'ENABLE_2FA_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 11. غیرفعال‌سازی Two-Factor Authentication
  // POST /api/v1/profile/security/2fa/disable
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  disable2FA: async (code, password) => {
    if (!code || !/^\d{6}$/.test(code)) {
      throw new ProfileError('کد 2FA معتبر نیست', 'INVALID_2FA_CODE')
    }
    
    const passwordError = validators.password(password)
    if (passwordError) throw new ProfileError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.post('/v1/profile/security/2fa/disable', {
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
        throw new ProfileError('کد یا رمز عبور اشتباه است', 'INVALID_CREDENTIALS')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در غیرفعال‌سازی 2FA',
        'DISABLE_2FA_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 12. دریافت دستگاه‌های متصل
  // GET /api/v1/profile/sessions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getSessions: async () => {
    try {
      const response = await api.get('/v1/profile/sessions')
      
      return {
        success: true,
        sessions: response.data.sessions,
        currentSessionId: response.data.currentSessionId
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت دستگاه‌ها',
        'GET_SESSIONS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗑️ 13. خروج از یک دستگاه
  // DELETE /api/v1/profile/sessions/:sessionId
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  revokeSession: async (sessionId) => {
    if (!sessionId) {
      throw new ProfileError('شناسه جلسه معتبر نیست', 'INVALID_SESSION_ID')
    }
    
    try {
      const response = await api.delete(`/v1/profile/sessions/${sessionId}`)
      
      return {
        success: true,
        message: response.data?.message || 'دستگاه از لیست خارج شد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new ProfileError('جلسه یافت نشد', 'SESSION_NOT_FOUND')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در خروج از دستگاه',
        'REVOKE_SESSION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚪 14. خروج از همه دستگاه‌ها
  // DELETE /api/v1/profile/sessions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  revokeAllSessions: async () => {
    try {
      const response = await api.delete('/v1/profile/sessions')
      
      return {
        success: true,
        message: response.data?.message || 'از همه دستگاه‌ها خارج شدید'
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در خروج از همه دستگاه‌ها',
        'REVOKE_ALL_SESSIONS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 15. دریافت حساب‌های متصل
  // GET /api/v1/profile/connected-accounts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getConnectedAccounts: async () => {
    try {
      const response = await api.get('/v1/profile/connected-accounts')
      
      return {
        success: true,
        accounts: response.data.accounts
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت حساب‌های متصل',
        'GET_CONNECTED_ACCOUNTS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 16. اتصال به حساب اجتماعی
  // POST /api/v1/profile/connected-accounts/connect
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  connectAccount: async (provider) => {
    const validProviders = ['google', 'apple', 'facebook', 'linkedin']
    
    if (!validProviders.includes(provider)) {
      throw new ProfileError('ارائه‌دهنده نامعتبر است', 'INVALID_PROVIDER')
    }
    
    try {
      const response = await api.post('/v1/profile/connected-accounts/connect', {
        provider
      })
      
      // اگر نیاز به redirect باشد
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl
        return { redirecting: true }
      }
      
      return {
        success: true,
        account: response.data.account
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در اتصال حساب',
        'CONNECT_ACCOUNT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 17. قطع اتصال حساب اجتماعی
  // DELETE /api/v1/profile/connected-accounts/:provider
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  disconnectAccount: async (provider) => {
    const validProviders = ['google', 'apple', 'facebook', 'linkedin']
    
    if (!validProviders.includes(provider)) {
      throw new ProfileError('ارائه‌دهنده نامعتبر است', 'INVALID_PROVIDER')
    }
    
    try {
      const response = await api.delete(`/v1/profile/connected-accounts/${provider}`)
      
      return {
        success: true,
        message: response.data?.message || 'حساب با موفقیت قطع شد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 400) {
        throw new ProfileError(
          'نمی‌توانید آخرین روش ورود را قطع کنید',
          'CANNOT_DISCONNECT_LAST_PROVIDER'
        )
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در قطع اتصال حساب',
        'DISCONNECT_ACCOUNT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📦 18. درخواست خروجی داده‌ها
  // POST /api/v1/profile/export
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  requestDataExport: async () => {
    try {
      const response = await api.post('/v1/profile/export')
      
      return {
        success: true,
        message: response.data?.message || 'درخواست خروجی داده‌ها ثبت شد',
        estimatedTime: response.data?.estimatedTime
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در درخواست خروجی داده‌ها',
        'REQUEST_EXPORT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⬇️ 19. دانلود داده‌های خروجی
  // GET /api/v1/profile/export/:exportId
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  downloadExportedData: async (exportId) => {
    if (!exportId) {
      throw new ProfileError('شناسه خروجی معتبر نیست', 'INVALID_EXPORT_ID')
    }
    
    try {
      const response = await api.get(`/v1/profile/export/${exportId}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `roshana-data-${exportId}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      return {
        success: true,
        message: 'دانلود شروع شد'
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دانلود داده‌ها',
        'DOWNLOAD_EXPORT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗑️ 20. درخواست حذف حساب
  // DELETE /api/v1/profile
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  requestAccountDeletion: async (password, reason = '') => {
    const passwordError = validators.password(password)
    if (passwordError) throw new ProfileError(passwordError, 'INVALID_PASSWORD')
    
    try {
      const response = await api.delete('/v1/profile', {
        data: { password, reason }
      })
      
      // پاک کردن localStorage
      localStorage.clear()
      
      return {
        success: true,
        message: response.data?.message || 'درخواست حذف حساب ثبت شد',
        deletionDate: response.data?.deletionDate
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 401) {
        throw new ProfileError('رمز عبور اشتباه است', 'WRONG_PASSWORD')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در درخواست حذف حساب',
        'REQUEST_DELETION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ 21. لغو درخواست حذف حساب
  // POST /api/v1/profile/deletion/cancel
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cancelAccountDeletion: async () => {
    try {
      const response = await api.post('/v1/profile/deletion/cancel')
      
      return {
        success: true,
        message: response.data?.message || 'درخواست حذف حساب لغو شد'
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در لغو حذف حساب',
        'CANCEL_DELETION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👤 22. دریافت پروفایل عمومی کاربر
  // GET /api/v1/profile/public/:userId
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getPublicProfile: async (userId) => {
    if (!userId) {
      throw new ProfileError('شناسه کاربر معتبر نیست', 'INVALID_USER_ID')
    }
    
    try {
      const response = await api.get(`/v1/profile/public/${userId}`)
      
      return {
        success: true,
        profile: response.data
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new ProfileError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new ProfileError(
        response?.data?.message || 'خطا در دریافت پروفایل عمومی',
        'GET_PUBLIC_PROFILE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 23. دریافت آمار پروفایل
  // GET /api/v1/profile/stats
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getProfileStats: async () => {
    try {
      const response = await api.get('/v1/profile/stats')
      
      return {
        success: true,
        stats: response.data
      }
    } catch (error) {
      throw new ProfileError(
        error.response?.data?.message || 'خطا در دریافت آمار',
        'GET_STATS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 24. دریافت پروفایل از کش
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedProfile: () => {
    return storage.get(STORAGE_KEYS.USER)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 25. محاسبه درصد تکمیل پروفایل (برای کش)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getProfileCompletion: () => {
    const profile = storage.get(STORAGE_KEYS.USER)
    if (!profile) return null
    
    return calculateProfileCompletion(profile)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧹 26. پاک کردن کش پروفایل
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  clearCache: () => {
    storage.remove(STORAGE_KEYS.USER)
    storage.remove(STORAGE_KEYS.AVATAR)
    storage.remove(STORAGE_KEYS.SETTINGS)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 Export کلاس‌های خطا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export { ProfileError, ValidationError }
export default profileService