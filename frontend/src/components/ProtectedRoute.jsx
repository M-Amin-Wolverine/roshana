// ============================================================
// src/components/ProtectedRoute.jsx - نسخه فوق خفن 🚀
// ============================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// 🛠️ Utility Functions
// ═══════════════════════════════════════════════════════════
const trackAccess = (data) => {
  const history = JSON.parse(localStorage.getItem('access_history') || '[]');
  history.push({ ...data, timestamp: new Date().toISOString() });
  localStorage.setItem('access_history', JSON.stringify(history.slice(-100)));
  
  // Analytics
  if (window.gtag) {
    window.gtag('event', 'protected_route_access', data);
  }
};

const checkTimeRestriction = (restrictions) => {
  if (!restrictions) return true;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startH, startM] = restrictions.start.split(':').map(Number);
  const [endH, endM] = restrictions.end.split(':').map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// ═══════════════════════════════════════════════════════════
// 🎨 لودینگ خفن
// ═══════════════════════════════════════════════════════════
const ThemedLoader = ({ message = 'در حال بررسی دسترسی...' }) => {
  const { isDark, colorScheme } = useTheme();
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  const getGradient = () => {
    const gradients = {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      ocean: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      forest: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      sunset: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      midnight: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
    };
    return gradients[colorScheme] || gradients.default;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: isDark ? '#0f172a' : '#f8fafc'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 60,
          height: 60,
          margin: '0 auto 20px',
          position: 'relative'
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '3px solid transparent',
              borderTopColor: 'currentColor',
              borderRadius: '50%',
              animation: `spin ${1 + i * 0.2}s linear infinite`,
              color: getGradient().split(' ')[2] || '#667eea',
              opacity: 1 - i * 0.2
            }} />
          ))}
        </div>
        
        <p style={{
          color: isDark ? '#e2e8f0' : '#334155',
          fontSize: '16px',
          fontFamily: 'Vazirmatn, sans-serif'
        }}>
          {message}{dots}
        </p>
        
        <div style={{
          width: 200,
          height: 4,
          background: isDark ? '#334155' : '#e2e8f0',
          borderRadius: 2,
          marginTop: 20,
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              ease: 'easeInOut'
            }}
            style={{
              width: '100%',
              height: '100%',
              background: getGradient()
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 کامپوننت اصلی
// ═══════════════════════════════════════════════════════════
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login',
  adminOnly = false,
  professorOnly = false,
  studentOnly = false,
  staffOnly = false,
  
  // قابلیت‌های جدید
  timeRestriction = null,
  require2FA = false,
  trackVisits = true,
  transition = true,
  showAccessMessage = true,
  pageTitle = '',
  featureFlag = null,
  rateLimit = null
}) => {
  const { 
    isAuthenticated, 
    loading, 
    isInitialized,
    user,
    activeRole,
    isAdmin,
    isProfessor,
    isStudent,
    isStaff,
    getRolePath
  } = useAuth();
  
  const { isDark } = useTheme();
  const location = useLocation();
  const accessRef = useRef(null);
  const [accessCheck, setAccessCheck] = useState({
    checking: true,
    allowed: false,
    reason: ''
  });

  // ═══════════════════════════════════════════════════════════
  // 📊 Tracking
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (trackVisits && isAuthenticated && accessCheck.allowed) {
      trackAccess({
        path: location.pathname,
        user: user?.email,
        role: activeRole?.roleName,
        allowed: true
      });
    }
  }, [location.pathname, isAuthenticated, accessCheck.allowed]);

  // ═══════════════════════════════════════════════════════════
  // 🔍 بررسی دسترسی
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const checkAccess = async () => {
      if (!isInitialized || loading) return;
      
      let allowed = true;
      let reason = '';
      
      // 1. بررسی احراز هویت
      if (!isAuthenticated) {
        allowed = false;
        reason = 'NOT_AUTHENTICATED';
      }
      
      // 2. بررسی محدودیت زمانی
      else if (timeRestriction && !checkTimeRestriction(timeRestriction)) {
        allowed = false;
        reason = 'TIME_RESTRICTED';
      }
      
      // 3. بررسی 2FA
      else if (require2FA && !user?.twoFactorEnabled) {
        allowed = false;
        reason = '2FA_REQUIRED';
      }
      
      // 4. بررسی Feature Flag
      else if (featureFlag) {
        const flags = user?.featureFlags || {};
        if (!flags[featureFlag]) {
          allowed = false;
          reason = 'FEATURE_DISABLED';
        }
      }
      
      // 5. بررسی Rate Limit
      else if (rateLimit) {
        const attempts = JSON.parse(localStorage.getItem(`rate_${location.pathname}`) || '[]');
        const recentAttempts = attempts.filter(t => Date.now() - t < rateLimit.window);
        
        if (recentAttempts.length >= rateLimit.max) {
          allowed = false;
          reason = 'RATE_LIMITED';
        } else {
          recentAttempts.push(Date.now());
          localStorage.setItem(`rate_${location.pathname}`, JSON.stringify(recentAttempts));
        }
      }
      
      setAccessCheck({ checking: false, allowed, reason });
      
      // ثبت تلاش ناموفق
      if (!allowed && isAuthenticated) {
        trackAccess({
          path: location.pathname,
          user: user?.email,
          role: activeRole?.roleName,
          allowed: false,
          reason
        });
        
        // نمایش پیام
        if (showAccessMessage) {
          const messages = {
            TIME_RESTRICTED: '⏰ این بخش فقط در ساعات مجاز قابل دسترسی است',
            '2FA_REQUIRED': '🔐 لطفاً احراز هویت دو مرحله‌ای را فعال کنید',
            FEATURE_DISABLED: '🚫 این قابلیت برای حساب شما فعال نیست',
            RATE_LIMITED: '⏳ تعداد درخواست‌ها زیاد است. لطفاً بعداً تلاش کنید'
          };
          
          toast.error(messages[reason] || '⛔ دسترسی غیرمجاز');
        }
      }
    };
    
    checkAccess();
  }, [isAuthenticated, isInitialized, loading, location.pathname]);

  // ═══════════════════════════════════════════════════════════
  // ⏳ لودینگ
  // ═══════════════════════════════════════════════════════════
  if (loading || !isInitialized || accessCheck.checking) {
    return <ThemedLoader message={`در حال بارگذاری ${pageTitle}...`} />;
  }

  // ═══════════════════════════════════════════════════════════
  // ❌ عدم احراز هویت
  // ═══════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ❌ دسترسی غیرمجاز
  // ═══════════════════════════════════════════════════════════
  if (!accessCheck.allowed) {
    const userRole = activeRole?.roleName || user?.role;
    
    if (accessCheck.reason === '2FA_REQUIRED') {
      return <Navigate to="/enable-2fa" state={{ from: location.pathname }} replace />;
    }
    
    return <Navigate to={getRolePath(userRole)} replace />;
  }

  // ═══════════════════════════════════════════════════════════
  // 🔍 بررسی دسترسی بر اساس نقش
  // ═══════════════════════════════════════════════════════════
  const userRole = activeRole?.roleName || user?.role;
  
  if (adminOnly && !isAdmin()) {
    return <Navigate to={getRolePath(userRole)} replace />;
  }
  
  if (professorOnly && !isProfessor()) {
    return <Navigate to={getRolePath(userRole)} replace />;
  }
  
  if (studentOnly && !isStudent()) {
    return <Navigate to={getRolePath(userRole)} replace />;
  }
  
  if (staffOnly && !isStaff()) {
    return <Navigate to={getRolePath(userRole)} replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={getRolePath(userRole)} replace />;
  }

  // ═══════════════════════════════════════════════════════════
  // ✅ دسترسی مجاز با انیمیشن
  // ═══════════════════════════════════════════════════════════
  const content = children ? children : <Outlet />;
  
  if (!transition) return content;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 کامپوننت‌های میانبر
// ═══════════════════════════════════════════════════════════
export const AdminRoute = (props) => (
  <ProtectedRoute adminOnly {...props} />
);

export const ProfessorRoute = (props) => (
  <ProtectedRoute professorOnly {...props} />
);

export const StudentRoute = (props) => (
  <ProtectedRoute studentOnly {...props} />
);

export const StaffRoute = (props) => (
  <ProtectedRoute staffOnly {...props} />
);

export default ProtectedRoute;