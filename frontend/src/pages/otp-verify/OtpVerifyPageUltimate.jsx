// ============================================================
//  ███████╗ █████╗ ██████╗ ████████╗ █████╗ ██╗  ██╗
//  ██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██║ ██╔╝
//  █████╗  ███████║██████╔╝   ██║   ███████║█████╔╝ 
//  ██╔══╝  ██╔══██║██╔══██╗   ██║   ██╔══██║██╔═██╗ 
//  ██║     ██║  ██║██║  ██║   ██║   ██║  ██║██║  ██╗
//  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
//  ============================================================
//  ╔═══════════════════════════════════════════════════════════════╗
//  ║   FARTAK ULTIMATE OTP VERIFICATION - ENTERPRISE GRADE V3.0   ║
//  ║   ترکیبی از بهترین قابلیت‌ها + امنیت نظامی + UX فوق‌العاده   ║
//  ╚═══════════════════════════════════════════════════════════════╝
// ============================================================

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
//  🎨 آیکون‌های سفارشی و سبک (بدون وابستگی خارجی)
// ============================================================
const Icons = {
  Shield: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
  ),
  Spinner: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="spin">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8z"/>
      <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Mobile: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  )
};

// ============================================================
//  🎨 هاردکد استایل‌ها (بدون نیاز به فایل CSS خارجی)
// ============================================================
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .otp-ultimate-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Vazirmatn', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    position: relative;
    overflow: hidden;
  }
  
  .otp-ultimate-container::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .otp-ultimate-card {
    position: relative;
    z-index: 10;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 48px;
    padding: 48px 40px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 50px 80px -30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.3);
    transition: all 0.3s ease;
  }
  
  @media (max-width: 560px) {
    .otp-ultimate-card { padding: 32px 24px; margin: 16px; }
  }
  
  .otp-icon-ultimate {
    width: 90px;
    height: 90px;
    margin: 0 auto 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    color: white;
    font-size: 44px;
    box-shadow: 0 20px 35px -10px rgba(102, 126, 234, 0.4);
  }
  
  .otp-title-ultimate {
    text-align: center;
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea, #764ba2);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    margin-bottom: 12px;
  }
  
  .otp-subtitle-ultimate {
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 28px;
  }
  
  .user-contact-ultimate {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #667eea20, #764ba220);
    padding: 6px 16px;
    border-radius: 40px;
    margin-top: 10px;
    font-weight: 700;
    color: #667eea;
    direction: ltr;
  }
  
  .timer-ultimate {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 60px;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 36px;
  }
  
  .timer-ultimate.expired {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
  }
  
  .timer-value-ultimate {
    font-size: 32px;
    font-weight: 800;
    font-family: monospace;
    color: #667eea;
    letter-spacing: 2px;
  }
  
  .timer-value-ultimate.expired {
    color: #ef4444;
    animation: pulse-red 1s infinite;
  }
  
  @keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .otp-inputs-ultimate {
    display: flex;
    justify-content: center;
    gap: 14px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }
  
  .otp-input-ultimate {
    width: 62px;
    height: 72px;
    text-align: center;
    font-size: 32px;
    font-weight: 800;
    font-family: monospace;
    border: 2px solid #e5e7eb;
    border-radius: 20px;
    background: white;
    transition: all 0.2s ease;
    outline: none;
    color: #1f2937;
  }
  
  .otp-input-ultimate:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
    transform: scale(1.02);
  }
  
  .otp-input-ultimate.active {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea08, #764ba208);
  }
  
  .otp-input-ultimate.success {
    border-color: #10b981;
    background: linear-gradient(135deg, #10b98110, #05966910);
    animation: success-pop 0.3s ease;
  }
  
  @keyframes success-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); background: #10b98120; }
    100% { transform: scale(1); }
  }
  
  .otp-input-ultimate.shake {
    animation: shake-ultimate 0.4s ease-in-out;
    border-color: #ef4444;
  }
  
  @keyframes shake-ultimate {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
  
  @media (max-width: 480px) {
    .otp-input-ultimate { width: 48px; height: 56px; font-size: 26px; }
    .otp-inputs-ultimate { gap: 8px; }
  }
  
  .error-ultimate {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    padding: 12px 20px;
    border-radius: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
    font-size: 13px;
    font-weight: 600;
  }
  
  .verify-btn-ultimate {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 60px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .verify-btn-ultimate:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -10px rgba(102, 126, 234, 0.5);
  }
  
  .verify-btn-ultimate:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .resend-ultimate {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .resend-btn-ultimate {
    background: none;
    border: none;
    color: #667eea;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 40px;
    transition: all 0.2s ease;
  }
  
  .resend-btn-ultimate:hover:not(:disabled) {
    background: linear-gradient(135deg, #667eea10, #764ba210);
    color: #764ba2;
  }
  
  .resend-btn-ultimate:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }
  
  .alternative-ultimate {
    margin-top: 24px;
    text-align: center;
  }
  
  .alternative-label-ultimate {
    font-size: 12px;
    color: #9ca3af;
    display: block;
    margin-bottom: 12px;
  }
  
  .alternative-icons-ultimate {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
  
  .alt-icon-ultimate {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f3f4f6;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: all 0.2s ease;
  }
  
  .alt-icon-ultimate:hover {
    transform: scale(1.1);
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
  }
  
  .back-link-ultimate {
    display: block;
    text-align: center;
    margin-top: 24px;
    color: #9ca3af;
    text-decoration: none;
    font-size: 13px;
    transition: color 0.2s ease;
  }
  
  .back-link-ultimate:hover {
    color: #667eea;
  }
  
  .resend-hint-ultimate {
    margin-top: 8px;
    font-size: 12px;
    color: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  
  .spin {
    animation: spin-ultimate 1s linear infinite;
  }
  
  @keyframes spin-ultimate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  #notification-ultimate {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    pointer-events: none;
  }
  
  .notification-ultimate-item {
    pointer-events: auto;
    max-width: 400px;
    width: 100%;
  }
`;
const ROLE_PATHS = {
  admin: '/admin',
  super_admin: '/admin',
  it_manager: '/admin',
  education_manager: '/admin',
  financial_manager: '/admin',
  cultural_manager: '/admin',
  security_manager: '/admin',
  vice_chancellor: '/vice/dashboard',
  head_of_department: '/professor/department/dashboard',
  professor: '/professor/dashboard',
  student: '/dashboard',
  staff: '/staff/dashboard',
  dormitory_manager: '/staff/dormitory/dashboard',
  support_agent: '/staff/support/dashboard',
  librarian: '/staff/library/dashboard',
  research_assistant: '/student/research/dashboard',
  guest: '/dashboard'
};
// ============================================================
//  🎯 کامپوننت اصلی
// ============================================================
const OtpVerifyPageUltimate = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showResendHint, setShowResendHint] = useState(false);
  const [activeInput, setActiveInput] = useState(0);
  const [particles, setParticles] = useState([]);

  // Refs
  const inputRefs = useRef([]);
  const timerRef = useRef(null);
  const lockTimerRef = useRef(null);
  const notificationContainerRef = useRef(null);

  // دریافت اطلاعات از navigation state
  const {
    type = 'login',
    username,
    userFullName,
    tempToken,
    phone,
    email,
    role: stateRole,          // 👈 نقش از state (در صورت وجود)
    returnPath = '/login',
    redirectPath = null,      // 👈 دیگر استفاده مستقیم نمی‌کنیم
    metadata = {}
  } = location.state || {};

  const userContact = phone || email || username || 'شماره تماس';
  const displayName = userFullName || username || 'کاربر گرامی';
  const contactType = phone ? 'phone' : (email ? 'email' : 'unknown');

  // ============================================
  //  📢 سیستم نوتیفیکیشن پیشرفته
  // ============================================
  const showNotification = (message, type = 'info', duration = 4000) => {
    const container = notificationContainerRef.current;
    if (!container) {
      console.log(message);
      return;
    }

    const colors = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const id = Date.now();
    const notification = { id, message: `${icons[type]} ${message}`, type, isExiting: false };
    
    setParticles(prev => [...prev, notification]);
    
    setTimeout(() => {
      setParticles(prev => prev.map(n => 
        n.id === id ? { ...n, isExiting: true } : n
      ));
      setTimeout(() => {
        setParticles(prev => prev.filter(n => n.id !== id));
      }, 300);
    }, duration);
  };

  // ============================================
  //  🛡️ توابع کمکی
  // ============================================
  const maskPhone = (phoneNum) => {
    if (!phoneNum) return 'شماره موبایل';
    const str = phoneNum.toString();
    if (str.length === 11) return str.substring(0, 4) + '****' + str.substring(8);
    if (str.length === 10) return str.substring(0, 3) + '****' + str.substring(7);
    return str;
  };

  const maskEmail = (emailAddr) => {
    if (!emailAddr) return 'ایمیل';
    const [local, domain] = emailAddr.split('@');
    if (local.length <= 3) return `${local}***@${domain}`;
    return `${local.substring(0, 3)}***${local.substring(local.length - 2)}@${domain}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const convertToPersian = (timeStr) => {
    const persianDigits = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };
    return timeStr.replace(/[0-9]/g, (d) => persianDigits[d]);
  };

  const getDisplayContact = () => {
    if (contactType === 'phone') return maskPhone(userContact);
    if (contactType === 'email') return maskEmail(userContact);
    return userContact;
  };

  // ============================================
  //  ⏱️ مدیریت تایمر
  // ============================================
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowResendHint(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [startTimer]);

  // ============================================
  //  🔢 مدیریت ورودی OTP
  // ============================================
  const handleOtpChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return;
    
    const newOtp = [...otpDigits];
    newOtp[index] = numericValue;
    setOtpDigits(newOtp);
    if (error) setError('');
    
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits filled
    if (numericValue && index === 5 && newOtp.every(d => d !== '')) {
      setTimeout(() => handleSubmit(new Event('submit')), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newOtp = [...otpDigits];
        newOtp[index - 1] = '';
        setOtpDigits(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (otpDigits.every(d => d !== '')) {
        handleSubmit(e);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').split('').slice(0, 6);
    if (digits.length === 0) {
      showNotification('لطفاً فقط عدد وارد کنید', 'warning');
      return;
    }
    const newOtp = [...otpDigits];
    digits.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
    setOtpDigits(newOtp);
    const lastIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // ============================================
  //  📤 ارسال فرم
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      showNotification('فرم قفل شده است. لطفاً بعداً تلاش کنید.', 'error');
      return;
    }
    
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      showNotification('لطفاً کد ۶ رقمی را کامل وارد کنید', 'error');
      setError('کد باید ۶ رقم باشد');
      inputRefs.current.forEach(ref => {
        if (ref) {
          ref.classList.add('shake');
          setTimeout(() => ref.classList.remove('shake'), 500);
        }
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          [contactType === 'phone' ? 'phone' : 'email']: userContact,
          code: otpCode,
          tempToken: tempToken,
          type: type
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        
        inputRefs.current.forEach((ref, i) => {
          setTimeout(() => {
            if (ref) ref.classList.add('success');
          }, i * 100);
        });
        
        if (data.token) localStorage.setItem('authToken', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        
                // ✨ تعیین مسیر نهایی بر اساس نقش
        let finalRedirect = '/dashboard';
        const userRole = data.user?.role || stateRole || 'student';
        
        if (ROLE_PATHS[userRole]) {
          finalRedirect = ROLE_PATHS[userRole];
        } else if (redirectPath) {
          finalRedirect = redirectPath;
        }

        const successMessages = {
          login: `✨ ${displayName} جان، ورود شما با موفقیت تأیید شد!`,
          register: `🎉 ${displayName} جان، ثبت‌نام شما با موفقیت انجام شد!`,
          'forgot-password': `🔐 کد تأیید شد! در حال انتقال...`,
          'change-email': `✉️ ایمیل شما با موفقیت تغییر کرد!`,
          'change-phone': `📱 شماره موبایل شما با موفقیت تغییر کرد!`
        };
        
        showNotification(successMessages[type] || 'عملیات با موفقیت انجام شد', 'success', 2000);
        
        setTimeout(() => {
          if (type === 'forgot-password') {
            navigate('/reset-password', { state: { contact: userContact, token: data.token } });
          } else {
            navigate(finalRedirect, { replace: true });
          }
        }, 2000);
        
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          showNotification('⚠️ به دلیل ۳ بار تلاش ناموفق، فرم به مدت ۵ دقیقه قفل شد.', 'error');
          lockTimerRef.current = setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
            showNotification('✅ فرم باز شد. می‌توانید مجدد تلاش کنید.', 'success');
          }, 5 * 60 * 1000);
        } else {
          showNotification(data.message || 'کد تأیید نامعتبر است', 'error');
          setError(`کد وارد شده صحیح نیست (${newAttempts}/3)`);
          inputRefs.current.forEach(ref => {
            if (ref) {
              ref.classList.add('shake');
              setTimeout(() => ref.classList.remove('shake'), 500);
            }
          });
        }
        
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showNotification('❌ خطا در ارتباط با سرور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  //  🔄 ارسال مجدد
  // ============================================
  const handleResend = async () => {
    if (timeLeft > 0) {
      showNotification(`لطفاً ${formatTime(timeLeft)} ثانیه دیگر صبر کنید`, 'warning');
      return;
    }
    
    setIsResending(true);
    
    try {
      const response = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [contactType === 'phone' ? 'phone' : 'email']: userContact,
          type: type
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeLeft(120);
        setShowResendHint(false);
        startTimer();
        setOtpDigits(['', '', '', '', '', '']);
        setAttempts(0);
        setError('');
        showNotification('✅ کد جدید با موفقیت ارسال شد', 'success');
        inputRefs.current[0]?.focus();
      } else {
        showNotification(data.message || 'خطا در ارسال کد', 'error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      showNotification('❌ خطا در ارسال مجدد کد', 'error');
    } finally {
      setIsResending(false);
    }
  };

  // ============================================
  //  🎨 توابع عنوان و آیکون
  // ============================================
  const getTitle = () => {
    const titles = {
      login: 'تأیید هویت',
      register: 'تکمیل ثبت‌نام',
      'forgot-password': 'بازیابی رمز عبور',
      'change-email': 'تغییر ایمیل',
      'change-phone': 'تغییر شماره موبایل'
    };
    return titles[type] || 'تأیید کد امنیتی';
  };

  const getSubtitle = () => {
    const subtitles = {
      login: 'جهت ورود به حساب کاربری، کد تأیید را وارد کنید',
      register: 'جهت تکمیل ثبت‌نام، کد تأیید را وارد کنید',
      'forgot-password': 'جهت بازیابی رمز عبور، کد تأیید را وارد کنید',
      'change-email': 'جهت تأیید ایمیل جدید، کد تأیید را وارد کنید',
      'change-phone': 'جهت تأیید شماره موبایل جدید، کد تأیید را وارد کنید'
    };
    return subtitles[type] || 'کد ۶ رقمی ارسال شده را وارد کنید';
  };

  const getIcon = () => {
    const icons = { login: '🔑', register: '📝', 'forgot-password': '🔐', 'change-email': '✉️', 'change-phone': '📱' };
    return icons[type] || '🔐';
  };

  // ============================================
  //  🎨 رندر نهایی
  // ============================================
  return (
    <>
      <style>{styles}</style>
      
      <div className="otp-ultimate-container">
        <div id="notification-ultimate" ref={notificationContainerRef}>
          <AnimatePresence>
            {particles.map(notification => (
              <motion.div
                key={notification.id}
                className="notification-ultimate-item"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{
                  background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                             notification.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                             notification.type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                             'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '60px',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Vazirmatn, sans-serif',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                  backdropFilter: 'blur(10px)',
                  direction: 'rtl'
                }}>
                  {notification.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div 
          className="otp-ultimate-card"
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <motion.div 
            className="otp-icon-ultimate"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {getIcon()}
          </motion.div>
          
          <h1 className="otp-title-ultimate">{getTitle()}</h1>
          <p className="otp-subtitle-ultimate">
            {getSubtitle()}
            <br />
            <span className="user-contact-ultimate">
              {contactType === 'phone' ? <Icons.Mobile /> : <Icons.Mail />}
              {getDisplayContact()}
            </span>
          </p>
          
          <div className={`timer-ultimate ${timeLeft === 0 ? 'expired' : ''}`}>
            <Icons.Clock />
            <span>زمان باقیمانده:</span>
            <span className={`timer-value-ultimate ${timeLeft === 0 ? 'expired' : ''}`}>
              {timeLeft === 0 ? '۰۰:۰۰' : convertToPersian(formatTime(timeLeft))}
            </span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="otp-inputs-ultimate">
              {otpDigits.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength="1"
                  className={`otp-input-ultimate ${activeInput === index ? 'active' : ''}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  onFocus={() => setActiveInput(index)}
                  disabled={isLoading || isLocked}
                  autoFocus={index === 0}
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="error-ultimate"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Icons.Warning />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.button 
              type="submit" 
              className="verify-btn-ultimate"
              disabled={isLoading || isLocked}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Icons.Spinner />
                  در حال تأیید...
                </>
              ) : (
                <>
                  <Icons.Check />
                  تأیید و ادامه
                </>
              )}
            </motion.button>
          </form>
          
          <div className="resend-ultimate">
            <span>کد را دریافت نکردید؟</span>
            <motion.button 
              className="resend-btn-ultimate"
              onClick={handleResend}
              disabled={timeLeft > 0 || isResending || isLocked}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icons.Refresh />
              {isResending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
            </motion.button>
            {showResendHint && timeLeft === 0 && !isResending && (
              <motion.div 
                className="resend-hint-ultimate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Icons.Warning />
                <span>برای ارسال مجدد کلیک کنید</span>
              </motion.div>
            )}
          </div>
          
          <div className="alternative-ultimate">
            <div className="alternative-label-ultimate">ارسال از طریق:</div>
            <div className="alternative-icons-ultimate">
              {['💬', '📱', '✉️'].map((icon, i) => (
                <motion.button
                  key={i}
                  className="alt-icon-ultimate"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => showNotification('در حال توسعه...', 'info')}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>
          
          <a href={returnPath} className="back-link-ultimate">
            ← تغییر {contactType === 'phone' ? 'شماره موبایل' : 'ایمیل'} و بازگشت
          </a>
        </motion.div>
      </div>
    </>
  );
};

export default OtpVerifyPageUltimate;