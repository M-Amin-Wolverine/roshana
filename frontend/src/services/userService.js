import api from './api'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 کلاس‌های خطای سفارشی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class UserError extends Error {
  constructor(message, code = 'USER_ERROR') {
    super(message)
    this.name = 'UserError'
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

class PermissionError extends Error {
  constructor(message = 'دسترسی غیرمجاز') {
    super(message)
    this.name = 'PermissionError'
    this.code = 'PERMISSION_DENIED'
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 تنظیمات و کلیدهای ذخیره‌سازی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STORAGE_KEYS = {
  USERS_CACHE: 'roshana-users-cache',
  USERS_STATS: 'roshana-users-stats',
  USER_DETAIL: 'roshana-user-detail'
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 دقیقه

const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key, value) => {
    const data = {
      value,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(data))
  },
  getWithExpiry: (key) => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const data = JSON.parse(item)
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key)
        return null
      }
      return data.value
    } catch {
      return null
    }
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
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name)) return 'نام فقط می‌تواند حروف باشد'
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
  
  phone: (phone) => {
    const phoneRegex = /^09\d{9}$/
    if (!phone) return 'شماره موبایل الزامی است'
    if (!phoneRegex.test(phone)) return 'شماره موبایل معتبر نیست'
    return null
  },
  
  nationalCode: (code) => {
    if (!code) return 'کد ملی الزامی است'
    if (!/^\d{10}$/.test(code)) return 'کد ملی باید ۱۰ رقم باشد'
    return null
  },
  
  password: (password) => {
    if (!password) return 'رمز عبور الزامی است'
    if (password.length < 6) return 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    return null
  },
  
  role: (role) => {
    const validRoles = ['admin', 'professor', 'student', 'staff', 'superadmin']
    if (!role) return 'نقش الزامی است'
    if (!validRoles.includes(role)) return 'نقش معتبر نیست'
    return null
  },
  
  userId: (id) => {
    if (!id) return 'شناسه کاربر الزامی است'
    return null
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 اعتبارسنجی داده‌های کاربر
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateUserData = (data, isCreate = false) => {
  const errors = {}
  
  if (isCreate) {
    const firstNameError = validators.firstName(data.firstName)
    if (firstNameError) errors.firstName = firstNameError
    
    const lastNameError = validators.lastName(data.lastName)
    if (lastNameError) errors.lastName = lastNameError
    
    const phoneError = validators.phone(data.phone)
    if (phoneError) errors.phone = phoneError
    
    const emailError = validators.email(data.email)
    if (emailError) errors.email = emailError
    
    const nationalCodeError = validators.nationalCode(data.nationalCode)
    if (nationalCodeError) errors.nationalCode = nationalCodeError
    
    const passwordError = validators.password(data.password)
    if (passwordError) errors.password = passwordError
  }
  
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
  
  if (data.phone !== undefined) {
    const error = validators.phone(data.phone)
    if (error) errors.phone = error
  }
  
  if (data.role !== undefined) {
    const error = validators.role(data.role)
    if (error) errors.role = error
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('خطا در اعتبارسنجی', errors)
  }
  
  return true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 ساخت query string هوشمند
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const buildQueryString = (params) => {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v))
      } else {
        queryParams.append(key, value)
      }
    }
  })
  
  return queryParams.toString()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 سرویس مدیریت کاربران (ویژه ادمین)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const userService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 1. دریافت لیست کاربران
  // GET /api/v1/users
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getUsers: async (params = {}) => {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      verified,
      includeInactive = false
    } = params
    
    // ✅ اعتبارسنجی pagination
    if (page < 1) page = 1
    if (limit < 1) limit = 1
    if (limit > 100) limit = 100
    
    const queryParams = buildQueryString({
      page,
      limit,
      role,
      search,
      status,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      verified,
      includeInactive
    })
    
    try {
      const response = await api.get(`/v1/users?${queryParams}`)
      const { data, meta } = response.data
      
      // 💾 کش کردن نتایج
      storage.set(STORAGE_KEYS.USERS_CACHE, { data, meta, params })
      
      return {
        success: true,
        users: data,
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
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت لیست کاربران',
        'GET_USERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 2. جستجوی پیشرفته کاربران
  // GET /api/v1/users/search
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  searchUsers: async (query, filters = {}) => {
    if (!query || query.trim().length < 2) {
      throw new UserError('عبارت جستجو باید حداقل ۲ کاراکتر باشد', 'INVALID_SEARCH_QUERY')
    }
    
    try {
      const response = await api.get('/v1/users/search', {
        params: { q: query, ...filters }
      })
      
      return {
        success: true,
        results: response.data.results,
        total: response.data.total
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در جستجوی کاربران',
        'SEARCH_USERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👤 3. دریافت یک کاربر خاص
  // GET /api/v1/users/:id
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getUserById: async (id) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.get(`/v1/users/${id}`)
      
      // 💾 کش کردن
      storage.set(`${STORAGE_KEYS.USER_DETAIL}-${id}`, response.data)
      
      return {
        success: true,
        user: response.data
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در دریافت اطلاعات کاربر',
        'GET_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ➕ 4. ایجاد کاربر جدید (ادمین)
  // POST /api/v1/users
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  createUser: async (userData) => {
    // ✅ اعتبارسنجی داده‌ها
    validateUserData(userData, true)
    
    try {
      const response = await api.post('/v1/users', userData)
      
      // پاک کردن کش
      storage.remove(STORAGE_KEYS.USERS_CACHE)
      
      return {
        success: true,
        message: response.data?.message || 'کاربر با موفقیت ایجاد شد',
        user: response.data.user,
        tempPassword: response.data.tempPassword // اگر تولید شده باشد
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 409) {
        throw new UserError('این شماره موبایل یا ایمیل قبلاً ثبت شده است', 'USER_EXISTS')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در ایجاد کاربر',
        'CREATE_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✏️ 5. ویرایش کاربر (ادمین)
  // PUT /api/v1/users/:id
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  updateUser: async (id, userData) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    // ✅ اعتبارسنجی داده‌ها
    validateUserData(userData)
    
    try {
      const response = await api.put(`/v1/users/${id}`, userData)
      
      // پاک کردن کش
      storage.remove(STORAGE_KEYS.USERS_CACHE)
      storage.remove(`${STORAGE_KEYS.USER_DETAIL}-${id}`)
      
      return {
        success: true,
        message: response.data?.message || 'کاربر با موفقیت بروزرسانی شد',
        user: response.data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      if (response?.status === 409) {
        throw new UserError('این ایمیل یا شماره موبایل قبلاً استفاده شده است', 'DUPLICATE_FIELD')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در بروزرسانی کاربر',
        'UPDATE_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗑️ 6. حذف کاربر (ادمین)
  // DELETE /api/v1/users/:id
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deleteUser: async (id, reason = '') => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.delete(`/v1/users/${id}`, {
        data: { reason }
      })
      
      // پاک کردن کش
      storage.remove(STORAGE_KEYS.USERS_CACHE)
      storage.remove(`${STORAGE_KEYS.USER_DETAIL}-${id}`)
      
      return {
        success: true,
        message: response.data?.message || 'کاربر با موفقیت حذف شد'
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      if (response?.status === 403) {
        throw new PermissionError('امکان حذف این کاربر وجود ندارد')
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در حذف کاربر',
        'DELETE_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 7. تغییر نقش کاربر
  // PUT /api/v1/users/:id/role
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  changeUserRole: async (id, role) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    const roleError = validators.role(role)
    if (roleError) throw new UserError(roleError, 'INVALID_ROLE')
    
    try {
      const response = await api.put(`/v1/users/${id}/role`, { role })
      
      return {
        success: true,
        message: response.data?.message || 'نقش کاربر با موفقیت تغییر کرد',
        user: response.data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در تغییر نقش کاربر',
        'CHANGE_ROLE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⏸️ 8. فعال/غیرفعال کردن کاربر
  // PUT /api/v1/users/:id/status
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  toggleUserStatus: async (id, reason = '') => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.put(`/v1/users/${id}/status`, { reason })
      
      return {
        success: true,
        message: response.data?.message || 'وضعیت کاربر تغییر کرد',
        isActive: response.data.isActive,
        user: response.data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در تغییر وضعیت کاربر',
        'TOGGLE_STATUS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚫 9. مسدود کردن کاربر
  // POST /api/v1/users/:id/block
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  blockUser: async (id, reason, duration = null) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    if (!reason || reason.trim().length < 5) {
      throw new UserError('دلیل مسدودسازی الزامی است', 'BLOCK_REASON_REQUIRED')
    }
    
    try {
      const response = await api.post(`/v1/users/${id}/block`, {
        reason,
        duration // به دقیقه، اگر null باشد نامحدود
      })
      
      return {
        success: true,
        message: response.data?.message || 'کاربر مسدود شد',
        blockedUntil: response.data.blockedUntil,
        user: response.data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در مسدود کردن کاربر',
        'BLOCK_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ 10. رفع مسدودی کاربر
  // POST /api/v1/users/:id/unblock
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  unblockUser: async (id) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.post(`/v1/users/${id}/unblock`)
      
      return {
        success: true,
        message: response.data?.message || 'مسدودی کاربر رفع شد',
        user: response.data.user
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 404) {
        throw new UserError('کاربر یافت نشد', 'USER_NOT_FOUND')
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در رفع مسدودی',
        'UNBLOCK_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 11. آمار کلی کاربران
  // GET /api/v1/users/stats
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getStats: async (forceRefresh = false) => {
    // بررسی کش
    if (!forceRefresh) {
      const cachedStats = storage.getWithExpiry(STORAGE_KEYS.USERS_STATS)
      if (cachedStats) {
        return {
          success: true,
          stats: cachedStats,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get('/v1/users/stats')
      
      // 💾 کش کردن
      storage.set(STORAGE_KEYS.USERS_STATS, response.data)
      
      return {
        success: true,
        stats: response.data,
        cached: false
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت آمار',
        'GET_STATS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📈 12. آمار تفصیلی کاربران
  // GET /api/v1/users/stats/detailed
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getDetailedStats: async (period = 'month') => {
    const validPeriods = ['day', 'week', 'month', 'year', 'all']
    if (!validPeriods.includes(period)) {
      throw new UserError('بازه زمانی نامعتبر است', 'INVALID_PERIOD')
    }
    
    try {
      const response = await api.get('/v1/users/stats/detailed', {
        params: { period }
      })
      
      return {
        success: true,
        stats: response.data
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت آمار تفصیلی',
        'GET_DETAILED_STATS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📤 13. صادرات کاربران
  // GET /api/v1/users/export
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  exportUsers: async (filters = {}, format = 'xlsx') => {
    const validFormats = ['xlsx', 'csv', 'pdf']
    if (!validFormats.includes(format)) {
      throw new UserError('فرمت نامعتبر است', 'INVALID_FORMAT')
    }
    
    try {
      const response = await api.get('/v1/users/export', {
        params: { ...filters, format },
        responseType: 'blob'
      })
      
      // دانلود فایل
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-export-${Date.now()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      return {
        success: true,
        message: 'دانلود شروع شد'
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در صادرات کاربران',
        'EXPORT_USERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 14. وارد کردن کاربران (Bulk Import)
  // POST /api/v1/users/import
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  importUsers: async (file, onProgress = () => {}) => {
    if (!file) {
      throw new UserError('لطفاً یک فایل انتخاب کنید', 'NO_FILE')
    }
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      throw new UserError('فرمت فایل باید xlsx، xls یا csv باشد', 'INVALID_FILE_TYPE')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await api.post('/v1/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      })
      
      return {
        success: true,
        message: response.data?.message || 'کاربران با موفقیت وارد شدند',
        imported: response.data.imported,
        failed: response.data.failed,
        errors: response.data.errors
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی فایل', response.data?.errors || {})
      }
      
      throw new UserError(
        response?.data?.message || 'خطا در وارد کردن کاربران',
        'IMPORT_USERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔢 15. عملیات گروهی (Bulk Actions)
  // POST /api/v1/users/bulk
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  bulkAction: async (userIds, action, data = {}) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new UserError('لطفاً حداقل یک کاربر انتخاب کنید', 'NO_USERS_SELECTED')
    }
    
    const validActions = ['delete', 'activate', 'deactivate', 'block', 'changeRole', 'sendEmail']
    if (!validActions.includes(action)) {
      throw new UserError('عملیات نامعتبر است', 'INVALID_ACTION')
    }
    
    try {
      const response = await api.post('/v1/users/bulk', {
        userIds,
        action,
        ...data
      })
      
      // پاک کردن کش
      storage.remove(STORAGE_KEYS.USERS_CACHE)
      
      return {
        success: true,
        message: response.data?.message || 'عملیات با موفقیت انجام شد',
        results: response.data.results,
        failed: response.data.failed
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در عملیات گروهی',
        'BULK_ACTION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 16. دریافت فعالیت‌های کاربر
  // GET /api/v1/users/:id/activities
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getUserActivities: async (id, page = 1, limit = 20) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.get(`/v1/users/${id}/activities`, {
        params: { page, limit }
      })
      
      return {
        success: true,
        activities: response.data.activities,
        pagination: response.data.meta
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت فعالیت‌ها',
        'GET_USER_ACTIVITIES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 17. دریافت جلسات کاربر
  // GET /api/v1/users/:id/sessions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getUserSessions: async (id) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.get(`/v1/users/${id}/sessions`)
      
      return {
        success: true,
        sessions: response.data.sessions,
        currentSessionId: response.data.currentSessionId
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت جلسات',
        'GET_USER_SESSIONS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚪 18. خروج کاربر از یک جلسه
  // DELETE /api/v1/users/:id/sessions/:sessionId
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  revokeUserSession: async (userId, sessionId) => {
    const userIdError = validators.userId(userId)
    if (userIdError) throw new UserError(userIdError, 'INVALID_USER_ID')
    
    if (!sessionId) {
      throw new UserError('شناسه جلسه معتبر نیست', 'INVALID_SESSION_ID')
    }
    
    try {
      const response = await api.delete(`/v1/users/${userId}/sessions/${sessionId}`)
      
      return {
        success: true,
        message: response.data?.message || 'جلسه کاربر پایان یافت'
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در خروج جلسه',
        'REVOKE_SESSION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📧 19. ارسال ایمیل به کاربر
  // POST /api/v1/users/:id/email
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sendEmail: async (id, subject, body, template = null) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    if (!subject || !body) {
      throw new UserError('موضوع و متن ایمیل الزامی است', 'EMAIL_CONTENT_REQUIRED')
    }
    
    try {
      const response = await api.post(`/v1/users/${id}/email`, {
        subject,
        body,
        template
      })
      
      return {
        success: true,
        message: response.data?.message || 'ایمیل ارسال شد'
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در ارسال ایمیل',
        'SEND_EMAIL_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📧 20. ارسال ایمیل گروهی
  // POST /api/v1/users/email/bulk
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sendBulkEmail: async (userIds, subject, body, template = null) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new UserError('لطفاً حداقل یک کاربر انتخاب کنید', 'NO_USERS_SELECTED')
    }
    
    try {
      const response = await api.post('/v1/users/email/bulk', {
        userIds,
        subject,
        body,
        template
      })
      
      return {
        success: true,
        message: response.data?.message || 'ایمیل‌ها در صف ارسال قرار گرفتند',
        queued: response.data.queued,
        failed: response.data.failed
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در ارسال ایمیل گروهی',
        'SEND_BULK_EMAIL_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ 21. تأیید کاربر
  // POST /api/v1/users/:id/verify
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  verifyUser: async (id, documents = null) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    try {
      const response = await api.post(`/v1/users/${id}/verify`, {
        documents
      })
      
      return {
        success: true,
        message: response.data?.message || 'کاربر تأیید شد',
        verified: response.data.verified,
        user: response.data.user
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در تأیید کاربر',
        'VERIFY_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ 22. رد تأیید کاربر
  // POST /api/v1/users/:id/reject
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  rejectUser: async (id, reason) => {
    const idError = validators.userId(id)
    if (idError) throw new UserError(idError, 'INVALID_USER_ID')
    
    if (!reason || reason.trim().length < 10) {
      throw new UserError('دلیل رد تأیید باید حداقل ۱۰ کاراکتر باشد', 'REASON_REQUIRED')
    }
    
    try {
      const response = await api.post(`/v1/users/${id}/reject`, { reason })
      
      return {
        success: true,
        message: response.data?.message || 'تأیید کاربر رد شد',
        user: response.data.user
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در رد تأیید',
        'REJECT_USER_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 23. دریافت لیست نقش‌ها
  // GET /api/v1/users/roles
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getRoles: async () => {
    try {
      const response = await api.get('/v1/users/roles')
      
      return {
        success: true,
        roles: response.data.roles
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت نقش‌ها',
        'GET_ROLES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 24. دریافت لیست کاربران تأیید نشده
  // GET /api/v1/users/pending
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getPendingUsers: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/v1/users/pending', {
        params: { page, limit }
      })
      
      return {
        success: true,
        users: response.data.users,
        pagination: response.data.meta
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت کاربران در انتظار',
        'GET_PENDING_USERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📈 25. گزارش‌گیری کاربران
  // GET /api/v1/users/reports
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getReports: async (type = 'summary', params = {}) => {
    const validTypes = ['summary', 'activity', 'registration', 'verification', 'engagement']
    if (!validTypes.includes(type)) {
      throw new UserError('نوع گزارش نامعتبر است', 'INVALID_REPORT_TYPE')
    }
    
    try {
      const response = await api.get(`/v1/users/reports/${type}`, { params })
      
      return {
        success: true,
        report: response.data
      }
    } catch (error) {
      throw new UserError(
        error.response?.data?.message || 'خطا در دریافت گزارش',
        'GET_REPORT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 26. دریافت کش لیست کاربران
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedUsers: () => {
    return storage.getWithExpiry(STORAGE_KEYS.USERS_CACHE)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 27. دریافت کش آمار
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedStats: () => {
    return storage.getWithExpiry(STORAGE_KEYS.USERS_STATS)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧹 28. پاک کردن کش
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  clearCache: () => {
    storage.remove(STORAGE_KEYS.USERS_CACHE)
    storage.remove(STORAGE_KEYS.USERS_STATS)
    // پاک کردن کش جزئی
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEYS.USER_DETAIL))
      .forEach(key => localStorage.removeItem(key))
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 Export کلاس‌های خطا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export { UserError, ValidationError, PermissionError }
export default userService