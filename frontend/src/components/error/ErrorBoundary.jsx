// components/error/ErrorBoundary.jsx - مدیریت پیشرفته خطاها
import React, { useState, useEffect, useCallback, lazy, Suspense, Component } from 'react'
import { Link, useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { 
  FaExclamationTriangle, 
  FaHome, 
  FaRedo, 
  FaWifi,
  FaLock,
  FaBug,
  FaServer,
  FaChevronLeft,
  FaCopy,
  FaExpand
} from 'react-icons/fa'

// ==================== کانتکست خطا ====================
const ErrorContext = React.createContext(null)

export const useError = () => {
  const context = React.useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}

// ==================== انواع خطا ====================
export const ErrorTypes = {
  UNKNOWN: 'unknown',
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  VALIDATION: 'validation',
  COMPONENT: 'component',
  ROUTE: 'route',
  MAINTENANCE: 'maintenance',
}

// ==================== کانفیگ پیام‌های خطا ====================
const errorConfig = {
  [ErrorTypes.NETWORK]: {
    title: 'خطای اتصال',
    message: 'اتصال اینترنت برقرار نیست. لطفا اتصال خود را بررسی کنید.',
    icon: FaWifi,
    color: '#f59e0b',
    showRetry: true,
    showHome: true,
  },
  [ErrorTypes.AUTH]: {
    title: 'خطای احراز هویت',
    message: 'جلسه کاری منقضی شده است. لطفا دوباره وارد شوید.',
    icon: FaLock,
    color: '#ef4444',
    showRetry: false,
    showHome: true,
    action: 'login',
  },
  [ErrorTypes.PERMISSION]: {
    title: 'دسترسی غیرمجاز',
    message: 'شما مجوز دسترسی به این بخش را ندارید.',
    icon: FaLock,
    color: '#ef4444',
    showRetry: false,
    showHome: true,
  },
  [ErrorTypes.NOT_FOUND]: {
    title: 'صفحه یافت نشد',
    message: 'صفحه مورد نظر وجود ندارد یا حذف شده است.',
    icon: FaExclamationTriangle,
    color: '#f59e0b',
    showRetry: false,
    showHome: true,
  },
  [ErrorTypes.SERVER]: {
    title: 'خطای سرور',
    message: 'مشکلی در سرور رخ داده است. لطفا بعدا تلاش کنید.',
    icon: FaServer,
    color: '#ef4444',
    showRetry: true,
    showHome: true,
  },
  [ErrorTypes.VALIDATION]: {
    title: 'خطای اعتبارسنجی',
    message: 'اطلاعات وارد شده معتبر نیست.',
    icon: FaExclamationTriangle,
    color: '#f59e0b',
    showRetry: true,
    showHome: false,
  },
  [ErrorTypes.COMPONENT]: {
    title: 'خطای کامپوننت',
    message: 'کامپوننت مورد نظر با مشکل مواجه شده است.',
    icon: FaBug,
    color: '#ef4444',
    showRetry: true,
    showHome: true,
  },
  [ErrorTypes.MAINTENANCE]: {
    title: 'سایت در دست تعمیر',
    message: 'سایت در حال به‌روزرسانی است. لطفا بعدا مراجعه کنید.',
    icon: FaServer,
    color: '#3b82f6',
    showRetry: false,
    showHome: false,
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'خطای ناشناخته',
    message: 'خطای غیرمنتظره‌ای رخ داده است.',
    icon: FaExclamationTriangle,
    color: '#ef4444',
    showRetry: true,
    showHome: true,
  },
}

// ==================== سرویس‌های گزارش خطا ====================
const errorServices = {
  console: {
    capture: (error, context) => {
      console.group('🚨 Error Caught')
      console.error('Error:', error)
      console.error('Context:', context)
      console.groupEnd()
    },
    captureMessage: (message, context) => {
      console.warn('⚠️ Warning:', message, context)
    },
  },
}

// ==================== هوشمندسازی تشخیص نوع خطا ====================
export const detectErrorType = (error) => {
  if (!navigator.onLine || error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return ErrorTypes.NETWORK
  }
  if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
    return ErrorTypes.AUTH
  }
  if (error?.response?.status === 403 || error?.message?.includes('Forbidden')) {
    return ErrorTypes.PERMISSION
  }
  if (error?.response?.status === 404 || error?.message?.includes('Not Found')) {
    return ErrorTypes.NOT_FOUND
  }
  if (error?.response?.status >= 500 || error?.message?.includes('Server Error')) {
    return ErrorTypes.SERVER
  }
  if (error?.response?.status === 422 || error?.name === 'ValidationError') {
    return ErrorTypes.VALIDATION
  }
  if (error?.response?.status === 503 || error?.message?.includes('Maintenance')) {
    return ErrorTypes.MAINTENANCE
  }
  return ErrorTypes.UNKNOWN
}

