/* import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

// ✅ اصلاح شده: فقط یکبار import با نام مناسب
import i18n, { t, setLocale, changeLanguage, getLocale, useTranslation } from './i18n.js'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/error/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import NetworkStatus from './components/NetworkStatus'
import PerformanceMonitor from './components/PerformanceMonitor'
import App from './App'
import './styles/global.css'

// ============================================
// 🏛️ تنظیمات کلی اپلیکیشن - دانشگاه روشنا (نسخه پیشرفته)
// ============================================
const APP_CONFIG = {
  name: 'دانشگاه روشنا',
  nameEn: 'Roshana University',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  description: 'سامانه هوشمند مدیریت دانشگاه',
  author: 'تیم توسعه روشنا',
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDevTools: import.meta.env.DEV,
  enablePWA: 'serviceWorker' in navigator,
  enableOfflineMode: true,
  enablePerformanceMonitoring: import.meta.env.DEV,
  defaultLanguage: 'fa',
  defaultTheme: 'light',
  directions: { fa: 'rtl', en: 'ltr', ar: 'rtl', ku: 'rtl' },
  
  modules: {
    live: true,
    classroom: true,
    meeting: true,
    messaging: true,
    forum: true,
    automation: true,
    food: true,
    transport: true,
    dormitory: true,
    wallet: true,
    library: true,
    proxy: true,
    smartCard: true,
    ai: true,
    analytics: true,
  },
  
  security: {
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
    userKey: 'user',
    sessionTimeout: 30 * 60 * 1000,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    enable2FA: true,
    enableBiometric: 'biometric' in navigator,
  },
  
  features: {
    darkMode: true,
    rtlSupport: true,
    offlineSupport: true,
    pushNotifications: 'Notification' in window,
    voiceCommands: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    screenReader: true,
  }
}

// ============================================
// ⚙️ تنظیمات پیشرفته React Query با کش هوشمند
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false
        if (error?.response?.status === 403) return false
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'online',
      enabled: true,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
      onError: (error) => {
        console.error('Mutation error:', error)
      }
    }
  }
})

// ============================================
// 🌐 تنظیمات پیشرفته i18n با پشتیبانی از RTL/LTR
// ============================================
const initI18n = () => {
  const savedLang = localStorage.getItem('language') || APP_CONFIG.defaultLanguage
  const supportedLangs = ['fa', 'en', 'ar', 'ku']
  const finalLang = supportedLangs.includes(savedLang) ? savedLang : 'fa'
  
  // ✅ اصلاح شده: استفاده از setLocale به جای i18n.setLocale
  setLocale(finalLang)
  
  const direction = APP_CONFIG.directions[finalLang] || 'rtl'
  document.documentElement.dir = direction
  document.documentElement.lang = finalLang
  
  const fontFamily = direction === 'rtl' ? 'Vazirmatn, Tahoma' : 'Inter, Arial'
  document.documentElement.style.setProperty('--font-family', fontFamily)
  
  localStorage.setItem('language', finalLang)
  
  console.log(`🌐 زبان تنظیم شد: ${finalLang} (${direction})`)
  console.log(`📝 پیام تست: ${t('welcomeMessage')}`)
}

// ============================================
// 🎨 Toast Configuration با انیمیشن و قابلیت شخصی‌سازی
// ============================================
const toastConfig = {
  duration: 3500,
  position: 'top-center',
  style: {
    fontFamily: 'var(--font-family, Vazirmatn)',
    fontSize: '14px',
    borderRadius: '12px',
    padding: '12px 20px',
    direction: 'rtl',
    background: 'var(--toast-bg, #1e293b)',
    color: 'var(--toast-color, #ffffff)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  success: {
    icon: '✓',
    style: { background: '#10b981' }
  },
  error: {
    icon: '✗',
    style: { background: '#ef4444' }
  },
  loading: {
    duration: Infinity,
    style: { background: '#3b82f6' }
  }
}

// ============================================
// 🎓 کامپوننت اصلی برنامه با قابلیت‌های پیشرفته
// ============================================
const RootApp = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true)
      console.log('✅ اتصال به اینترنت برقرار شد')
      queryClient.resumePausedMutations()
    }
    
    const handleOffline = () => {
      setNetworkStatus(false)
      console.warn('⚠️ اتصال به اینترنت قطع شد')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        initI18n()
        
        const token = localStorage.getItem(APP_CONFIG.security.tokenKey)
        if (token) {
          console.log('🔑 توکن موجود است، در حال اعتبارسنجی...')
        }
        
        setIsInitialized(true)
        console.log('🚀 اپلیکیشن روشنا با موفقیت راه‌اندازی شد')
      } catch (error) {
        console.error('❌ خطا در مقداردهی اولیه:', error)
        setIsInitialized(true)
      }
    }
    
    init()
  }, [])

  if (!isInitialized) {
    return <LoadingSpinner fullScreen text={t('loading') || "در حال آماده‌سازی سامانه..."} />
  }

  return (
    <ErrorBoundary fallback={<div>{t('systemError') || "خطای سیستمی! لطفاً صفحه را refresh کنید."}</div>}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingSpinner fullScreen text={t('loading') || "در حال بارگذاری..."} />}>
              <App />
            </Suspense>
            
            <Toaster 
              position="top-center" 
              rtl={document.documentElement.dir === 'rtl'} 
              toastOptions={toastConfig} 
              containerStyle={{ zIndex: 9999 }}
            />
            
            {APP_CONFIG.enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
            {APP_CONFIG.enablePerformanceMonitoring && <PerformanceMonitor />}
            <NetworkStatus />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// ============================================
// 🎬 رندر اپلیکیشن با قابلیت PWA
// ============================================
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('❌ المان root با آیدی "root" در HTML پیدا نشد!')
}

const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>
)

// ============================================
// 📱 قابلیت PWA و Service Worker
// ============================================
if ('serviceWorker' in navigator && APP_CONFIG.enablePWA && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope)
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error)
      })
  })
}

// ============================================
// 📊 گزارش خطاهای global (برای دیباگ)
// ============================================
window.addEventListener('error', (event) => {
  console.error('🌍 Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🌍 Unhandled promise rejection:', event.reason)
})

export { APP_CONFIG, queryClient } */
//-------------------------------------
import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import i18n, { t, setLocale } from './i18n.js'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/error/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import App from './App'
import './styles/global.css'

// ============================================
// تنظیمات
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const initI18n = () => {
  const savedLang = localStorage.getItem('language') || 'fa'
  const supportedLangs = ['fa', 'en', 'ar', 'ku']
  const finalLang = supportedLangs.includes(savedLang) ? savedLang : 'fa'
  
  setLocale(finalLang)
  document.documentElement.dir = finalLang === 'en' ? 'ltr' : 'rtl'
  document.documentElement.lang = finalLang
  localStorage.setItem('language', finalLang)
}

// ============================================
// کامپوننت اصلی
// ============================================
const RootApp = () => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initI18n()
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return <LoadingSpinner fullScreen text="در حال آماده‌سازی..." />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingSpinner fullScreen text="در حال بارگذاری..." />}>
              <App />
            </Suspense>
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// ============================================
// رندر
// ============================================
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('❌ المان root پیدا نشد!')
}

const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>
)