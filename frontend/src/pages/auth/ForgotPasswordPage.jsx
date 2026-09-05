// ============================================================
//  ForgotPasswordPage.jsx - نسخه REAL و متصل به API
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaEnvelope, FaPhoneAlt, FaArrowRight, FaCheckCircle, 
  FaExclamationTriangle, FaSpinner, FaMoon, FaSun,
  FaInfoCircle, FaShieldAlt, FaBolt, FaGlobe, FaRocket,
  FaClock, FaKey, FaMobile, FaWhatsapp, FaTelegramPlane,
  FaUserCheck, FaLock, FaUndo, FaArrowLeft
} from 'react-icons/fa';
import '../../styles/ForgotPasswordPage.css';

// ============================================================
//  🧮 توابع اعتبارسنجی
// ============================================================

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^09\d{9}$/;
  return phoneRegex.test(phone);
};

const validateEmailOrPhone = (value) => {
  return validateEmail(value) || validatePhone(value);
};

const detectInputType = (value) => {
  if (validateEmail(value)) return 'email';
  if (validatePhone(value)) return 'phone';
  return 'unknown';
};

const formatPhoneNumber = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) return cleaned;
  return cleaned.slice(0, 11);
};

const maskContact = (contact, type) => {
  if (type === 'email' || validateEmail(contact)) {
    const [local, domain] = contact.split('@');
    return `${local.slice(0, 3)}***@${domain}`;
  } else {
    return `${contact.slice(0, 3)}****${contact.slice(-4)}`;
  }
};

// ============================================================
//  🎨 کامپوننت‌های پیشرفته
// ============================================================

// Particle Background با افکت سه بعدی
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.baseSpeedX = this.speedX;
        this.baseSpeedY = this.speedY;
        this.color = `hsla(${Math.random() * 60 + 200}, 80%, 65%, ${Math.random() * 0.3 + 0.1})`;
      }

      update(mouseX, mouseY) {
        // واکنش به موس
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const angle = Math.atan2(dy, dx);
          const force = (150 - distance) / 150;
          this.x -= Math.cos(angle) * force * 2;
          this.y -= Math.sin(angle) * force * 2;
        }
        
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // اضافه کردن glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = () => {
      const particles = [];
      const count = Math.min(100, Math.floor(window.innerWidth / 15));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.update(mouseRef.current.x, mouseRef.current.y);
        particle.draw(ctx);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0
  }} />;
};

// Theme Toggle با انیمیشن حرفه‌ای
const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <motion.button 
      className="theme-toggle"
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: '70px',
        height: '36px',
        background: theme === 'dark' ? '#334155' : '#e2e8f0',
        borderRadius: '50px',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <motion.div 
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '28px',
            height: '28px',
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          animate={{ x: theme === 'dark' ? 34 : 4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {theme === 'dark' ? <FaMoon size={14} color="#667eea" /> : <FaSun size={14} color="#f59e0b" />}
        </motion.div>
      </div>
    </motion.button>
  );
};

// کانفی اتوماتیک (Auto-fill) با انیمیشن
const AutoFillAnimation = ({ onComplete, contact }) => {
  useEffect(() => {
    if (!contact) return;
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [contact, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        padding: '12px 20px',
        borderRadius: '50px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        zIndex: 1000,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <FaSpinner size={16} />
      </motion.div>
      <span>در حال تکمیل خودکار اطلاعات...</span>
    </motion.div>
  );
};

// Progress Bar پیشرفته
const ProgressBar = ({ step, totalSteps = 3 }) => {
  const progress = (step / totalSteps) * 100;
  
  return (
    <div style={{ marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        {[...Array(totalSteps)].map((_, idx) => (
          <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: idx + 1 <= step ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e2e8f0',
                color: idx + 1 <= step ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold',
                boxShadow: idx + 1 <= step ? '0 5px 15px rgba(102,126,234,0.3)' : 'none'
              }}
            >
              {idx + 1 < step ? <FaCheckCircle size={18} /> : idx + 1}
            </motion.div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: '#94a3b8', fontWeight: 500 }}>
              {idx === 0 && 'شناسایی'}
              {idx === 1 && 'تأیید'}
              {idx === 2 && 'بازنشانی'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div 
          style={{ height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '3px' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, type: 'spring' }}
        />
      </div>
    </div>
  );
};

// Countdown Timer
const CountdownTimer = ({ seconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);
  
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };
  
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '15px',
        fontSize: '14px',
        color: timeLeft <= 10 ? '#ef4444' : '#667eea'
      }}
    >
      <FaClock />
      <span>زمان باقیمانده: </span>
      <strong style={{ fontFamily: 'monospace', fontSize: '18px' }}>
        {formatTime(timeLeft)}
      </strong>
    </motion.div>
  );
};

