// ============================================================
//  ╔═══════════════════════════════════════════════════════════════╗
//  ║   RegisterPage.jsx - نسخه فوق‌العاده خفن با تمام قابلیت‌ها   ║
//  ║   Fartak Ultimate Registration - Full Enterprise Features    ║
//  ╚═══════════════════════════════════════════════════════════════╝
// ============================================================
import React, { useRef, useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { changeLanguage , useTranslation } from '../../i18n';
import { 
  FaUser, FaEnvelope, FaLock, FaPhone, FaIdCard, FaCalendarAlt, 
  FaMapMarkerAlt, FaUpload, FaCheckCircle, FaArrowLeft, FaArrowRight, 
  FaEye, FaEyeSlash, FaFilePdf, FaCloudUploadAlt, FaInfoCircle, 
  FaFileContract, FaShieldAlt, FaSpinner, FaDownload, FaCreditCard,
  FaMobileAlt, FaCheck, FaTimes, FaSave, FaUndo, FaQrcode
} from 'react-icons/fa';
import { MdSchool, MdLocationCity, MdPhoneAndroid, MdFamilyRestroom, MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';
import '../../styles/RegisterPage.css';

// ============================================================
//  🧮 الگوریتم‌های اعتبارسنجی
// ============================================================

// الگوریتم اعتبارسنجی کد ملی ایران
const validateNationalCode = (code) => {
  if (!code || code.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;
  
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop();
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const remainder = sum % 11;
  const isValid = (remainder < 2 && checkDigit === remainder) || (remainder >= 2 && checkDigit === (11 - remainder));
  
  return isValid;
};

// الگوریتم اعتبارسنجی شماره شبا
const validateIBAN = (iban) => {
  const ibanRegex = /^IR\d{24}$/;
  return ibanRegex.test(iban);
};

// الگوریتم اعتبارسنجی شماره موبایل
const validateMobile = (mobile) => {
  const mobileRegex = /^09[0-9]{9}$/;
  return mobileRegex.test(mobile);
};

// الگوریتم اعتبارسنجی کد پستی
const validatePostalCode = (postalCode) => {
  const postalRegex = /^\d{10}$/;
  return postalRegex.test(postalCode);
};

// ============================================================
//  📅 کامپوننت تاریخ شمسی (جلالی)
// ============================================================

const PersianDatePicker = ({ value, onChange, label, required }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  const generateYears = () => {
    const currentYear = new Date().getFullYear() - 621;
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };
  
  const handleDateSelect = () => {
    if (year && month && day) {
      const persianDate = `${year}/${month}/${day}`;
      onChange(persianDate);
      setShowPicker(false);
    }
  };
  
  return (
    <div className="persian-date-picker">
      <label>{label}{required && <span className="required">*</span>}</label>
      <div className="date-input-wrapper">
        <input
          type="text"
          value={value}
          placeholder="۱۴۰۰/۰۱/۱۵"
          readOnly
          onClick={() => setShowPicker(!showPicker)}
          className="date-input"
        />
        <FaCalendarAlt className="date-icon" onClick={() => setShowPicker(!showPicker)} />
      </div>
      
      {showPicker && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="date-picker-popup"
        >
          <div className="picker-row">
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">سال</option>
              {generateYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">ماه</option>
              {persianMonths.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">روز</option>
              {[...Array(31)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <button onClick={handleDateSelect} className="picker-confirm">تایید</button>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================
//  🤖 CAPTCHA ساده
// ============================================================

const SimpleCaptcha = ({ onVerify }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  useEffect(() => {
    generateQuestion();
  }, []);
  
  const generateQuestion = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setIsVerified(false);
  };
  
  const checkAnswer = () => {
    const correct = num1 + num2 === parseInt(userAnswer);
    setIsVerified(correct);
    onVerify(correct);
    if (!correct) {
      generateQuestion();
    }
  };
  
  return (
    <div className="captcha-container">
      <div className="captcha-question">
        <span className="captcha-text">{num1} + {num2} = ?</span>
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="?"
          className="captcha-input"
        />
        <button onClick={checkAnswer} className="captcha-verify">
          {isVerified ? <FaCheck /> : 'تایید'}
        </button>
        <button onClick={generateQuestion} className="captcha-refresh">
          <FaUndo />
        </button>
      </div>
      {isVerified && <span className="captcha-success">✓ تأیید شد</span>}
    </div>
  );
};

// ============================================================
//  📤 آپلود فایل با پیشرفت
// ============================================================

const UploadWithProgress = ({ label, name, accept, onUpload, preview }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    
    // شبیه‌سازی آپلود با پیشرفت
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    setTimeout(() => {
      clearInterval(interval);
      setUploading(false);
      setUploadedFile(file);
      onUpload(file);
    }, 2000);
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };
  
  return (
    <div className="upload-progress-item">
      <div className="upload-label" onClick={() => fileInputRef.current?.click()}>
        <FaCloudUploadAlt className="upload-icon" />
        <span className="upload-title">{label}</span>
        <span className="upload-hint">{accept}</span>
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleFileSelect}
          className="file-input"
        />
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              style={{ background: '#00cc66' }}
            />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
      
      {uploadedFile && !uploading && (
        <div className="upload-success">
          <FaCheckCircle />
          <span>{uploadedFile.name}</span>
        </div>
      )}
      
      {preview && (
        <div className="upload-preview">
          <img src={preview} alt="پیش‌نمایش" />
        </div>
      )}
    </div>
  );
};

// ============================================================
//  📱 OTP تایید موبایل
// ============================================================

const MobileVerification = ({ mobile, onVerified }) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  const sendOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpSent(true);
    setTimer(120);
    
    // شبیه‌سازی ارسال پیامک
    console.log(`🔐 کد تایید برای ${mobile}: ${otp}`);
    alert(`کد تایید: ${otp}\n(در نسخه واقعی به شماره شما پیامک می‌شود)`);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const verifyOTP = () => {
    if (otpCode === generatedOtp) {
      setIsVerified(true);
      onVerified(true);
      alert('شماره موبایل با موفقیت تأیید شد!');
    } else {
      alert('کد وارد شده صحیح نیست');
    }
  };
  
  return (
    <div className="mobile-verification">
      <div className="mobile-display">
        <FaMobileAlt />
        <span>{mobile}</span>
        {!isVerified && !otpSent && (
          <button onClick={sendOTP} className="send-otp-btn">ارسال کد</button>
        )}
      </div>
      
      {otpSent && !isVerified && (
        <div className="otp-section">
          <input
            type="text"
            placeholder="کد ۶ رقمی"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            maxLength={6}
            className="otp-input"
          />
          <button onClick={verifyOTP} className="verify-otp-btn">تایید</button>
          {timer > 0 && <span className="otp-timer">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>}
          {timer === 0 && <button onClick={sendOTP} className="resend-otp-btn">ارسال مجدد</button>}
        </div>
      )}
      
      {isVerified && (
        <div className="verified-badge">
          <MdVerified />
          <span>تأیید شده</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
//  💳 درگاه پرداخت (غیرفعال - نمایشی)
// ============================================================

const PaymentGateway = ({ amount, onPayment }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  
  const paymentMethods = [
    { id: 'zarinpal', name: 'زرین‌پال', icon: '🟡', disabled: true },
    { id: 'mellat', name: 'بانک ملت', icon: '🏦', disabled: true },
    { id: 'saman', name: 'بانک سامان', icon: '🏛️', disabled: true },
    { id: 'wallet', name: 'کیف پول فرتاک', icon: '👛', disabled: false }
  ];
  
  const handlePayment = () => {
    if (selectedMethod === 'wallet') {
      alert('پرداخت با کیف پول فرتاک (در حال توسعه)');
      onPayment(true);
    } else {
      alert('درگاه‌های بانکی فعلاً غیرفعال هستند. لطفاً از کیف پول فرتاک استفاده کنید.');
    }
  };
  
  return (
    <div className="payment-gateway">
      <h4>
        <FaCreditCard />
        پرداخت آنلاین
      </h4>
      <div className="payment-amount">مبلغ: {amount.toLocaleString()} تومان</div>
      <div className="payment-methods">
        {paymentMethods.map(method => (
          <button
            key={method.id}
            className={`payment-method ${selectedMethod === method.id ? 'selected' : ''} ${method.disabled ? 'disabled' : ''}`}
            onClick={() => !method.disabled && setSelectedMethod(method.id)}
            disabled={method.disabled}
          >
            <span>{method.icon}</span>
            <span>{method.name}</span>
            {method.disabled && <span className="disabled-badge">به زودی</span>}
          </button>
        ))}
      </div>
      <button 
        onClick={handlePayment} 
        className={`pay-btn ${!selectedMethod ? 'disabled' : ''}`}
        disabled={!selectedMethod}
      >
        پرداخت و ثبت نهایی
      </button>
    </div>
  );
};

// ============================================================
//  📄 دانلود تعهدنامه PDF
// ============================================================

const CommitmentPDF = ({ userData, onDownload }) => {
  const generatePDF = () => {
    const content = `
      تعهدنامه ثبت‌نام
      
      بسمه تعالی
      
      اینجانب ${userData.firstName} ${userData.lastName} با کد ملی ${userData.nationalCode}
      متعهد می‌شوم که:
      
      ۱. کلیه اطلاعات ارائه شده صحیح و واقعی می‌باشد.
      ۲. در صورت اثبات هرگونه تخلف، مسئولیت قانونی بر عهده اینجانب خواهد بود.
      ۳. در صورت پذیرش در مصاحبه، در زمان مقرر حضور خواهم داشت.
      ۴. کلیه قوانین و مقررات دانشگاه را می‌پذیرم.
      
      تاریخ: ${new Date().toLocaleDateString('fa-IR')}
      امضا: _________________
    `;
    
    // شبیه‌سازی دانلود PDF
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تعهدنامه_${userData.nationalCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    
    onDownload(true);
  };
  
  return (
    <div className="commitment-pdf">
      <button onClick={generatePDF} className="download-pdf-btn">
        <FaDownload />
        دانلود تعهدنامه (PDF)
      </button>
    </div>
  );
};

// ============================================================
//  💾 Auto-Save سیستم
// ============================================================

const useAutoSave = (data, step, interval = 60000) => {
  useEffect(() => {
    const saveTimer = setInterval(() => {
      const saveData = {
        ...data,
        _savedAt: new Date().toISOString(),
        _step: step
      };
      localStorage.setItem('register_auto_save', JSON.stringify(saveData));
      console.log('💾 Auto-save انجام شد');
    }, interval);
    
    return () => clearInterval(saveTimer);
  }, [data, step, interval]);
  
  const loadSavedData = useCallback(() => {
    const saved = localStorage.getItem('register_auto_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);
  
  const clearSavedData = useCallback(() => {
    localStorage.removeItem('register_auto_save');
  }, []);
  
  return { loadSavedData, clearSavedData };
};

// ============================================================
//  📧 ارسال ایمیل تایید
// ============================================================

const sendVerificationEmail = async (email, userData) => {
  // شبیه‌سازی ارسال ایمیل
  console.log(`📧 ارسال ایمیل تایید به ${email}`);
  console.log('اطلاعات کاربر:', userData);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      alert(`ایمیل تایید به ${email} ارسال شد.\n(در نسخه واقعی ایمیل حاوی لینک فعالسازی ارسال می‌شود)`);
      resolve(true);
    }, 1000);
  });
};

// ============================================================
//  🎯 کامپوننت اصلی صفحه ثبت‌نام
// ============================================================

const RegisterPage = () => {
  const { t, isRTL } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    candidateNumber: '',
    religion: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    homePhone: '',
    candidateMobile: '',
    fatherMobile: '',
    motherMobile: '',
    address: '',
    province: '',
    city: '',
    postalCode: '',
    profilePhoto: null,
    idBooklet: null,
    nationalCard: null,
    educationDoc: null,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    commitment: false,
    terms: false
  });
  
  const [previews, setPreviews] = useState({});
  const [errors, setErrors] = useState({});
  
  // Auto-Save
  const { loadSavedData, clearSavedData } = useAutoSave(formData, currentStep, 60000);
  
  // بازیابی فرم نیمه‌تمام
  useEffect(() => {
    const saved = loadSavedData();
    if (saved && saved._savedAt) {
      const savedDate = new Date(saved._savedAt);
      const now = new Date();
      const diffHours = (now - savedDate) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        setShowRestorePrompt(true);
      }
    }
  }, [loadSavedData]);
  
  const restoreSavedForm = () => {
    const saved = loadSavedData();
    if (saved) {
      const { _savedAt, _step, ...form } = saved;
      setFormData(form);
      setCurrentStep(_step || 1);
      showNotification('فرم نیمه‌تمام قبلی بازیابی شد', 'success');
      setShowRestorePrompt(false);
    }
  };
  
  // اعتبارسنجی کد ملی
  const handleNationalCodeChange = (code) => {
    const isValid = validateNationalCode(code);
    setFormData(prev => ({ ...prev, nationalCode: code }));
    if (code.length === 10 && !isValid) {
      setErrors(prev => ({ ...prev, nationalCode: 'کد ملی معتبر نیست' }));
    } else {
      setErrors(prev => ({ ...prev, nationalCode: null }));
    }
  };
  
  // تابع نمایش نوتیفیکیشن
  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);
  
  // اعتبارسنجی مرحله
  const validateStep = useCallback(() => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = 'نام الزامی است';
      if (!formData.lastName) newErrors.lastName = 'نام خانوادگی الزامی است';
      if (!formData.nationalCode) newErrors.nationalCode = 'کد ملی الزامی است';
      else if (!validateNationalCode(formData.nationalCode)) newErrors.nationalCode = 'کد ملی نامعتبر است';
      if (!formData.candidateNumber) newErrors.candidateNumber = 'شماره داوطلبی الزامی است';
      if (!formData.religion) newErrors.religion = 'مذهب الزامی است';
      if (!formData.gender) newErrors.gender = 'جنسیت الزامی است';
    }
    
    if (currentStep === 2) {
      if (!formData.candidateMobile) newErrors.candidateMobile = 'شماره همراه الزامی است';
      else if (!validateMobile(formData.candidateMobile)) newErrors.candidateMobile = 'شماره همراه نامعتبر است';
      if (!mobileVerified) newErrors.mobileVerified = 'شماره موبایل تأیید نشده است';
      if (!formData.address) newErrors.address = 'آدرس الزامی است';
    }
    
    if (currentStep === 4) {
      if (!formData.username) newErrors.username = 'نام کاربری الزامی است';
      if (!formData.password) newErrors.password = 'رمز عبور الزامی است';
      else if (formData.password.length < 8) newErrors.password = 'رمز عبور حداقل ۸ کاراکتر';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'رمزهای عبور مطابقت ندارند';
      if (!formData.commitment) newErrors.commitment = 'تعهدنامه باید تایید شود';
      if (!formData.terms) newErrors.terms = 'قوانین باید پذیرفته شود';
      if (!captchaVerified) newErrors.captcha = 'لطفاً کپچا را تأیید کنید';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData, mobileVerified, captchaVerified]);
  
  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      showNotification('لطفاً فیلدهای الزامی را تکمیل کنید', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ارسال ایمیل تایید
      if (formData.email) {
        await sendVerificationEmail(formData.email, formData);
        setEmailSent(true);
      }
      
      // شبیه‌سازی ثبت در دیتابیس
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('ثبت‌نام با موفقیت انجام شد! به سامانه فرتاک خوش آمدید 🎉', 'success');
      clearSavedData();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      showNotification('خطا در ثبت‌نام. لطفاً مجدد تلاش کنید', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="register-page">
      <canvas id="particles-canvas" className="particles-canvas" />
      
      {/* بنر بازیابی فرم */}
      {showRestorePrompt && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="restore-banner"
        >
          <FaSave />
          <span>فرم ناتمام قبلی یافت شد!</span>
          <button onClick={restoreSavedForm}>بازیابی</button>
          <button onClick={() => setShowRestorePrompt(false)}>رد کردن</button>
        </motion.div>
      )}
      
      <div className="register-container">
        {/* هدر با مراحل */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="register-header">
          <div className="header-content">
            <div className="header-icon">🎓</div>
            <div className="header-text">
              <h1>ثبت‌نام داوطلبان مصاحبه</h1>
              <p>سامانه جامع فرتاک - دانشگاه صدا و سیما</p>
            </div>
          </div>
          
          <div className="header-steps">
            {[
              { step: 1, label: 'اطلاعات فردی', icon: '👤' },
              { step: 2, label: 'اطلاعات تماس', icon: '📱' },
              { step: 3, label: 'مدارک', icon: '📎' },
              { step: 4, label: 'اطلاعات حساب', icon: '🔐' },
              { step: 5, label: 'پرداخت', icon: '💰' }
            ].map((s, idx) => (
              <React.Fragment key={s.step}>
                <div className={`step ${currentStep === s.step ? 'active' : ''} ${currentStep > s.step ? 'completed' : ''}`}>
                  <div className="step-number">{currentStep > s.step ? <FaCheckCircle /> : s.step}</div>
                  <span className="step-label">{s.label}</span>
                </div>
                {idx < 4 && <div className="step-line" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
        
        {/* فرم اصلی */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="register-box">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* مرحله 1: اطلاعات فردی */}
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: isRTL ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 50 : -50 }} className="form-section">
                  <h2 className="section-title"><span className="section-icon">👤</span> اطلاعات فردی</h2>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>نام <span className="required">*</span></label>
                      <div className="input-wrapper"><FaUser className="input-icon" /><input name="firstName" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} /></div>
                      {errors.firstName && <span className="input-error">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label>نام خانوادگی <span className="required">*</span></label>
                      <div className="input-wrapper"><FaUser className="input-icon" /><input name="lastName" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} /></div>
                      {errors.lastName && <span className="input-error">{errors.lastName}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>کد ملی <span className="required">*</span></label>
                      <div className="input-wrapper"><FaIdCard className="input-icon" /><input name="nationalCode" value={formData.nationalCode} onChange={(e) => handleNationalCodeChange(e.target.value)} maxLength={10} /></div>
                      {errors.nationalCode && <span className="input-error">{errors.nationalCode}</span>}
                      {formData.nationalCode.length === 10 && validateNationalCode(formData.nationalCode) && <span className="input-success"><MdVerified /> معتبر</span>}
                    </div>
                    <div className="form-group">
                      <label>شماره داوطلبی <span className="required">*</span></label>
                      <div className="input-wrapper"><FaIdCard className="input-icon" /><input name="candidateNumber" value={formData.candidateNumber} onChange={(e) => setFormData(prev => ({ ...prev, candidateNumber: e.target.value }))} /></div>
                      {errors.candidateNumber && <span className="input-error">{errors.candidateNumber}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>مذهب <span className="required">*</span></label>
                      <div className="input-wrapper select-wrapper"><FaShieldAlt className="input-icon" /><select name="religion" value={formData.religion} onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))}><option value="">انتخاب کنید</option><option value="islam">اسلام</option><option value="christianity">مسیحیت</option><option value="judaism">یهودیت</option><option value="zoroastrianism">زرتشتی</option><option value="other">سایر</option></select><span className="select-arrow">▼</span></div>
                      {errors.religion && <span className="input-error">{errors.religion}</span>}
                    </div>
                    <div className="form-group">
                      <label>جنسیت <span className="required">*</span></label>
                      <div className="input-wrapper select-wrapper"><FaUser className="input-icon" /><select name="gender" value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}><option value="">انتخاب کنید</option><option value="male">مرد</option><option value="female">زن</option></select><span className="select-arrow">▼</span></div>
                      {errors.gender && <span className="input-error">{errors.gender}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <PersianDatePicker label="تاریخ تولد" value={formData.birthDate} onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date }))} />
                    <div className="form-group">
                      <label>محل تولد</label>
                      <div className="input-wrapper"><FaMapMarkerAlt className="input-icon" /><input name="birthPlace" value={formData.birthPlace} onChange={(e) => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))} /></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* مرحله 2: اطلاعات تماس با OTP */}
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: isRTL ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 50 : -50 }} className="form-section">
                  <h2 className="section-title"><span className="section-icon">📱</span> اطلاعات تماس</h2>
                  
                  <div className="info-box"><FaInfoCircle /><p>لطفاً شماره‌های تماس را با دقت وارد کنید</p></div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>شماره همراه داوطلب <span className="required">*</span></label>
                      <div className="input-wrapper"><MdPhoneAndroid className="input-icon" /><input name="candidateMobile" value={formData.candidateMobile} onChange={(e) => setFormData(prev => ({ ...prev, candidateMobile: e.target.value }))} maxLength={11} /></div>
                      {errors.candidateMobile && <span className="input-error">{errors.candidateMobile}</span>}
                    </div>
                    <MobileVerification mobile={formData.candidateMobile} onVerified={setMobileVerified} />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>شماره همراه پدر <span className="required">*</span></label>
                      <div className="input-wrapper"><MdFamilyRestroom className="input-icon" /><input name="fatherMobile" value={formData.fatherMobile} onChange={(e) => setFormData(prev => ({ ...prev, fatherMobile: e.target.value }))} maxLength={11} /></div>
                    </div>
                    <div className="form-group">
                      <label>شماره همراه مادر <span className="required">*</span></label>
                      <div className="input-wrapper"><MdFamilyRestroom className="input-icon" /><input name="motherMobile" value={formData.motherMobile} onChange={(e) => setFormData(prev => ({ ...prev, motherMobile: e.target.value }))} maxLength={11} /></div>
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>آدرس منزل <span className="required">*</span></label>
                    <div className="input-wrapper"><FaMapMarkerAlt className="input-icon" /><textarea name="address" rows="3" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
                    {errors.address && <span className="input-error">{errors.address}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group"><label>استان</label><div className="input-wrapper select-wrapper"><MdLocationCity className="input-icon" /><select name="province" value={formData.province} onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}><option value="">انتخاب کنید</option><option value="tehran">تهران</option><option value="alborz">البرز</option><option value="isfahan">اصفهان</option><option value="fars">فارس</option><option value="khorasan">خراسان رضوی</option></select><span className="select-arrow">▼</span></div></div>
                    <div className="form-group"><label>شهر</label><div className="input-wrapper"><MdLocationCity className="input-icon" /><input name="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} /></div></div>
                  </div>
                </motion.div>
              )}
              
              {/* مرحله 3: مدارک با آپلود پیشرفته */}
              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: isRTL ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 50 : -50 }} className="form-section">
                  <h2 className="section-title"><span className="section-icon">📎</span> مدارک و مستندات</h2>
                  
                  <div className="upload-grid">
                    <UploadWithProgress label="عکس پروفایل" name="profilePhoto" accept="JPG/PNG" onUpload={(file) => setFormData(prev => ({ ...prev, profilePhoto: file }))} />
                    <UploadWithProgress label="صفحه اول شناسنامه" name="idBooklet" accept="JPG/PNG/PDF" onUpload={(file) => setFormData(prev => ({ ...prev, idBooklet: file }))} />
                    <UploadWithProgress label="کارت ملی" name="nationalCard" accept="JPG/PNG/PDF" onUpload={(file) => setFormData(prev => ({ ...prev, nationalCard: file }))} />
                    <UploadWithProgress label="مدرک تحصیلی" name="educationDoc" accept="JPG/PNG/PDF" onUpload={(file) => setFormData(prev => ({ ...prev, educationDoc: file }))} />
                  </div>
                </motion.div>
              )}
              
              {/* مرحله 4: اطلاعات حساب + CAPTCHA */}
              {currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: isRTL ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 50 : -50 }} className="form-section">
                  <h2 className="section-title"><span className="section-icon">🔐</span> اطلاعات حساب کاربری</h2>
                  
                  <div className="form-row">
                    <div className="form-group"><label>نام کاربری <span className="required">*</span></label><div className="input-wrapper"><FaUser className="input-icon" /><input name="username" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} /></div>{errors.username && <span className="input-error">{errors.username}</span>}</div>
                    <div className="form-group"><label>ایمیل</label><div className="input-wrapper"><FaEnvelope className="input-icon" /><input type="email" name="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div></div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group"><label>رمز عبور <span className="required">*</span></label><div className="input-wrapper password-wrapper"><FaLock className="input-icon" /><input type="password" name="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} /></div>{errors.password && <span className="input-error">{errors.password}</span>}</div>
                    <div className="form-group"><label>تکرار رمز <span className="required">*</span></label><div className="input-wrapper password-wrapper"><FaLock className="input-icon" /><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} /></div>{errors.confirmPassword && <span className="input-error">{errors.confirmPassword}</span>}</div>
                  </div>
                  
                  {/* تعهدنامه و دانلود PDF */}
                  <div className="commitment-section">
                    <h3 className="commitment-title"><FaFileContract /> تعهدنامه</h3>
                    <div className="commitment-text"><p>با ثبت‌نام در این سامانه، متعهد می‌شوم:</p><ul><li>کلیه اطلاعات ارائه شده صحیح و واقعی می‌باشد.</li><li>در صورت اثبات هرگونه تخلف، مسئولیت قانونی بر عهده اینجانب خواهد بود.</li><li>در صورت پذیرش در مصاحبه، در زمان مقرر حضور خواهم داشت.</li></ul></div>
                    <CommitmentPDF userData={formData} onDownload={() => showNotification('تعهدنامه با موفقیت دانلود شد', 'success')} />
                    <label className="checkbox-label"><input type="checkbox" name="commitment" checked={formData.commitment} onChange={(e) => setFormData(prev => ({ ...prev, commitment: e.target.checked }))} /><span className="checkbox-custom" /><span>تعهدات فوق را می‌پذیرم</span></label>
                    {errors.commitment && <span className="input-error">{errors.commitment}</span>}
                    <label className="checkbox-label"><input type="checkbox" name="terms" checked={formData.terms} onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))} /><span className="checkbox-custom" /><span>با <a href="#">قوانین و حریم خصوصی</a> موافقم</span></label>
                    {errors.terms && <span className="input-error">{errors.terms}</span>}
                  </div>
                  
                  {/* CAPTCHA */}
                  <div className="captcha-section">
                    <label>کد امنیتی <span className="required">*</span></label>
                    <SimpleCaptcha onVerify={setCaptchaVerified} />
                    {errors.captcha && <span className="input-error">{errors.captcha}</span>}
                  </div>
                </motion.div>
              )}
              
              {/* مرحله 5: پرداخت */}
              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: isRTL ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 50 : -50 }} className="form-section">
                  <h2 className="section-title"><span className="section-icon">💰</span> پرداخت شهریه</h2>
                  <PaymentGateway amount={2500000} onPayment={setPaymentCompleted} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* دکمه‌های ناوبری */}
            <div className="form-navigation">
              {currentStep > 1 && <button type="button" className="nav-btn prev-btn" onClick={prevStep}><FaArrowRight /> قبلی</button>}
              {currentStep < 5 && <button type="button" className="nav-btn next-btn" onClick={nextStep}>بعدی <FaArrowLeft /></button>}
              {currentStep === 5 && <button type="submit" className="nav-btn submit-btn" disabled={isSubmitting}>{isSubmitting ? <FaSpinner className="spinner" /> : 'تکمیل ثبت‌نام'} <FaCheckCircle /></button>}
            </div>
          </form>
          
          <div className="login-link-section"><p>قبلاً ثبت‌نام کرده‌اید؟ <a href="/login">ورود به سامانه</a></p></div>
        </motion.div>
      </div>
      
      {/* نوتیفیکیشن‌ها */}
      <div className="notification-container">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div key={notif.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className={`notification notification-${notif.type}`}>
              <span className="notification-icon">{notif.type === 'success' ? '✓' : notif.type === 'error' ? '✕' : 'ℹ'}</span>
              <span className="notification-message">{notif.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RegisterPage;