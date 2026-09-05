// components/loaders/PageLoader.jsx - سیستم جامع لودینگ
import { 
  FaGraduationCap, 
  FaSpinner, 
  FaCheck, 
  FaTimes,
  FaCloudUploadAlt,
  FaFileDownload,
} from 'react-icons/fa'
import { 
  SiLoading, 
  SiNextdotjs,
  SiReact,
} from 'react-icons/si'
import { 
  BsFillCircleFill,
  BsThreeDots,
} from 'react-icons/bs'
import { 
  MdSecurity, 
  MdSchool,
  MdMenuBook,
  MdVideoLibrary,
  MdAttachMoney,
  MdPeople,
  MdSettings,
} from 'react-icons/md'

// ==================== انواع لودر ====================
export const LoaderTypes = {
  SPINNER: 'spinner',
  PULSE: 'pulse',
  PROGRESS: 'progress',
  SKELETON: 'skeleton',
  OVERLAY: 'overlay',
  DOTS: 'dots',
  RIPPLE: 'ripple',
  CIRCULAR: 'circular',
}

// ==================== لودر اصلی صفحه ====================
export const PageLoader = ({ 
  fullScreen = true, 
  message = 'در حال بارگذاری...',
  type = LoaderTypes.SPINNER,
  progress,
  showProgress = false,
  variant = 'default', // default, minimal, elegant
}) => {
  const containerStyle = fullScreen ? {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: variant === 'minimal' 
      ? 'transparent' 
      : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    gap: '1.5rem',
    padding: '2rem',
  } : {
    minHeight: fullScreen ? '100vh' : '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
    background: variant === 'minimal' ? 'transparent' : 'rgba(15, 23, 42, 0.8)',
  }

  const renderLoader = () => {
    switch (type) {
      case LoaderTypes.PULSE:
        return <PulseLoader message={message} />
      case LoaderTypes.PROGRESS:
        return <ProgressLoader message={message} progress={progress} />
      case LoaderTypes.DOTS:
        return <DotsLoader message={message} />
      case LoaderTypes.RIPPLE:
        return <RippleLoader message={message} />
      case LoaderTypes.CIRCULAR:
        return <CircularLoader message={message} />
      case LoaderTypes.SKELETON:
        return <SkeletonLoader />
      default:
        return <SpinnerLoader message={message} />
    }
  }

  return (
    <div style={containerStyle}>
      {renderLoader()}
      {showProgress && progress !== undefined && (
        <div style={progressContainerStyle}>
          <div style={{ ...progressBarStyle, width: `${progress}%` }} />
          <span style={progressTextStyle}>{progress}%</span>
        </div>
      )}
    </div>
  )
}

