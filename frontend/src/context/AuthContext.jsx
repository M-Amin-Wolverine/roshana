// ============================================================
// src/context/AuthContext.jsx - نسخه نهایی و خفن
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// ═══════════════════════════════════════════════════════════
// 📋 ثابت‌ها
// ═══════════════════════════════════════════════════════════
const STORAGE_KEYS = {
  TOKEN: 'fartak_auth_token',
  REFRESH_TOKEN: 'fartak_refresh_token',
  USER: 'fartak_user',
  ACTIVE_ROLE: 'fartak_active_role',
  REMEMBER_ME: 'fartak_remember_me',
  LAST_LOGIN: 'fartak_last_login'
};
// نقش‌های مجاز برای پنل ادمین
export const ADMIN_ROLES = [
  'admin', 'super_admin', 'it_manager', 'education_manager',
  'financial_manager', 'cultural_manager', 'security_manager',
  'vice_chancellor', 'head_of_department'
];

// نقش‌های مجاز برای پنل استاد
export const PROFESSOR_ROLES = ['professor', 'head_of_department'];

// نقش‌های مجاز برای پنل دانشجو
export const STUDENT_ROLES = ['student'];

// نقش‌های مجاز برای پنل کارمند
export const STAFF_ROLES = ['staff', 'education_manager', 'financial_manager'];

// نام‌های فارسی نقش‌ها
export const ROLE_NAMES = {
  'admin': 'مدیر سیستم',
  'super_admin': 'مدیر ارشد',
  'it_manager': 'مدیر فناوری اطلاعات',
  'education_manager': 'مدیر آموزش',
  'financial_manager': 'مدیر مالی',
  'cultural_manager': 'مدیر فرهنگی',
  'security_manager': 'مدیر حراست',
  'vice_chancellor': 'معاون دانشگاه',
  'head_of_department': 'مدیر گروه',
  'professor': 'استاد',
  'student': 'دانشجو',
  'staff': 'کارمند',
  'dormitory_manager': 'مدیر خوابگاه',
  'supervisor': 'ناظر',
  'support_agent': 'پشتیبان فنی',
  'librarian': 'کتابدار',
  'research_assistant': 'دستیار پژوهشی',
  'guest': 'مهمان'
};

// مسیرهای پیش‌فرض برای هر نقش
export const ROLE_PATHS = {
  'admin': '/admin',
  'super_admin': '/admin',
  'it_manager': '/admin',
  'education_manager': '/admin/education_manager',
  'financial_manager': '/admin/financial_manager',
  'cultural_manager': '/admin/cultural_manager',
  'security_manager': '/admin/security_manager',
  'vice_chancellor': '/vice/dashboard',
  'head_of_department': '/professor/department/dashboard',
  'professor': '/professor/dashboard',
  'student': '/student/dashboard',
  'staff': '/staff/dashboard',
  'dormitory_manager': '/staff/dormitory/dashboard',
  'support_agent': '/staff/support/dashboard',
  'librarian': '/staff/library/dashboard',
  'research_assistant': '/student/research/dashboard',
  'guest': '/dashboard'
};

// ═══════════════════════════════════════════════════════════
// 🎯 Context
// ═══════════════════════════════════════════════════════════
const AuthContext = createContext(null);

