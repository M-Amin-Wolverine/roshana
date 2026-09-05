// ============================================================
// src/pages/admin/AdminShortcuts.jsx - نسخه ULTIMATE
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWindows, FaApple, FaSearch, FaTimes, FaPrint, FaShare,
  FaGamepad, FaList, FaThLarge, FaEdit, FaCheck, FaUndo,
  FaTrophy, FaFire, FaStar, FaCopy, FaDownload, FaHistory,
  FaChevronDown, FaChevronUp, FaKeyboard, FaMousePointer
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

// ═══════════════════════════════════════════════════════════
// 🎯 ثابت‌ها و تنظیمات
// ═══════════════════════════════════════════════════════════
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';

const DEFAULT_SHORTCUTS = [
  {
    title: '🧭 ناوبری',
    icon: '🧭',
    shortcuts: [
      { id: 'nav-palette', keys: [`${modKey}K`, `${modKey}P`], description: 'باز کردن Command Palette', category: 'navigation' },
      { id: 'nav-tabs', keys: [`${modKey}1`, `${modKey}2`, `${modKey}3`, `${modKey}4`, `${modKey}5`, `${modKey}6`, `${modKey}7`, `${modKey}8`, `${modKey}9`], description: 'سوئیچ به تب ۱-۹', category: 'navigation' },
      { id: 'nav-back', keys: [`${modKey}[`, 'Alt ←'], description: 'صفحه قبلی', category: 'navigation' },
      { id: 'nav-forward', keys: [`${modKey}]`, 'Alt →'], description: 'صفحه بعدی', category: 'navigation' },
      { id: 'nav-home', keys: [`${modKey}H`], description: 'رفتن به داشبورد', category: 'navigation' },
      { id: 'nav-refresh', keys: [`${modKey}R`], description: 'رفرش صفحه', category: 'navigation' },
      { id: 'nav-escape', keys: ['Esc'], description: 'بستن پنجره‌ها/منوها/مودال‌ها', category: 'navigation' }
    ]
  },
  {
    title: '📑 مدیریت تب‌ها',
    icon: '📑',
    shortcuts: [
      { id: 'tab-new', keys: [`${modKey}T`], description: 'تب جدید', category: 'tabs' },
      { id: 'tab-close', keys: [`${modKey}W`], description: 'بستن تب فعلی', category: 'tabs' },
      { id: 'tab-reopen', keys: [`${modKey}⇧T`], description: 'باز کردن آخرین تب بسته شده', category: 'tabs' },
      { id: 'tab-next', keys: [`${modKey}Tab`, `${modKey}→`], description: 'تب بعدی', category: 'tabs' },
      { id: 'tab-prev', keys: [`${modKey}⇧Tab`, `${modKey}←`], description: 'تب قبلی', category: 'tabs' },
      { id: 'tab-pin', keys: [`${modKey}⇧P`], description: 'پین/برداشتن پین تب', category: 'tabs' },
      { id: 'tab-close-others', keys: [`${modKey}⇧W`], description: 'بستن سایر تب‌ها', category: 'tabs' },
      { id: 'tab-close-all', keys: [`${modKey}⇧⌥W`], description: 'بستن همه تب‌ها', category: 'tabs' }
    ]
  },
  {
    title: '🎨 ظاهر و نمایش',
    icon: '🎨',
    shortcuts: [
      { id: 'view-sidebar', keys: [`${modKey}B`], description: 'باز/بسته کردن سایدبار', category: 'appearance' },
      { id: 'view-theme', keys: [`${modKey}D`], description: 'تغییر تم (دارک/لایت)', category: 'appearance' },
      { id: 'view-fullscreen', keys: [`${modKey}⇧F`, 'F11'], description: 'حالت تمام‌صفحه', category: 'appearance' },
      { id: 'view-split', keys: [`${modKey}\\`], description: 'Split View', category: 'appearance' },
      { id: 'view-contrast', keys: [`${modKey}⇧H`], description: 'High Contrast Mode', category: 'appearance' },
      { id: 'view-direction', keys: [`${modKey}⇧L`], description: 'تغییر جهت (RTL/LTR)', category: 'appearance' },
      { id: 'view-zoom-in', keys: [`${modKey}+`, `${modKey}=`], description: 'بزرگ‌نمایی', category: 'appearance' },
      { id: 'view-zoom-out', keys: [`${modKey}-`], description: 'کوچک‌نمایی', category: 'appearance' },
      { id: 'view-zoom-reset', keys: [`${modKey}0`], description: 'بازنشانی بزرگ‌نمایی', category: 'appearance' }
    ]
  },
  {
    title: '✏️ ویرایش',
    icon: '✏️',
    shortcuts: [
      { id: 'edit-save', keys: [`${modKey}S`], description: 'ذخیره تغییرات', category: 'editing' },
      { id: 'edit-undo', keys: [`${modKey}Z`], description: 'برگشت (Undo)', category: 'editing' },
      { id: 'edit-redo', keys: [`${modKey}⇧Z`, `${modKey}Y`], description: 'بازگردانی (Redo)', category: 'editing' },
      { id: 'edit-find', keys: [`${modKey}F`], description: 'جستجو در صفحه', category: 'editing' },
      { id: 'edit-select-all', keys: [`${modKey}A`], description: 'انتخاب همه', category: 'editing' },
      { id: 'edit-deselect', keys: [`${modKey}⇧A`, 'Esc'], description: 'لغو انتخاب', category: 'editing' },
      { id: 'edit-delete', keys: ['Delete', `${modKey}⌫`], description: 'حذف آیتم انتخاب شده', category: 'editing' },
      { id: 'edit-copy', keys: [`${modKey}C`], description: 'کپی', category: 'editing' },
      { id: 'edit-cut', keys: [`${modKey}X`], description: 'برش', category: 'editing' },
      { id: 'edit-paste', keys: [`${modKey}V`], description: 'چسباندن', category: 'editing' },
      { id: 'edit-duplicate', keys: [`${modKey}⇧D`], description: 'کپی کردن آیتم', category: 'editing' }
    ]
  },
  {
    title: '🛠️ ابزارها',
    icon: '🛠️',
    shortcuts: [
      { id: 'tool-terminal', keys: ['`', `${modKey}\``], description: 'باز/بسته کردن ترمینال', category: 'tools' },
      { id: 'tool-files', keys: [`${modKey}⇧E`], description: 'مدیریت فایل', category: 'tools' },
      { id: 'tool-collab', keys: [`${modKey}⇧C`], description: 'پنل همکاری', category: 'tools' },
      { id: 'tool-new-user', keys: [`${modKey}⇧N`], description: 'ایجاد کاربر جدید', category: 'tools' },
      { id: 'tool-quick-report', keys: [`${modKey}⇧R`], description: 'گزارش سریع', category: 'tools' },
      { id: 'tool-backup', keys: [`${modKey}⇧B`], description: 'تهیه نسخه پشتیبان', category: 'tools' },
      { id: 'tool-settings', keys: [`${modKey},`], description: 'تنظیمات', category: 'tools' },
      { id: 'tool-logout', keys: [`${modKey}Q`], description: 'خروج از سیستم', category: 'tools' }
    ]
  },
  {
    title: '❓ راهنما و آموزش',
    icon: '❓',
    shortcuts: [
      { id: 'help-shortcuts', keys: [`${modKey}/`, '?'], description: 'نمایش این راهنما', category: 'help' },
      { id: 'help-tour', keys: [`${modKey}⇧/`], description: 'شروع تور آموزشی', category: 'help' },
      { id: 'help-docs', keys: ['F1'], description: 'مستندات آنلاین', category: 'help' },
      { id: 'help-support', keys: [`${modKey}⇧?`], description: 'ارتباط با پشتیبانی', category: 'help' }
    ]
  },
  {
    title: '🔍 جستجو و فیلتر',
    icon: '🔍',
    shortcuts: [
      { id: 'search-global', keys: [`${modKey}K`, `${modKey}P`], description: 'جستجوی سراسری', category: 'search' },
      { id: 'search-in-page', keys: [`${modKey}F`], description: 'جستجو در صفحه فعلی', category: 'search' },
      { id: 'search-next', keys: ['Enter', 'F3'], description: 'مورد بعدی', category: 'search' },
      { id: 'search-prev', keys: ['⇧Enter', '⇧F3'], description: 'مورد قبلی', category: 'search' },
      { id: 'search-filter', keys: [`${modKey}⇧F`], description: 'فیلتر پیشرفته', category: 'search' }
    ]
  }
];

