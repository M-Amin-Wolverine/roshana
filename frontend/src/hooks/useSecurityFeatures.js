// ============================================================
// 🛡️ فایل امنیتی پیشرفته: src/hooks/useSecurityFeatures.js
// ============================================================

import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ✅ امتیازات استاندارد هر آیتم امنیتی
const SECURITY_WEIGHTS = {
  TWO_FACTOR: 25,
  TRUSTED_DEVICES: 15,
  NO_SUSPICIOUS_LOGIN: 20,
  SESSIONS_LIMIT: 15,
  EMAIL_VERIFIED: 15,
  PASSWORD_RECENT: 10
};

// ✅ محدوده‌های امنیتی
const SECURITY_LEVELS = {
  CRITICAL: { min: 0, max: 49, label: '⚠️ بحرانی', emoji: '🔴' },
  NEEDS_ATTENTION: { min: 50, max: 69, label: '⚠️ نیاز به توجه', emoji: '🟠' },
  SECURE: { min: 70, max: 89, label: '✅ امن', emoji: '🟢' },
  VERY_SECURE: { min: 90, max: 100, label: '🔒 بسیار امن', emoji: '🔐' }
};

// ✅ الگوهای لاگین مشکوک
const SUSPICIOUS_PATTERNS = {
  UNKNOWN_LOCATION: 'موقعیت مکانی غیرمعمول',
  UNUSUAL_TIME: 'زمان غیرمعمول (شب)',
  NEW_DEVICE: 'دستگاه جدید',
  MULTIPLE_FAILED: 'چندین بار تلاش ناموفق'
};

export const useSecurityFeatures = () => {
  const auth = useAuth();
  const [securityScore, setSecurityScore] = useState(0);
  const [securityRecommendations, setSecurityRecommendations] = useState([]);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const lastAnalysisRef = useRef(null);

  // ✅ تابع محاسبه روزهای گذشته (رفکتور شده)
  const calculateDaysPassed = useCallback((dateString) => {
    if (!dateString) return null;
    const pastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - pastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // ✅ تابع تحلیل پیشرفته تاریخچه ورود
  const analyzeLoginHistory = useCallback((loginHistory) => {
    if (!loginHistory?.length) return { isSuspicious: false, suspiciousCount: 0, details: [] };
    
    const suspiciousEntries = loginHistory.filter(login => 
      login.isSuspicious || login.location !== 'معمول' || login.timeOfDay === 'night'
    );
    
    const details = suspiciousEntries.map(entry => ({
      date: entry.date,
      location: entry.location,
      reason: entry.isSuspicious ? 'فعالیت مشکوک' : 'موقعیت غیرمعمول',
      severity: entry.isSuspicious ? 'high' : 'medium'
    }));
    
    return {
      isSuspicious: suspiciousEntries.length > 0,
      suspiciousCount: suspiciousEntries.length,
      details,
      lastSuspicious: suspiciousEntries[0]?.date || null
    };
  }, []);

  // ✅ تابع تحلیل نشست‌های فعال
  const analyzeActiveSessions = useCallback((sessions) => {
    const sessionCount = sessions?.length || 0;
    const isOptimal = sessionCount <= 2;
    const isWarning = sessionCount >= 5;
    
    return {
      count: sessionCount,
      isOptimal,
      isWarning,
      score: isOptimal ? SECURITY_WEIGHTS.SESSIONS_LIMIT : Math.max(0, SECURITY_WEIGHTS.SESSIONS_LIMIT - (sessionCount - 2) * 3),
      recommendation: !isOptimal ? `بستن ${sessionCount - 2} نشست فعال اضافی` : null
    };
  }, []);

  // ✅ تابع بررسی قدرت رمز عبور
  const analyzePasswordStrength = useCallback((lastPasswordChange, passwordStrength) => {
    if (!lastPasswordChange) {
      return {
        score: 0,
        needsChange: true,
        recommendation: 'تنظیم رمز عبور قوی',
        daysSinceChange: null
      };
    }
    
    const daysSinceChange = calculateDaysPassed(lastPasswordChange);
    const isRecent = daysSinceChange <= 90;
    const isStrong = passwordStrength === 'strong';
    
    let score = 0;
    let recommendation = null;
    
    if (isRecent && isStrong) {
      score = SECURITY_WEIGHTS.PASSWORD_RECENT;
    } else if (isRecent) {
      score = SECURITY_WEIGHTS.PASSWORD_RECENT - 3;
      recommendation = 'تقویت رمز عبور (رمز فعلی ضعیف است)';
    } else if (!isRecent && isStrong) {
      score = 5;
      recommendation = 'تغییر رمز عبور (بیش از 90 روز گذشته)';
    } else {
      recommendation = 'تغییر و تقویت رمز عبور';
    }
    
    return {
      score,
      needsChange: daysSinceChange > 90 || !isStrong,
      recommendation,
      daysSinceChange,
      isStrong
    };
  }, [calculateDaysPassed]);

  // ✅ تابع اصلی محاسبه امتیاز امنیتی (خفن شده)
  const calculateSecurityScore = useCallback(() => {
    let score = 0;
    const recommendations = [];
    const analysis = {};

    // 1. 🔐 بررسی 2FA (احراز هویت دو مرحله‌ای)
    analysis.twoFactor = {
      enabled: auth.twoFactorEnabled || false,
      score: auth.twoFactorEnabled ? SECURITY_WEIGHTS.TWO_FACTOR : 0
    };
    if (analysis.twoFactor.enabled) {
      score += analysis.twoFactor.score;
    } else {
      recommendations.push({
        id: '2fa',
        priority: 'high',
        text: 'فعال‌سازی احراز هویت دو مرحله‌ای',
        emoji: '🔐',
        action: '/security/2fa-setup'
      });
    }

    // 2. 📱 بررسی دستگاه‌های معتبر
    const trustedDevicesCount = auth.trustedDevices?.length || 0;
    analysis.trustedDevices = {
      count: trustedDevicesCount,
      score: trustedDevicesCount > 0 ? SECURITY_WEIGHTS.TRUSTED_DEVICES : 0
    };
    if (trustedDevicesCount > 0) {
      score += analysis.trustedDevices.score;
    } else {
      recommendations.push({
        id: 'trusted_devices',
        priority: 'medium',
        text: 'افزودن دستگاه‌های معتبر',
        emoji: '💻',
        action: '/security/devices'
      });
    }

    // 3. 🕵️ بررسی تاریخچه ورود
    const loginAnalysis = analyzeLoginHistory(auth.loginHistory);
    analysis.loginHistory = loginAnalysis;
    if (!loginAnalysis.isSuspicious) {
      score += SECURITY_WEIGHTS.NO_SUSPICIOUS_LOGIN;
    } else {
      recommendations.push({
        id: 'suspicious_logins',
        priority: 'critical',
        text: `بررسی ${loginAnalysis.suspiciousCount} ورود مشکوک به حساب کاربری`,
        emoji: '⚠️',
        details: loginAnalysis.details,
        action: '/security/login-history'
      });
    }

    // 4. 💻 بررسی نشست‌های فعال
    const sessionsAnalysis = analyzeActiveSessions(auth.sessions);
    analysis.sessions = sessionsAnalysis;
    score += sessionsAnalysis.score;
    if (sessionsAnalysis.recommendation) {
      recommendations.push({
        id: 'active_sessions',
        priority: 'medium',
        text: sessionsAnalysis.recommendation,
        emoji: '🖥️',
        action: '/security/sessions'
      });
    }

    // 5. ✉️ بررسی تایید ایمیل
    analysis.emailVerified = {
      verified: auth.user?.emailVerified || false,
      score: auth.user?.emailVerified ? SECURITY_WEIGHTS.EMAIL_VERIFIED : 0
    };
    if (auth.user?.emailVerified) {
      score += analysis.emailVerified.score;
    } else {
      recommendations.push({
        id: 'email_verification',
        priority: 'high',
        text: 'تایید آدرس ایمیل',
        emoji: '📧',
        action: '/profile/verify-email'
      });
    }

    // 6. 🔑 بررسی آخرین تغییر رمز و قدرت آن
    const passwordAnalysis = analyzePasswordStrength(
      auth.user?.lastPasswordChange,
      auth.user?.passwordStrength
    );
    analysis.password = passwordAnalysis;
    score += passwordAnalysis.score;
    if (passwordAnalysis.recommendation) {
      recommendations.push({
        id: 'password',
        priority: passwordAnalysis.needsChange ? 'high' : 'medium',
        text: passwordAnalysis.recommendation,
        emoji: '🔑',
        action: '/profile/change-password'
      });
    }

    // ✅ نرمالایز کردن امتیاز نهایی (بین 0 تا 100)
    const finalScore = Math.min(100, Math.max(0, score));
    
    // 🎯 تعیین سطح امنیت
    let securityLevel = null;
    for (const [key, level] of Object.entries(SECURITY_LEVELS)) {
      if (finalScore >= level.min && finalScore <= level.max) {
        securityLevel = { key, ...level };
        break;
      }
    }
    
    // مرتب‌سازی پیشنهادات بر اساس اولویت
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
    
    // ذخیره تحلیل کامل
    const fullAnalysis = {
      ...analysis,
      totalScore: finalScore,
      securityLevel,
      recommendationsCount: sortedRecommendations.length,
      timestamp: new Date().toISOString()
    };
    
    setSecurityScore(finalScore);
    setSecurityRecommendations(sortedRecommendations.map(rec => rec.text));
    setDetailedAnalysis(fullAnalysis);
    lastAnalysisRef.current = fullAnalysis;
    
    return { 
      score: finalScore, 
      recommendations: sortedRecommendations,
      analysis: fullAnalysis,
      securityLevel
    };
  }, [auth, analyzeLoginHistory, analyzeActiveSessions, analyzePasswordStrength]);

  // ✅ تابع دریافت توصیه‌های فوری امنیتی
  const getUrgentRecommendations = useCallback(() => {
    if (!securityRecommendations.length) return [];
    return securityRecommendations.filter(rec => 
      rec.priority === 'critical' || rec.priority === 'high'
    );
  }, [securityRecommendations]);

  // ✅ تابع بررسی تغییرات اخیر امنیتی
  const hasRecentSecurityChanges = useCallback((days = 7) => {
    const lastAnalysis = lastAnalysisRef.current;
    if (!lastAnalysis?.timestamp) return false;
    
    const daysSinceLastAnalysis = calculateDaysPassed(lastAnalysis.timestamp);
    return daysSinceLastAnalysis <= days;
  }, [calculateDaysPassed]);

  // ✅ useEffect بهینه‌شده با وابستگی‌های کامل
  useEffect(() => {
    if (auth.isAuthenticated) {
      calculateSecurityScore();
    } else {
      // ریست کردن وضعیت در صورت خروج کاربر
      setSecurityScore(0);
      setSecurityRecommendations([]);
      setDetailedAnalysis(null);
    }
  }, [
    auth.isAuthenticated,
    auth.twoFactorEnabled,
    auth.trustedDevices,
    auth.loginHistory,
    auth.sessions,
    auth.user?.emailVerified,
    auth.user?.lastPasswordChange,
    auth.user?.passwordStrength,
    calculateSecurityScore
  ]);

  // ✅ مقادیر memoized برای عملکرد بهتر
  const isSecure = useMemo(() => securityScore >= 70, [securityScore]);
  const isVerySecure = useMemo(() => securityScore >= 90, [securityScore]);
  const needsAttention = useMemo(() => securityScore < 50, [securityScore]);
  const securityLevelInfo = useMemo(() => {
    if (isVerySecure) return SECURITY_LEVELS.VERY_SECURE;
    if (isSecure) return SECURITY_LEVELS.SECURE;
    if (needsAttention) return SECURITY_LEVELS.NEEDS_ATTENTION;
    return SECURITY_LEVELS.CRITICAL;
  }, [isSecure, isVerySecure, needsAttention]);

  return {
    // مقادیر اصلی
    securityScore,
    securityRecommendations,
    calculateSecurityScore,
    isSecure,
    isVerySecure,
    needsAttention,
    
    // مقادیر جدید و پیشرفته
    detailedAnalysis,           // تحلیل کامل امنیتی
    securityLevelInfo,          // اطلاعات سطح امنیت با emoji
    urgentRecommendations: getUrgentRecommendations(), // توصیه‌های فوری
    hasRecentChanges: hasRecentSecurityChanges(),     // تغییرات اخیر
    securityScorePercent: `${Math.round(securityScore)}%`, // امتیاز به صورت درصد
    
    // توابع کمکی
    getUrgentRecommendations,
    hasRecentSecurityChanges,
    refreshSecurityScore: calculateSecurityScore
  };
};

// ✅ خروجی پیش‌فرض
export default useSecurityFeatures;