// ==================== Spinner Loader ====================
const SpinnerLoader = ({ message }) => (
  <>
    <div style={loaderContainerStyle}>
      <div style={logoWrapperStyle}>
        <FaGraduationCap style={logoIconStyle} />
      </div>
      <div style={spinnerRingStyle}>
        <div style={spinnerRingInnerStyle} />
      </div>
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Pulse Loader ====================
const PulseLoader = ({ message }) => (
  <>
    <div style={pulseContainerStyle}>
      <div style={pulseCircleStyle} />
      <div style={{ ...pulseCircleStyle, animationDelay: '0.5s' }} />
      <div style={{ ...pulseCircleStyle, animationDelay: '1s' }} />
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Progress Loader ====================
const ProgressLoader = ({ message, progress }) => (
  <>
    <div style={progressLoaderContainer}>
      <div style={progressLoaderCircle}>
        <svg style={progressSvgStyle} viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="45" 
            style={progressBgCircle} 
          />
          <circle 
            cx="50" cy="50" r="45" 
            style={{
              ...progressFgCircle,
              strokeDasharray: `${(progress || 0) * 2.83} 283`,
            }} 
          />
        </svg>
        <span style={progressPercentStyle}>{progress || 0}%</span>
      </div>
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Dots Loader ====================
const DotsLoader = ({ message }) => (
  <>
    <div style={dotsContainerStyle}>
      {[0, 1, 2].map((i) => (
        <div 
          key={i} 
          style={{
            ...dotStyle,
            animationDelay: `${i * 0.15}s`,
          }} 
        />
      ))}
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Ripple Loader ====================
const RippleLoader = ({ message }) => (
  <>
    <div style={rippleContainerStyle}>
      {[0, 1, 2, 3].map((i) => (
        <div 
          key={i}
          style={{
            ...rippleCircleStyle,
            animationDelay: `${i * 0.3}s`,
          }} 
        />
      ))}
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Circular Loader ====================
const CircularLoader = ({ message }) => (
  <>
    <div style={circularContainerStyle}>
      <div style={circularOuterStyle}>
        <div style={circularInnerStyle} />
      </div>
    </div>
    {message && <p style={messageStyle}>{message}</p>}
  </>
)

// ==================== Skeleton Loader ====================
export const SkeletonLoader = ({ 
  variant = 'text', 
  width, 
  height, 
  borderRadius = '8px',
  count = 1,
}) => {
  const skeletonStyle = {
    width: width || (variant === 'text' ? '100%' : '100%'),
    height: height || (variant === 'text' ? '16px' : '200px'),
    borderRadius,
    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }

  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {[...Array(count)].map((_, i) => (
          <div key={i} style={skeletonStyle} />
        ))}
      </div>
    )
  }

  return <div style={skeletonStyle} />
}

// ==================== Skeleton برای کارت ====================
export const CardSkeleton = ({ showImage = true }) => (
  <div style={cardSkeletonStyle}>
    {showImage && <SkeletonLoader height="160px" borderRadius="12px 12px 0 0" />}
    <div style={cardSkeletonContentStyle}>
      <SkeletonLoader width="70%" height="20px" />
      <SkeletonLoader width="40%" height="14px" />
      <div style={cardSkeletonFooterStyle}>
        <SkeletonLoader width="60px" height="24px" borderRadius="12px" />
        <SkeletonLoader width="60px" height="24px" borderRadius="12px" />
      </div>
    </div>
  </div>
)

// ==================== Skeleton برای پروفایل ====================
export const ProfileSkeleton = () => (
  <div style={profileSkeletonStyle}>
    <SkeletonLoader width="120px" height="120px" borderRadius="50%" />
    <SkeletonLoader width="60%" height="24px" />
    <SkeletonLoader width="40%" height="16px" />
    <div style={profileSkeletonStatsStyle}>
      {[1, 2, 3].map((i) => (
        <SkeletonLoader key={i} width="80px" height="60px" borderRadius="8px" />
      ))}
    </div>
  </div>
)

// ==================== Skeleton برای جدول ====================
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div style={tableSkeletonStyle}>
    {/* Header */}
    <div style={tableSkeletonHeaderStyle}>
      {[...Array(columns)].map((_, i) => (
        <SkeletonLoader key={i} height="16px" />
      ))}
    </div>
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} style={tableSkeletonRowStyle}>
        {[...Array(columns)].map((_, colIndex) => (
          <SkeletonLoader key={colIndex} height="14px" />
        ))}
      </div>
    ))}
  </div>
)

// ==================== Skeleton برای فرم ====================
export const FormSkeleton = ({ fields = 3 }) => (
  <div style={formSkeletonStyle}>
    {[...Array(fields)].map((_, i) => (
      <div key={i} style={formFieldSkeletonStyle}>
        <SkeletonLoader width="30%" height="14px" />
        <SkeletonLoader height="44px" borderRadius="8px" />
      </div>
    ))}
    <SkeletonLoader height="48px" borderRadius="8px" />
  </div>
)

// ==================== Overlay Loader ====================
export const OverlayLoader = ({ 
  show, 
  message = 'در حال پردازش...',
  blur = true,
  opacity = 0.8,
}) => {
  if (!show) return null

  return (
    <div style={{
      ...overlayContainerStyle,
      backdropFilter: blur ? 'blur(4px)' : 'none',
      background: `rgba(15, 23, 42, ${opacity})`,
    }}>
      <div style={overlayContentStyle}>
        <SpinnerLoader message={message} />
      </div>
    </div>
  )
}