// ═══════════════════════════════════════════════════════════
// 🎮 حالت تمرین (Practice Mode)
// ═══════════════════════════════════════════════════════════
const PracticeMode = ({ shortcuts, onClose, onScoreUpdate }) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    return parseInt(localStorage.getItem('shortcut-best-streak') || '0');
  });
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  
  const allShortcuts = shortcuts.flatMap(c => c.shortcuts);
  
  const generateChallenge = useCallback(() => {
    const available = allShortcuts.filter(s => {
      if (difficulty === 'easy') return s.keys.length <= 2;
      if (difficulty === 'normal') return true;
      return s.keys.length >= 3;
    });
    
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentChallenge(random);
    setShowHint(false);
    
    if (difficulty !== 'easy') {
      setTimeLeft(difficulty === 'hard' ? 15 : 30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [difficulty, allShortcuts]);
  
  const handleTimeout = () => {
    setStreak(0);
    setTotalAttempts(prev => prev + 1);
    toast.error('⏰ زمان تمام شد!', { duration: 1500 });
    setTimeout(generateChallenge, 1000);
  };
  
  const handleCorrect = () => {
    const newScore = score + (difficulty === 'hard' ? 20 : difficulty === 'easy' ? 5 : 10);
    const newStreak = streak + 1;
    
    setScore(newScore);
    setStreak(newStreak);
    setTotalAttempts(prev => prev + 1);
    setCorrectAttempts(prev => prev + 1);
    
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
      localStorage.setItem('shortcut-best-streak', newStreak.toString());
    }
    
    if (newStreak % 10 === 0) {
      toast.success(`🔥 رکورد! ${newStreak} تای متوالی!`, { icon: '🏆' });
    } else if (newStreak % 5 === 0) {
      toast.success(`⚡ ${newStreak} تای متوالی!`, { icon: '⭐' });
    }
    
    onScoreUpdate?.(newScore);
    
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(generateChallenge, 800);
  };
  
  const handleIncorrect = (pressed) => {
    setStreak(0);
    setTotalAttempts(prev => prev + 1);
    toast.error(`❌ اشتباه! "${pressed}"`, { duration: 2000 });
  };
  
  const handleKeyDown = useCallback((e) => {
    if (!currentChallenge) return;
    
    const pressedKeys = [];
    if (e.ctrlKey || e.metaKey) pressedKeys.push(modKey);
    if (e.shiftKey) pressedKeys.push('⇧');
    if (e.altKey) pressedKeys.push('Alt');
    
    const key = e.key === ' ' ? 'Space' : 
                e.key === 'ArrowUp' ? '↑' :
                e.key === 'ArrowDown' ? '↓' :
                e.key === 'ArrowLeft' ? '←' :
                e.key === 'ArrowRight' ? '→' :
                e.key === 'Backspace' ? '⌫' :
                e.key === 'Delete' ? 'Del' :
                e.key === 'Escape' ? 'Esc' :
                e.key === 'Enter' ? '↵' :
                e.key === 'Tab' ? 'Tab' :
                e.key === '`' ? '`' :
                e.key.length === 1 ? e.key.toUpperCase() : e.key;
    
    pressedKeys.push(key);
    const pressed = pressedKeys.join('');
    
    const expected = currentChallenge.keys[0].replace(/[+\s]/g, '');
    
    if (pressed === expected) {
      handleCorrect();
    } else {
      handleIncorrect(pressed);
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, [currentChallenge, handleCorrect, handleIncorrect]);
  
  useEffect(() => {
    generateChallenge();
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [generateChallenge, handleKeyDown]);
  
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  
  return (
    <motion.div 
      className="practice-mode"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="practice-header">
        <h3><FaGamepad /> حالت تمرین میانبرها</h3>
        <div className="practice-stats">
          <span className="stat"><FaStar /> {score}</span>
          <span className="stat"><FaFire /> {streak}</span>
          <span className="stat"><FaTrophy /> {bestStreak}</span>
          <span className="stat">🎯 {accuracy}%</span>
        </div>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
      </div>
      
      {currentChallenge && (
        <div className="practice-challenge">
          <div className="challenge-info">
            <span className="difficulty-badge" data-level={difficulty}>
              {difficulty === 'easy' ? 'آسان' : difficulty === 'normal' ? 'متوسط' : 'سخت'}
            </span>
            {difficulty !== 'easy' && (
              <span className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>
                ⏱️ {timeLeft}s
              </span>
            )}
          </div>
          
          <h4 className="challenge-action">{currentChallenge.description}</h4>
          
          {showHint ? (
            <div className="challenge-hint">
              <span>کلیدها:</span>
              {currentChallenge.keys.map((k, i) => (
                <kbd key={i}>{k}</kbd>
              ))}
            </div>
          ) : (
            <button className="hint-btn" onClick={() => setShowHint(true)}>
              💡 نمایش راهنمایی
            </button>
          )}
          
          <p className="press-hint">
            <FaKeyboard /> کلیدهای مربوطه را فشار دهید...
          </p>
        </div>
      )}
      
      <div className="practice-settings">
        <label>سختی:</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">آسان</option>
          <option value="normal">متوسط</option>
          <option value="hard">سخت</option>
        </select>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 کامپوننت اصلی
// ═══════════════════════════════════════════════════════════
const AdminShortcuts = ({ onClose, isOpen = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    return localStorage.getItem('shortcuts-compact') === 'true';
  });
  const [customShortcuts, setCustomShortcuts] = useState(() => {
    const saved = localStorage.getItem('custom-shortcuts');
    return saved ? JSON.parse(saved) : {};
  });
  const [editingId, setEditingId] = useState(null);
  const [usageStats, setUsageStats] = useState(() => {
    const saved = localStorage.getItem('shortcut-usage-stats');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState(
    DEFAULT_SHORTCUTS.map(c => c.title)
  );
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // ═══════════════════════════════════════════════════════════
  // جستجو و فیلتر
  // ═══════════════════════════════════════════════════════════
  const filteredCategories = DEFAULT_SHORTCUTS.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(s => {
      const matchSearch = !searchQuery || 
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = activeTab === 'all' || category.title === activeTab;
      
      return matchSearch && matchCategory;
    })
  })).filter(c => c.shortcuts.length > 0);
  
  const totalFiltered = filteredCategories.reduce((acc, c) => acc + c.shortcuts.length, 0);
  
  // ═══════════════════════════════════════════════════════════
  // مدیریت شخصی‌سازی
  // ═══════════════════════════════════════════════════════════
  const handleStartEditing = (shortcutId) => {
    setEditingId(shortcutId);
    
    toast('⌨️ کلیدهای جدید را فشار دهید...', {
      icon: '🎹',
      duration: 5000
    });
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push(modKey);
      if (e.shiftKey) keys.push('⇧');
      if (e.altKey) keys.push('Alt');
      
      const key = e.key === ' ' ? 'Space' : 
                  e.key.length === 1 ? e.key.toUpperCase() : 
                  e.key === 'Backspace' ? '⌫' : e.key;
      
      keys.push(key);
      const newShortcut = keys.join('+');
      
      setCustomShortcuts(prev => {
        const updated = { ...prev, [shortcutId]: newShortcut };
        localStorage.setItem('custom-shortcuts', JSON.stringify(updated));
        return updated;
      });
      
      setEditingId(null);
      toast.success(`✅ میانبر به "${newShortcut}" تغییر یافت`);
      
      document.removeEventListener('keydown', handleKeyDown);
    };
    
    document.addEventListener('keydown', handleKeyDown, { once: false });
    
    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
      if (editingId === shortcutId) {
        setEditingId(null);
        toast.error('⏰ زمان ثبت میانبر تمام شد');
      }
    }, 5000);
  };
  
  const handleResetShortcut = (shortcutId) => {
    Swal.fire({
      title: 'بازنشانی میانبر؟',
      text: 'میانبر به حالت پیش‌فرض برمی‌گردد',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'بله',
      cancelButtonText: 'انصراف'
    }).then((result) => {
      if (result.isConfirmed) {
        setCustomShortcuts(prev => {
          const updated = { ...prev };
          delete updated[shortcutId];
          localStorage.setItem('custom-shortcuts', JSON.stringify(updated));
          return updated;
        });
        toast.success('🔄 میانبر بازنشانی شد');
      }
    });
  };
  
  const handleResetAll = () => {
    Swal.fire({
      title: '⚠️ بازنشانی همه میانبرها؟',
      text: 'تمام میانبرهای شخصی‌سازی شده به حالت پیش‌فرض برمی‌گردند',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'بله، بازنشانی کن',
      cancelButtonText: 'انصراف'
    }).then((result) => {
      if (result.isConfirmed) {
        setCustomShortcuts({});
        localStorage.removeItem('custom-shortcuts');
        toast.success('🔄 همه میانبرها بازنشانی شدند');
      }
    });
  };
  
  // ═══════════════════════════════════════════════════════════
  // ردیابی استفاده
  // ═══════════════════════════════════════════════════════════
  const trackUsage = (shortcutId) => {
    setUsageStats(prev => {
      const updated = { ...prev, [shortcutId]: (prev[shortcutId] || 0) + 1 };
      localStorage.setItem('shortcut-usage-stats', JSON.stringify(updated));
      return updated;
    });
  };
  
  const mostUsed = Object.entries(usageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  // ═══════════════════════════════════════════════════════════
  // Export/Import/Print
  // ═══════════════════════════════════════════════════════════
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    const content = filteredCategories.map(category => `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          ${category.icon} ${category.title}
        </h3>
        <table style="width: 100%; border-collapse: collapse; direction: rtl;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #ddd;">میانبر</th>
              <th style="padding: 10px; border: 1px solid #ddd;">عملکرد</th>
            </tr>
          </thead>
          <tbody>
            ${category.shortcuts.map(s => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <kbd style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; margin: 2px;">
                    ${s.keys.join('</kbd> <span>یا</span> <kbd style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; margin: 2px;">')}
                  </kbd>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">${s.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>میانبرهای کیبورد - فرتاک</title>
          <style>
            body { font-family: Vazirmatn, sans-serif; padding: 30px; color: #1f2937; }
            h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <h1>🎹 میانبرهای کیبورد - پنل مدیریت فرتاک</h1>
          <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
            تاریخ چاپ: ${new Date().toLocaleString('fa-IR')} | ${isMac ? 'Mac' : 'Windows/Linux'}
          </p>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };
  
  const handleCopyAll = async () => {
    const text = filteredCategories.map(c => 
      `${c.icon} ${c.title}:\n${c.shortcuts.map(s => `  ${s.keys.join(' / ')} → ${s.description}`).join('\n')}`
    ).join('\n\n');
    
    await navigator.clipboard.writeText(text);
    toast.success('📋 همه میانبرها در کلیپبورد کپی شدند');
  };
  
  const handleExport = () => {
    const data = {
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      platform: isMac ? 'mac' : 'windows',
      customShortcuts,
      usageStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortcuts-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('💾 پشتیبان میانبرها ذخیره شد');
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const text = await file.text();
      
      try {
        const data = JSON.parse(text);
        
        Swal.fire({
          title: '📥 بازیابی میانبرها',
          text: `بازیابی از ${new Date(data.exportedAt).toLocaleString('fa-IR')}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'بازیابی',
          cancelButtonText: 'انصراف'
        }).then((result) => {
          if (result.isConfirmed) {
            if (data.customShortcuts) {
              setCustomShortcuts(data.customShortcuts);
              localStorage.setItem('custom-shortcuts', JSON.stringify(data.customShortcuts));
            }
            toast.success('✅ میانبرها بازیابی شدند');
          }
        });
      } catch {
        toast.error('❌ فایل نامعتبر است');
      }
    };
    
    input.click();
  };
  
  // ═══════════════════════════════════════════════════════════
  // مدیریت حالت‌ها
  // ═══════════════════════════════════════════════════════════
  const toggleCompact = () => {
    setIsCompact(prev => {
      const newValue = !prev;
      localStorage.setItem('shortcuts-compact', newValue);
      return newValue;
    });
  };
  
  const toggleCategory = (title) => {
    setExpandedCategories(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };
  
  const getShortcutKeys = (shortcut) => {
    return customShortcuts[shortcut.id] || shortcut.keys[0];
  };
  
  // ═══════════════════════════════════════════════════════════
  // رندر
  // ═══════════════════════════════════════════════════════════
  if (!isOpen) return null;
  
  return (
    <motion.div 
      className="shortcuts-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div 
        className="shortcuts-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════════════════════════════════════════════════ */}
        {/* هدر */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="shortcuts-header">
          <div className="header-left">
            <h2>
              <span className="os-icon">{isMac ? <FaApple /> : <FaWindows />}</span>
              میانبرهای کیبورد
            </h2>
            <span className="platform-badge">
              {isMac ? 'Mac' : 'Windows/Linux'} • {DEFAULT_SHORTCUTS.flatMap(c => c.shortcuts).length} میانبر
            </span>
          </div>
          
          <div className="header-right">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="جستجوی میانبر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  <FaTimes />
                </button>
              )}
            </div>
            
            {searchQuery && (
              <span className="search-count">{totalFiltered} میانبر یافت شد</span>
            )}
            
            <button 
              className={`icon-btn ${practiceMode ? 'active' : ''}`}
              onClick={() => setPracticeMode(!practiceMode)}
              title="حالت تمرین"
            >
              <FaGamepad />
            </button>
            
            <button 
              className={`icon-btn ${isCompact ? 'active' : ''}`}
              onClick={toggleCompact}
              title={isCompact ? 'نمای دسته‌بندی' : 'نمای فشرده'}
            >
              {isCompact ? <FaThLarge /> : <FaList />}
            </button>
            
            <button className="icon-btn" onClick={handlePrint} title="چاپ">
              <FaPrint />
            </button>
            
            <button className="icon-btn" onClick={handleCopyAll} title="کپی همه">
              <FaCopy />
            </button>
            
            <button className="icon-btn" onClick={handleExport} title="خروجی">
              <FaDownload />
            </button>
            
            <button className="icon-btn" onClick={handleImport} title="ورودی">
              <FaDownload style={{ transform: 'rotate(180deg)' }} />
            </button>
            
            <button className="icon-btn" onClick={() => setShowUsageStats(!showUsageStats)} title="آمار">
              <FaHistory />
            </button>
            
            <button className="icon-btn danger" onClick={handleResetAll} title="بازنشانی همه">
              <FaUndo />
            </button>
            
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* تب‌های دسته‌بندی */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!isCompact && (
          <div className="category-tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              همه
            </button>
            {DEFAULT_SHORTCUTS.map(cat => (
              <button
                key={cat.title}
                className={`tab ${activeTab === cat.title ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.title)}
              >
                {cat.icon} {cat.title.replace(/[^\u0600-\u06FF\s]/g, '').trim()}
              </button>
            ))}
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* حالت تمرین */}
        {/* ═══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {practiceMode && (
            <PracticeMode 
              shortcuts={filteredCategories} 
              onClose={() => setPracticeMode(false)}
              onScoreUpdate={(score) => {
                if (score >= 100) {
                  toast.success('🏆 آفرین! به ۱۰۰ امتیاز رسیدی!', { icon: '👑' });
                }
              }}
            />
          )}
        </AnimatePresence>
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* محتوای اصلی */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!practiceMode && (
          <>
            {isCompact ? (
              /* ─── نمای فشرده (جدولی) ─── */
              <div className="shortcuts-compact">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>میانبر</th>
                      <th>عملکرد</th>
                      <th>دسته</th>
                      <th>استفاده</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.flatMap(cat => 
                      cat.shortcuts.map((s, i) => (
                        <tr key={s.id}>
                          <td>{i + 1}</td>
                          <td>
                            <kbd>{getShortcutKeys(s)}</kbd>
                            {s.keys.length > 1 && (
                              <span className="alt-keys">
                                ({s.keys.slice(1).join(', ')})
                              </span>
                            )}
                          </td>
                          <td>{s.description}</td>
                          <td>
                            <span className="category-badge">{cat.title}</span>
                          </td>
                          <td>
                            {usageStats[s.id] ? (
                              <span className="usage-count">{usageStats[s.id]}x</span>
                            ) : (
                              <span className="no-usage">-</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className={`edit-btn ${editingId === s.id ? 'recording' : ''}`}
                              onClick={() => handleStartEditing(s.id)}
                            >
                              {editingId === s.id ? '🎹' : '✏️'}
                            </button>
                            {customShortcuts[s.id] && (
                              <button 
                                className="reset-btn"
                                onClick={() => handleResetShortcut(s.id)}
                              >
                                ↩️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ─── نمای دسته‌بندی شده ─── */
              <div className="shortcuts-categories">
                {filteredCategories.map((category, idx) => (
                  <motion.div 
                    key={category.title}
                    className={`shortcut-category ${expandedCategories.includes(category.title) ? 'expanded' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div 
                      className="category-header"
                      onClick={() => toggleCategory(category.title)}
                    >
                      <h3>
                        <span>{category.icon}</span>
                        {category.title}
                        <span className="shortcut-count">{category.shortcuts.length}</span>
                      </h3>
                      <button className="expand-btn">
                        {expandedCategories.includes(category.title) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {expandedCategories.includes(category.title) && (
                        <motion.div
                          className="shortcut-list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {category.shortcuts.map((shortcut) => (
                            <div key={shortcut.id} className="shortcut-item">
                              <div className="shortcut-info">
                                <span className="shortcut-description">{shortcut.description}</span>
                                {usageStats[shortcut.id] > 5 && (
                                  <span className="popular-badge" title="پراستفاده">
                                    ⭐
                                  </span>
                                )}
                              </div>
                              
                              <div className="shortcut-actions">
                                <div className="shortcut-keys">
                                  <kbd className={customShortcuts[shortcut.id] ? 'custom' : ''}>
                                    {getShortcutKeys(shortcut)}
                                  </kbd>
                                  {shortcut.keys.length > 1 && (
                                    <span className="alt-keys" title="کلیدهای جایگزین">
                                      +{shortcut.keys.length - 1}
                                    </span>
                                  )}
                                </div>
                                
                                <button 
                                  className={`edit-btn ${editingId === shortcut.id ? 'recording' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditing(shortcut.id);
                                  }}
                                  title="شخصی‌سازی"
                                >
                                  {editingId === shortcut.id ? '🎹' : '✏️'}
                                </button>
                                
                                {customShortcuts[shortcut.id] && (
                                  <button 
                                    className="reset-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResetShortcut(shortcut.id);
                                    }}
                                    title="بازنشانی"
                                  >
                                    ↩️
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* آمار استفاده */}
        {/* ═══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showUsageStats && mostUsed.length > 0 && (
            <motion.div
              className="usage-stats-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h4>🏆 پراستفاده‌ترین میانبرها</h4>
              <div className="usage-list">
                {mostUsed.map(([id, count]) => {
                  const shortcut = DEFAULT_SHORTCUTS.flatMap(c => c.shortcuts).find(s => s.id === id);
                  return shortcut ? (
                    <div key={id} className="usage-item">
                      <span className="usage-name">{shortcut.description}</span>
                      <div className="usage-bar-container">
                        <div 
                          className="usage-bar" 
                          style={{ width: `${(count / mostUsed[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="usage-count">{count}x</span>
                    </div>
                  ) : null;
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* پانوشت */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="shortcuts-footer">
          <div className="footer-info">
            <span>
              💡 {customShortcuts && Object.keys(customShortcuts).length > 0 
                ? `${Object.keys(customShortcuts).length} میانبر شخصی‌سازی شده` 
                : 'میانبرها در حالت پیش‌فرض هستند'}
            </span>
            <span>|</span>
            <span>⌨️ {totalFiltered} میانبر</span>
            <span>|</span>
            <span>
              {isMac ? <FaApple /> : <FaWindows />} {isMac ? 'Mac' : 'Windows'}
            </span>
          </div>
          <p className="footer-hint">
            💡 برای شخصی‌سازی، روی آیکون ✏️ کلیک کنید و کلیدهای جدید را فشار دهید
          </p>
        </div>
      </motion.div>
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* استایل‌های داخلی */}
      {/* ═══════════════════════════════════════════════════════ */}
      <style>{`
        .shortcuts-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .shortcuts-modal {
          background: var(--bg-primary, #1e293b);
          border-radius: 20px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          direction: rtl;
        }
        
        .shortcuts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 25px;
          border-bottom: 1px solid var(--border-color, #334155);
          position: sticky;
          top: 0;
          background: var(--bg-primary, #1e293b);
          z-index: 10;
          border-radius: 20px 20px 0 0;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .header-left h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 5px;
          font-size: 1.5rem;
        }
        
        .os-icon {
          font-size: 1.5rem;
        }
        
        .platform-badge {
          font-size: 0.8rem;
          color: #6b7280;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          background: var(--bg-secondary, #0f172a);
          border: 1px solid var(--border-color, #334155);
          border-radius: 10px;
          padding: 8px 12px;
          gap: 8px;
        }
        
        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary, #f1f5f9);
          font-family: Vazirmatn, sans-serif;
          width: 200px;
        }
        
        .search-count {
          font-size: 0.8rem;
          color: #6b7280;
          white-space: nowrap;
        }
        
        .icon-btn {
          background: var(--bg-secondary, #0f172a);
          border: 1px solid var(--border-color, #334155);
          color: var(--text-primary, #f1f5f9);
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9rem;
        }
        
        .icon-btn:hover { background: var(--border-color, #475569); }
        .icon-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
        .icon-btn.danger:hover { background: #ef4444; border-color: #ef4444; color: white; }
        
        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 5px;
        }
        .close-btn:hover { color: #ef4444; }
        
        .category-tabs {
          display: flex;
          gap: 5px;
          padding: 15px 25px;
          overflow-x: auto;
          border-bottom: 1px solid var(--border-color, #334155);
        }
        
        .category-tabs .tab {
          padding: 8px 16px;
          border: none;
          background: var(--bg-secondary, #0f172a);
          color: #9ca3af;
          border-radius: 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          font-family: Vazirmatn, sans-serif;
          font-size: 0.85rem;
        }
        
        .category-tabs .tab.active {
          background: #3b82f6;
          color: white;
        }
        
        .shortcuts-categories {
          padding: 20px 25px;
        }
        
        .shortcut-category {
          margin-bottom: 15px;
          border: 1px solid var(--border-color, #334155);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          cursor: pointer;
          background: var(--bg-secondary, #0f172a);
          transition: background 0.2s;
        }
        
        .category-header:hover { background: var(--border-color, #475569); }
        
        .category-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
        }
        
        .shortcut-count {
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
          margin-right: 8px;
        }
        
        .shortcut-list {
          padding: 0 20px;
        }
        
        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #334155);
        }
        
        .shortcut-item:last-child { border-bottom: none; }
        
        .shortcut-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .popular-badge {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .shortcut-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        kbd {
          background: #334155;
          color: #f1f5f9;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'Cascadia Code', monospace;
          font-size: 0.85rem;
          border: 1px solid #475569;
        }
        
        kbd.custom {
          background: #3b82f620;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        
        .alt-keys {
          font-size: 0.7rem;
          color: #6b7280;
          margin-right: 5px;
        }
        
        .edit-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 2px 5px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .edit-btn:hover { background: #334155; }
        .edit-btn.recording {
          animation: pulse 0.5s infinite;
          background: #ef444420;
        }
        
        .reset-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px 5px;
        }
        .reset-btn:hover { background: #334155; border-radius: 4px; }
        
        .shortcuts-compact {
          padding: 20px;
          overflow-x: auto;
        }
        
        .shortcuts-compact table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .shortcuts-compact th {
          background: var(--bg-secondary, #0f172a);
          padding: 12px;
          text-align: right;
          border-bottom: 2px solid var(--border-color, #334155);
          position: sticky;
          top: 0;
        }
        
        .shortcuts-compact td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color, #334155);
        }
        
        .category-badge {
          background: #3b82f620;
          color: #3b82f6;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
        }
        
        .usage-count {
          color: #10b981;
          font-weight: 600;
        }
        
        .no-usage { color: #6b7280; }
        
        .usage-stats-panel {
          margin: 0 25px 20px;
          padding: 20px;
          background: var(--bg-secondary, #0f172a);
          border-radius: 12px;
          border: 1px solid var(--border-color, #334155);
        }
        
        .usage-stats-panel h4 {
          margin: 0 0 15px;
        }
        
        .usage-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .usage-name {
          min-width: 150px;
          font-size: 0.9rem;
        }
        
        .usage-bar-container {
          flex: 1;
          height: 8px;
          background: #334155;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .usage-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .shortcuts-footer {
          padding: 15px 25px;
          border-top: 1px solid var(--border-color, #334155);
          text-align: center;
        }
        
        .footer-info {
          display: flex;
          justify-content: center;
          gap: 15px;
          color: #6b7280;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }
        
        .footer-hint {
          color: #6b7280;
          font-size: 0.8rem;
          margin: 0;
        }
        
        /* Practice Mode */
        .practice-mode {
          background: var(--bg-secondary, #0f172a);
          margin: 0 25px 20px;
          border-radius: 16px;
          padding: 25px;
          border: 2px solid #3b82f6;
        }
        
        .practice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .practice-stats {
          display: flex;
          gap: 15px;
        }
        
        .practice-stats .stat {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .practice-challenge {
          text-align: center;
          padding: 30px;
        }
        
        .challenge-info {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .difficulty-badge[data-level="easy"] { background: #10b98120; color: #10b981; }
        .difficulty-badge[data-level="normal"] { background: #f59e0b20; color: #f59e0b; }
        .difficulty-badge[data-level="hard"] { background: #ef444420; color: #ef4444; }
        
        .timer {
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .timer.warning { color: #ef4444; animation: pulse 1s infinite; }
        
        .challenge-action {
          font-size: 1.3rem;
          margin: 15px 0;
        }
        
        .challenge-hint {
          margin: 15px 0;
        }
        
        .challenge-hint kbd {
          margin: 0 5px;
          font-size: 1.1rem;
          padding: 6px 14px;
        }
        
        .hint-btn {
          background: none;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          padding: 8px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-family: Vazirmatn, sans-serif;
        }
        
        .press-hint {
          color: #6b7280;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .practice-settings {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .practice-settings select {
          background: #334155;
          color: #f1f5f9;
          border: 1px solid #475569;
          padding: 8px 12px;
          border-radius: 8px;
          font-family: Vazirmatn, sans-serif;
        }
        
        @media (max-width: 768px) {
          .shortcuts-modal { max-width: 100%; border-radius: 12px; }
          .shortcuts-header { padding: 15px; }
          .header-right { flex-wrap: wrap; }
          .search-box input { width: 120px; }
          .shortcut-item { flex-direction: column; align-items: flex-start; gap: 10px; }
          .practice-header { flex-direction: column; gap: 10px; }
        }
      `}</style>
    </motion.div>
  );
};

export default AdminShortcuts;
export { DEFAULT_SHORTCUTS, isMac, modKey };