// ═══════════════════════════════════════════════════════════
// 🚀 Provider
// ═══════════════════════════════════════════════════════════
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // 🔄 مقداردهی اولیه
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('🔍 initializeAuth STARTED');
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      console.log('🔍 storedToken:', !!storedToken, 'storedUser:', !!storedUser);
      const storedActiveRole = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const parsedRole = storedActiveRole ? JSON.parse(storedActiveRole) : null;
          
          // اعتبارسنجی توکن (اختیاری - می‌تونیم با API چک کنیم)
          const isValid = await validateToken(storedToken);
          
          if (isValid) {
            setToken(storedToken);
            setUser(parsedUser);
            setActiveRole(parsedRole);
            setIsAuthenticated(true);
            
            console.log('✅ احراز هویت موفق - کاربر:', parsedUser.fullName || parsedUser.username);
          } else {
            // توکن نامعتبر - پاکسازی
            clearAuthData();
          }
        } catch (parseError) {
          console.error('❌ خطا در پارس داده‌های کاربر:', parseError);
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('❌ خطا در مقداردهی اولیه Auth:', error);
      clearAuthData();
    } finally {
      console.log('🔍 initializeAuth FINISHED - setting loading to false');
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ اعتبارسنجی توکن با API
  // ═══════════════════════════════════════════════════════════
  const validateToken = async (tokenToValidate) => {
      // موقتاً همیشه true برگردان - برای تست
  console.log('🔍 validateToken called - returning true (bypass)');
  return true;
    /* try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.warn('⚠️ خطا در اعتبارسنجی توکن:', error.message);
      // در صورت قطعی شبکه، توکن رو معتبر در نظر می‌گیریم
      return true;
    } */
  };

  // ═══════════════════════════════════════════════════════════
  // 🧹 پاکسازی داده‌های احراز هویت
  // ═══════════════════════════════════════════════════════════
  const clearAuthData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // ═══════════════════════════════════════════════════════════
  // 🔐 لاگین
  // ═══════════════════════════════════════════════════════════
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const { username, phone, email, password, rememberMe = true } = credentials;
      
      // ساخت بدنه درخواست
      const body = { password };
      if (phone) body.phone = phone;
      else if (email) body.email = email;
      else if (username) body.username = username;
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (response.ok && data.success) {
        // ذخیره توکن و اطلاعات کاربر
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
        
        if (data.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        
        console.log(`✅ لاگین موفق (${responseTime}ms) - ${data.user.fullName || data.user.username}`);
        
        // 🎯 تعیین مسیر هدایت
        const redirectPath = determineRedirectPath(data.user);
        
        return {
          success: true,
          user: data.user,
          token: data.token,
          redirectPath,
          message: data.message || 'ورود موفق',
          responseTime
        };
        
      } else {
        // لاگین ناموفق
        setError(data.message || 'خطا در ورود');
        
        return {
          success: false,
          message: data.message || 'نام کاربری یا رمز عبور اشتباه است',
          code: data.code,
          attemptsRemaining: data.attemptsRemaining
        };
      }
      
    } catch (error) {
      console.error('❌ خطای لاگین:', error);
      setError('خطا در ارتباط با سرور');
      
      return {
        success: false,
        message: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎯 تعیین مسیر هدایت بر اساس کاربر
  // ═══════════════════════════════════════════════════════════
  const determineRedirectPath = (userData) => {
    // اگه کاربر چند نقش داره، بره به صفحه انتخاب نقش
    // (این رو بعداً با API چک می‌کنیم)
    const userRoles = userData.roles || [userData.role];
    
    if (userRoles.length > 1) {
      return '/select-role';
    }
    
    // در غیر این صورت، مسیر پیش‌فرض نقش
    return ROLE_PATHS[userData.role] || '/dashboard';
  };

  // ═══════════════════════════════════════════════════════════
  // 🚪 خروج
  // ═══════════════════════════════════════════════════════════
  const logout = async () => {
    try {
      // تلاش برای logout در سرور
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {}); // خطا رو نادیده بگیر
      }
    } finally {
      // پاکسازی داده‌های محلی
      clearAuthData();
      navigate('/login', { replace: true });
      
      console.log('👋 خروج موفق');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔄 رفرش توکن
  // ═══════════════════════════════════════════════════════════
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshTokenValue) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        setToken(data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطا در رفرش توکن:', error);
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎭 مدیریت نقش فعال
  // ═══════════════════════════════════════════════════════════
  const setActiveRoleWithStorage = (role) => {
    setActiveRole(role);
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, JSON.stringify(role));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔍 بررسی نقش
  // ═══════════════════════════════════════════════════════════
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    const userRole = activeRole?.roleName || user.role;
    return allowedRoles.includes(userRole);
  };

  const isAdmin = () => {
    return hasRole(ADMIN_ROLES);
  };

  const isProfessor = () => {
    return hasRole(PROFESSOR_ROLES);
  };

  const isStudent = () => {
    return hasRole(STUDENT_ROLES);
  };

  const isStaff = () => {
    return hasRole(STAFF_ROLES);
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 بروزرسانی پروفایل
  // ═══════════════════════════════════════════════════════════
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در بروزرسانی پروفایل:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 تغییر رمز عبور
  // ═══════════════════════════════════════════════════════════
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در تغییر رمز عبور:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📤 ارسال OTP
  // ═══════════════════════════════════════════════════════════
  const sendOTP = async (phone, type = 'login') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        expiresIn: data.expiresIn
      };
    } catch (error) {
      console.error('❌ خطا در ارسال OTP:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ تأیید OTP
  // ═══════════════════════════════════════════════════════════
  const verifyOTP = async (phone, code, type = 'login') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, type })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
      }
      
      return {
        success: data.success,
        message: data.message,
        tempToken: data.tempToken,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('❌ خطا در تأیید OTP:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 ثبت‌نام
  // ═══════════════════════════════════════════════════════════
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        user: data.user
      };
    } catch (error) {
      console.error('❌ خطا در ثبت‌نام:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔐 فراموشی رمز
  // ═══════════════════════════════════════════════════════════
  const forgotPassword = async (phone) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در فراموشی رمز:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔄 بازنشانی رمز
  // ═══════════════════════════════════════════════════════════
  const resetPassword = async (tempToken, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, newPassword })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در بازنشانی رمز:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎯 مقدار Context
  // ═══════════════════════════════════════════════════════════
  const value = {
    // State
    user,
    token,
    activeRole,
    loading,
    isAuthenticated,
    isInitialized,
    error,
    
    // متدهای اصلی
    login,
    logout,
    refreshToken,
    clearAuthData,
    
    // مدیریت نقش
    setActiveRole: setActiveRoleWithStorage,
    hasRole,
    isAdmin,
    isProfessor,
    isStudent,
    isStaff,
    
    // پروفایل
    updateProfile,
    changePassword,
    
    // OTP
    sendOTP,
    verifyOTP,
    
    // ثبت‌نام و بازیابی
    register,
    forgotPassword,
    resetPassword,
    
    // ثابت‌ها
    ADMIN_ROLES,
    PROFESSOR_ROLES,
    STUDENT_ROLES,
    STAFF_ROLES,
    ROLE_NAMES,
    ROLE_PATHS,
    STORAGE_KEYS,
    
    // توابع کمکی
    getRoleName: (role) => ROLE_NAMES[role] || role,
    getRolePath: (role) => ROLE_PATHS[role] || '/dashboard',
    getUserFullName: () => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'کاربر' : '',
  };
  console.log('🔍 AdminLayout RENDER - authLoading:', loading, 'Loading:', loading, 'isAuthenticated:', isAuthenticated);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 Hook
// ═══════════════════════════════════════════════════════════
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('❌ useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext;

/* // ============================================================
// src/context/AuthContext.jsx - نسخه کامل و نهایی با تمام فیچرها
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// ═══════════════════════════════════════════════════════════
// 📋 ثابت‌ها
// ═══════════════════════════════════════════════════════════
const STORAGE_KEYS = {
  TOKEN: 'fartak_auth_token',
  REFRESH_TOKEN: 'fartak_refresh_token',
  USER: 'fartak_user',
  ACTIVE_ROLE: 'fartak_active_role',
  REMEMBER_ME: 'fartak_remember_me',
  LAST_LOGIN: 'fartak_last_login'
};

// نقش‌های مجاز برای پنل ادمین
export const ADMIN_ROLES = [
  'admin', 'super_admin', 'it_manager', 'education_manager',
  'financial_manager', 'cultural_manager', 'security_manager',
  'vice_chancellor', 'head_of_department'
];

// نقش‌های مجاز برای پنل استاد
export const PROFESSOR_ROLES = ['professor', 'head_of_department'];

// نقش‌های مجاز برای پنل دانشجو
export const STUDENT_ROLES = ['student'];

// نقش‌های مجاز برای پنل کارمند
export const STAFF_ROLES = ['staff', 'education_manager', 'financial_manager'];

// نام‌های فارسی نقش‌ها
export const ROLE_NAMES = {
  'admin': 'مدیر سیستم',
  'super_admin': 'مدیر ارشد',
  'it_manager': 'مدیر فناوری اطلاعات',
  'education_manager': 'مدیر آموزش',
  'financial_manager': 'مدیر مالی',
  'cultural_manager': 'مدیر فرهنگی',
  'security_manager': 'مدیر حراست',
  'vice_chancellor': 'معاون دانشگاه',
  'head_of_department': 'مدیر گروه',
  'professor': 'استاد',
  'student': 'دانشجو',
  'staff': 'کارمند',
  'dormitory_manager': 'مدیر خوابگاه',
  'supervisor': 'ناظر',
  'support_agent': 'پشتیبان فنی',
  'librarian': 'کتابدار',
  'research_assistant': 'دستیار پژوهشی',
  'guest': 'مهمان'
};

// مسیرهای پیش‌فرض برای هر نقش
export const ROLE_PATHS = {
  'admin': '/admin/dashboard',
  'super_admin': '/admin/dashboard',
  'it_manager': '/admin/dashboard',
  'education_manager': '/admin/dashboard',
  'financial_manager': '/admin/dashboard',
  'cultural_manager': '/admin/dashboard',
  'security_manager': '/admin/dashboard',
  'vice_chancellor': '/vice/dashboard',
  'head_of_department': '/professor/department/dashboard',
  'professor': '/professor/dashboard',
  'student': '/student/dashboard',
  'staff': '/staff/dashboard',
  'dormitory_manager': '/staff/dormitory/dashboard',
  'support_agent': '/staff/support/dashboard',
  'librarian': '/staff/library/dashboard',
  'research_assistant': '/student/research/dashboard',
  'guest': '/dashboard'
};

// ═══════════════════════════════════════════════════════════
// 🎯 Context
// ═══════════════════════════════════════════════════════════
const AuthContext = createContext(null);

// ═══════════════════════════════════════════════════════════
// 🚀 Provider
// ═══════════════════════════════════════════════════════════
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // Stateهای اصلی
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Stateهای فیچرهای جدید
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState(null);
  const [securityNotifications, setSecurityNotifications] = useState([]);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: null,
    limit: null,
    resetAt: null
  });
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [accountLockInfo, setAccountLockInfo] = useState({
    isLocked: false,
    remainingAttempts: null,
    lockUntil: null
  });
  const [activityLog, setActivityLog] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // 🔄 مقداردهی اولیه
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedActiveRole = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const parsedRole = storedActiveRole ? JSON.parse(storedActiveRole) : null;
          
          // اعتبارسنجی توکن
          const isValid = await validateToken(storedToken);
          
          if (isValid) {
            setToken(storedToken);
            setUser(parsedUser);
            setActiveRole(parsedRole);
            setIsAuthenticated(true);
            setTwoFactorEnabled(parsedUser?.twoFactorEnabled || false);
            
            // بارگذاری داده‌های امنیتی در پس‌زمینه
            setTimeout(() => {
              if (isAuthenticated) {
                getActiveSessions();
                getSecurityNotifications();
                getTrustedDevices();
              }
            }, 1000);
            
            console.log('✅ احراز هویت موفق - کاربر:', parsedUser.fullName || parsedUser.username);
          } else {
            clearAuthData();
          }
        } catch (parseError) {
          console.error('❌ خطا در پارس داده‌های کاربر:', parseError);
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('❌ خطا در مقداردهی اولیه Auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ اعتبارسنجی توکن با API
  // ═══════════════════════════════════════════════════════════
  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.warn('⚠️ خطا در اعتبارسنجی توکن:', error.message);
      return true;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🧹 پاکسازی داده‌های احراز هویت
  // ═══════════════════════════════════════════════════════════
  const clearAuthData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setIsAuthenticated(false);
    setError(null);
    setTwoFactorEnabled(false);
    setSessions([]);
    setTrustedDevices([]);
    setSecurityNotifications([]);
    
    // قطع اتصال WebSocket
    disconnectWebSocket();
  };

  // ═══════════════════════════════════════════════════════════
  // 🔐 لاگین
  // ═══════════════════════════════════════════════════════════
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const { username, phone, email, password, rememberMe = true } = credentials;
      
      const body = { password };
      if (phone) body.phone = phone;
      else if (email) body.email = email;
      else if (username) body.username = username;
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (response.ok && data.success) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
        
        if (data.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setTwoFactorEnabled(data.user?.twoFactorEnabled || false);
        
        console.log(`✅ لاگین موفق (${responseTime}ms) - ${data.user.fullName || data.user.username}`);
        
        const redirectPath = determineRedirectPath(data.user);
        
        // اتصال WebSocket بعد از لاگین موفق
        setTimeout(() => connectWebSocket(), 1000);
        
        return {
          success: true,
          user: data.user,
          token: data.token,
          redirectPath,
          message: data.message || 'ورود موفق',
          responseTime
        };
        
      } else {
        setError(data.message || 'خطا در ورود');
        
        return {
          success: false,
          message: data.message || 'نام کاربری یا رمز عبور اشتباه است',
          code: data.code,
          attemptsRemaining: data.attemptsRemaining
        };
      }
      
    } catch (error) {
      console.error('❌ خطای لاگین:', error);
      setError('خطا در ارتباط با سرور');
      
      return {
        success: false,
        message: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎯 تعیین مسیر هدایت بر اساس کاربر
  // ═══════════════════════════════════════════════════════════
  const determineRedirectPath = (userData) => {
    const userRoles = userData.roles || [userData.role];
    
    if (userRoles.length > 1) {
      return '/select-role';
    }
    
    return ROLE_PATHS[userData.role] || '/dashboard';
  };

  // ═══════════════════════════════════════════════════════════
  // 🚪 خروج
  // ═══════════════════════════════════════════════════════════
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {});
      }
    } finally {
      disconnectWebSocket();
      clearAuthData();
      navigate('/login', { replace: true });
      console.log('👋 خروج موفق');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔄 رفرش توکن
  // ═══════════════════════════════════════════════════════════
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshTokenValue) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        setToken(data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطا در رفرش توکن:', error);
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎭 مدیریت نقش فعال
  // ═══════════════════════════════════════════════════════════
  const setActiveRoleWithStorage = (role) => {
    setActiveRole(role);
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, JSON.stringify(role));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔍 بررسی نقش
  // ═══════════════════════════════════════════════════════════
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    const userRole = activeRole?.roleName || user.role;
    return allowedRoles.includes(userRole);
  };

  const isAdmin = () => hasRole(ADMIN_ROLES);
  const isProfessor = () => hasRole(PROFESSOR_ROLES);
  const isStudent = () => hasRole(STUDENT_ROLES);
  const isStaff = () => hasRole(STAFF_ROLES);

  // ═══════════════════════════════════════════════════════════
  // 📝 بروزرسانی پروفایل
  // ═══════════════════════════════════════════════════════════
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در بروزرسانی پروفایل:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 تغییر رمز عبور
  // ═══════════════════════════════════════════════════════════
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در تغییر رمز عبور:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📤 ارسال OTP
  // ═══════════════════════════════════════════════════════════
  const sendOTP = async (phone, type = 'login') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        expiresIn: data.expiresIn
      };
    } catch (error) {
      console.error('❌ خطا در ارسال OTP:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ تأیید OTP
  // ═══════════════════════════════════════════════════════════
  const verifyOTP = async (phone, code, type = 'login') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, type })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
      }
      
      return {
        success: data.success,
        message: data.message,
        tempToken: data.tempToken,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('❌ خطا در تأیید OTP:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 ثبت‌نام
  // ═══════════════════════════════════════════════════════════
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        user: data.user
      };
    } catch (error) {
      console.error('❌ خطا در ثبت‌نام:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔐 فراموشی رمز
  // ═══════════════════════════════════════════════════════════
  const forgotPassword = async (phone) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در فراموشی رمز:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔄 بازنشانی رمز
  // ═══════════════════════════════════════════════════════════
  const resetPassword = async (tempToken, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, newPassword })
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در بازنشانی رمز:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: مدیریت نشست‌های همزمان
  // ═══════════════════════════════════════════════════════════
  const getActiveSessions = async () => {
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
        setCurrentSessionId(data.currentSessionId);
        return data.sessions;
      }
      
      return [];
    } catch (error) {
      console.error('❌ خطا در دریافت نشست‌ها:', error);
      return [];
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        return { success: true, message: 'نشست با موفقیت terminated شد' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در terminate نشست:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions/terminate-others`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await getActiveSessions();
        return { success: true, message: 'تمام نشست‌های دیگر terminated شدند' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در terminate نشست‌های دیگر:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: تاریخچه ورود
  // ═══════════════════════════════════════════════════════════
  const getLoginHistory = async (page = 1, limit = 20) => {
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login-history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLoginHistory(data.history);
        return {
          history: data.history,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages
        };
      }
      
      return { history: [], total: 0 };
    } catch (error) {
      console.error('❌ خطا در دریافت تاریخچه ورود:', error);
      return { history: [], total: 0 };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: احراز هویت دو مرحله‌ای
  // ═══════════════════════════════════════════════════════════
  const enableTwoFactor = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTwoFactorSecret(data.secret);
        return {
          success: true,
          secret: data.secret,
          qrCode: data.qrCode,
          backupCodes: data.backupCodes
        };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در فعال‌سازی 2FA:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  const verifyTwoFactor = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(true);
        setTwoFactorSecret(null);
        const updatedUser = { ...user, twoFactorEnabled: true };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return { success: true, message: '2FA با موفقیت فعال شد' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در تایید 2FA:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  const disableTwoFactor = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(false);
        const updatedUser = { ...user, twoFactorEnabled: false };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return { success: true, message: '2FA غیرفعال شد' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در غیرفعال‌سازی 2FA:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: اعلان‌های امنیتی
  // ═══════════════════════════════════════════════════════════
  const getSecurityNotifications = async () => {
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/security-notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSecurityNotifications(data.notifications);
        return data.notifications;
      }
      
      return [];
    } catch (error) {
      console.error('❌ خطا در دریافت اعلان‌های امنیتی:', error);
      return [];
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/security-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSecurityNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('❌ خطا در نشان‌گذاری اعلان:', error);
      return { success: false };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: محدودیت‌های نرخ درخواست
  // ═══════════════════════════════════════════════════════════
  const getRateLimitInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/rate-limit-info`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRateLimitInfo({
          remaining: data.remaining,
          limit: data.limit,
          resetAt: data.resetAt
        });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطا در دریافت اطلاعات Rate Limit:', error);
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: دستگاه‌های معتبر
  // ═══════════════════════════════════════════════════════════
  const getTrustedDevices = async () => {
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/trusted-devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTrustedDevices(data.devices);
        return data.devices;
      }
      
      return [];
    } catch (error) {
      console.error('❌ خطا در دریافت دستگاه‌های معتبر:', error);
      return [];
    }
  };

  const addTrustedDevice = async (deviceInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/trusted-devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deviceInfo)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await getTrustedDevices();
        return { success: true, device: data.device };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در افزودن دستگاه معتبر:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  const removeTrustedDevice = async (deviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
        return { success: true, message: 'دستگاه با موفقیت حذف شد' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در حذف دستگاه معتبر:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: قفل خودکار حساب
  // ═══════════════════════════════════════════════════════════
  const checkAccountLockStatus = async (identifier) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/account-lock-status?identifier=${identifier}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAccountLockInfo({
          isLocked: data.isLocked,
          remainingAttempts: data.remainingAttempts,
          lockUntil: data.lockUntil
        });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطا در بررسی وضعیت قفل حساب:', error);
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: ایمیل‌های احراز هویت
  // ═══════════════════════════════════════════════════════════
  const sendVerificationEmail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ خطا در ارسال ایمیل تایید:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  const verifyEmail = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return { success: true, message: 'ایمیل با موفقیت تایید شد' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ خطا در تایید ایمیل:', error);
      return { success: false, message: 'خطا در ارتباط با سرور' };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: گزارش فعالیت
  // ═══════════════════════════════════════════════════════════
  const getActivityLog = async (page = 1, limit = 50, type = null) => {
    if (!token) return [];
    
    let url = `${API_BASE_URL}/api/v1/auth/activity-log?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActivityLog(data.activities);
        return {
          activities: data.activities,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages
        };
      }
      
      return { activities: [], total: 0 };
    } catch (error) {
      console.error('❌ خطا در دریافت گزارش فعالیت:', error);
      return { activities: [], total: 0 };
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🆕 فیچر جدید: WebSocket برای اعلان‌های لحظه‌ای
  // ═══════════════════════════════════════════════════════════
  const connectWebSocket = useCallback(() => {
    if (!token || !isAuthenticated) return null;
    
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/auth?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket متصل شد');
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'security_alert':
            setRealtimeNotifications(prev => [data, ...prev]);
            if (typeof window !== 'undefined' && window.showNotification) {
              window.showNotification(data.title, data.message, 'warning');
            }
            break;
            
          case 'session_update':
            getActiveSessions();
            break;
            
          case 'account_update':
            initializeAuth();
            break;
            
          default:
            console.log('📨 پیام WebSocket دریافت شد:', data);
        }
      } catch (error) {
        console.error('❌ خطا در پردازش پیام WebSocket:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ خطای WebSocket:', error);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket قطع شد');
      setWsConnection(null);
      
      setTimeout(() => {
        if (isAuthenticated && token) {
          connectWebSocket();
        }
      }, 5000);
    };
    
    return ws;
  }, [token, isAuthenticated]);

  const disconnectWebSocket = useCallback(() => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.close();
    }
    setWsConnection(null);
  }, [wsConnection]);

  // اتصال خودکار WebSocket
  useEffect(() => {
    if (isAuthenticated && token && !wsConnection) {
      connectWebSocket();
    }
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [isAuthenticated, token, connectWebSocket]);

  // ═══════════════════════════════════════════════════════════
  // 🎯 مقدار Context نهایی
  // ═══════════════════════════════════════════════════════════
  const value = {
    // Stateهای اصلی
    user,
    token,
    activeRole,
    loading,
    isAuthenticated,
    isInitialized,
    error,
    
    // متدهای اصلی
    login,
    logout,
    refreshToken,
    clearAuthData,
    setActiveRole: setActiveRoleWithStorage,
    hasRole,
    isAdmin,
    isProfessor,
    isStudent,
    isStaff,
    updateProfile,
    changePassword,
    sendOTP,
    verifyOTP,
    register,
    forgotPassword,
    resetPassword,
    
    // 🆕 مدیریت نشست‌ها
    sessions,
    currentSessionId,
    getActiveSessions,
    terminateSession,
    terminateAllOtherSessions,
    
    // 🆕 تاریخچه ورود
    loginHistory,
    getLoginHistory,
    
    // 🆕 احراز هویت دو مرحله‌ای
    twoFactorEnabled,
    twoFactorSecret,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    
    // 🆕 اعلان‌های امنیتی
    securityNotifications,
    getSecurityNotifications,
    markNotificationAsRead,
    
    // 🆕 محدودیت نرخ
    rateLimitInfo,
    getRateLimitInfo,
    
    // 🆕 دستگاه‌های معتبر
    trustedDevices,
    getTrustedDevices,
    addTrustedDevice,
    removeTrustedDevice,
    
    // 🆕 قفل حساب
    accountLockInfo,
    checkAccountLockStatus,
    
    // 🆕 ایمیل‌های احراز هویت
    sendVerificationEmail,
    verifyEmail,
    
    // 🆕 گزارش فعالیت
    activityLog,
    getActivityLog,
    
    // 🆕 WebSocket
    wsConnection,
    realtimeNotifications,
    connectWebSocket,
    disconnectWebSocket,
    
    // ثابت‌ها
    ADMIN_ROLES,
    PROFESSOR_ROLES,
    STUDENT_ROLES,
    STAFF_ROLES,
    ROLE_NAMES,
    ROLE_PATHS,
    STORAGE_KEYS,
    
    // توابع کمکی
    getRoleName: (role) => ROLE_NAMES[role] || role,
    getRolePath: (role) => ROLE_PATHS[role] || '/dashboard',
    getUserFullName: () => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'کاربر' : '',
    getRemainingAttempts: () => accountLockInfo.remainingAttempts,
    isAccountLocked: () => accountLockInfo.isLocked,
    getLockUntil: () => accountLockInfo.lockUntil,
    getCurrentSession: () => sessions.find(s => s.id === currentSessionId),
    isDeviceTrusted: (deviceId) => trustedDevices.some(d => d.id === deviceId),
    getUnreadNotifications: () => securityNotifications.filter(n => !n.read),
    getRecentActivities: (limit = 10) => activityLog.slice(0, limit)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 Hook
// ═══════════════════════════════════════════════════════════
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('❌ useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext;*/