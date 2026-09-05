// ============================================================
// src/components/ThemeManager/ThemeManager.jsx
// کامپوننت کنترل پنل تم - بدون دست زدن به منطق اصلی App
// ============================================================

import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeManager.css';

const ThemeManager = () => {
  const {
    // پایه
    theme, actualTheme, isDark, isRTL,
    toggleTheme, setTheme, toggleDirection,
    
    // طرح رنگی
    colorScheme, setColorScheme, cycleColorScheme, colorSchemes,
    
    // مودهای ویژه
    specialMode, setSpecialMode, cycleSpecialMode, specialModes,
    
    // قابلیت‌های پیشرفته
    autoSwitch, setAutoSwitch,
    highContrast, toggleHighContrast,
    themeLocked, lockTheme, unlockTheme,
    
    // ابزارها
    exportPreferences, importPreferences, resetToDefaults,
    
    // ثابت‌ها
    THEMES
  } = useTheme();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // کیبورد شورتکات برای باز/بسته کردن پنل
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Shift + P برای باز کردن پنل تم
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsPanelOpen(prev => !prev);
      }
      
      // Escape برای بستن
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPanelOpen]);

  // ذخیره موقعیت پنل در localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('theme_panel_open');
    if (savedState) {
      setIsPanelOpen(JSON.parse(savedState));
    }
  }, []);

  const togglePanel = () => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    localStorage.setItem('theme_panel_open', JSON.stringify(newState));
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      importPreferences(file);
    }
  };

  if (!isPanelOpen) {
    return (
      <button 
        className="theme-manager-toggle"
        onClick={togglePanel}
        title="پنل تنظیمات تم (Ctrl+Shift+P)"
      >
        🎨
        {themeLocked && <span className="lock-badge">🔒</span>}
      </button>
    );
  }

  return (
    <div className="theme-manager-panel">
      <div className="panel-header">
        <h2>🎨 پنل مدیریت تم</h2>
        <div className="header-actions">
          <button 
            className="icon-btn"
            onClick={() => setShowShortcuts(!showShortcuts)}
            title="شورتکات‌ها"
          >
            ⌨️
          </button>
          <button 
            className="icon-btn close-btn"
            onClick={togglePanel}
            title="بستن (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="shortcuts-panel">
          <h4>⌨️ شورتکات‌های کیبورد</h4>
          <table>
            <tbody>
              <tr><td>Ctrl+Shift+D</td><td>تغییر تم روشن/تاریک</td></tr>
              <tr><td>Ctrl+Shift+R</td><td>تغییر جهت RTL/LTR</td></tr>
              <tr><td>Ctrl+Shift+S</td><td>تم سیستم</td></tr>
              <tr><td>Ctrl+Shift+C</td><td>طرح رنگی بعدی</td></tr>
              <tr><td>Ctrl+Shift+M</td><td>مود ویژه بعدی</td></tr>
              <tr><td>Ctrl+Shift+H</td><td>کنتراست بالا</td></tr>
              <tr><td>Ctrl+Shift+P</td><td>باز/بسته کردن پنل</td></tr>
              <tr><td>Alt+H</td><td>نمایش راهنما در کنسول</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="panel-content">
        {/* بخش تم اصلی */}
        <div className="section">
          <h3>🌓 تم اصلی</h3>
          <div className="control-group">
            <button 
              className={`theme-btn ${isDark ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              {isDark ? '☀️ روشن' : '🌙 تاریک'}
            </button>
            
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              disabled={themeLocked}
            >
              <option value={THEMES.LIGHT}>☀️ روشن</option>
              <option value={THEMES.DARK}>🌙 تاریک</option>
              <option value={THEMES.SYSTEM}>💻 سیستم</option>
            </select>

            <button 
              className={`direction-btn ${isRTL ? 'active' : ''}`}
              onClick={toggleDirection}
            >
              {isRTL ? '🇮🇷 فارسی' : '🇬🇧 English'}
            </button>
          </div>
        </div>

        {/* بخش طرح رنگی */}
        <div className="section">
          <h3>🌈 طرح رنگی</h3>
          <div className="control-group">
            <button onClick={cycleColorScheme} className="cycle-btn">
              🔄 طرح بعدی
            </button>
            <select 
              value={colorScheme} 
              onChange={(e) => setColorScheme(e.target.value)}
            >
              {Object.entries(colorSchemes).map(([key, value]) => (
                <option key={key} value={value}>
                  {key === 'DEFAULT' && '🎯 پیش‌فرض'}
                  {key === 'OCEAN' && '🌊 اقیانوس'}
                  {key === 'FOREST' && '🌲 جنگل'}
                  {key === 'SUNSET' && '🌅 غروب'}
                  {key === 'MIDNIGHT' && '🌙 نیمه‌شب'}
                  {key === 'LAVENDER' && '💜 اسطوخودوس'}
                  {key === 'COFFEE' && '☕ قهوه'}
                </option>
              ))}
            </select>
          </div>
          
          {/* پیش‌نمایش رنگ‌ها */}
          <div className="color-preview">
            {Object.entries(colorSchemes).slice(0, 4).map(([key]) => (
              <button
                key={key}
                className={`color-swatch ${key.toLowerCase()}`}
                onClick={() => setColorScheme(colorSchemes[key])}
                title={key}
              />
            ))}
          </div>
        </div>

        {/* بخش مودهای ویژه */}
        <div className="section">
          <h3>🎭 مود ویژه</h3>
          <div className="control-group">
            <button onClick={cycleSpecialMode} className="cycle-btn">
              🔄 مود بعدی
            </button>
            <select 
              value={specialMode} 
              onChange={(e) => setSpecialMode(e.target.value)}
            >
              {Object.entries(specialModes).map(([key, value]) => (
                <option key={key} value={value}>
                  {key === 'NORMAL' && '✨ عادی'}
                  {key === 'READING' && '📖 مطالعه'}
                  {key === 'FOCUS' && '🎯 تمرکز'}
                  {key === 'NIGHT_VISION' && '🌙 دید در شب'}
                  {key === 'SEPIA' && '📜 سپیا'}
                  {key === 'GRAYSCALE' && '⚫ خاکستری'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* بخش تنظیمات خودکار */}
        <div className="section">
          <h3>⏰ زمان‌بندی</h3>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={autoSwitch} 
              onChange={(e) => setAutoSwitch(e.target.checked)}
            />
            تغییر خودکار شب/روز (۲۰:۰۰ تا ۰۶:۰۰)
          </label>
        </div>

        {/* بخش دسترسی‌پذیری */}
        <div className="section">
          <h3>♿ دسترسی‌پذیری</h3>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={highContrast} 
              onChange={toggleHighContrast}
            />
            کنتراست بالا
          </label>
        </div>

        {/* بخش قفل و امنیت */}
        <div className="section">
          <h3>🔒 قفل تم</h3>
          <button 
            className={`lock-btn ${themeLocked ? 'locked' : ''}`}
            onClick={() => themeLocked ? unlockTheme() : lockTheme()}
          >
            {themeLocked ? '🔓 باز کردن قفل' : '🔒 قفل کردن تم فعلی'}
          </button>
          {themeLocked && (
            <p className="lock-info">
              ⚠️ تم قفل شده است. تغییرات اعمال نمی‌شوند.
            </p>
          )}
        </div>

        {/* بخش ابزارها */}
        <div className="section">
          <h3>🛠️ ابزارها</h3>
          <div className="tool-buttons">
            <button onClick={exportPreferences} className="tool-btn">
              📤 خروجی تنظیمات
            </button>
            
            <label className="tool-btn file-input-label">
              📥 ورودی تنظیمات
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
              />
            </label>
            
            <button onClick={resetToDefaults} className="tool-btn warning">
              🔄 بازنشانی
            </button>
          </div>
        </div>

        {/* اطلاعات فعلی */}
        <div className="info-bar">
          <span className="info-item">
            <strong>تم:</strong> {actualTheme === 'dark' ? '🌙 تاریک' : '☀️ روشن'}
          </span>
          <span className="info-item">
            <strong>جهت:</strong> {isRTL ? '🇮🇷 RTL' : '🇬🇧 LTR'}
          </span>
          <span className="info-item">
            <strong>طرح:</strong> {colorScheme}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;