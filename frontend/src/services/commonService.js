import api from './api'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 کلاس‌های خطای سفارشی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class CommonError extends Error {
  constructor(message, code = 'COMMON_ERROR') {
    super(message)
    this.name = 'CommonError'
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
  PROVINCES: 'roshana-provinces',
  CITIES: 'roshana-cities',
  FIELDS: 'roshana-fields',
  SETTINGS: 'roshana-settings',
  CATEGORIES: 'roshana-categories'
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 ساعت

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
  getWithExpiry: (key, customDuration = CACHE_DURATION) => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const data = JSON.parse(item)
      if (Date.now() - data.timestamp > customDuration) {
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
// ✅ اعتبارسنجی فایل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB پیش‌فرض
    allowedTypes = [],
    allowedExtensions = []
  } = options
  
  if (!file) {
    return { valid: false, error: 'لطفاً یک فایل انتخاب کنید' }
  }
  
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return { valid: false, error: `حجم فایل نباید بیش از ${maxSizeMB} مگابایت باشد` }
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'فرمت فایل مجاز نیست' }
  }
  
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop().toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: `پسوند فایل باید ${allowedExtensions.join(', ')} باشد` }
    }
  }
  
  return { valid: true }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 فیلتر و مرتب‌سازی آرایه
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const filterAndSort = (items, search, sortBy, sortOrder) => {
  let result = [...items]
  
  // جستجو
  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(item => {
      const name = item.name?.toLowerCase() || ''
      const nameEn = item.nameEn?.toLowerCase() || ''
      const code = item.code?.toLowerCase() || ''
      return name.includes(searchLower) || nameEn.includes(searchLower) || code.includes(searchLower)
    })
  }
  
  // مرتب‌سازی
  if (sortBy) {
    result.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (aVal < bVal) return sortOrder === 'desc' ? 1 : -1
      if (aVal > bVal) return sortOrder === 'desc' ? -1 : 1
      return 0
    })
  }
  
  return result
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 سرویس‌های عمومی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const commonService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏛️ 1. دریافت استان‌ها
  // GET /api/v1/common/provinces
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getProvinces: async (forceRefresh = false) => {
    // بررسی کش
    if (!forceRefresh) {
      const cached = storage.getWithExpiry(STORAGE_KEYS.PROVINCES)
      if (cached) {
        return {
          success: true,
          provinces: cached,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get('/v1/common/provinces')
      const provinces = response.data
      
      // 💾 کش کردن
      storage.set(STORAGE_KEYS.PROVINCES, provinces)
      
      return {
        success: true,
        provinces,
        cached: false
      }
    } catch (error) {
      // برگرداندن کش در صورت خطا
      const cached = storage.get(STORAGE_KEYS.PROVINCES)
      if (cached) {
        return {
          success: true,
          provinces: cached,
          cached: true,
          offline: true
        }
      }
      
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت استان‌ها',
        'GET_PROVINCES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏙️ 2. دریافت شهرها بر اساس استان
  // GET /api/v1/common/cities?province_id=1
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCities: async (provinceId, forceRefresh = false) => {
    if (!provinceId) {
      throw new CommonError('شناسه استان الزامی است', 'PROVINCE_ID_REQUIRED')
    }
    
    const cacheKey = `${STORAGE_KEYS.CITIES}-${provinceId}`
    
    // بررسی کش
    if (!forceRefresh) {
      const cached = storage.getWithExpiry(cacheKey)
      if (cached) {
        return {
          success: true,
          cities: cached,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get(`/v1/common/cities?province_id=${provinceId}`)
      const cities = response.data
      
      // 💾 کش کردن
      storage.set(cacheKey, cities)
      
      return {
        success: true,
        cities,
        cached: false
      }
    } catch (error) {
      const cached = storage.get(cacheKey)
      if (cached) {
        return {
          success: true,
          cities: cached,
          cached: true,
          offline: true
        }
      }
      
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت شهرها',
        'GET_CITIES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 3. جستجوی شهر
  // GET /api/v1/common/cities/search?q=تهران
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  searchCities: async (query, provinceId = null) => {
    if (!query || query.trim().length < 2) {
      throw new CommonError('عبارت جستجو باید حداقل ۲ کاراکتر باشد', 'INVALID_QUERY')
    }
    
    try {
      const params = { q: query }
      if (provinceId) params.province_id = provinceId
      
      const response = await api.get('/v1/common/cities/search', { params })
      
      return {
        success: true,
        cities: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در جستجوی شهر',
        'SEARCH_CITIES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎓 4. دریافت رشته‌های تحصیلی
  // GET /api/v1/common/fields
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getFields: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = storage.getWithExpiry(STORAGE_KEYS.FIELDS)
      if (cached) {
        return {
          success: true,
          fields: cached,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get('/v1/common/fields')
      const fields = response.data
      
      storage.set(STORAGE_KEYS.FIELDS, fields)
      
      return {
        success: true,
        fields,
        cached: false
      }
    } catch (error) {
      const cached = storage.get(STORAGE_KEYS.FIELDS)
      if (cached) {
        return {
          success: true,
          fields: cached,
          cached: true,
          offline: true
        }
      }
      
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت رشته‌های تحصیلی',
        'GET_FIELDS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎓 5. دریافت گروه‌های آموزشی
  // GET /api/v1/common/groups
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getGroups: async (fieldId = null) => {
    try {
      const params = fieldId ? { field_id: fieldId } : {}
      const response = await api.get('/v1/common/groups', { params })
      
      return {
        success: true,
        groups: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت گروه‌های آموزشی',
        'GET_GROUPS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📚 6. دریافت مقاطع تحصیلی
  // GET /api/v1/common/degrees
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getDegrees: async () => {
    try {
      const response = await api.get('/v1/common/degrees')
      
      return {
        success: true,
        degrees: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت مقاطع تحصیلی',
        'GET_DEGREES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📂 7. دریافت دسته‌بندی‌ها
  // GET /api/v1/common/categories
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCategories: async (type = 'general', forceRefresh = false) => {
    const cacheKey = `${STORAGE_KEYS.CATEGORIES}-${type}`
    
    if (!forceRefresh) {
      const cached = storage.getWithExpiry(cacheKey)
      if (cached) {
        return {
          success: true,
          categories: cached,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get('/v1/common/categories', {
        params: { type }
      })
      
      const categories = response.data
      storage.set(cacheKey, categories)
      
      return {
        success: true,
        categories,
        cached: false
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت دسته‌بندی‌ها',
        'GET_CATEGORIES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📤 8. آپلود فایل عمومی
  // POST /api/v1/common/upload
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  uploadFile: async (file, options = {}) => {
    const {
      folder = 'general',
      maxSize = 10 * 1024 * 1024,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      onProgress = () => {}
    } = options
    
    // ✅ اعتبارسنجی فایل
    const validation = validateFile(file, { maxSize, allowedTypes, allowedExtensions })
    if (!validation.valid) {
      throw new CommonError(validation.error, 'INVALID_FILE')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    
    try {
      const response = await api.post('/v1/common/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      })
      
      return {
        success: true,
        file: response.data.file,
        url: response.data.url,
        filename: response.data.filename,
        size: response.data.size,
        mimeType: response.data.mimeType
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 413) {
        throw new CommonError('حجم فایل بیش از حد مجاز است', 'FILE_TOO_LARGE')
      }
      
      if (response?.status === 415) {
        throw new CommonError('فرمت فایل پشتیبانی نمی‌شود', 'UNSUPPORTED_FORMAT')
      }
      
      throw new CommonError(
        response?.data?.message || 'خطا در آپلود فایل',
        'UPLOAD_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📤 9. آپلود چند فایل
  // POST /api/v1/common/upload/multiple
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  uploadMultipleFiles: async (files, options = {}) => {
    if (!Array.isArray(files) || files.length === 0) {
      throw new CommonError('لطفاً حداقل یک فایل انتخاب کنید', 'NO_FILES')
    }
    
    const { folder = 'general', maxSize = 10 * 1024 * 1024, onProgress = () => {} } = options
    
    const results = {
      success: [],
      failed: []
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateFile(file, { maxSize })
      
      if (!validation.valid) {
        results.failed.push({
          name: file.name,
          error: validation.error
        })
        continue
      }
      
      try {
        const result = await commonService.uploadFile(file, { folder, onProgress: (percent) => {
          const overallProgress = Math.round(((i + percent / 100) / files.length) * 100)
          onProgress(overallProgress)
        }})
        results.success.push(result)
      } catch (error) {
        results.failed.push({
          name: file.name,
          error: error.message
        })
      }
    }
    
    return {
      success: results.success.length > 0,
      uploaded: results.success,
      failed: results.failed,
      totalUploaded: results.success.length,
      totalFailed: results.failed.length
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗑️ 10. حذف فایل
  // DELETE /api/v1/common/files/:filename
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deleteFile: async (filename) => {
    if (!filename) {
      throw new CommonError('نام فایل الزامی است', 'FILENAME_REQUIRED')
    }
    
    try {
      const response = await api.delete(`/v1/common/files/${encodeURIComponent(filename)}`)
      
      return {
        success: true,
        message: response.data?.message || 'فایل حذف شد'
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در حذف فایل',
        'DELETE_FILE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ 11. دریافت تنظیمات سیستم
  // GET /api/v1/common/settings
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getSettings: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = storage.getWithExpiry(STORAGE_KEYS.SETTINGS, 60 * 60 * 1000) // 1 ساعت
      if (cached) {
        return {
          success: true,
          settings: cached,
          cached: true
        }
      }
    }
    
    try {
      const response = await api.get('/v1/common/settings')
      const settings = response.data
      
      storage.set(STORAGE_KEYS.SETTINGS, settings)
      
      return {
        success: true,
        settings,
        cached: false
      }
    } catch (error) {
      const cached = storage.get(STORAGE_KEYS.SETTINGS)
      if (cached) {
        return {
          success: true,
          settings: cached,
          cached: true,
          offline: true
        }
      }
      
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت تنظیمات',
        'GET_SETTINGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✏️ 12. بروزرسانی تنظیمات سیستم (فقط ادمین)
  // PUT /api/v1/common/settings
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  updateSettings: async (settings) => {
    if (!settings || typeof settings !== 'object') {
      throw new CommonError('تنظیمات معتبر نیست', 'INVALID_SETTINGS')
    }
    
    try {
      const response = await api.put('/v1/common/settings', settings)
      
      // به‌روزرسانی کش
      storage.set(STORAGE_KEYS.SETTINGS, response.data)
      
      return {
        success: true,
        message: response.data?.message || 'تنظیمات بروزرسانی شد',
        settings: response.data
      }
    } catch (error) {
      const { response } = error
      
      if (response?.status === 403) {
        throw new CommonError('دسترسی غیرمجاز', 'PERMISSION_DENIED')
      }
      
      if (response?.status === 422) {
        throw new ValidationError('خطا در اعتبارسنجی', response.data?.errors || {})
      }
      
      throw new CommonError(
        response?.data?.message || 'خطا در بروزرسانی تنظیمات',
        'UPDATE_SETTINGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📜 13. دریافت لاگ‌های سیستم (فقط ادمین)
  // GET /api/v1/common/logs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getLogs: async (params = {}) => {
    const { page = 1, limit = 50, level, startDate, endDate } = params
    
    try {
      const response = await api.get('/v1/common/logs', {
        params: { page, limit, level, startDate, endDate }
      })
      
      return {
        success: true,
        logs: response.data.logs,
        pagination: response.data.meta
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت لاگ‌ها',
        'GET_LOGS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 14. دریافت آمار کلی سیستم
  // GET /api/v1/common/stats
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getStats: async () => {
    try {
      const response = await api.get('/v1/common/stats')
      
      return {
        success: true,
        stats: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت آمار',
        'GET_STATS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌐 15. دریافت زبان‌های سیستم
  // GET /api/v1/common/languages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getLanguages: async () => {
    try {
      const response = await api.get('/v1/common/languages')
      
      return {
        success: true,
        languages: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت زبان‌ها',
        'GET_LANGUAGES_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 16. دریافت تعطیلات رسمی
  // GET /api/v1/common/holidays
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getHolidays: async (year = new Date().getFullYear()) => {
    try {
      const response = await api.get('/v1/common/holidays', {
        params: { year }
      })
      
      return {
        success: true,
        holidays: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت تعطیلات',
        'GET_HOLIDAYS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 17. دریافت نسخه اپلیکیشن
  // GET /api/v1/common/version
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getVersion: async () => {
    try {
      const response = await api.get('/v1/common/version')
      
      return {
        success: true,
        version: response.data.version,
        minVersion: response.data.minVersion,
        updateRequired: response.data.updateRequired,
        releaseNotes: response.data.releaseNotes,
        downloadUrl: response.data.downloadUrl
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت نسخه',
        'GET_VERSION_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📞 18. دریافت اطلاعات تماس
  // GET /api/v1/common/contact
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getContactInfo: async () => {
    try {
      const response = await api.get('/v1/common/contact')
      
      return {
        success: true,
        contact: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت اطلاعات تماس',
        'GET_CONTACT_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 19. ارسال پیام به پشتیبانی
  // POST /api/v1/common/contact
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sendContactMessage: async (data) => {
    const { name, email, subject, message, attachments } = data
    
    if (!name || !email || !subject || !message) {
      throw new CommonError('تمام فیلدها الزامی هستند', 'FIELDS_REQUIRED')
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new CommonError('ایمیل معتبر نیست', 'INVALID_EMAIL')
    }
    
    if (message.length < 10) {
      throw new CommonError('پیام باید حداقل ۱۰ کاراکتر باشد', 'MESSAGE_TOO_SHORT')
    }
    
    try {
      const response = await api.post('/v1/common/contact', {
        name,
        email,
        subject,
        message,
        attachments
      })
      
      return {
        success: true,
        message: response.data?.message || 'پیام با موفقیت ارسال شد',
        ticketId: response.data?.ticketId
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در ارسال پیام',
        'SEND_MESSAGE_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔔 20. دریافت اعلان‌های عمومی
  // GET /api/v1/common/announcements
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getAnnouncements: async (params = {}) => {
    const { page = 1, limit = 10, type, active } = params
    
    try {
      const response = await api.get('/v1/common/announcements', {
        params: { page, limit, type, active }
      })
      
      return {
        success: true,
        announcements: response.data.announcements,
        pagination: response.data.meta
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت اعلان‌ها',
        'GET_ANNOUNCEMENTS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📜 21. دریافت سوالات متداول
  // GET /api/v1/common/faqs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getFAQs: async (category = null) => {
    try {
      const params = category ? { category } : {}
      const response = await api.get('/v1/common/faqs', { params })
      
      return {
        success: true,
        faqs: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت سوالات متداول',
        'GET_FAQS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📄 22. دریافت قوانین و مقررات
  // GET /api/v1/common/terms
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getTerms: async (type = 'terms') => {
    const validTypes = ['terms', 'privacy', 'cookies', 'refund']
    if (!validTypes.includes(type)) {
      throw new CommonError('نوع سند نامعتبر است', 'INVALID_TYPE')
    }
    
    try {
      const response = await api.get(`/v1/common/terms/${type}`)
      
      return {
        success: true,
        content: response.data.content,
        version: response.data.version,
        updatedAt: response.data.updatedAt
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت قوانین',
        'GET_TERMS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖼️ 23. دریافت اسلایدر‌ها
  // GET /api/v1/common/sliders
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getSliders: async (position = 'home') => {
    try {
      const response = await api.get('/v1/common/sliders', {
        params: { position }
      })
      
      return {
        success: true,
        sliders: response.data
      }
    } catch (error) {
      throw new CommonError(
        error.response?.data?.message || 'خطا در دریافت اسلایدرها',
        'GET_SLIDERS_FAILED'
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 24. دریافت کش استان‌ها
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedProvinces: () => {
    return storage.getWithExpiry(STORAGE_KEYS.PROVINCES)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 25. دریافت کش شهرها
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedCities: (provinceId) => {
    return storage.getWithExpiry(`${STORAGE_KEYS.CITIES}-${provinceId}`)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 26. دریافت کش تنظیمات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCachedSettings: () => {
    return storage.getWithExpiry(STORAGE_KEYS.SETTINGS, 60 * 60 * 1000)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧹 27. پاک کردن تمام کش
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  clearCache: () => {
    Object.values(STORAGE_KEYS).forEach(key => storage.remove(key))
    // پاک کردن کش شهرها
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEYS.CITIES))
      .forEach(key => localStorage.removeItem(key))
    // پاک کردن کش دسته‌بندی‌ها
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEYS.CATEGORIES))
      .forEach(key => localStorage.removeItem(key))
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 28. همگام‌سازی داده‌های آفلاین
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  syncOfflineData: async () => {
    const results = {
      provinces: false,
      cities: false,
      fields: false,
      settings: false,
      categories: false
    }
    
    try {
      const [provincesResult, fieldsResult, settingsResult] = await Promise.all([
        commonService.getProvinces(true),
        commonService.getFields(true),
        commonService.getSettings(true)
      ])
      
      results.provinces = provincesResult.success
      results.fields = fieldsResult.success
      results.settings = settingsResult.success
      
      return {
        success: true,
        results
      }
    } catch (error) {
      return {
        success: false,
        results,
        error: error.message
      }
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 Export کلاس‌های خطا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export { CommonError, ValidationError }
export default commonService