// ==================== Action Loader ====================
export const ActionButtonLoader = ({ 
  loading, 
  children, 
  disabled,
  icon: Icon,
  successIcon: SuccessIcon = FaCheck,
  errorIcon: ErrorIcon = FaTimes,
  status = 'idle', // idle, loading, success, error
  onReset,
}) => {
  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <FaSpinner className="animate-spin" />
      case 'success':
        return <SuccessIcon />
      case 'error':
        return <ErrorIcon />
      default:
        return Icon
    }
  }

  return (
    <div style={actionLoaderContainerStyle}>
      <span style={{
        ...actionLoaderIconStyle,
        color: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : 'inherit',
      }}>
        {getIcon()}
      </span>
      {children}
      {(status === 'success' || status === 'error') && (
        <button 
          style={actionResetButtonStyle}
          onClick={onReset}
        >
          <FaTimes />
        </button>
      )}
    </div>
  )
}

// ==================== File Upload Loader ====================
export const FileUploadLoader = ({ 
  progress = 0, 
  fileName = '',
  status = 'uploading', // uploading, processing, complete, error
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return { icon: FaCloudUploadAlt, color: '#3b82f6', text: 'در حال آپلود...' }
      case 'processing':
        return { icon: FaSpinner, color: '#f59e0b', text: 'در حال پردازش...' }
      case 'complete':
        return { icon: FaCheck, color: '#10b981', text: 'آپلود تکمیل شد' }
      case 'error':
        return { icon: FaTimes, color: '#ef4444', text: 'خطا در آپلود' }
      default:
        return { icon: FaCloudUploadAlt, color: '#3b82f6', text: '' }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div style={fileUploadContainerStyle}>
      <div style={fileUploadIconStyle}>
        <Icon style={{ fontSize: '2rem', color: config.color }} />
      </div>
      <div style={fileUploadInfoStyle}>
        <p style={fileUploadNameStyle}>{fileName}</p>
        <p style={{ ...fileUploadStatusStyle, color: config.color }}>{config.text}</p>
        {status === 'uploading' && (
          <div style={fileUploadProgressStyle}>
            <div style={{ ...fileUploadProgressBarStyle, width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Context برای لودینگ سراسری ====================
import { createContext, useContext, useState, useCallback } from 'react'

const LoadingContext = createContext(null)

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    global: false,
    actions: {}, // { actionName: boolean }
    message: '',
  })

  const setGlobalLoading = useCallback((loading, message = '') => {
    setLoadingState(prev => ({
      ...prev,
      global: loading,
      message,
    }))
  }, [])

  const setActionLoading = useCallback((actionName, loading, message = '') => {
    setLoadingState(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [actionName]: loading,
      },
      message,
    }))
  }, [])

  const isLoading = useCallback((actionName = null) => {
    if (actionName) {
      return loadingState.actions[actionName] || false
    }
    return loadingState.global || Object.values(loadingState.actions).some(Boolean)
  }, [loadingState])

  const value = {
    loadingState,
    setGlobalLoading,
    setActionLoading,
    isLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

// ==================== هوک برای لودینگ ====================
export const useAsyncLoader = (asyncFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [asyncFunction])

  return { loading, error, data, execute }
}

// ==================== لودر برای بخش‌های مختلف ====================
export const SectionLoader = ({ 
  type = 'skeleton',
  count = 3,
  variant = 'card',
}) => {
  if (type === 'skeleton') {
    switch (variant) {
      case 'card':
        return (
          <div style={sectionGridStyle}>
            {[...Array(count)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )
      case 'list':
        return (
          <div style={sectionListStyle}>
            {[...Array(count)].map((_, i) => (
              <div key={i} style={listItemSkeletonStyle}>
                <SkeletonLoader width="48px" height="48px" borderRadius="8px" />
                <div style={listItemContentStyle}>
                  <SkeletonLoader width="60%" height="16px" />
                  <SkeletonLoader width="40%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        )
      default:
        return <SkeletonLoader count={count} />
    }
  }

  return <PageLoader fullScreen={false} message="در حال بارگذاری..." />
}

// ==================== استایل‌ها ====================
const loaderContainerStyle = {
  position: 'relative',
  width: '100px',
  height: '100px',
}

const logoWrapperStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
}

const logoIconStyle = {
  fontSize: '2.5rem',
  color: '#22d3ee',
}

const spinnerRingStyle = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: '3px solid transparent',
  borderTopColor: '#22d3ee',
  animation: 'spin 1s linear infinite',
}

const spinnerRingInnerStyle = {
  position: 'absolute',
  inset: '8px',
  borderRadius: '50%',
  border: '3px solid transparent',
  borderTopColor: '#a855f7',
  animation: 'spin 1.5s linear infinite reverse',
}

const messageStyle = {
  fontSize: '1rem',
  color: '#9ca3af',
  textAlign: 'center',
}

// Pulse Loader Styles
const pulseContainerStyle = {
  display: 'flex',
  gap: '1rem',
}

const pulseCircleStyle = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: '#22d3ee',
  animation: 'pulse 1s ease-in-out infinite',
}

// Progress Loader Styles
const progressLoaderContainer = {
  position: 'relative',
  width: '120px',
  height: '120px',
}

const progressLoaderCircle = {
  position: 'relative',
  width: '100%',
  height: '100%',
}

const progressSvgStyle = {
  transform: 'rotate(-90deg)',
  width: '100%',
  height: '100%',
}

const progressBgCircle = {
  fill: 'none',
  stroke: '#1e293b',
  strokeWidth: '8',
}

const progressFgCircle = {
  fill: 'none',
  stroke: '#22d3ee',
  strokeWidth: '8',
  strokeLinecap: 'round',
  transition: 'stroke-dasharray 0.3s ease',
}

const progressPercentStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  color: '#fff',
}

// Dots Loader Styles
const dotsContainerStyle = {
  display: 'flex',
  gap: '8px',
}

const dotStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: '#22d3ee',
  animation: 'bounce 1s ease-in-out infinite',
}

// Ripple Loader Styles
const rippleContainerStyle = {
  position: 'relative',
  width: '80px',
  height: '80px',
}

const rippleCircleStyle = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: '3px solid #22d3ee',
  animation: 'ripple 1.5s ease-out infinite',
  opacity: 0,
}

// Circular Loader Styles
const circularContainerStyle = {
  position: 'relative',
  width: '80px',
  height: '80px',
}

const circularOuterStyle = {
  position: 'absolute',
  inset: 0,
  border: '4px solid rgba(34, 211, 238, 0.2)',
  borderTopColor: '#22d3ee',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const circularInnerStyle = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  right: '8px',
  bottom: '8px',
  border: '4px solid rgba(168, 85, 247, 0.2)',
  borderBottomColor: '#a855f7',
  borderRadius: '50%',
  animation: 'spin 1.5s linear infinite reverse',
}

// Progress Bar Styles
const progressContainerStyle = {
  width: '200px',
  height: '24px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
}

const progressBarStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
  borderRadius: '12px',
  transition: 'width 0.3s ease',
}

const progressTextStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  color: '#fff',
}

// Skeleton Styles
const cardSkeletonStyle = {
  background: '#1e293b',
  borderRadius: '12px',
  overflow: 'hidden',
}

const cardSkeletonContentStyle = {
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const cardSkeletonFooterStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '0.5rem',
}

const profileSkeletonStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '2rem',
}

const profileSkeletonStatsStyle = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
}

const tableSkeletonStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const tableSkeletonHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1rem',
  padding: '1rem',
  background: '#1e293b',
  borderRadius: '8px',
}

const tableSkeletonRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1rem',
  padding: '1rem',
  background: '#0f172a',
  borderRadius: '8px',
}

const formSkeletonStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const formFieldSkeletonStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

// Overlay Styles
const overlayContainerStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const overlayContentStyle = {
  textAlign: 'center',
}

// Action Loader Styles
const actionLoaderContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const actionLoaderIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const actionResetButtonStyle = {
  marginRight: '0.5rem',
  padding: '0.25rem',
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
}

// File Upload Styles
const fileUploadContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: '#1e293b',
  borderRadius: '12px',
}

const fileUploadIconStyle = {
  flexShrink: 0,
}

const fileUploadInfoStyle = {
  flex: 1,
}

const fileUploadNameStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#fff',
  marginBottom: '0.25rem',
}

const fileUploadStatusStyle = {
  fontSize: '0.75rem',
  marginBottom: '0.5rem',
}

const fileUploadProgressStyle = {
  height: '4px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '2px',
  overflow: 'hidden',
}

const fileUploadProgressBarStyle = {
  height: '100%',
  background: '#22d3ee',
  transition: 'width 0.3s ease',
}

// Section Styles
const sectionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
}

const sectionListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const listItemSkeletonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: '#1e293b',
  borderRadius: '12px',
}

const listItemContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

// Global Styles
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 1; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes ripple {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

export default PageLoader