// ============================================================
//  🎯 کامپوننت اصلی متصل به API
// ============================================================

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('fartak-theme') || 'light');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anomalyMessage, setAnomalyMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [maskedContact, setMaskedContact] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [tempToken, setTempToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [contactType, setContactType] = useState('unknown');
  const inputRefs = useRef([]);

  const isValid = validateEmailOrPhone(emailOrPhone);
  const inputType = detectInputType(emailOrPhone);
  const isOtpComplete = otpCode.every(digit => digit !== '');

  // تغییر تم
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fartak-theme', theme);
  }, [theme]);

  // مدیریت cooldown برای ارسال مجدد
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // نمایش پیام
  const showMessage = (message, type = 'error') => {
    if (type === 'error') {
      setAnomalyMessage(message);
      setTimeout(() => setAnomalyMessage(null), 4000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // ============================================================
  //  📤 مرحله 1: ارسال کد OTP به سرور
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      showMessage('لطفاً شماره موبایل یا ایمیل معتبر وارد کنید');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: 'forgot-password'
      };
      
      if (inputType === 'email') {
        payload.email = emailOrPhone;
      } else {
        payload.phone = emailOrPhone;
      }
      
      const response = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setContactType(inputType);
        setMaskedContact(maskContact(emailOrPhone, inputType));
        setTempToken(data.tempToken || '');
        setStep(2);
        setResendCooldown(60);
        showMessage(`کد تأیید به ${maskContact(emailOrPhone, inputType)} ارسال شد`, 'success');
        
        // در محیط توسعه کد رو نشون بده
        if (process.env.NODE_ENV === 'development' && data.code) {
          console.log(`📱 کد آزمایشی: ${data.code}`);
          showMessage(`🔧 [DEV] کد: ${data.code}`, 'success');
        }
      } else {
        showMessage(data.message || 'خطا در ارسال کد تأیید');
      }
      
    } catch (error) {
      console.error('Send OTP error:', error);
      showMessage('❌ خطا در ارتباط با سرور. لطفاً مجدد تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  //  🔢 مدیریت ورودی OTP
  // ============================================================
  const handleOtpChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = numericValue;
    setOtpCode(newOtp);
    
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && isOtpComplete) {
      handleVerifyOTP();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').split('').slice(0, 6);
    if (digits.length === 6) {
      setOtpCode(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // ============================================================
  //  ✅ مرحله 2: تأیید کد OTP
  // ============================================================
  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      showMessage('لطفاً کد ۶ رقمی را کامل وارد کنید');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        code: code,
        type: 'forgot-password'
      };
      
      if (contactType === 'email') {
        payload.email = emailOrPhone;
      } else {
        payload.phone = emailOrPhone;
      }
      
      if (tempToken) {
        payload.tempToken = tempToken;
      }
      
      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showMessage('✅ کد تأیید صحیح است. در حال انتقال...', 'success');
        
        // ذخیره tempToken جدید برای مرحله بعد
        const newTempToken = data.tempToken || tempToken;
        
        setTimeout(() => {
          navigate('/Reset-passwd', {
            state: {
              tempToken: newTempToken,
              contact: emailOrPhone,
              contactType: contactType,
              maskedContact: maskedContact
            }
          });
        }, 1500);
        
      } else {
        showMessage(data.message || 'کد تأیید نامعتبر است');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      
    } catch (error) {
      console.error('Verify OTP error:', error);
      showMessage('❌ خطا در تأیید کد');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  //  🔄 ارسال مجدد کد
  // ============================================================
  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      showMessage(`لطفاً ${resendCooldown} ثانیه دیگر صبر کنید`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        type: 'forgot-password'
      };
      
      if (contactType === 'email') {
        payload.email = emailOrPhone;
      } else {
        payload.phone = emailOrPhone;
      }
      
      const response = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResendCooldown(60);
        showMessage('کد جدید با موفقیت ارسال شد', 'success');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        if (process.env.NODE_ENV === 'development' && data.code) {
          console.log(`📱 کد جدید: ${data.code}`);
        }
      } else {
        showMessage(data.message || 'خطا در ارسال مجدد');
      }
      
    } catch (error) {
      showMessage('❌ خطا در ارسال مجدد کد');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  //  🎨 رندر
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <ParticleBackground />
      <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />

      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* بخش چپ - Hero Section */}
        <section style={{
          flex: 1,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          position: 'relative',
          overflow: 'hidden'
        }} className="left-panel">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', color: 'white', padding: '40px', zIndex: 10, maxWidth: '400px' }}
          >
            <motion.div
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 30px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              🎓
            </motion.div>
            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>دانشگاه صدا و سیما</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '30px' }}>سیستم مدیریت فرتاک</p>
            <div style={{ width: '100px', height: '3px', background: 'white', margin: '0 auto 20px' }} />
            <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>بازیابی رمز عبور با امنیت بالا و تأیید دو مرحله‌ای</p>
            
            <div style={{ marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <motion.div whileHover={{ scale: 1.1 }} style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 15px', borderRadius: '20px', fontSize: '12px' }}>
                <FaShieldAlt style={{ marginLeft: '5px' }} /> امنیت نظامی
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 15px', borderRadius: '20px', fontSize: '12px' }}>
                <FaRocket /> سریع و هوشمند
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* بخش راست - فرم اصلی */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              width: '100%',
              maxWidth: '500px',
              background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.95)',
              borderRadius: '32px',
              padding: '40px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`
            }}
          >
            <ProgressBar step={step} totalSteps={3} />

            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(102,126,234,0.4)'
              }}
            >
              {step === 1 && <FaLock size={32} />}
              {step === 2 && <FaMobile size={32} />}
              {step === 3 && <FaUserCheck size={32} />}
            </motion.div>

            <h2 style={{
              textAlign: 'center',
              fontSize: '26px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '8px'
            }}>
              {step === 1 && 'فراموشی رمز عبور'}
              {step === 2 && 'تأیید هویت'}
              {step === 3 && 'بازنشانی رمز'}
            </h2>
            
            <p style={{
              textAlign: 'center',
              color: theme === 'dark' ? '#94a3b8' : '#666',
              marginBottom: '32px',
              fontSize: '14px'
            }}>
              {step === 1 && 'شماره موبایل یا ایمیل خود را وارد کنید'}
              {step === 2 && `کد تأیید ارسال شده به ${maskedContact || 'شما'} را وارد کنید`}
              {step === 3 && 'در حال انتقال به صفحه امن تغییر رمز عبور...'}
            </p>

            {/* مرحله 1: فرم ارسال کد */}
            {step === 1 && (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 600,
                    color: theme === 'dark' ? '#e2e8f0' : '#333'
                  }}>
                    شماره موبایل یا ایمیل
                  </label>
                  <motion.div 
                    whileFocus={{ scale: 1.02 }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      border: `2px solid ${isValid && emailOrPhone ? '#10b981' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      background: theme === 'dark' ? '#1e293b' : '#f8fafc',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ position: 'absolute', right: '15px', color: '#94a3b8' }}>
                      {inputType === 'email' ? <FaEnvelope /> : <FaPhoneAlt />}
                    </span>
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.startsWith('09')) {
                          value = formatPhoneNumber(value);
                        }
                        setEmailOrPhone(value);
                      }}
                      placeholder= "example@gmail.com  مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '16px 45px 16px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '14px',
                        outline: 'none',
                        color: theme === 'dark' ? 'white' : '#333'
                      }}
                      autoFocus
                    />
                    {isValid && emailOrPhone && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ position: 'absolute', left: '15px', color: '#10b981' }}
                      >
                        <FaCheckCircle />
                      </motion.span>
                    )}
                  </motion.div>
                </div>

                <motion.button
                  type="submit"
                  disabled={!isValid || isSubmitting}
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
                    cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: !isValid || isSubmitting ? 0.6 : 1,
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
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <FaShieldAlt />
                      <span>ارسال کد تأیید</span>
                    </>
                  )}
                </motion.button>

                <motion.div 
                  whileHover={{ x: -5 }}
                  style={{ textAlign: 'center', marginTop: '24px' }}
                >
                  <a href="/login" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    <FaArrowLeft />
                    بازگشت به صفحه ورود
                  </a>
                </motion.div>
              </form>
            )}

            {/* مرحله 2: فرم تأیید کد */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: 600,
                    textAlign: 'center',
                    color: theme === 'dark' ? '#e2e8f0' : '#333'
                  }}>
                    کد ۶ رقمی را وارد کنید
                  </label>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    {otpCode.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handlePasteOtp : undefined}
                        disabled={isSubmitting}
                        autoFocus={index === 0}
                        whileFocus={{ scale: 1.05, y: -2 }}
                        style={{
                          width: '55px',
                          height: '65px',
                          textAlign: 'center',
                          fontSize: '28px',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          border: `2px solid ${digit ? '#667eea' : '#e2e8f0'}`,
                          borderRadius: '16px',
                          background: theme === 'dark' ? '#1e293b' : 'white',
                          color: theme === 'dark' ? 'white' : '#333',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                  
                  <CountdownTimer seconds={120} onExpire={() => showMessage('کد منقضی شد، لطفاً مجدد ارسال کنید', 'error')} />
                </div>

                <motion.button
                  onClick={handleVerifyOTP}
                  disabled={!isOtpComplete || isSubmitting}
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
                    cursor: !isOtpComplete || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: !isOtpComplete || isSubmitting ? 0.6 : 1,
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
                      <span>در حال تأیید...</span>
                    </>
                  ) : (
                    <>
                      <FaUserCheck />
                      <span>تأیید و ادامه</span>
                    </>
                  )}
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <motion.button
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#94a3b8' : '#667eea',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaUndo />
                    {resendCooldown > 0 ? `ارسال مجدد (${resendCooldown}s)` : 'ارسال مجدد کد'}
                  </motion.button>
                </div>
              </div>
            )}

            {/* مرحله 3: لودینگ انتقال */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: '50px', marginBottom: '20px' }}
                >
                  <FaSpinner />
                </motion.div>
                <p style={{ color: theme === 'dark' ? '#94a3b8' : '#666' }}>
                  در حال انتقال به صفحه امن...
                </p>
              </div>
            )}

            {/* Feature Badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`
            }}>
              <motion.span whileHover={{ scale: 1.05 }} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: theme === 'dark' ? '#334155' : '#f1f5f9',
                borderRadius: '20px',
                fontSize: '11px',
                color: '#667eea'
              }}>
                <FaShieldAlt size={10} /> امنیت نظامی
              </motion.span>
              <motion.span whileHover={{ scale: 1.05 }} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: theme === 'dark' ? '#334155' : '#f1f5f9',
                borderRadius: '20px',
                fontSize: '11px',
                color: '#667eea'
              }}>
                <FaBolt size={10} /> سریع و هوشمند
              </motion.span>
              <motion.span whileHover={{ scale: 1.05 }} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: theme === 'dark' ? '#334155' : '#f1f5f9',
                borderRadius: '20px',
                fontSize: '11px',
                color: '#667eea'
              }}>
                <FaGlobe size={10} /> یکپارچه
              </motion.span>
            </div>
          </motion.div>
        </main>
      </div>

      {/* پیام‌های سیستمی */}
      <AnimatePresence>
        {anomalyMessage && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              background: '#ef4444',
              color: 'white',
              padding: '14px 24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10000,
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <FaExclamationTriangle />
            <span>{anomalyMessage}</span>
          </motion.div>
        )}
        
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              background: '#10b981',
              color: 'white',
              padding: '14px 24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10000,
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <FaCheckCircle />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (min-width: 1024px) {
          .left-panel {
            display: flex !important;
          }
        }
        
        * {
          direction: rtl;
        }
        
        input {
          direction: ltr;
        }
        
        input::placeholder {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;