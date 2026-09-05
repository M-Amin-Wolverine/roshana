// components/layout/AuthLayout.jsx - لایه احراز هویت پیشرفته
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import Particles from '../Particles'
import LoadingOverlay from '../loaders/LoadingOverlay'

// ==================== کامپوننت‌های کمکی ====================

// 🎆 پس‌زمینه متحرک
const AnimatedBackground = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // تولید ذرات تصادفی
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div style={bgContainerStyle}>
      {/* گرادینت پس‌زمینه */}
      <div style={bgGradientStyle} />
      
      {/* شبکه */}
      <div style={bgGridStyle} />
      
      {/* ذرات شناور */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            ...particleStyle,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {/* لکه‌های نوری */}
      <div style={{ ...lightSpotStyle, top: '10%', left: '10%' }} />
      <div style={{ ...lightSpotStyle, bottom: '20%', right: '15%', background: 'rgba(168, 85, 247, 0.3)' }} />
    </div>
  )
}

// 🌍 انتخاب زبان
const LanguageSwitcher = ({ currentLang = 'fa', onChange }) => {
  const languages = [
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ]

  const [isOpen, setIsOpen] = useState(false)
  const current = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <div style={langSwitcherStyle}>
      <button
        style={langButtonStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={langFlagStyle}>{current.flag}</span>
        <span style={langNameStyle}>{current.name}</span>
      </button>
      
      {isOpen && (
        <div style={langDropdownStyle}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              style={{
                ...langOptionStyle,
                background: lang.code === currentLang ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
              }}
              onClick={() => {
                onChange?.(lang.code)
                setIsOpen(false)
              }}
            >
              <span style={langFlagStyle}>{lang.flag}</span>
              <span style={langNameStyle}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 🔘 دکمه‌های شبکه‌های اجتماعی
const SocialLogin = ({ onGoogle, onGithub, onApple }) => {
  const socialButtons = [
    { id: 'google', icon: '🔵', label: 'Google', onClick: onGoogle, color: '#4285f4' },
    { id: 'github', icon: '⚫', label: 'GitHub', onClick: onGithub, color: '#333' },
    { id: 'apple', icon: '🍎', label: 'Apple', onClick: onApple, color: '#000' },
  ]

  return (
    <div style={socialContainerStyle}>
      <div style={socialDividerStyle}>
        <span style={socialDividerTextStyle}>یا با حساب کاربری دیگر وارد شوید</span>
      </div>
      <div style={socialButtonsStyle}>
        {socialButtons.map((social) => (
          <button
            key={social.id}
            style={{ ...socialButtonStyle, borderColor: `${social.color}50` }}
            onClick={social.onClick}
            title={`ورود با ${social.label}`}
          >
            <span style={socialIconStyle}>{social.icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// 📱 تأیید شماره موبایل
const PhoneVerification = ({ onComplete }) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState('phone') // phone, verify
  const [timer, setTimer] = useState(60)
  const [resendEnabled, setResendEnabled] = useState(false)

  useEffect(() => {
    if (step === 'verify' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000)
      return () => clearInterval(interval)
    } else if (timer === 0) {
      setResendEnabled(true)
    }
  }, [step, timer])

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Focus to next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }

    // Check if complete
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      onComplete?.(newCode.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  return (
    <div style={phoneVerifyStyle}>
      {step === 'phone' ? (
        <>
          <h3 style={phoneTitleStyle}>شماره موبایل</h3>
          <input
            type="tel"
            placeholder="09xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={phoneInputStyle}
            dir="ltr"
          />
          <button
            style={verifyButtonStyle}
            onClick={() => {
              setStep('verify')
              setTimer(60)
              setResendEnabled(false)
            }}
          >
            ارسال کد تأیید
          </button>
        </>
      ) : (
        <>
          <h3 style={phoneTitleStyle}>کد تأیید</h3>
          <p style={phoneDescStyle}>
            کد ۶ رقمی به شماره {phone} ارسال شد
          </p>
          <div style={codeInputsStyle}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={codeInputStyle}
                dir="ltr"
              />
            ))}
          </div>
          <p style={timerStyle}>
            {resendEnabled ? (
              <button style={resendButtonStyle} onClick={() => {
                setTimer(60)
                setResendEnabled(false)
              }}>
                ارسال مجدد کد
              </button>
            ) : (
              `ارسال مجدد کد تا ${timer} ثانیه`
            )}
          </p>
        </>
      )}
    </div>
  )
}

// 🔐 فرم ورود پیشرفته
const LoginForm = ({ 
  onSubmit, 
  onForgotPassword, 
  onSocialLogin,
  loading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    showPassword: false,
  })
  const [errors, setErrors] = useState({})

  const validate = useCallback(() => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست'
    }
    
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است'
    } else if (formData.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit?.(formData)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {/* عنوان */}
      <div style={formHeaderStyle}>
        <h1 style={formTitleStyle}>خوش آمدید</h1>
        <p style={formSubtitleStyle}>برای ادامه وارد حساب کاربری خود شوید</p>
      </div>

      {/* خطا */}
      {error && (
        <div style={errorAlertStyle}>
          <span>{error}</span>
        </div>
      )}

      {/* ایمیل */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>ایمیل یا شماره موبایل</label>
        <input
          type="text"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="example@domain.com"
          style={{
            ...inputStyle,
            borderColor: errors.email ? '#ef4444' : 'rgba(34, 211, 238, 0.3)',
          }}
          dir="ltr"
        />
        {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
      </div>

      {/* رمز عبور */}
      <div style={inputGroupStyle}>
        <div style={labelRowStyle}>
          <label style={labelStyle}>رمز عبور</label>
          <button
            type="button"
            style={forgotLinkStyle}
            onClick={onForgotPassword}
          >
            فراموشی رمز؟
          </button>
        </div>
        <div style={passwordWrapperStyle}>
          <input
            type={formData.showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="••••••••"
            style={{
              ...inputStyle,
              borderColor: errors.password ? '#ef4444' : 'rgba(34, 211, 238, 0.3)',
            }}
            dir="ltr"
          />
          <button
            type="button"
            style={togglePasswordStyle}
            onClick={() => handleChange('showPassword', !formData.showPassword)}
          >
            {formData.showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
      </div>

      {/* remember me */}
      <div style={checkboxRowStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange('rememberMe', e.target.checked)}
            style={checkboxStyle}
          />
          <span style={checkboxTextStyle}>مرا به خاطر بسپار</span>
        </label>
      </div>

      {/* دکمه ورود */}
      <button
        type="submit"
        style={{
          ...submitButtonStyle,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
        disabled={loading}
      >
        {loading ? (
          <span style={loadingSpinnerStyle}>⏳</span>
        ) : (
          'ورود به سیستم'
        )}
      </button>

      {/* شبکه‌های اجتماعی */}
      <SocialLogin {...onSocialLogin} />

      {/* لینک ثبت‌نام */}
      <div style={signupRowStyle}>
        <span style={signupTextStyle}>حساب کاربری ندارید؟</span>
        <a href="/auth/register" style={signupLinkStyle}>ثبت‌نام</a>
      </div>
    </form>
  )
}

// 📝 فرم ثبت‌نام
const RegisterForm = ({ onSubmit, onLogin, onSocialLogin, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    showPassword: false,
  })
  const [errors, setErrors] = useState({})

  const validate = useCallback(() => {
    const newErrors = {}
    
    if (!formData.firstName) newErrors.firstName = 'نام الزامی است'
    if (!formData.lastName) newErrors.lastName = 'نام خانوادگی الزامی است'
    
    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'شماره موبایل الزامی است'
    } else if (!/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل معتبر نیست'
    }
    
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است'
    } else if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمزهای عبور مطابقت ندارند'
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'پذیرش قوانین الزامی است'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit?.(formData)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={formHeaderStyle}>
        <h1 style={formTitleStyle}>ثبت‌نام</h1>
        <p style={formSubtitleStyle}>حساب کاربری جدید ایجاد کنید</p>
      </div>

      {error && <div style={errorAlertStyle}>{error}</div>}

      {/* نام و نام خانوادگی */}
      <div style={inputRowStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>نام</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="علی"
            style={inputStyle}
          />
          {errors.firstName && <span style={errorTextStyle}>{errors.firstName}</span>}
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>نام خانوادگی</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="محمدی"
            style={inputStyle}
          />
          {errors.lastName && <span style={errorTextStyle}>{errors.lastName}</span>}
        </div>
      </div>

      {/* ایمیل و موبایل */}
      <div style={inputRowStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>ایمیل</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="example@domain.com"
            style={inputStyle}
            dir="ltr"
          />
          {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>موبایل</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="0912xxxxxxx"
            style={inputStyle}
            dir="ltr"
          />
          {errors.phone && <span style={errorTextStyle}>{errors.phone}</span>}
        </div>
      </div>

      {/* رمز عبور */}
      <div style={inputRowStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>رمز عبور</label>
          <div style={passwordWrapperStyle}>
            <input
              type={formData.showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              dir="ltr"
            />
            <button
              type="button"
              style={togglePasswordStyle}
              onClick={() => handleChange('showPassword', !formData.showPassword)}
            >
              {formData.showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>تکرار رمز عبور</label>
          <input
            type={formData.showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            dir="ltr"
          />
          {errors.confirmPassword && <span style={errorTextStyle}>{errors.confirmPassword}</span>}
        </div>
      </div>

      {/* قوانین */}
      <div style={checkboxRowStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleChange('acceptTerms', e.target.checked)}
            style={checkboxStyle}
          />
          <span style={checkboxTextStyle}>
            با <a href="/terms" style={termsLinkStyle}>قوانین</a> و <a href="/privacy" style={termsLinkStyle}>حریم خصوصی</a> موافقم
          </span>
        </label>
        {errors.acceptTerms && <span style={errorTextStyle}>{errors.acceptTerms}</span>}
      </div>

      <button type="submit" style={submitButtonStyle} disabled={loading}>
        {loading ? <span style={loadingSpinnerStyle}>⏳</span> : 'ثبت‌نام'}
      </button>

      <SocialLogin {...onSocialLogin} />

      <div style={signupRowStyle}>
        <span style={signupTextStyle}>حساب کاربری دارید؟</span>
        <a href="/auth/login" style={signupLinkStyle}>ورود</a>
      </div>
    </form>
  )
}

// ==================== لایه اصلی ====================
const AuthLayout = ({ 
  children,
  variant = 'default', // default, minimal, centered
  showParticles = true,
  showLanguageSwitcher = true,
  backgroundVariant = 'animated', // animated, gradient, solid
}) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()
  const [language, setLanguage] = useState('fa')

  // ریدایرکت اگر کاربر لاگین باشد
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/app/dashboard'
    return <Navigate to={from} replace />
  }

  const containerVariants = {
    default: containerStyle,
    minimal: minimalContainerStyle,
    centered: centeredContainerStyle,
  }

  const cardVariants = {
    default: cardStyle,
    minimal: minimalCardStyle,
    centered: centeredCardStyle,
  }

  return (
    <div style={containerVariants[variant]}>
      {/* پس‌زمینه */}
      {backgroundVariant === 'animated' && <AnimatedBackground />}
      {backgroundVariant === 'gradient' && <div style={simpleGradientBg} />}
      
      {/* ذرات (اختیاری) */}
      {showParticles && backgroundVariant !== 'solid' && <Particles />}

      {/* انتخاب زبان */}
      {showLanguageSwitcher && (
        <div style={langContainerStyle}>
          <LanguageSwitcher 
            currentLang={language} 
            onChange={setLanguage} 
          />
        </div>
      )}

      {/* محتوای اصلی */}
      <div style={contentStyle}>
        {/* لوگو */}
        <div style={logoContainerStyle}>
          <div style={logoStyle}>🎓</div>
          <h1 style={logoTitleStyle}>دانشگاه روشنا</h1>
          <p style={logoSubtitleStyle}>سامانه جامع دانشگاهی</p>
        </div>

        {/* کارت احراز هویت */}
        <div style={cardVariants[variant]}>
          <Outlet />
        </div>
      </div>

      {/* فوتر */}
      <div style={footerStyle}>
        <p style={footerTextStyle}>© ۱۴۰۴ دانشگاه روشنا - تمامی حقوق محفوظ است</p>
      </div>

      {/* لودر */}
      {isLoading && <LoadingOverlay />}
    </div>
  )
}

// ==================== استایل‌ها ====================

// Container Styles
const containerStyle = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
}

const minimalContainerStyle = {
  ...containerStyle,
  background: '#0f172a',
}

const centeredContainerStyle = {
  ...containerStyle,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const simpleGradientBg = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
}

// Background Styles
const bgContainerStyle = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
}

const bgGradientStyle = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.15) 0%, transparent 50%)',
}

const bgGridStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)
  `,
  backgroundSize: '50px 50px',
}

const particleStyle = {
  position: 'absolute',
  borderRadius: '50%',
  background: 'rgba(34, 211, 238, 0.6)',
  animation: 'float 15s ease-in-out infinite',
}

const lightSpotStyle = {
  position: 'absolute',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
  filter: 'blur(60px)',
}

// Language Switcher Styles
const langContainerStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  zIndex: 100,
}

const langSwitcherStyle = {
  position: 'relative',
}

const langButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
}

const langFlagStyle = {
  fontSize: '1.25rem',
}

const langNameStyle = {
  fontSize: '0.875rem',
}

const langDropdownStyle = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '0.5rem',
  background: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  minWidth: '120px',
}

const langOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '0.75rem 1rem',
  border: 'none',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
  textAlign: 'right',
}

// Content Styles
const contentStyle = {
  position: 'relative',
  zIndex: 1,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  gap: '2rem',
}

// Logo Styles
const logoContainerStyle = {
  textAlign: 'center',
  marginBottom: '1rem',
}

const logoStyle = {
  fontSize: '4rem',
  marginBottom: '1rem',
  animation: 'float 3s ease-in-out infinite',
}

const logoTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: '#fff',
  marginBottom: '0.5rem',
}

const logoSubtitleStyle = {
  fontSize: '1rem',
  color: '#9ca3af',
}

// Card Styles
const cardStyle = {
  width: '100%',
  maxWidth: '480px',
  padding: '2.5rem',
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
}

const minimalCardStyle = {
  ...cardStyle,
  background: 'rgba(30, 41, 59, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}

const centeredCardStyle = {
  ...cardStyle,
  maxWidth: '520px',
}

// Form Styles
const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const formHeaderStyle = {
  textAlign: 'center',
  marginBottom: '1rem',
}

const formTitleStyle = {
  fontSize: '1.75rem',
  fontWeight: '700',
  color: '#fff',
  marginBottom: '0.5rem',
}

const formSubtitleStyle = {
  fontSize: '0.95rem',
  color: '#9ca3af',
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const inputRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
}

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#e5e7eb',
}

const labelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(34, 211, 238, 0.3)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const passwordWrapperStyle = {
  position: 'relative',
}

const togglePasswordStyle = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.25rem',
  padding: '0.25rem',
}

const forgotLinkStyle = {
  fontSize: '0.8rem',
  color: '#22d3ee',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
}

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
}

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
}

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#22d3ee',
}

const checkboxTextStyle = {
  fontSize: '0.875rem',
  color: '#9ca3af',
}

const submitButtonStyle = {
  width: '100%',
  padding: '1rem',
  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
}

const loadingSpinnerStyle = {
  display: 'inline-block',
  animation: 'spin 1s linear infinite',
}

// Error Styles
const errorAlertStyle = {
  padding: '0.75rem 1rem',
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  color: '#ef4444',
  fontSize: '0.875rem',
}

const errorTextStyle = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '0.25rem',
}

// Social Login Styles
const socialContainerStyle = {
  marginTop: '0.5rem',
}

const socialDividerStyle = {
  display: 'flex',
  alignItems: 'center',
  margin: '1.5rem 0',
}

const socialDividerTextStyle = {
  margin: '0 auto',
  fontSize: '0.8rem',
  color: '#6b7280',
  background: 'transparent',
  padding: '0 1rem',
}

const socialButtonsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
}

const socialButtonStyle = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  cursor: 'pointer',
  fontSize: '1.25rem',
  transition: 'background 0.2s',
}

const socialIconStyle = {
  fontSize: '1.5rem',
}

// Signup Row Styles
const signupRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.5rem',
  marginTop: '1rem',
}

const signupTextStyle = {
  fontSize: '0.9rem',
  color: '#9ca3af',
}

const signupLinkStyle = {
  fontSize: '0.9rem',
  color: '#22d3ee',
  textDecoration: 'none',
  fontWeight: '500',
}

const termsLinkStyle = {
  color: '#22d3ee',
  textDecoration: 'none',
}

// Phone Verification Styles
const phoneVerifyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const phoneTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#fff',
  textAlign: 'center',
}

const phoneDescStyle = {
  fontSize: '0.875rem',
  color: '#9ca3af',
  textAlign: 'center',
}

const phoneInputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(34, 211, 238, 0.3)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '1rem',
  textAlign: 'center',
  letterSpacing: '0.5rem',
}

const verifyButtonStyle = {
  width: '100%',
  padding: '0.875rem',
  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: '600',
  cursor: 'pointer',
}

const codeInputsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.5rem',
}

const codeInputStyle = {
  width: '45px',
  height: '55px',
  textAlign: 'center',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(34, 211, 238, 0.3)',
  borderRadius: '12px',
  color: '#fff',
  outline: 'none',
}

const timerStyle = {
  textAlign: 'center',
  fontSize: '0.875rem',
  color: '#9ca3af',
}

const resendButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#22d3ee',
  cursor: 'pointer',
  fontSize: '0.875rem',
}

// Footer Styles
const footerStyle = {
  position: 'absolute',
  bottom: '1rem',
  left: '0',
  right: '0',
  textAlign: 'center',
}

const footerTextStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
}

// Global Styles
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  input::placeholder {
    color: #6b7280;
  }
  input:focus {
    border-color: #22d3ee !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
  }
`

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

// Export components
export { 
  AuthLayout, 
  LoginForm, 
  RegisterForm, 
  PhoneVerification,
  LanguageSwitcher,
  SocialLogin,
}

export default AuthLayout