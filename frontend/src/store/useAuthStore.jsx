// store/useAuthStore.jsx - استور جامع احراز هویت
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api } from '../services/api'
//import { Navigate } from 'react-router-dom'


// ==================== کانفیگ اولیه ====================
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  roles: [],
  permissions: [],
  lastActivity: Date.now(),
  sessionExpiresAt: null,
}

// ==================== استور اصلی ====================
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ==================== حالت اولیه ====================
      ...initialState,

      // ==================== احراز هویت ====================
      
      // 🔐 ورود به سیستم
      login: async (credentials, rememberMe = true) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/login', {
            email: credentials.email,
            password: credentials.password,
            rememberMe,
          })

          const { 
            user, 
            token, 
            refreshToken,
            roles, 
            permissions,
            expiresAt 
          } = response.data

          set({
            user,
            token,
            refreshToken,
            roles,
            permissions,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: Date.now(),
            sessionExpiresAt: expiresAt,
          })

          // تنظیم توکن در هدرهای پیش‌فرض
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'خطا در ورود به سیستم'
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          return { success: false, error: errorMessage }
        }
      },

      // 📝 ثبت‌نام
      register: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/register', {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            passwordConfirmation: userData.confirmPassword,
          })

          const { user, token } = response.data

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: Date.now(),
          })

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'خطا در ثبت‌نام'
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          return { success: false, error: errorMessage }
        }
      },

      // 🚪 خروج از سیستم
      logout: async (allDevices = false) => {
        set({ isLoading: true })
        
        try {
          const { token } = get()
          if (token) {
            await api.post('/auth/logout', { allDevices })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // پاک کردن کل استیت
          set({
            ...initialState,
            isLoading: false,
          })
          
          // پاک کردن توکن از هدرها
          delete api.defaults.headers.common['Authorization']
          
          // ریدایرکت به صفحه ورود
          window.location.href = '/login'
        }
      },
      // 🔐 بررسی احراز هویت (جدید)
checkAuth: async () => {
  const { token, isAuthenticated } = get()
  
  if (token && isAuthenticated) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const isValid = get().checkSession()
    if (!isValid) {
      await get().refreshToken()
    }
    return true
  }
  return false
},

// 👤 تنظیم کاربر (جدید)
setUser: (user) => {
  set({ user, isAuthenticated: !!user })
},

// 🔑 تنظیم توکن (جدید)
setToken: (token) => {
  set({ token })
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
},
      // 🔄 refresh توکن
      refreshToken: async () => {
        const { refreshToken: rt } = get()
        
        if (!rt) {
          get().logout()
          return false
        }

        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: rt,
          })

          const { token, refreshToken: newRefreshToken, expiresAt } = response.data

          set({
            token,
            refreshToken: newRefreshToken,
            sessionExpiresAt: expiresAt,
            lastActivity: Date.now(),
          })

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      // ==================== مدیریت پروفایل ====================

      // 👤 دریافت پروفایل
      fetchProfile: async () => {
        set({ isLoading: true })
        
        try {
          const response = await api.get('/users/profile')
          const { user, roles, permissions } = response.data
          
          set({
            user,
            roles,
            permissions,
            isLoading: false,
          })
          
          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ✏️ ویرایش پروفایل
      updateProfile: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.put('/users/profile', data)
          const { user } = response.data
          
          set({ user, isLoading: false })
          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'خطا در بروزرسانی پروفایل'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // 🔑 تغییر رمز عبور
      changePassword: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          await api.post('/users/change-password', {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
            newPasswordConfirmation: data.confirmPassword,
          })
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'خطا در تغییر رمز عبور'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // 📤 آپلود آواتار
      uploadAvatar: async (file) => {
        set({ isLoading: true })
        
        try {
          const formData = new FormData()
          formData.append('avatar', file)
          
          const response = await api.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          
          const { avatarUrl } = response.data
          const user = get().user
          
          set({
            user: { ...user, avatar: avatarUrl },
            isLoading: false,
          })
          
          return { success: true, avatarUrl }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ==================== مدیریت نقش‌ها و مجوزها ====================

      // ✅ بررسی نقش
      hasRole: (requiredRoles) => {
        const { roles } = get()
        
        if (!requiredRoles || requiredRoles.length === 0) return true
        
        if (typeof requiredRoles === 'string') {
          return roles.includes(requiredRoles)
        }
        
        return requiredRoles.some(role => roles.includes(role))
      },

      // ✅ بررسی مجوز
      hasPermission: (requiredPermissions) => {
        const { permissions } = get()
        
        if (!requiredPermissions || requiredPermissions.length === 0) return true
        
        // superadmin همه مجوزها را دارد
        if (permissions.includes('*')) return true
        
        if (typeof requiredPermissions === 'string') {
          return permissions.includes(requiredPermissions)
        }
        
        return requiredPermissions.every(perm => permissions.includes(perm))
      },

      // ✅ بررسی دسترسی کامل
      hasAccess: (requiredRoles = [], requiredPermissions = []) => {
        const hasRoleAccess = get().hasRole(requiredRoles)
        const hasPermissionAccess = get().hasPermission(requiredPermissions)
        
        return hasRoleAccess && hasPermissionAccess
      },

      // ==================== مدیریت جلسه ====================

      // ⏰ به‌روزرسانی فعالیت
      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      // ⏱️ بررسی انقضای جلسه
      checkSession: () => {
        const { sessionExpiresAt, lastActivity } = get()
        
        // بررسی زمان انقضا
        if (sessionExpiresAt && Date.now() > sessionExpiresAt) {
          get().logout()
          return false
        }
        
        // بررسی inactivity (30 دقیقه)
        const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes
        if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
          get().logout()
          return false
        }
        
        return true
      },

      // 🔁 تمدید جلسه
      extendSession: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) return false
        
        try {
          await api.post('/auth/extend-session')
          set({ lastActivity: Date.now() })
          return true
        } catch {
          return false
        }
      },

      // ==================== احراز هویت دو مرحله‌ای ====================

      // 📱 فعال‌سازی 2FA
      enable2FA: async () => {
        set({ isLoading: true })
        
        try {
          const response = await api.post('/auth/2fa/enable')
          const { qrCode, secret } = response.data
          
          set({ isLoading: false })
          return { success: true, qrCode, secret }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ✅ تأیید 2FA
      verify2FA: async (code) => {
        set({ isLoading: true })
        
        try {
          await api.post('/auth/2fa/verify', { code })
          
          const user = get().user
          set({
            user: { ...user, twoFactorEnabled: true },
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ❌ غیرفعال‌سازی 2FA
      disable2FA: async (code) => {
        set({ isLoading: true })
        
        try {
          await api.post('/auth/2fa/disable', { code })
          
          const user = get().user
          set({
            user: { ...user, twoFactorEnabled: false },
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ==================== بازیابی رمز عبور ====================

      // 📧 درخواست بازیابی
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null })
        
        try {
          await api.post('/auth/forgot-password', { email })
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // 🔐 بازنشانی رمز عبور
      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null })
        
        try {
          await api.post('/auth/reset-password', {
            token,
            password: newPassword,
            passwordConfirmation: newPassword,
          })
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // ==================== شبکه‌های اجتماعی ====================

      // 🔗 ورود با گوگل
      loginWithGoogle: async () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
      },

      // 🔗 ورود با گیتهاب
      loginWithGithub: async () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`
      },

      // 🔗 ورود با اپل
      loginWithApple: async () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/apple`
      },

      // ==================== مدیریت خطا ====================

      // 🧹 پاک کردن خطا
      clearError: () => {
        set({ error: null })
      },

      // ==================== مدیریت لودینگ ====================

      // ⏳ تنظیم لودینگ
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // فقط این فیلدها در localStorage ذخیره شوند
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        roles: state.roles,
        permissions: state.permissions,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
      // exclude از persist
      // onRehydrateStorage: () => (state) => {
      //   if (state?.token) {
      //     api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      //   }
      // }
    }
  )
)

// ==================== هوک‌های کمکی ====================

// هوک برای بررسی نقش
export const useHasRole = (roles) => {
  return useAuthStore((state) => state.hasRole(roles))
}

// هوک برای بررسی مجوز
export const useHasPermission = (permissions) => {
  return useAuthStore((state) => state.hasPermission(permissions))
}

// هوک برای بررسی دسترسی
export const useHasAccess = (roles = [], permissions = []) => {
  return useAuthStore((state) => state.hasAccess(roles, permissions))
}

// هوک برای کاربر جاری
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}

// هوک برای نقش‌ها
export const useUserRoles = () => {
  return useAuthStore((state) => state.roles)
}

// هوک برای مجوزها
export const useUserPermissions = () => {
  return useAuthStore((state) => state.permissions)
}

// هوک برای احراز هویت
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated)
}

// هوک برای لودینگ
export const useAuthLoading = () => {
  return useAuthStore((state) => state.isLoading)
}

// ==================== کامپوننت محافظت‌شده ====================
export const ProtectedComponent = ({ 
  children, 
  roles = [], 
  permissions = [],
  fallback = null,
  LoadingComponent = null,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasAccess 
  } = useAuthStore()

  if (LoadingComponent && isLoading) {
    return <LoadingComponent />
  }

  if (!isAuthenticated) {
    return fallback
  }

  if (!hasAccess(roles, permissions)) {
    return fallback
  }

  return children
}

// ==================== کامپوننت ریدایرکت اگر لاگین باشد ====================
export const AuthenticatedOnly = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    // استفاده از window.location به جای Navigate
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
    return null
  }
  
  return children
}

// ==================== کامپوننت ریدایرکت اگر لاگین نباشد ====================
export const GuestOnly = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return children
  }
  
  // استفاده از window.location به جای Navigate
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo
  }
  return null
}
// ==================== هوک useAuthActions ====================
// این هوک رو به انتهای فایل اضافه کنید، قبل از export default
export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const fetchProfile = useAuthStore((state) => state.fetchProfile)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const changePassword = useAuthStore((state) => state.changePassword)
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar)
  const enable2FA = useAuthStore((state) => state.enable2FA)
  const verify2FA = useAuthStore((state) => state.verify2FA)
  const disable2FA = useAuthStore((state) => state.disable2FA)
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const updateActivity = useAuthStore((state) => state.updateActivity)
  const extendSession = useAuthStore((state) => state.extendSession)
  const checkSession = useAuthStore((state) => state.checkSession)
  const clearError = useAuthStore((state) => state.clearError)
  const setLoading = useAuthStore((state) => state.setLoading)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  
  return {
    login,
    register,
    logout,
    refreshToken,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    enable2FA,
    verify2FA,
    disable2FA,
    forgotPassword,
    resetPassword,
    updateActivity,
    extendSession,
    checkSession,
    clearError,
    setLoading,
    checkAuth,
    setUser,
    setToken,
  }
}