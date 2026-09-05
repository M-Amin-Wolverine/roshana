import axios from 'axios'
import authService from './services/authService';  // فایل اصلی

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 تنظیمات اولیه و Config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000,
  retry: 3,
  retryDelay: 1000,
  storageKeys: {
    token: 'token',
    user: 'user',
    refreshToken: 'refreshToken'
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏭 ایجاد instance اصلی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const api = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 متدهای کمکی (Helpers)
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
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  },
  remove: (key) => localStorage.removeItem(key)
}

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 صف درخواست‌ها (در انتظار refresh توکن)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 Interceptor: قبل از ارسال درخواست
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
api.interceptors.request.use(
  (config) => {
    // ➕ اضافه کردن Request ID برای ردیابی
    config.headers['X-Request-ID'] = generateRequestId()
    
    // ⏰ زمان شروع درخواست
    config.metadata = { startTime: Date.now() }

    // 🔐 گرفتن توکن از localStorage
    const token = storage.get(CONFIG.storageKeys.token)
    
    if (token) {
      // ⚠️ چک کردن انقضای توکن
      if (isTokenExpired(token)) {
        return new Promise((resolve, reject) => {
          if (!isRefreshing) {
            isRefreshing = true
            
            // 📡 تلاش برای refresh توکن
            api.post('/auth/refresh', {
              refreshToken: storage.get(CONFIG.storageKeys.refreshToken)
            })
            .then(({ data }) => {
              storage.set(CONFIG.storageKeys.token, data.accessToken)
              storage.set(CONFIG.storageKeys.refreshToken, data.refreshToken)
              config.headers.Authorization = `Bearer ${data.accessToken}`
              processQueue(null, data.accessToken)
              isRefreshing = false
              resolve(config)
            })
            .catch((err) => {
              processQueue(err, null)
              handleAuthError()
              isRefreshing = false
              reject(err)
            })
          } else {
            // 📝 اضافه کردن به صف
            failedQueue.push({ resolve, reject })
          }
        })
      }
      
      config.headers.Authorization = `Bearer ${token}`
    }

    // 🖼️ مدیریت FormData
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    // 🌍 زبان
    config.headers['Accept-Language'] = localStorage.getItem('lang') || 'fa'

    return config
  },
  (error) => Promise.reject(error)
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 Interceptor: بعد از دریافت پاسخ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
api.interceptors.response.use(
  // ✅ در صورت موفقیت
  (response) => {
    const { config, data } = response
    const endTime = Date.now()
    
    // ⏱️ محاسبه زمان پاسخ
    if (config.metadata?.startTime) {
      const duration = endTime - config.metadata.startTime
      if (duration > 5000) {
        console.warn(`⚠️ درخواست کند: ${config.url} - ${duration}ms`)
      }
    }

    // 💾 ذخیره توکن اگر در پاسخ باشد
    if (data.accessToken) {
      storage.set(CONFIG.storageKeys.token, data.accessToken)
    }
    if (data.refreshToken) {
      storage.set(CONFIG.storageKeys.refreshToken, data.refreshToken)
    }

    return response
  },
  
  // ❌ در صورت خطا
  async (error) => {
    const { config, response } = error
    
    // 🌐 خطای شبکه
    if (!response) {
      console.error('🌐 خطای شبکه - اینترنت را بررسی کنید')
      return Promise.reject(new NetworkError('خطای شبکه'))
    }

    // 📊 لاگ خطا
    console.error('❌ خطای API:', {
      url: config?.url,
      status: response.status,
      message: response.data?.message,
      timestamp: new Date().toISOString()
    })

    // 🔐 مدیریت خطای 401
    if (response.status === 401) {
      handleAuthError()
      return Promise.reject(new AuthError(response.data?.message || 'Unauthorized'))
    }

    // 🚫 مدیریت خطای 403
    if (response.status === 403) {
      return Promise.reject(new ForbiddenError(response.data?.message || 'دسترسی غیرمجاز'))
    }

    // 🔁 تلاش مجدد برای خطاهای 5xx
    if (response.status >= 500 && config && !config.__retryCount) {
      config.__retryCount = config.__retryCount || 0
      
      if (config.__retryCount < CONFIG.retry) {
        config.__retryCount += 1
        const delay = CONFIG.retryDelay * Math.pow(2, config.__retryCount - 1)
        
        console.log(`🔁 تلاش مجدد ${config.__retryCount}/${CONFIG.retry} بعد از ${delay}ms`)
        
        return new Promise(resolve => setTimeout(() => resolve(api(config)), delay))
      }
    }

    // 📦 ایجاد خطای سفارشی
    const apiError = new ApiError(
      response.data?.message || 'خطای ناشناخته',
      response.status,
      response.data
    )

    return Promise.reject(apiError)
  }
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 مدیریت خطای احراز هویت
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const handleAuthError = () => {
  storage.remove(CONFIG.storageKeys.token)
  storage.remove(CONFIG.storageKeys.user)
  storage.remove(CONFIG.storageKeys.refreshToken)
  
  // جلوگیری از لوپ ریدایرکت
  if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
    window.location.href = '/login'
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 کلاس‌های خطای سفارشی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
    this.status = 401
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ForbiddenError'
    this.status = 403
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NetworkError'
    this.status = 0
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 متدهای آماده (Wrapper Methods)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // 📤 آپلود فایل با نوار پیشرفت
  upload: (url, file, onProgress = () => {}) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    })
  },
  
  // 📥 دانلود فایل
  download: (url, filename = 'download') => {
    return api.get(url, { responseType: 'blob' })
      .then(response => {
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(new Blob([response.data]))
        link.download = filename
        link.click()
      })
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 متدهای احراز هویت
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    api.post('/logout').finally(handleAuthError)
  },
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getCurrentUser: () => api.get('/auth/me')
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 خروجی‌ها
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// در انتهای api.js، قبل از export، اضافه کنید:
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem(CONFIG.storageKeys.token, token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem(CONFIG.storageKeys.token)
  }
}
export { api, ApiError, AuthError, ForbiddenError, NetworkError }
export default api