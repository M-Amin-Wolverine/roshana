// ============================================================
//  ResetPasswordPage.jsx - نسخه REAL متصل به API
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaLock, FaEye, FaEyeSlash, FaKey, FaArrowRight, FaCheckCircle, 
  FaExclamationTriangle, FaShieldAlt, FaMagic, FaCopy, FaCheck,
  FaMoon, FaSun, FaSpinner, FaInfoCircle, FaTimesCircle
} from 'react-icons/fa';

// ============================================================
//  🧮 توابع کمکی (همون‌هایی که بود)
// ============================================================

const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, level: 'weak', text: 'بسیار ضعیف' };
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 2;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (!/(.)\1{2,}/.test(password)) score += 1;
  
  let level, text;
  if (score <= 2) { level = 'weak'; text = 'بسیار ضعیف'; }
  else if (score <= 4) { level = 'fair'; text = 'ضعیف'; }
  else if (score <= 6) { level = 'good'; text = 'متوسط'; }
  else if (score <= 7) { level = 'very-good'; text = 'خوب'; }
  else { level = 'strong'; text = 'قوی'; }
  
  return { score, level, text };
};

const commonPasswords = ['12345678', 'password', '123456789', 'qwerty', 'abc123'];

// ============================================================
//  🎯 کامپوننت اصلی - متصل به API
// ============================================================

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // دریافت tempToken از navigation state
  const { tempToken, contact, contactType, maskedContact } = location.state || {};
  
  const [theme, setTheme] = useState(() => localStorage.getItem('fartak-theme') || 'light');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });

  // بررسی وجود tempToken
  useEffect(() => {
    if (!tempToken) {
      showToast('لطفاً از طریق صفحه بازیابی رمز اقدام کنید', 'error');
      setTimeout(() => navigate('/forgot-passwd'), 2000);
    }
  }, [tempToken, navigate]);

  // تغییر تم
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fartak-theme', theme);
  }, [theme]);

  // شمارش معکوس بعد از موفقیت
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      navigate('/login');
    }
  }, [showSuccess, countdown, navigate]);

  // نمایش پیام
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // اعتبارسنجی رمز
  const isValid = () => {
    const strength = calculatePasswordStrength(password);
    return password.length >= 8 && 
           password === confirmPassword && 
           strength.score >= 4 &&
           !commonPasswords.includes(password.toLowerCase());
  };

  // ============================================================
  //  📤 ارسال درخواست تغییر رمز به بک‌اند
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tempToken) {
      showToast('توکن نامعتبر است. لطفاً مجدد تلاش کنید.', 'error');
      navigate('/forgot-password');
      return;
    }
    
    if (!isValid()) {
      showToast('لطفاً رمز عبور معتبر و قوی وارد کنید', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tempToken: tempToken,
          newPassword: password,
          ...(contactType === 'email' ? { email: contact } : { phone: contact })
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowSuccess(true);
        showToast('✅ رمز عبور با موفقیت تغییر کرد!', 'success');
        
        // پاک کردن داده‌های موقت
        localStorage.removeItem('resetTempToken');
        
      } else {
        showToast(data.message || 'خطا در تغییر رمز عبور', 'error');
        
        // اگر توکن منقضی شده بود، برگرد به صفحه اول
        if (data.error === 'invalid_token' || data.error === 'expired_token') {
          setTimeout(() => navigate('/forgot-passwd'), 2000);
        }
      }
      
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('❌ خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تولید رمز قوی
  const generateStrongPassword = () => {
    const length = 16;
    const charset = {
      lower: 'abcdefghijklmnopqrstuvwxyz',
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    
    let newPassword = '';
    newPassword += charset.lower[Math.floor(Math.random() * charset.lower.length)];
    newPassword += charset.upper[Math.floor(Math.random() * charset.upper.length)];
    newPassword += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    newPassword += charset.special[Math.floor(Math.random() * charset.special.length)];
    
    const allChars = charset.lower + charset.upper + charset.numbers + charset.special;
    for (let i = newPassword.length; i < length; i++) {
      newPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(newPassword);
    setConfirmPassword('');
    showToast('رمز قوی با موفقیت تولید شد!', 'success');
  };

  // کپی رمز
  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    showToast('رمز در کلیپبورد کپی شد', 'success');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Vazirmatn, sans-serif'
    }}>
      {/* دکمه تغییر تم */}
      <motion.button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          background: theme === 'dark' ? '#334155' : 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {theme === 'dark' ? <FaSun size={24} color="#f59e0b" /> : <FaMoon size={24} color="#667eea" />}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.98)',
          borderRadius: '32px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        {!showSuccess ? (
          <>
            {/* هدر */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: 'white'
              }}>
                <FaKey />
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: '8px'
              }}>
                تغییر رمز عبور
              </h2>
              <p style={{ color: theme === 'dark' ? '#94a3b8' : '#666', fontSize: '14px' }}>
                {maskedContact && `برای حساب ${maskedContact}`}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* رمز جدید */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#e2e8f0' : '#333'
                }}>
                  <FaLock style={{ marginLeft: '8px' }} />
                  رمز عبور جدید
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  border: `2px solid ${password ? '#667eea' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  background: theme === 'dark' ? '#1e293b' : '#f8fafc'
                }}>
                  <input
                    type={showPassword.password ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور جدید را وارد کنید"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      outline: 'none',
                      color: theme === 'dark' ? 'white' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* قدرت رمز */}
                {password && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      height: '4px',
                      background: '#e2e8f0',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(calculatePasswordStrength(password).score / 10) * 100}%` }}
                        style={{
                          height: '100%',
                          background: calculatePasswordStrength(password).level === 'weak' ? '#ef4444' :
                                     calculatePasswordStrength(password).level === 'fair' ? '#f59e0b' :
                                     calculatePasswordStrength(password).level === 'good' ? '#3b82f6' :
                                     calculatePasswordStrength(password).level === 'very-good' ? '#8b5cf6' : '#10b981'
                        }}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#94a3b8' }}>قدرت رمز:</span>
                      <span style={{
                        color: calculatePasswordStrength(password).level === 'weak' ? '#ef4444' :
                               calculatePasswordStrength(password).level === 'fair' ? '#f59e0b' :
                               calculatePasswordStrength(password).level === 'good' ? '#3b82f6' :
                               calculatePasswordStrength(password).level === 'very-good' ? '#8b5cf6' : '#10b981',
                        fontWeight: 600
                      }}>
                        {calculatePasswordStrength(password).text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* تکرار رمز */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#e2e8f0' : '#333'
                }}>
                  <FaLock style={{ marginLeft: '8px' }} />
                  تکرار رمز عبور
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  border: `2px solid ${confirmPassword && password === confirmPassword ? '#10b981' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  background: theme === 'dark' ? '#1e293b' : '#f8fafc'
                }}>
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="رمز عبور را دوباره وارد کنید"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      outline: 'none',
                      color: theme === 'dark' ? 'white' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {confirmPassword && password !== confirmPassword && (
                  <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaTimesCircle size={12} />
                    <span>رمزها مطابقت ندارند</span>
                  </div>
                )}
                
                {confirmPassword && password === confirmPassword && password && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCheckCircle size={12} />
                    <span>رمزها مطابقت دارند ✓</span>
                  </div>
                )}
              </div>

              {/* دکمه تولید رمز قوی */}
              <motion.button
                type="button"
                onClick={generateStrongPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '16px',
                  background: 'transparent',
                  border: `2px solid #667eea`,
                  borderRadius: '16px',
                  color: '#667eea',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaMagic />
                <span>تولید رمز قوی</span>
              </motion.button>

              {/* دکمه اصلی */}
              <motion.button
                type="submit"
                disabled={!isValid() || isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: !isValid() || isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: !isValid() || isSubmitting ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <FaSpinner />
                    </motion.div>
                    <span>در حال تغییر رمز...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>تغییر رمز عبور</span>
                  </>
                )}
              </motion.button>

              {/* لینک بازگشت */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <a href="/login" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  <FaArrowRight />
                  بازگشت به صفحه ورود
                </a>
              </div>
            </form>
          </>
        ) : (
          // صفحه موفقیت
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 24px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'white'
              }}
            >
              ✓
            </motion.div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
              رمز عبور تغییر کرد! 🎉
            </h3>
            <p style={{ color: theme === 'dark' ? '#94a3b8' : '#666', marginBottom: '24px' }}>
              رمز عبور شما با موفقیت به‌روزرسانی شد
            </p>
            <div style={{ fontSize: '14px', color: '#667eea' }}>
              انتقال به صفحه ورود در {countdown} ثانیه...
            </div>
          </div>
        )}
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10000,
              fontSize: '14px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResetPasswordPage;