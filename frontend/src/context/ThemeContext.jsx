/* // src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('mode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('mode', mode);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
  }, [theme, mode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    mode,
    setTheme,
    setMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; */
// ============================================================
// src/context/ThemeContext.jsx - نسخه خفن نهایی 🚀
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ═══════════════════════════════════════════════════════════
// 📋 ثابت‌ها و تنظیمات
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  STORAGE_KEYS: {
    THEME: 'fartak_theme',
    DIRECTION: 'fartak_direction',
    COLOR_SCHEME: 'fartak_color_scheme',
    AUTO_SWITCH: 'fartak_auto_switch',
    NIGHT_SCHEDULE: 'fartak_night_schedule',
    HIGH_CONTRAST: 'fartak_high_contrast',
    SPECIAL_MODE: 'fartak_special_mode',
    CUSTOM_THEMES: 'fartak_custom_themes',
    HISTORY: 'fartak_theme_history',
    PREFERENCES: 'fartak_theme_preferences'
  },
  ANIMATION_DURATION: 300,
  HISTORY_MAX_ITEMS: 100,
  DEBOUNCE_DELAY: 150
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export const DIRECTIONS = {
  RTL: 'rtl',
  LTR: 'ltr'
};

export const COLOR_SCHEMES = {
  DEFAULT: 'default',
  OCEAN: 'ocean',
  FOREST: 'forest',
  SUNSET: 'sunset',
  MIDNIGHT: 'midnight',
  LAVENDER: 'lavender',
  COFFEE: 'coffee'
};

export const SPECIAL_MODES = {
  NORMAL: 'normal',
  READING: 'reading',
  FOCUS: 'focus',
  NIGHT_VISION: 'night_vision',
  SEPIA: 'sepia',
  GRAYSCALE: 'grayscale'
};

// ═══════════════════════════════════════════════════════════
// 🛠️ Utility Functions
// ═══════════════════════════════════════════════════════════
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const generateThemeCSS = (scheme, isDark) => {
  const schemes = {
    default: isDark ? {
      '--primary': '#3b82f6',
      '--background': '#0f172a',
      '--surface': '#1e293b',
      '--text': '#f8fafc'
    } : {
      '--primary': '#3b82f6',
      '--background': '#ffffff',
      '--surface': '#f8fafc',
      '--text': '#0f172a'
    },
    ocean: isDark ? {
      '--primary': '#06b6d4',
      '--background': '#0f172a',
      '--surface': '#164e63',
      '--text': '#ecfeff'
    } : {
      '--primary': '#0891b2',
      '--background': '#f0f9ff',
      '--surface': '#e0f2fe',
      '--text': '#082f49'
    },
    forest: isDark ? {
      '--primary': '#10b981',
      '--background': '#0f172a',
      '--surface': '#064e3b',
      '--text': '#d1fae5'
    } : {
      '--primary': '#059669',
      '--background': '#f0fdf4',
      '--surface': '#dcfce7',
      '--text': '#052e16'
    },
    sunset: isDark ? {
      '--primary': '#f59e0b',
      '--background': '#1a0b2e',
      '--surface': '#4c1d95',
      '--text': '#fef3c7'
    } : {
      '--primary': '#d97706',
      '--background': '#fffbeb',
      '--surface': '#fef3c7',
      '--text': '#451a03'
    },
    midnight: isDark ? {
      '--primary': '#8b5cf6',
      '--background': '#0f172a',
      '--surface': '#1e1b4b',
      '--text': '#e0e7ff'
    } : {
      '--primary': '#7c3aed',
      '--background': '#f5f3ff',
      '--surface': '#ede9fe',
      '--text': '#2e1065'
    },
    lavender: isDark ? {
      '--primary': '#a78bfa',
      '--background': '#1a1a2e',
      '--surface': '#2d2b4a',
      '--text': '#f3e8ff'
    } : {
      '--primary': '#8b5cf6',
      '--background': '#faf5ff',
      '--surface': '#f3e8ff',
      '--text': '#3b0764'
    },
    coffee: isDark ? {
      '--primary': '#d97706',
      '--background': '#1c1917',
      '--surface': '#44403c',
      '--text': '#fef3c7'
    } : {
      '--primary': '#b45309',
      '--background': '#fef3c7',
      '--surface': '#fde68a',
      '--text': '#451a03'
    }
  };
  
  return schemes[scheme] || schemes.default;
};

