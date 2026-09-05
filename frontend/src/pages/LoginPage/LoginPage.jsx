import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 🎨 ایمپورت تمام تصاویر با مدیریت پیشرفته
import download from "../../components/shared/download.png";
import iribuIcon from "../../components/shared/iribuIcon.svg";
import moavenat from "../../components/shared/moavenat.jpg";
import roshana from "../../components/shared/roshana.jpg";
import sazman from "../../components/shared/sazman.jpg";
import '../../styles/Login.css';

// ============================================
// 🚀 کامپوننت اصلی صفحه ورود روشنــا (نسخه پیشرفته)
// ============================================
const RoshanLoginPage = () => {
  const navigate = useNavigate();

  // =================== 📊 مدیریت وضعیت (State Management) ===================
  const [theme, setTheme] = useState('dark');                    // تم برنامه (dark/light)
  const [username, setUsername] = useState('');                  // نام کاربری/موبایل/ایمیل
  const [password, setPassword] = useState('');                  // رمز عبور
  const [remember, setRemember] = useState(true);                // به خاطر سپاری کاربر
  const [isLoading, setIsLoading] = useState(false);             // وضعیت لودینگ
  const [currentDateTime, setCurrentDateTime] = useState('');    // تاریخ و زمان جاری
  const [ipWeather, setIpWeather] = useState({ 
    ip: 'قابل دریافت نیست 🌍', 
    weather: 'آب‌و‌هوا: نامشخص ☁️' 
  });                                                             // اطلاعات IP و آب و هوا
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false); // وضعیت پخش‌کننده موسیقی
  const [isPlaying, setIsPlaying] = useState(false);             // وضعیت پخش آهنگ
  const [currentTime, setCurrentTime] = useState('00:00');       // زمان جاری آهنگ
  const [duration, setDuration] = useState('00:00');             // طول کل آهنگ
  const [volume, setVolume] = useState(0.18);                    // میزان صدا (18%)
  const [showPassword, setShowPassword] = useState(false);       // نمایش/مخفی کردن رمز
  const [capsLock, setCapsLock] = useState(false);               // وضعیت کلید Caps Lock
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // وضعیت اتصال به اینترنت
  const [loginAttempts, setLoginAttempts] = useState(0);         // تعداد تلاش‌های ناموفق
  const [isLocked, setIsLocked] = useState(false);               // قفل بودن حساب کاربری
  const [lockTimer, setLockTimer] = useState(null);              // تایمر قفل حساب
  
  // اطلاعات آهنگ در حال پخش
  const [trackInfo] = useState({
    title: 'باران عشق',
    artist: 'ناصر چشم‌آذر',
    cover: 'https://raw.githubusercontent.com/m-amin-wolverine/Roshana-Project/main/Login-page/cover.jpg'
  });

  // =================== 🌐 تنظیمات API ===================
  //const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
  //const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  const API_BASE_URL = '/api/v1';
  // =================== 🔗 ارجاعات (Refs) ===================
  const canvasRef = useRef(null);           // رفرنس بوم ذرات
  const audioRef = useRef(null);            // رفرنس المان صوتی
  const wavesurferRef = useRef(null);       // رفرنس ویوفرم صوتی
  const usernameInputRef = useRef(null);    // رفرنس فیلد نام کاربری
  const passwordInputRef = useRef(null);    // رفرنس فیلد رمز عبور

  // =================== 🛠️ توابع کمکی ===================
  
  /**
   * نمایش نوتیفیکیشن پیشرفته با انیمیشن
   * @param {string} message - متن پیام
   * @param {string} type - نوع پیام (info/success/warning/error)
   * @param {number} duration - مدت زمان نمایش (میلی‌ثانیه)
   */
  const showNotification = (message, type = 'info', duration = 4000) => {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    const colors = {
      info: '#00e0ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    notification.style.cssText = `
      background: ${colors[type]};
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      font-family: 'Vazirmatn', sans-serif;
      direction: rtl;
      transform: translateX(120%);
      transition: transform 0.3s ease;
      cursor: pointer;
      max-width: 380px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 10002;
    `;
    notification.innerHTML = `${icons[type]} ${message}`;
    notification.onclick = () => {
      notification.style.transform = 'translateX(120%)';
      setTimeout(() => notification.remove(), 300);
    };
    container.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => {
      notification.style.transform = 'translateX(120%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  };

  /**
   * تبدیل ثانیه به فرمت دقیقه:ثانیه
   * @param {number} seconds - ثانیه
   * @returns {string} زمان فرمت شده
   */
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  /**
   * اعتبارسنجی رمز عبور (قدرت رمز)
   * @param {string} pass - رمز عبور
   * @returns {object} وضعیت اعتبارسنجی
   */
  const validatePassword = (pass) => {
    const checks = {
      length: pass.length >= 8,
      number: /[0-9]/.test(pass),
      letter: /[a-zA-Z]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };
    return checks;
  };

  // =================== 🎨 مدیریت تم ===================
  
  /**
   * تغییر تم بین روشن و تاریک
   */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('rooshan-theme', newTheme);
    generateDynamicGradient(newTheme);
    showNotification(`تم به ${newTheme === 'dark' ? 'تاریک' : 'روشن'} تغییر یافت`, 'success', 1500);
  };

  /**
   * تولید گرادینت پویا بر اساس تم
   * @param {string} currentTheme - تم فعلی
   */
  const generateDynamicGradient = (currentTheme) => {
    const colors = currentTheme === 'dark'
      ? ['#0a1118', '#1a2a35', '#00e0ff']
      : ['#f0f7fc', '#e0f0ff', '#0077cc'];
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const gradient = `radial-gradient(circle at ${x}% ${y}%, ${colors[0]}, ${colors[1]} 50%, ${colors[2]} 100%)`;
    document.body.style.backgroundImage = gradient;
  };

  // =================== ✨ موتور ذرات (بهینه شده) ===================
  /**
   * راه‌اندازی انیمیشن ذرات متحرک در پس‌زمینه
   */
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 80 : 200;  // کاهش تعداد ذرات در موبایل
    let particles = [];
    let animationId = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    const drawParticles = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createLinearGradient(particle.x, particle.y, particle.x + 10, particle.y + 10);
        gradient.addColorStop(0, `rgba(0, 224, 255, ${particle.alpha})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, ${particle.alpha})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      });
      
      animationId = requestAnimationFrame(drawParticles);
    };

    const init = () => {
      resizeCanvas();
      createParticles();
      drawParticles();
    };

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    init();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // =================== 🌤️ دریافت اطلاعات آب و هوا و IP (نسخه پیشرفته) ===================
  /**
   * دریافت موقعیت مکانی، IP و اطلاعات آب و هوایی کاربر
   */
  const fetchWeatherAndIP = useCallback(async () => {
    try {
      // دریافت IP کاربر
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      
      // دریافت موقعیت از روی IP
      const locRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
      const locData = await locRes.json();
      
      // تولید ایموجی پرچم کشور
      let flagEmoji = '🌍';
      if (locData.country_code && locData.country_code.length === 2) {
        flagEmoji = String.fromCodePoint(
          locData.country_code.charCodeAt(0) + 127397,
          locData.country_code.charCodeAt(1) + 127397
        );
      }
      
      setIpWeather(prev => ({
        ...prev,
        ip: `${ipData.ip} ${flagEmoji} ${locData.city ? `(${locData.city})` : ''}`
      }));
      
      // هشدار در صورت استفاده از VPN
      if (locData.country_code !== 'IR') {
        showNotification(
          `⚠️ شما از طریق ${locData.country_name} متصل هستید. لطفاً VPN خود را غیرفعال کنید.`,
          'warning',
          8000
        );
      }
      
      // دریافت داده‌های آب و هوا
      if (locData.latitude && locData.longitude) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FTehran`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const current = weatherData.current || {};
        
        // نقشه کدهای وضعیت آب و هوا
        const conditionMap = {
          0: '☀️ آفتابی', 1: '🌤️ کمی ابری', 2: '⛅ نیمه ابری', 3: '☁️ ابری',
          45: '🌫️ مه آلود', 51: '🌦️ باران ریز', 61: '🌧️ باران', 71: '❄️ برف',
          80: '⛈️ رگبار', 95: '⚡ رعد و برق'
        };
        
        setIpWeather(prev => ({
          ...prev,
          weather: `${locData.city || 'تهران'}: ${current.temperature_2m?.toFixed(0) || '?'}°C • ${conditionMap[current.weather_code] || '🌡️ متغیر'} • 💧 ${current.relative_humidity_2m || '?'}%`
        }));
      }
    } catch (error) {
      console.error('خطا در دریافت اطلاعات آب و هوا:', error);
      setIpWeather({ ip: '🔒 حالت ناشناس', weather: '🌡️ آب و هوا: نامشخص' });
    }
  }, []);

  // =================== 🎵 پخش‌کننده موسیقی ===================
  /**
   * راه‌اندازی ویوفرم صوتی با WaveSurfer
   */
  const initWaveSurfer = useCallback(() => {
    if (!window.WaveSurfer) {
      console.warn('WaveSurfer بارگذاری نشده است');
      return;
    }

    const wavesurfer = window.WaveSurfer.create({
      container: '#waveform',
      waveColor: '#64748b',
      progressColor: '#06b6d4',
      cursorColor: '#ffffff',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      height: 64,
      normalize: true,
      backend: 'WebAudio',
      responsive: true,
      hideScrollbar: true,
      mediaControls: false
    });

    const audioUrl = 'https://dl.musicdel.ir/Music/1400/05/naser_chashmazar_barane_eshghe.mp3';
    
    wavesurfer.load(audioUrl);
    
    wavesurfer.on('ready', () => {
      setDuration(formatTime(wavesurfer.getDuration()));
      wavesurfer.setVolume(volume);
    });
    
    wavesurfer.on('audioprocess', () => {
      setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
    });
    
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));
    
    wavesurfer.on('error', (err) => {
      console.error('خطای WaveSurfer:', err);
      showNotification('⚠️ خطا در پخش آهنگ', 'error');
    });

    wavesurferRef.current = wavesurfer;
  }, [volume]);

  /**
   * تغییر وضعیت پخش/مکث آهنگ
   */
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  /**
   * تنظیم میزان صدا
   * @param {object} e - رویداد تغییر
   */
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  /**
   * باز/بستن پخش‌کننده موسیقی
   * @param {boolean} open - وضعیت باز بودن
   */
  const toggleMusicPlayer = (open) => {
    setIsMusicPlayerOpen(open);
    if (open && !wavesurferRef.current) {
      initWaveSurfer();
    }
  };

  // =================== 🔐 مدیریت ورود (نسخه نهایی پیشرفته) ===================
  
  /**
   * پردازش درخواست ورود به سامانه با اعتبارسنجی کامل
   * @param {object} e - رویداد فرم
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 🔒 بررسی قفل بودن حساب
    if (isLocked) {
      showNotification('🔒 حساب کاربری شما موقتاً قفل شده است. لطفاً چند دقیقه دیگر تلاش کنید.', 'error');
      return;
    }
    
    // ✅ اعتبارسنجی پیشرفته ورودی‌ها
    const isPhoneNumber = /^09[0-9]{9}$/.test(username);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    
    if (!username || username.length < 3) {
      showNotification('📝 لطفاً نام کاربری، ایمیل یا شماره موبایل معتبر وارد کنید', 'error');
      usernameInputRef.current?.focus();
      return;
    }
    
    const passwordChecks = validatePassword(password);
    if (!password || password.length < 6) {
      showNotification('🔑 رمز عبور باید حداقل ۶ کاراکتر باشد', 'error');
      passwordInputRef.current?.focus();
      return;
    }
    
    if (passwordChecks && passwordChecks.level === 'weak') {
      showNotification('⚠️ رمز عبور شما ضعیف است. پیشنهاد می‌کنیم بعد از ورود آن را تغییر دهید.', 'warning', 3000);
    }
    
    setIsLoading(true);
    
    // 📡 ارسال درخواست به سرور
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`
          }
        }),
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      console.log(`📊 زمان پاسخ سرور: ${responseTime}ms`);
      
      // ✅ پردازش پاسخ موفق
      if (response.ok && data.success) {
        // ریست تلاش‌های ناموفق
        setLoginAttempts(0);
        setIsLocked(false);
        
        // ذخیره اطلاعات احراز هویت
        localStorage.setItem('fartak_auth_token', data.token);
        localStorage.setItem('fartak_user', JSON.stringify(data.user));
        localStorage.setItem('fartak_last_login', new Date().toISOString());
        localStorage.setItem('fartak_last_login_device', navigator.userAgent);
        
        if (remember) {
          localStorage.setItem('rememberedUser', username);
          localStorage.setItem('rememberedUserType', isPhoneNumber ? 'phone' : (isEmail ? 'email' : 'username'));
        } else {
          localStorage.removeItem('rememberedUser');
          localStorage.removeItem('rememberedUserType');
        }
        
        // 🎯 ساخت پیام خوش‌آمدگویی شخصی‌سازی شده
        const userFullName = data.user?.fullName || 
                            (data.user?.firstName && data.user?.lastName ? `${data.user.firstName} ${data.user.lastName}` : null) ||
                            data.user?.name ||
                            data.user?.username ||
                            (isPhoneNumber ? 'کاربر گرامی' : username);
        
        const cleanName = userFullName.replace(/^(کاربر|user|test)/i, '').trim() || 'کاربر گرامی';
        
        const currentHour = new Date().getHours();
        let welcomeMessage = '';
        if (currentHour < 12) welcomeMessage = `☀️ صبح بخیر`;
        else if (currentHour < 18) welcomeMessage = `🌤️ ظهر بخیر`;
        else welcomeMessage = `🌙 عصر بخیر`;
        
        const rolePersian = {
          'student': '🎓 دانشجو', 'professor': '👨‍🏫 استاد', 
          'admin': '👑 مدیر', 'staff': '👔 کارمند'
        };
        const userRole = rolePersian[data.user?.role] || '👤 کاربر';
        
        // 💾 ذخیره اطلاعات در localStorage برای صفحه OTP
        const userDisplayName = cleanName;
        const maskedPhone = data.user?.phone 
          ? data.user.phone.substring(0, 4) + '****' + data.user.phone.substring(7)
          : username.trim().substring(0, 4) + '****' + (username.trim().length > 7 ? username.trim().substring(7) : '');
        
        localStorage.setItem('otpPhone', username.trim());
        localStorage.setItem('otpType', 'login');
        localStorage.setItem('otpTempToken', data.tempToken || data.token);
        localStorage.setItem('otpUser', JSON.stringify(data.user));
        localStorage.setItem('otpUserName', userDisplayName);
        localStorage.setItem('otpMaskedPhone', maskedPhone);
        localStorage.setItem('otpExpiry', Date.now() + 5 * 60 * 1000);
        
        // 🎨 انیمیشن موفقیت روی دکمه و فرم
        const btn = document.querySelector('.login-btn');
        const form = document.querySelector('.login-form');
        
        if (btn) {
          btn.classList.add('success-animation');
          btn.innerHTML = '<span class="btn-text">✅ ورود موفق</span>';
          setTimeout(() => {
            btn.classList.remove('success-animation');
          }, 1000);
        }
        
        if (form) {
          form.classList.add('success-glow');
          setTimeout(() => {
            form.classList.remove('success-glow');
          }, 1500);
        }
        
        // نمایش نوتیفیکیشن خوش‌آمدگویی
        showNotification(
          `✨ ${welcomeMessage} ${userDisplayName} جان!\n${userRole} عزیز، خوش آمدی به سامانه فرتاک\n📱 کد تأیید به ${maskedPhone} ارسال شد\n⏱️ در حال هدایت به صفحه تأیید...`, 
          'success', 
          4000
        );
        
        // 🚀 هدایت به صفحه OTP
        setTimeout(() => {
          if (typeof navigate === 'function') {
            navigate('/otp-verify', {
              state: {
                username: username.trim(),
                userFullName: userDisplayName,
                tempToken: data.tempToken || data.token,
                phone: data.user?.phone,
                maskedPhone: maskedPhone,
                email: data.user?.email,
                role: data.user?.role,
                timestamp: Date.now()
              },
              replace: true
            });
          } else {
            window.location.href = '/otp-verify';
          }
        }, 3000);
        
        // پاکسازی خودکار اطلاعات OTP بعد از 10 دقیقه
        setTimeout(() => {
          const otpExpiry = localStorage.getItem('otpExpiry');
          if (otpExpiry && Date.now() > parseInt(otpExpiry)) {
            ['otpPhone', 'otpType', 'otpTempToken', 'otpUser', 'otpUserName', 'otpMaskedPhone', 'otpExpiry']
              .forEach(key => localStorage.removeItem(key));
            console.log('🧹 اطلاعات OTP منقضی و پاک شد');
          }
        }, 10 * 60 * 1000);
        
      } 
      // ❌ پردازش خطای لاگین ناموفق
      else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        const remainingAttempts = 5 - newAttempts;
        
        let errorMessage = data.message || 'نام کاربری یا رمز عبور اشتباه است';
        let errorIcon = '❌';
        
        if (data.code === 'ACCOUNT_LOCKED') {
          errorIcon = '🔒';
          errorMessage = `حساب کاربری شما قفل شده است. ${data.remainingMinutes || 5} دقیقه دیگر تلاش کنید.`;
          setIsLocked(true);
        } else if (remainingAttempts > 0 && remainingAttempts <= 2) {
          errorIcon = '⚠️';
          errorMessage = `${errorMessage}\nتنها ${remainingAttempts} تلاش دیگر باقی مانده است.`;
        } else if (remainingAttempts === 0) {
          errorIcon = '🔒';
          errorMessage = `به دلیل ۵ بار تلاش ناموفق، حساب کاربری شما به مدت ۵ دقیقه قفل شد.`;
          setIsLocked(true);
          
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
            showNotification('✅ قفل حساب کاربری باز شد. می‌توانید مجدد تلاش کنید.', 'success', 5000);
          }, 5 * 60 * 1000);
        }
        
        showNotification(`${errorIcon} ${errorMessage}`, 'error', 5000);
        
        // لرزش فرم و اینپوت‌ها
        const form = document.querySelector('.login-form');
        const inputs = document.querySelectorAll('.login-form input');
        
        if (form) {
          form.classList.add('shake');
          setTimeout(() => form.classList.remove('shake'), 500);
        }
        
        inputs.forEach(input => {
          input.classList.add('error-shake');
          setTimeout(() => input.classList.remove('error-shake'), 500);
        });
        
        // پاک کردن فیلد رمز عبور
        setPassword('');
        passwordInputRef.current?.focus();
      }
      
    } 
    // 🌐 مدیریت خطاهای شبکه
    catch (error) {
      console.error('خطای ورود:', error);
      
      if (!navigator.onLine) {
        showNotification('📡 اتصال اینترنت خود را بررسی کنید و مجدد تلاش نمایید.', 'error', 5000);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showNotification('🔌 سرور در دسترس نیست. لطفاً چند لحظه دیگر تلاش کنید.', 'error', 5000);
      } else if (error.name === 'AbortError') {
        showNotification('⏱️ زمان درخواست به پایان رسید. مجدد تلاش کنید.', 'error', 5000);
      } else {
        showNotification('❌ خطا در ارتباط با سرور. لطفاً مجدد تلاش کنید.', 'error', 5000);
      }
      
    } 
    finally {
      setIsLoading(false);
    }
  };

  // =================== 🔑 مدیریت فراموشی رمز عبور (نسخه نهایی) ===================
  /**
   * هدایت کاربر به صفحه بازیابی رمز عبور
   */
  const handleForgotPassword = () => {
    let contactInfo = null;
    let contactType = 'none';
    
    if (username && username.trim() !== '') {
      const isPhoneNumber = /^09[0-9]{9}$/.test(username);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      
      contactType = isPhoneNumber ? 'phone' : (isEmail ? 'email' : 'username');
      contactInfo = username.trim();
      showNotification('🔄 در حال انتقال به صفحه بازیابی رمز عبور...', 'info', 1500);

/*       if (isPhoneNumber ) {
        if (!/^09[0-9]{9}$/.test(username)) {
          showNotification('📱 شماره موبایل وارد شده معتبر نیست', 'warning', 2000);
        } else {
          showNotification(`📱 در حال انتقال به صفحه بازیابی برای شماره ${username.substring(0, 4)}****${username.substring(7)}...`, 'info', 1500);
        }
      } else if (isEmail) {
        if (username.length < 5) {
          showNotification('✉️ ایمیل وارد شده معتبر نیست', 'warning', 2000);
        } else {
          const maskedEmail = username.replace(/(.{2})(.*)(@.*)/, '$1****$3');
          showNotification(`✉️ در حال انتقال به صفحه بازیابی برای ایمیل ${maskedEmail}...`, 'info', 1500);
        }
      } else {
        const maskedName = username.length > 3 ? username.substring(0, 2) + '***' : username;
        showNotification(`👤 در حال انتقال به صفحه بازیابی برای کاربر ${maskedName}...`, 'info', 1500);
      }
    } else {
      showNotification('🔄 در حال انتقال به صفحه بازیابی رمز عبور...', 'info', 1500);
    } */
    }
    // 🎯 افکت و انیمیشن دکمه
    const forgotBtn = document.querySelector('.forgot-link');
    let originalBtnText = null;
    let originalBtnBg = null;
    
    if (forgotBtn) {
      originalBtnText = forgotBtn.innerHTML;
      originalBtnBg = forgotBtn.style.background;
      
      forgotBtn.style.transform = 'scale(0.95)';
      forgotBtn.style.transition = 'all 0.2s ease';
      forgotBtn.innerHTML = '🔄 در حال انتقال...';
      forgotBtn.style.opacity = '0.7';
      forgotBtn.style.pointerEvents = 'none';
      
      setTimeout(() => {
        forgotBtn.style.transform = 'scale(1)';
      }, 150);
    }
    
    // 💾 ذخیره اطلاعات در localStorage برای صفحه بعد
    if (contactInfo) {
      localStorage.setItem('forgotPasswordContact', contactInfo);
      localStorage.setItem('forgotPasswordType', contactType);
      localStorage.setItem('forgotPasswordTimestamp', Date.now().toString());
      
      setTimeout(() => {
        if (localStorage.getItem('forgotPasswordTimestamp') === Date.now().toString()) {
          localStorage.removeItem('forgotPasswordContact');
          localStorage.removeItem('forgotPasswordType');
          localStorage.removeItem('forgotPasswordTimestamp');
        }
      }, 30 * 60 * 1000);
    }
    
    // 🎨 افکت لرزش خفیف فرم
    const form = document.querySelector('.login-form');
    if (form) {
      form.classList.add('forgot-shake');
      setTimeout(() => {
        form.classList.remove('forgot-shake');
      }, 300);
    }
    
    // ایجاد افکت ریپل روی دکمه
    if (forgotBtn) {
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      ripple.style.width = '100px';
      ripple.style.height = '100px';
      ripple.style.marginLeft = '-50px';
      ripple.style.marginTop = '-50px';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'ripple-animation 0.6s ease-out';
      
      forgotBtn.style.position = 'relative';
      forgotBtn.style.overflow = 'hidden';
      forgotBtn.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    }
    
    // 🚀 هدایت به صفحه فراموشی رمز
    setTimeout(() => {
      navigate('/Forgot-passwd', {
        state: {
          contactInfo: contactInfo,
          contactType: contactType,
          from: 'login_page',
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        },
        replace: true
      });
      
      if (forgotBtn) {
        setTimeout(() => {
          if (forgotBtn) {
            forgotBtn.innerHTML = originalBtnText;
            forgotBtn.style.opacity = '1';
            forgotBtn.style.pointerEvents = 'auto';
            forgotBtn.style.background = originalBtnBg;
            forgotBtn.style.transform = 'scale(1)';
          }
        }, 500);
      }
    }, 400);
  };

  /**
   * اعتبارسنجی شماره موبایل ایران (پشتیبانی از فرمت‌های مختلف)
   * @param {string} mobile - شماره موبایل
   * @returns {boolean} معتبر/نامعتبر
   */
  const validateIranianMobile = (mobile) => {
    const patterns = [
      /^09[0-9]{9}$/,           // 09123456789
      /^\+989[0-9]{9}$/,        // +989123456789
      /^00989[0-9]{9}$/         // 00989123456789
    ];
    return patterns.some(pattern => pattern.test(mobile));
  };

  // =================== 💾 بارگذاری اطلاعات ذخیره شده ===================
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUser');
    if (savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

  // =================== 📡 تشخیص آنلاین/آفلاین ===================
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotification('اتصال اینترنت برقرار شد', 'success', 2000);
      fetchWeatherAndIP();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      showNotification('اتصال اینترنت قطع شد', 'error', 3000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchWeatherAndIP]);

  // =================== ⌨️ تشخیص Caps Lock ===================
  const handleKeyPress = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
  };

  // =================== 📅 بروزرسانی تاریخ و زمان ===================
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      const persianDate = now.toLocaleString('fa-IR', options);
      setCurrentDateTime(persianDate);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // =================== 🚀 راه‌اندازی اولیه ===================
  useEffect(() => {
    // بارگذاری تم ذخیره شده
    const savedTheme = localStorage.getItem('rooshan-theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    generateDynamicGradient(savedTheme);
    
    // راه‌اندازی ذرات
    const cleanupParticles = initParticles();
    
    // دریافت اطلاعات آب و هوا و IP
    fetchWeatherAndIP();
    
    // ایجاد کانتینر نوتیفیکیشن
    const notifContainer = document.createElement('div');
    notifContainer.id = 'notification-container';
    notifContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(notifContainer);
    
    // راه‌اندازی پخش‌کننده موسیقی در دسکتاپ
    if (window.innerWidth >= 768) {
      initWaveSurfer();
    }
    
    // فوکوس روی فیلد نام کاربری
    usernameInputRef.current?.focus();
    
    // پاکسازی
    return () => {
      if (cleanupParticles) cleanupParticles();
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      const container = document.getElementById('notification-container');
      if (container) container.remove();
    };
  }, [initParticles, fetchWeatherAndIP, initWaveSurfer]);

  // بروزرسانی attribute تم در body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // =================== 🎨 رندر اصلی کامپوننت ===================
  return (
    <div className="roshan-container">
      <style>{`
        /* متغیرهای CSS پیشرفته */
        :root {
          --primary-color: #3b82f6;
          --primary-dark: #2563eb;
          --primary-light: #60a5fa;
          --accent-color: #8b5cf6;
          --bg-dark: #0a1118;
          --bg-card: #111a22;
          --bg-card-light: #1a2632;
          --text-primary: #e5e7eb;
          --text-secondary: #9ca3af;
          --text-muted: #6b7280;
          --border-color: #2d3748;
          --input-bg: #1e2937;
          --input-border: #334155;
          --input-focus: #3b82f6;
          --glass-bg: rgba(17, 25, 40, 0.75);
          --glass-border: rgba(255, 255, 255, 0.05);
          --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --border-radius: 20px;
          --border-radius-sm: 12px;
        }

        /* تم روشن */
        [data-theme="light"] {
          --primary-color: #2563eb;
          --primary-dark: #1d4ed8;
          --primary-light: #3b82f6;
          --accent-color: #7c3aed;
          --bg-dark: #f0f4fa;
          --bg-card: #ffffff;
          --bg-card-light: #f8fafc;
          --text-primary: #1e293b;
          --text-secondary: #475569;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --input-bg: #f1f5f9;
          --input-border: #cbd5e1;
          --glass-bg: rgba(255, 255, 255, 0.85);
          --glass-border: rgba(255, 255, 255, 0.3);
          --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          height: 100vh;
          overflow: hidden;
          font-family: 'Vazirmatn', 'Tajawal', sans-serif;
        }

        body {
          background: var(--bg-dark);
          color: var(--text-primary);
          line-height: 1.5;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* کانواس ذرات */
        #particles-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        /* کانتینر اصلی */
        .container {
          display: flex;
          height: 100vh;
          padding: 20px;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* بخش چپ - اطلاعات و برندینگ */
        .left {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          padding: 20px;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius);
          box-shadow: var(--glass-shadow);
          overflow-y: auto;
        }

        .left::-webkit-scrollbar {
          width: 6px;
        }

        .left::-webkit-scrollbar-track {
          background: var(--border-color);
          border-radius: 10px;
        }

        .left::-webkit-scrollbar-thumb {
          background: var(--primary-color);
          border-radius: 10px;
        }

        /* بخش تصاویر */
        .image-wrapper {
          width: 100%;
          aspect-ratio: 25 / 6;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: var(--glass-shadow);
        }

        .image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .image-wrapper:hover img {
          transform: scale(1.05);
        }

        /* محتوای برندینگ */
        .branding-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .slogan {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .slogan.highlight {
          color: var(--primary-light);
          font-weight: 700;
          font-size: 1.1rem;
        }

        /* بخش اخبار */
        .news-section {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .news-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .news-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .news-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .news-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
        }

        .news-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .news-text {
          font-size: 0.85rem;
          color: var(--text-primary);
          margin: 0;
        }

        /* کارت‌های شبکه‌های اجتماعی */
        .social-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 1rem;
        }

        .social-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
        }

        .social-card:hover {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
        }

        .social-card img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        /* بخش راست - فرم ورود */
        .right {
          flex: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-box {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius);
          padding: 28px;
          width: 100%;
          max-width: 460px;
          box-shadow: var(--glass-shadow);
          max-height: 90vh;
          overflow-y: auto;
        }

        .login-box::-webkit-scrollbar {
          width: 6px;
        }

        /* نوار اطلاعات */
        .info-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 12px;
          background: var(--bg-card);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          font-size: 0.75rem;
          gap: 10px;
          flex-wrap: wrap;
        }

        .datetime-display, .ip-display {
          color: var(--text-secondary);
        }

        /* دکمه تغییر تم */
        .theme-toggle {
          position: absolute;
          top: 20px;
          left: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 40px;
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
          transition: var(--transition);
          z-index: 10;
          font-size: 0.9rem;
        }

        .theme-toggle:hover {
          background: var(--primary-color);
          transform: translateY(-2px);
        }

        /* عنوان‌ها */
        .login-title {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 8px;
          text-align: center;
          background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .login-subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 25px;
          font-size: 0.9rem;
        }

        /* گروه‌های فرم */
        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.85rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          right: 12px;
          font-size: 1.1rem;
          color: var(--text-muted);
          z-index: 1;
        }

        .password-toggle {
          position: absolute;
          left: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          color: var(--text-muted);
          z-index: 1;
        }

        input {
          width: 100%;
          padding: 12px 45px 12px 15px;
          background: var(--input-bg);
          border: 2px solid var(--input-border);
          border-radius: var(--border-radius-sm);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.95rem;
          transition: var(--transition);
          direction: rtl;
        }

        input:focus {
          outline: none;
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .capslock-warning {
          font-size: 0.7rem;
          color: #f59e0b;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* گزینه‌های فرم */
        .options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          font-size: 0.85rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .remember-me input {
          width: 16px;
          height: 16px;
          padding: 0;
          accent-color: var(--primary-color);
        }

        .forgot-link {
          color: var(--primary-light);
          text-decoration: none;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .forgot-link:hover {
          color: var(--primary-color);
        }

        /* دکمه ورود */
        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border: none;
          border-radius: var(--border-radius-sm);
          color: white;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(59, 130, 246, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-btn.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          top: 50%;
          left: 20px;
          margin-top: -10px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* متن کمکی */
        .helper-text {
          text-align: center;
          margin: 15px 0;
          padding: 12px;
          background: var(--bg-card);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
        }

        .helper-text p {
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .helper-contact {
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: var(--text-primary);
          font-size: 0.85rem;
        }

        /* نمایش آب و هوا */
        .weather-display {
          background: var(--bg-card);
          padding: 10px;
          border-radius: var(--border-radius-sm);
          margin: 12px 0;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.85rem;
          border: 1px solid var(--border-color);
        }

        /* ویژگی‌های برندینگ */
        .branding-features {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin: 15px 0;
        }

        .feature-badge {
          padding: 5px 12px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 30px;
          font-size: 0.7rem;
          color: var(--text-primary);
          backdrop-filter: blur(5px);
        }

        /* لینک‌های مفید */
        .useful-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color);
          font-size: 0.75rem;
        }

        .useful-link {
          color: var(--text-secondary);
          text-decoration: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .useful-link:hover {
          color: var(--primary-light);
        }

        .detail p {
          background: var(--bg-card);
          padding: 8px;
          border-radius: var(--border-radius-sm);
          margin: 12px 0 0;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.6rem;
          border: 1px solid var(--border-color);
        }

        /* بنر آفلاین */
        .offline-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ef4444;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          z-index: 10000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }

        /* پخش‌کننده موسیقی */
        .music-player {
          position: fixed;
          inset-inline-end: 0;
          bottom: 0;
          left: 0;
          z-index: 50;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @media (max-width: 767px) {
          .music-player {
            transform: translateY(100%);
          }
          .music-player.open {
            transform: translateY(0);
          }
        }

        @media (min-width: 768px) {
          .music-player {
            position: relative;
            transform: none !important;
            margin-top: 20px;
          }
          .mobile-mini-toggle, .mini-player-bar {
            display: none !important;
          }
        }

        .mobile-mini-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 100;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(6, 182, 212, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .mobile-mini-toggle:hover {
          transform: scale(1.1);
        }

        .mini-player-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(6, 182, 212, 0.4);
        }

        .full-player {
          background: linear-gradient(to bottom, #0f172a, #000);
          border-top: 1px solid rgba(6, 182, 212, 0.4);
          backdrop-filter: blur(12px);
          padding: 20px;
          color: white;
        }

        .wave-container #waveform {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        button {
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        button:hover {
          transform: scale(1.05);
        }

        /* ریسپانسیو */
        @media (max-width: 968px) {
          .container {
            padding: 15px;
            gap: 15px;
          }
        }

        @media (max-width: 768px) {
          .left {
            display: none;
          }
          .container {
            justify-content: center;
          }
          .right {
            flex: 1;
          }
          .theme-toggle:not(.fixed-mobile) {
            display: none;
          }
          .theme-toggle.fixed-mobile {
            position: fixed;
            bottom: 90px;
            right: 20px;
            z-index: 999;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            font-size: 1.3rem;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .info-bar {
            flex-direction: column;
            align-items: center;
          }
          .login-title {
            font-size: 1.5rem;
          }
          .options {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .login-box {
            padding: 20px;
          }
        }

        /* انیمیشن‌های اضافی */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes success-glow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .success-glow {
          animation: success-glow 0.8s ease-out;
        }

        @keyframes ripple-animation {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(20);
            opacity: 0;
          }
        }
      `}</style>

      {/* بنر آفلاین */}
      {isOffline && (
        <div className="offline-banner">
          ⚠️ شما آفلاین هستید. لطفاً اتصال اینترنت خود را بررسی کنید.
        </div>
      )}

      {/* کانواس ذرات */}
      <canvas ref={canvasRef} id="particles-canvas"></canvas>

      <div className="container">
        {/* دکمه تغییر تم */}
        <button className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'تم روشن' : 'تم تاریک'}</span>
        </button>
        <button className="theme-toggle fixed-mobile" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        {/* بخش چپ - اطلاعات و برندینگ */}
        <section className="left">
          <div className="image-wrapper">
            <img src={download} alt="دانشگاه صدا و سیما" />
          </div>
          <div className="branding-content">
            <p className="slogan highlight">
              🎓 دانشگاه صدا و سیما: مشعل امید در جنگ رسانه‌ای
            </p>

            {/* بخش اخبار */}
            <div className="news-section">
              <h2 className="news-title">📢 آخرین اخبار و اطلاعیه‌ها</h2>
              <div className="news-list">
                <div className="news-item">
                  <span className="news-date">۱۴۰۴/۱۲/۰۹</span>
                  <p className="news-text">شهادت رهبر مجاهد حضرت آیت الله خامنه‌ای و جمعی از فرماندهان</p>
                </div>
                <div className="news-item">
                  <span className="news-date">۱۴۰۵/۰۱/۱۵</span>
                  <p className="news-text">جوانان انقلابی، روایت را به دست می‌گیرند - ترم بهار آغاز شد</p>
                </div>
                <div className="news-item">
                  <span className="news-date">۱۴۰۵/۰۱/۱۲</span>
                  <p className="news-text">امتحانات پایان ترم از ۲۰ تیر ماه برگزار می‌شود</p>
                </div>
                <div className="news-item">
                  <span className="news-date">۱۴۰۵/۰۱/۱۰</span>
                  <p className="news-text">وبینار تخصصی رسانه و فضای مجازی برگزار می‌گردد</p>
                </div>
              </div>
            </div>

            {/* کارت‌های شبکه‌های اجتماعی */}
            <div className="social-cards">
              <a href="#" className="social-card">
                <img src={iribuIcon} alt="اینستاگرام" />
              </a>
              <a href="#" className="social-card">
                <img src={moavenat} alt="تلگرام" />
              </a>
              <a href="#" className="social-card">
                <img src={roshana} alt="یوتیوب" />
              </a>
              <a href="#" className="social-card">
                <img src={sazman} alt="توییتر" />
              </a>
            </div>
          </div>
        </section>

        {/* بخش راست - فرم ورود */}
        <main className="right">
          <div className="login-box">
            <div className="info-bar">
              <div className="datetime-display">📅 {currentDateTime}</div>
              <div className="ip-display">
                🌐 {ipWeather.ip}
              </div>
            </div>

            <h2 className="login-title">✨ ورود به سامانه فرتاک</h2>
            <p className="login-subtitle">
              به <strong>سامانه یکپارچه دانشگاه صدا و سیما</strong> خوش آمدید
            </p>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>👤 نام کاربری / شماره موبایل</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    placeholder="نام کاربری یا شماره موبایل خود را وارد کنید"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading || isLocked}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>🔒 رمز عبور</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور خود را وارد کنید"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || isLocked}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {capsLock && (
                  <div className="capslock-warning">
                    ⚠️ کلید Caps Lock فعال است
                  </div>
                )}
              </div>

              <div className="options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>مرا به خاطر بسپار</span>
                </label>
                <button 
                  type="button" 
                  className="forgot-link" 
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  فراموشی رمز عبور؟
                </button>
              </div>

              <button 
                type="submit" 
                className={`login-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || isLocked || isOffline}
              >
                {isLoading ? '⏳ در حال پردازش...' : '🚀 ورود به سامانه'}
              </button>
            </form>

            <div className="helper-text">
              <p>📞 جهت بازیابی رمز یا مشکلات ورود با پشتیبانی تماس بگیرید:</p>
              <div className="helper-contact">
                <span>📱 ۰۲۱-۲۲۱۶۸۵۴۰</span>
                <span>✉️ support@iribu.ac.ir</span>
              </div>
            </div>

            <div className="weather-display">
              🌡️ {ipWeather.weather}
            </div>

            <div className="branding-features">
              <span className="feature-badge">🚀 نسل نوین رسانه</span>
              <span className="feature-badge">⚡ سریع، امن، هوشمند</span>
              <span className="feature-badge">🌐 یکپارچه و متصل</span>
              <span className="feature-badge">🛡️ امنیت پیشرفته</span>
            </div>

            <div className="useful-links">
              <a href="#" className="useful-link">درباره روشنــا</a>
              <span>|</span>
              <a href="#" className="useful-link">تماس با پشتیبانی</a>
              <span>|</span>
              <a href="#" className="useful-link">قوانین و حریم خصوصی</a>
            </div>

            <div className="detail">
              <p>© کلیه حقوق مادی و معنوی محفوظ و مربوط به محمدامین خدادادی می‌باشد.</p>
            </div>
          </div>
        </main>
      </div>

      {/* دکمه موبایل برای پخش‌کننده */}
      <button className="mobile-mini-toggle" onClick={() => toggleMusicPlayer(true)}>
        🎵
      </button>

      {/* پخش‌کننده موسیقی */}
      <div className={`music-player ${isMusicPlayerOpen ? 'open' : ''}`}>
        <div className="mini-player-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img src={trackInfo.cover} alt="cover" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
            <div>
              <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{trackInfo.title}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>{trackInfo.artist}</div>
            </div>
          </div>
          <button onClick={togglePlayPause} style={{ color: '#06b6d4', fontSize: '28px' }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        <div className="full-player">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#06b6d4', fontSize: '18px', fontWeight: 'bold' }}>🎵 پخش‌کننده روشنــا</h3>
            <button onClick={() => toggleMusicPlayer(false)} style={{ color: '#9ca3af', fontSize: '24px' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            <img src={trackInfo.cover} alt="cover" style={{ width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '8px' }}>{trackInfo.title}</h2>
              <p style={{ color: '#d1d5db', fontSize: '14px' }}>{trackInfo.artist}</p>
            </div>
          </div>

          <div className="wave-container" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9ca3af' }}>
              <span style={{ fontSize: '14px' }}>{currentTime}</span>
              <div id="waveform" style={{ flex: 1, height: '64px' }}></div>
              <span style={{ fontSize: '14px' }}>{duration}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '20px' }}>
            <button onClick={togglePlayPause} style={{ color: '#06b6d4', fontSize: '56px' }}>
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#9ca3af', fontSize: '18px' }}>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              style={{ flex: 1, accentColor: '#06b6d4' }}
            />
          </div>
        </div>
      </div>

      {/* کانتینر نوتیفیکیشن */}
      <div id="notification-container"></div>
    </div>
  );
};

export default RoshanLoginPage;