// ==================== کامپوننت اصلی Error Boundary ====================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: ErrorTypes.UNKNOWN,
      errorCount: 0,
      lastErrorTime: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const errorType = detectErrorType(error)
    const errorCount = this.state.errorCount + 1
    const lastErrorTime = new Date().toISOString()

    this.setState({
      error,
      errorInfo,
      errorType,
      errorCount,
      lastErrorTime,
    })

    this.logError(error, errorInfo, errorType)
  }

  logError = (error, errorInfo, errorType) => {
    const context = {
      errorType,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      componentStack: errorInfo?.componentStack,
      errorCount: this.state.errorCount,
    }
    errorServices.console.capture(error, context)
  }

  handleRetry = () => {
    const { onRetry } = this.props
    if (onRetry) {
      onRetry()
    } else {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: ErrorTypes.UNKNOWN,
      })
    }
  }

  handleCopyError = () => {
    const { error, errorInfo } = this.state
    const errorText = `${error?.toString()}\n\n${errorInfo?.componentStack || ''}`
    navigator.clipboard.writeText(errorText)
  }

  render() {
    const { hasError, error, errorInfo, errorType, errorCount } = this.state
    const { 
      fallback, 
      fallbackRender, 
      showDetails = process.env.NODE_ENV === 'development',
      enableReport = true,
      children 
    } = this.props

    if (hasError) {
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ error, errorInfo, resetError: this.handleRetry })
          : fallback
      }
      if (fallbackRender) {
        return fallbackRender({ error, errorInfo, resetError: this.handleRetry })
      }

      return (
        <ErrorDisplay
          error={error}
          errorInfo={errorInfo}
          errorType={errorType}
          errorCount={errorCount}
          showDetails={showDetails}
          enableReport={enableReport}
          onRetry={this.handleRetry}
          onCopyError={this.handleCopyError}
          onReport={() => this.logError(error, errorInfo, errorType)}
        />
      )
    }
    return children
  }
}

// ==================== کامپوننت نمایش خطا ====================
const ErrorDisplay = ({
  error,
  errorInfo,
  errorType,
  errorCount,
  showDetails,
  enableReport,
  onRetry,
  onCopyError,
  onReport,
}) => {
  const config = errorConfig[errorType] || errorConfig[ErrorTypes.UNKNOWN]
  const Icon = config.icon
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopyError()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ ...styles.iconWrapper, background: `${config.color}20` }}>
            <Icon style={{ fontSize: '2.5rem', color: config.color }} />
          </div>
        </div>
        <div style={styles.content}>
          <h1 style={styles.title}>{config.title}</h1>
          <p style={styles.message}>{config.message}</p>
        </div>
        <div style={styles.actions}>
          {config.showHome && (
            <button style={styles.homeButton} onClick={handleGoHome}>
              <FaHome />
              <span>بازگشت به خانه</span>
            </button>
          )}
          {config.showRetry && (
            <button style={styles.retryButton} onClick={onRetry}>
              <FaRedo />
              <span>تلاش مجدد</span>
            </button>
          )}
          {config.action === 'login' && (
            <button style={styles.loginButton} onClick={handleLogin}>
              <FaLock />
              <span>ورود به سیستم</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== Route Error Boundary ====================
export const RouteErrorBoundary = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>خطا در بارگذاری صفحه</h1>
        <p style={styles.message}>متأسفانه خطایی رخ داده است.</p>
        <div style={styles.actions}>
          <button style={styles.homeButton} onClick={() => navigate('/')}>
            <FaHome />
            <span>خانه</span>
          </button>
          <button style={styles.retryButton} onClick={() => navigate(-1)}>
            <FaChevronLeft />
            <span>بازگشت</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== Error Provider ====================
export const ErrorProvider = ({ children }) => {
  const [globalError, setGlobalError] = useState(null)

  const clearError = useCallback(() => {
    setGlobalError(null)
  }, [])

  const triggerError = useCallback((error, context = {}) => {
    const errorType = detectErrorType(error)
    setGlobalError({ error, context, errorType, timestamp: Date.now() })
    errorServices.console.capture(error, context)
  }, [])

  return (
    <ErrorContext.Provider value={{ globalError, clearError, triggerError, ErrorTypes }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  )
}

// ==================== استایل‌ها ====================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '1rem',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '2.5rem',
    background: 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  content: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'white',
    marginBottom: '0.75rem',
  },
  message: {
    fontSize: '1rem',
    color: '#9ca3af',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  homeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  retryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  loginButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
}

export default ErrorBoundary