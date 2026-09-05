// ============================================================
// 🚀 فایل کمکی پیشرفته: src/hooks/useAutoLogout.js
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// ✅ لیست رویدادهای کاربری برای تشخیص فعالیت
const ACTIVITY_EVENTS = [
  'mousedown', 
  'mousemove', 
  'keypress', 
  'scroll', 
  'touchstart',
  'click',        // اضافه برای دقت بیشتر
  'wheel',        // اسکرول با ماوس
  'input',        // تایپ در input ها
  'focus'         // فوکوس روی المنت‌ها
];

// ✅ پیام خروج به دلیل عدم فعالیت
const INACTIVITY_MESSAGE = '⏰ به دلیل عدم فعالیت، از حساب کاربری خارج شدید';

// ✅ هوک سفارشی برای خروج خودکار در صورت عدم فعالیت
export const useAutoLogout = (timeoutMinutes = 30) => {
  const { logout, isAuthenticated } = useAuth();
  
  // رفرنس برای تایمر و وضعیت‌ها
  const timerRef = useRef(null);
  const isActiveRef = useRef(true);
  
  // ✅ تابع بازنشانی تایمر (بهینه و خفن شده)
  const resetTimer = useCallback(() => {
    // پاک کردن تایمر قبلی اگر وجود داشته
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // اگر کاربر احراز هویت شده، تایمر جدید تنظیم کن
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => {
        // نمایش پیام خروج حرفه‌ای
        if (typeof window !== 'undefined') {
          console.warn('🚪 خروج خودکار به دلیل عدم فعالیت کاربر');
          
          // استفاده از notif API در صورت وجود
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('خروج خودکار', {
              body: INACTIVITY_MESSAGE,
              icon: '/logo.png',
              silent: false
            });
          } else {
            alert(INACTIVITY_MESSAGE);
          }
        }
        
        // خروج از حساب کاربری
        logout();
      }, timeoutMinutes * 60 * 1000);
      
      // نمایش زمان باقی‌مانده در کنسول (فقط برای دیباگ)
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ تایمر خروج خودکار: ${timeoutMinutes} دقیقه`);
      }
    }
  }, [isAuthenticated, timeoutMinutes, logout]);
  
  // ✅ تابع پاک‌سازی حرفه‌ای
  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    // اگر کاربر احراز هویت نشده، کاری نکن
    if (!isAuthenticated) {
      cleanupTimer();
      return;
    }
    
    // تنظیم تایمر اولیه
    resetTimer();
    
    // هندلر رویدادهای کاربری (آپتیمایز شده با throttle)
    let lastActivityTime = Date.now();
    
    const handleActivity = () => {
      const now = Date.now();
      
      // جلوگیری از اجرای مکرر resetTimer در بازه کوتاه (throttle)
      if (now - lastActivityTime > 1000) {
        lastActivityTime = now;
        resetTimer();
      } else {
        resetTimer(); // برای رویدادهای حساس مثل حرکت موس، بدون تاخیر اجرا کن
      }
    };
    
    // ثبت شنونده‌ها
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // نشانگر فعالیت کاربر در کنسول (اختیاری)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ سیستم خروج خودکار فعال شد');
    }
    
    // پاک‌سازی هنگام unmount یا تغییر وابستگی‌ها
    return () => {
      cleanupTimer();
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 سیستم خروج خودکار غیرفعال شد');
      }
    };
  }, [isAuthenticated, timeoutMinutes, resetTimer, cleanupTimer]);
  
  // ✅ بازگرداندن توابع کمکی برای استفاده در کامپوننت‌ها
  return { 
    resetTimer,           // بازنشانی دستی تایمر
    cleanupTimer,        // پاک‌سازی دستی تایمر
    isActive: isActiveRef.current  // وضعیت فعالیت کاربر
  };
};

// ✅ خروجی پیش‌فرض برای import ساده
export default useAutoLogout;