// ═══════════════════════════════════════════════════════════
// 🎯 Context
// ═══════════════════════════════════════════════════════════
const ThemeContext = createContext(null);

// ═══════════════════════════════════════════════════════════
// 🚀 Provider اصلی
// ═══════════════════════════════════════════════════════════
export const ThemeProvider = ({ children }) => {
  // ═══════════════════════════════════════════════════════════
  // 📊 State اصلی
  // ═══════════════════════════════════════════════════════════
  const [theme, setThemeState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.THEME, THEMES.SYSTEM)
  );
  
  const [direction, setDirectionState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.DIRECTION, DIRECTIONS.RTL)
  );
  
  const [colorScheme, setColorSchemeState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.COLOR_SCHEME, COLOR_SCHEMES.DEFAULT)
  );
  
  const [actualTheme, setActualTheme] = useState(THEMES.LIGHT);
  
  // ═══════════════════════════════════════════════════════════
  // ⚙️ ویژگی‌های پیشرفته
  // ═══════════════════════════════════════════════════════════
  const [autoSwitch, setAutoSwitchState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.AUTO_SWITCH, false)
  );
  
  const [nightSchedule, setNightScheduleState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.NIGHT_SCHEDULE, { start: '20:00', end: '06:00' })
  );
  
  const [highContrast, setHighContrastState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.HIGH_CONTRAST, false)
  );
  
  const [specialMode, setSpecialModeState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.SPECIAL_MODE, SPECIAL_MODES.NORMAL)
  );
  
  const [themeLocked, setThemeLockedState] = useState(false);
  const [lockedTheme, setLockedTheme] = useState(null);
  
  const [customThemes, setCustomThemesState] = useState(() => 
    storage.get(CONFIG.STORAGE_KEYS.CUSTOM_THEMES, {})
  );
  
  const [previewTheme, setPreviewTheme] = useState(null);
  
  // Refs
  const historyRef = useRef([]);
  const overlayRef = useRef(null);
  const animationFrameRef = useRef(null);

  // ═══════════════════════════════════════════════════════════
  // 📝 Helper Functions
  // ═══════════════════════════════════════════════════════════
  const trackHistory = useCallback((action, details = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      theme,
      actualTheme,
      colorScheme,
      direction,
      specialMode,
      ...details
    };
    
    historyRef.current = [entry, ...historyRef.current].slice(0, CONFIG.HISTORY_MAX_ITEMS);
    storage.set(CONFIG.STORAGE_KEYS.HISTORY, historyRef.current);
    
    // Analytics tracking (if available)
    if (window.gtag) {
      window.gtag('event', 'theme_action', {
        event_category: 'Theme',
        event_label: action,
        theme_preference: theme,
        color_scheme: colorScheme
      });
    }
  }, [theme, actualTheme, colorScheme, direction, specialMode]);

  const applyColorScheme = useCallback((scheme, isDark) => {
    const colors = generateThemeCSS(scheme, isDark);
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    document.documentElement.setAttribute('data-color-scheme', scheme);
  }, []);

  const applySpecialMode = useCallback((mode) => {
    // حذف کلاس‌های قبلی
    Object.values(SPECIAL_MODES).forEach(m => {
      document.documentElement.classList.remove(`mode-${m}`);
    });
    
    document.documentElement.classList.add(`mode-${mode}`);
    
    const filters = {
      [SPECIAL_MODES.NORMAL]: 'none',
      [SPECIAL_MODES.READING]: 'sepia(0.4) brightness(0.95) contrast(1.1)',
      [SPECIAL_MODES.FOCUS]: 'brightness(0.9) blur(0.5px)',
      [SPECIAL_MODES.NIGHT_VISION]: 'brightness(0.4) sepia(1) hue-rotate(140deg) saturate(3)',
      [SPECIAL_MODES.SEPIA]: 'sepia(0.8) brightness(0.9)',
      [SPECIAL_MODES.GRAYSCALE]: 'grayscale(1) contrast(1.2)'
    };
    
    document.documentElement.style.filter = filters[mode] || 'none';
    document.documentElement.setAttribute('data-special-mode', mode);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🎨 اعمال تم اصلی به DOM
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const applyTheme = () => {
      let themeToApply = theme;
      
      if (theme === THEMES.SYSTEM) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeToApply = prefersDark ? THEMES.DARK : THEMES.LIGHT;
      }
      
      const finalTheme = previewTheme || (themeLocked ? lockedTheme : themeToApply);
      setActualTheme(finalTheme);
      
      document.documentElement.setAttribute('data-theme', finalTheme);
      applyColorScheme(colorScheme, finalTheme === THEMES.DARK);
      
      // تنظیم meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const colors = {
          [THEMES.DARK]: '#0f172a',
          [THEMES.LIGHT]: '#ffffff'
        };
        metaThemeColor.setAttribute('content', colors[finalTheme] || '#ffffff');
      }
    };
    
    applyTheme();
    storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === THEMES.SYSTEM && !themeLocked && !previewTheme) {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, colorScheme, themeLocked, lockedTheme, previewTheme, applyColorScheme]);

  // ═══════════════════════════════════════════════════════════
  // 📐 اعمال Direction
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', direction === DIRECTIONS.RTL ? 'fa' : 'en');
    storage.set(CONFIG.STORAGE_KEYS.DIRECTION, direction);
  }, [direction]);

  // ═══════════════════════════════════════════════════════════
  // 🌓 زمان‌بندی خودکار شب/روز
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!autoSwitch || themeLocked) return;
    
    const checkSchedule = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = nightSchedule.start.split(':').map(Number);
      const [endH, endM] = nightSchedule.end.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      const isNightTime = startMinutes <= endMinutes
        ? currentMinutes >= startMinutes && currentMinutes < endMinutes
        : currentMinutes >= startMinutes || currentMinutes < endMinutes;
      
      const targetTheme = isNightTime ? THEMES.DARK : THEMES.LIGHT;
      
      if (theme !== targetTheme) {
        setThemeState(targetTheme);
        trackHistory('auto_schedule', { isNightTime, targetTheme });
      }
    };
    
    checkSchedule();
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [autoSwitch, nightSchedule, theme, themeLocked, trackHistory]);

  // ═══════════════════════════════════════════════════════════
  // 🎯 تشخیص High Contrast
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleContrastChange = (e) => {
      if (!highContrast) {
        setHighContrastState(e.matches);
      }
    };
    
    handleContrastChange(mediaQuery);
    mediaQuery.addEventListener('change', handleContrastChange);
    return () => mediaQuery.removeEventListener('change', handleContrastChange);
  }, [highContrast]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
    storage.set(CONFIG.STORAGE_KEYS.HIGH_CONTRAST, highContrast);
  }, [highContrast]);

  // ═══════════════════════════════════════════════════════════
  // 🎨 اعمال Special Mode
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    applySpecialMode(specialMode);
    storage.set(CONFIG.STORAGE_KEYS.SPECIAL_MODE, specialMode);
  }, [specialMode, applySpecialMode]);

  // ═══════════════════════════════════════════════════════════
  // 🔄 همگام‌سازی بین تب‌ها
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleStorageChange = (e) => {
      const keyMap = {
        [CONFIG.STORAGE_KEYS.THEME]: setThemeState,
        [CONFIG.STORAGE_KEYS.DIRECTION]: setDirectionState,
        [CONFIG.STORAGE_KEYS.COLOR_SCHEME]: setColorSchemeState,
        [CONFIG.STORAGE_KEYS.SPECIAL_MODE]: setSpecialModeState
      };
      
      const setter = keyMap[e.key];
      if (setter && e.newValue) {
        try {
          const value = JSON.parse(e.newValue);
          setter(value);
          trackHistory('sync_from_tab', { key: e.key, value });
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [trackHistory]);

  // ═══════════════════════════════════════════════════════════
  // ⌨️ شورتکات‌های کیبورد
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyPress = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isModifier && e.shiftKey) {
        switch(e.key) {
          case 'D':
            e.preventDefault();
            toggleTheme();
            break;
          case 'R':
            e.preventDefault();
            toggleDirection();
            break;
          case 'S':
            e.preventDefault();
            setTheme(THEMES.SYSTEM);
            break;
          case 'C':
            e.preventDefault();
            cycleColorScheme();
            break;
          case 'H':
            e.preventDefault();
            toggleHighContrast();
            break;
          case 'M':
            e.preventDefault();
            cycleSpecialMode();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🎮 متدهای عمومی
  // ═══════════════════════════════════════════════════════════
  const setTheme = useCallback((newTheme) => {
    if (themeLocked) {
      console.warn('🔒 Theme is locked. Unlock first to change.');
      return;
    }
    if (Object.values(THEMES).includes(newTheme)) {
      trackHistory('set_theme', { from: theme, to: newTheme });
      setThemeState(newTheme);
    }
  }, [themeLocked, theme, trackHistory]);

  const toggleTheme = useCallback(() => {
    if (themeLocked) return;
    
    const newTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    trackHistory('toggle_theme', { from: theme, to: newTheme });
    setThemeState(newTheme);
  }, [theme, themeLocked, trackHistory]);

  const setDirection = useCallback((newDirection) => {
    if (Object.values(DIRECTIONS).includes(newDirection)) {
      trackHistory('set_direction', { from: direction, to: newDirection });
      setDirectionState(newDirection);
    }
  }, [direction, trackHistory]);

  const toggleDirection = useCallback(() => {
    const newDirection = direction === DIRECTIONS.RTL ? DIRECTIONS.LTR : DIRECTIONS.RTL;
    trackHistory('toggle_direction', { from: direction, to: newDirection });
    setDirectionState(newDirection);
  }, [direction, trackHistory]);

  const setColorScheme = useCallback((scheme) => {
    if (Object.values(COLOR_SCHEMES).includes(scheme)) {
      trackHistory('set_color_scheme', { from: colorScheme, to: scheme });
      setColorSchemeState(scheme);
      storage.set(CONFIG.STORAGE_KEYS.COLOR_SCHEME, scheme);
    }
  }, [colorScheme, trackHistory]);

  const cycleColorScheme = useCallback(() => {
    const schemes = Object.values(COLOR_SCHEMES);
    const currentIndex = schemes.indexOf(colorScheme);
    const nextIndex = (currentIndex + 1) % schemes.length;
    setColorScheme(schemes[nextIndex]);
  }, [colorScheme, setColorScheme]);

  const setSpecialMode = useCallback((mode) => {
    if (Object.values(SPECIAL_MODES).includes(mode)) {
      trackHistory('set_special_mode', { from: specialMode, to: mode });
      setSpecialModeState(mode);
    }
  }, [specialMode, trackHistory]);

  const cycleSpecialMode = useCallback(() => {
    const modes = Object.values(SPECIAL_MODES);
    const currentIndex = modes.indexOf(specialMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSpecialMode(modes[nextIndex]);
  }, [specialMode, setSpecialMode]);

  const toggleHighContrast = useCallback(() => {
    trackHistory('toggle_high_contrast', { from: highContrast, to: !highContrast });
    setHighContrastState(prev => !prev);
  }, [highContrast, trackHistory]);

  const setAutoSwitch = useCallback((enabled, schedule = null) => {
    setAutoSwitchState(enabled);
    if (schedule) {
      setNightScheduleState(schedule);
      storage.set(CONFIG.STORAGE_KEYS.NIGHT_SCHEDULE, schedule);
    }
    storage.set(CONFIG.STORAGE_KEYS.AUTO_SWITCH, enabled);
    trackHistory('set_auto_switch', { enabled, schedule });
  }, [trackHistory]);

  const lockTheme = useCallback((forcedTheme = null) => {
    const themeToLock = forcedTheme || actualTheme;
    setThemeLockedState(true);
    setLockedTheme(themeToLock);
    trackHistory('lock_theme', { lockedTheme: themeToLock });
  }, [actualTheme, trackHistory]);

  const unlockTheme = useCallback(() => {
    setThemeLockedState(false);
    setLockedTheme(null);
    trackHistory('unlock_theme');
  }, [trackHistory]);

  const previewThemeTemporarily = useCallback((previewThemeType) => {
    setPreviewTheme(previewThemeType);
  }, []);

  const cancelPreview = useCallback(() => {
    setPreviewTheme(null);
  }, []);

  const createCustomTheme = useCallback((name, colors) => {
    const updatedThemes = { ...customThemes, [name]: colors };
    setCustomThemesState(updatedThemes);
    storage.set(CONFIG.STORAGE_KEYS.CUSTOM_THEMES, updatedThemes);
    trackHistory('create_custom_theme', { name });
    
    // اضافه کردن به COLOR_SCHEMES
    if (!COLOR_SCHEMES[name.toUpperCase()]) {
      COLOR_SCHEMES[name.toUpperCase()] = name;
    }
  }, [customThemes, trackHistory]);

  const deleteCustomTheme = useCallback((name) => {
    const { [name]: removed, ...rest } = customThemes;
    setCustomThemesState(rest);
    storage.set(CONFIG.STORAGE_KEYS.CUSTOM_THEMES, rest);
    trackHistory('delete_custom_theme', { name });
  }, [customThemes, trackHistory]);

  const getHistory = useCallback(() => {
    return historyRef.current;
  }, []);

  const exportPreferences = useCallback(() => {
    const preferences = {
      theme,
      direction,
      colorScheme,
      autoSwitch,
      nightSchedule,
      highContrast,
      specialMode,
      customThemes,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(preferences, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-preferences-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    trackHistory('export_preferences');
  }, [theme, direction, colorScheme, autoSwitch, nightSchedule, highContrast, specialMode, customThemes, trackHistory]);

  const importPreferences = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const preferences = JSON.parse(e.target.result);
        
        if (preferences.theme) setThemeState(preferences.theme);
        if (preferences.direction) setDirectionState(preferences.direction);
        if (preferences.colorScheme) setColorSchemeState(preferences.colorScheme);
        if (preferences.autoSwitch !== undefined) setAutoSwitchState(preferences.autoSwitch);
        if (preferences.nightSchedule) setNightScheduleState(preferences.nightSchedule);
        if (preferences.highContrast !== undefined) setHighContrastState(preferences.highContrast);
        if (preferences.specialMode) setSpecialModeState(preferences.specialMode);
        if (preferences.customThemes) setCustomThemesState(preferences.customThemes);
        
        trackHistory('import_preferences', { filename: file.name });
      } catch (error) {
        console.error('Failed to import preferences:', error);
      }
    };
    reader.readAsText(file);
  }, [trackHistory]);

  const resetToDefaults = useCallback(() => {
    setThemeState(THEMES.SYSTEM);
    setDirectionState(DIRECTIONS.RTL);
    setColorSchemeState(COLOR_SCHEMES.DEFAULT);
    setAutoSwitchState(false);
    setNightScheduleState({ start: '20:00', end: '06:00' });
    setHighContrastState(false);
    setSpecialModeState(SPECIAL_MODES.NORMAL);
    setThemeLockedState(false);
    setLockedTheme(null);
    
    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    trackHistory('reset_to_defaults');
  }, [trackHistory]);

  // ═══════════════════════════════════════════════════════════
  // 🧹 Cleanup
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (overlayRef.current) {
        overlayRef.current.remove();
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 📦 مقدار نهایی Context
  // ═══════════════════════════════════════════════════════════
  const value = useMemo(() => ({
    // پایه
    theme,
    actualTheme,
    direction,
    
    // حالت‌های رنگی
    colorScheme,
    colorSchemes: COLOR_SCHEMES,
    
    // ویژگی‌های پیشرفته
    autoSwitch,
    nightSchedule,
    highContrast,
    specialMode,
    specialModes: SPECIAL_MODES,
    themeLocked,
    previewTheme,
    customThemes,
    
    // متدهای پایه
    setTheme,
    toggleTheme,
    setDirection,
    toggleDirection,
    
    // متدهای رنگی
    setColorScheme,
    cycleColorScheme,
    
    // متدهای پیشرفته
    setAutoSwitch,
    setSpecialMode,
    cycleSpecialMode,
    toggleHighContrast,
    
    // قفل و پیش‌نمایش
    lockTheme,
    unlockTheme,
    previewThemeTemporarily,
    cancelPreview,
    
    // تم‌های سفارشی
    createCustomTheme,
    deleteCustomTheme,
    
    // ابزارها
    getHistory,
    exportPreferences,
    importPreferences,
    resetToDefaults,
    
    // پرچم‌های کمکی
    isDark: actualTheme === THEMES.DARK,
    isLight: actualTheme === THEMES.LIGHT,
    isSystem: theme === THEMES.SYSTEM,
    isRTL: direction === DIRECTIONS.RTL,
    isLTR: direction === DIRECTIONS.LTR,
    isSpecialMode: specialMode !== SPECIAL_MODES.NORMAL,
    
    // ثابت‌ها
    THEMES,
    DIRECTIONS
  }), [
    theme, actualTheme, direction, colorScheme, autoSwitch, 
    nightSchedule, highContrast, specialMode, themeLocked, 
    previewTheme, customThemes, setTheme, toggleTheme, 
    setDirection, toggleDirection, setColorScheme, cycleColorScheme,
    setAutoSwitch, setSpecialMode, cycleSpecialMode, toggleHighContrast,
    lockTheme, unlockTheme, previewThemeTemporarily, cancelPreview,
    createCustomTheme, deleteCustomTheme, getHistory, 
    exportPreferences, importPreferences, resetToDefaults
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 Hook سفارشی
// ═══════════════════════════════════════════════════════════
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('❌ useTheme must be used within ThemeProvider');
  }
  
  return context;
};

// ═══════════════════════════════════════════════════════════
// 🎨 هوک‌های کمکی اضافه
// ═══════════════════════════════════════════════════════════
export const useThemeShortcuts = () => {
  const theme = useTheme();
  
  useEffect(() => {
    const shortcuts = [
      { key: 'd', ctrl: true, shift: true, action: theme.toggleTheme, desc: 'Toggle Dark/Light' },
      { key: 'r', ctrl: true, shift: true, action: theme.toggleDirection, desc: 'Toggle RTL/LTR' },
      { key: 's', ctrl: true, shift: true, action: () => theme.setTheme(THEMES.SYSTEM), desc: 'System Theme' },
      { key: 'c', ctrl: true, shift: true, action: theme.cycleColorScheme, desc: 'Cycle Color Scheme' },
      { key: 'm', ctrl: true, shift: true, action: theme.cycleSpecialMode, desc: 'Cycle Special Mode' },
      { key: 'h', ctrl: true, shift: true, action: theme.toggleHighContrast, desc: 'Toggle High Contrast' }
    ];
    
    // نمایش راهنما با Alt + H
    const handleHelp = (e) => {
      if (e.altKey && e.key === 'h') {
        console.table(shortcuts.map(s => ({ Shortcut: `Ctrl+Shift+${s.key.toUpperCase()}`, Action: s.desc })));
      }
    };
    
    window.addEventListener('keydown', handleHelp);
    return () => window.removeEventListener('keydown', handleHelp);
  }, [theme]);
  
  return theme;
};

export default ThemeContext;