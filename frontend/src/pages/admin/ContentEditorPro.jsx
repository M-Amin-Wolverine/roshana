// src/pages/admin/ContentEditorPro.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVersionControlPro } from '../../hooks/useVersionControlPro';
import { useAccessibilityPro } from '../../hooks/useAccessibilityPro';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'react-hot-toast';
import { 
  FaSave, FaUndo, FaRedo, FaHistory, FaCodeBranch, 
  FaTag, FaDownload, FaUpload, FaSearch, FaEye,
  FaEyeSlash, FaExpand, FaCompress, FaBold, FaItalic,
  FaHeading, FaListUl, FaImage, FaLink, FaTable,
  FaMarkdown, FaFileExport, FaFileImport, FaClock
} from 'react-icons/fa';
import { marked } from 'marked';

const ContentEditorPro = ({ initialContent = '', documentId = null, onSave }) => {
  // ============ Version Control ============
  const {
    allVersions, currentBranch, branches, autoSaveEnabled,
    createVersion, debouncedCreateVersion, revertToVersion,
    compareVersions, getLatestVersion, searchVersions,
    createBranch, switchBranch, addTag,
    exportVersions, toggleAutoSave, getStats
  } = useVersionControlPro({
    storageKey: `content_editor_${documentId || 'default'}`,
    maxVersions: 200,
    autoSave: true,
    autoSaveInterval: 15000,
    debounceMs: 1500,
    enableBranches: true
  });

  // ============ Accessibility ============
  const { settings, increaseFontSize, decreaseFontSize } = useAccessibilityPro();

  // ============ State ============
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [compareV1, setCompareV1] = useState(null);
  const [compareV2, setCompareV2] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(15);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);

  // ============ Effects ============
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [content]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    const timer = setInterval(() => {
      setAutoSaveCountdown(prev => prev <= 1 ? 15 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [autoSaveEnabled]);

  // ============ Hotkeys ============
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    handleSave();
  });
  useHotkeys('mod+shift+z', (e) => {
    e.preventDefault();
    handleRevertLast();
  });
  useHotkeys('mod+p', (e) => {
    e.preventDefault();
    setPreviewMode(!previewMode);
  });
  useHotkeys('mod+shift+f', (e) => {
    e.preventDefault();
    setIsFullscreen(!isFullscreen);
  });
  useHotkeys('mod+shift+h', (e) => {
    e.preventDefault();
    setShowHistory(!showHistory);
  });

  // ============ Handlers ============
  const handleContentChange = (newContent) => {
    setContent(newContent);
    debouncedCreateVersion(newContent, { message: 'تغییرات خودکار' });
  };

  const handleSave = () => {
    const message = prompt('توضیحات (اختیاری):') || 'ذخیره دستی';
    createVersion(content, { message });
    setLastSaved(new Date());
    toast.success('✅ ذخیره شد');
    onSave?.({ content, title });
  };

const handleRevertLast = () => {
  const latest = getLatestVersion();
  if (!latest) return;
  const result = revertToVersion(latest.id);
  if (result) {
    setContent(result.content);  // ✅ استفاده از result.content
  }
  toast.success('↩️ به آخرین نسخه برگشت');
};

  const handleExport = (format) => {
    if (format === 'json') {
      const data = { content, title, versions: exportVersions(allVersions.map(v => v.id)), stats: getStats() };
      downloadJSON(data, `content-${Date.now()}.json`);
    } else if (format === 'markdown') {
      downloadFile(content, `content-${Date.now()}.md`, 'text/markdown');
    } else if (format === 'html') {
      downloadFile(marked(content), `content-${Date.now()}.html`, 'text/html');
    }
    toast.success(`📥 Export به ${format.toUpperCase()} انجام شد`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setContent(event.target.result);
      createVersion(event.target.result, { message: 'import شده' });
      toast.success('📤 فایل import شد');
    };
    reader.readAsText(file);
  };

  // ============ Filtered Versions ============
  const filteredVersions = searchQuery ? searchVersions(searchQuery) : allVersions;
  const diff = compareV1 && compareV2 ? compareVersions(compareV1, compareV2) : null;
  const stats = getStats();

  // ============ Render ============
  return (
    <div className={`content-editor-pro ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* ============ Header ============ */}
      <div className="editor-header">
        <div className="header-left">
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="عنوان سند..." 
            className="title-input"
          />
          <span className="branch-badge">🌿 {currentBranch}</span>
        </div>
        
        <div className="header-right">
          {/* Auto-save indicator */}
          <div className="auto-save-indicator" title="ذخیره خودکار">
            <svg width="24" height="24" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#334155" strokeWidth="3" />
              <circle 
                cx="18" cy="18" r="15" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3"
                strokeDasharray={`${(autoSaveCountdown / 15) * 94.2} 94.2`}
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className="countdown">{autoSaveCountdown}</span>
          </div>
          
          <button onClick={handleSave} title="ذخیره (Ctrl+S)"><FaSave /></button>
          <button onClick={handleRevertLast} title="برگشت (Ctrl+Shift+Z)"><FaUndo /></button>
          <button onClick={() => setPreviewMode(!previewMode)} title="پیش‌نمایش (Ctrl+P)">
            {previewMode ? <FaEyeSlash /> : <FaEye />}
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} title="تمام‌صفحه (Ctrl+Shift+F)">
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button onClick={() => setShowHistory(!showHistory)} title="تاریخچه (Ctrl+Shift+H)"><FaHistory /></button>
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <div className="editor-toolbar">
        <select value={currentBranch} onChange={e => switchBranch(e.target.value)} className="branch-select">
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => createBranch(prompt('نام شاخه جدید:'))}><FaCodeBranch /> شاخه جدید</button>
        <button onClick={toggleAutoSave}>{autoSaveEnabled ? '⏸️' : '▶️'} ذخیره خودکار</button>
        
        <div className="toolbar-spacer" />
        
        <button onClick={() => handleExport('json')}><FaFileExport /> JSON</button>
        <button onClick={() => handleExport('markdown')}><FaMarkdown /> MD</button>
        <button onClick={() => handleExport('html')}><FaFileExport /> HTML</button>
        <label className="import-btn"><FaFileImport /> Import<input type="file" onChange={handleImport} hidden /></label>
      </div>

      {/* ============ Stats Bar ============ */}
      <div className="editor-stats">
        <span>{wordCount} کلمه</span>
        <span>{charCount} کاراکتر</span>
        <span>{stats?.totalVersions || 0} نسخه</span>
        <span>{branches.length} شاخه</span>
        {lastSaved && <span>آخرین ذخیره: {lastSaved.toLocaleTimeString('fa-IR')}</span>}
      </div>

      {/* ============ Main Content ============ */}
      <div className="editor-main">
        {/* Version History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              className="version-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              <div className="sidebar-header">
                <h4><FaHistory /> تاریخچه نسخه‌ها</h4>
                <input 
                  type="text" 
                  placeholder="🔍 جستجو..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setShowDiff(true)}>🔍 مقایسه</button>
              </div>
              
              <div className="version-list">
                {filteredVersions.slice(0, 50).map(v => (
                  <motion.div 
                    key={v.id} 
                    className="version-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="version-info">
                      <span className="version-number">v{v.version}</span>
                      <span className="version-message">{v.message || 'بدون توضیح'}</span>
                      <span className="version-time">
                        {new Date(v.timestamp).toLocaleString('fa-IR')}
                      </span>
                      {v.branch && <span className="version-branch">🌿 {v.branch}</span>}
                    </div>
                    <div className="version-actions">
                      <button onClick={() => { revertToVersion(v.id); setContent(v.data); }} title="بازگشت">
                        <FaUndo />
                      </button>
                      <button onClick={() => addTag(v.id, prompt('نام تگ:'))} title="تگ">
                        <FaTag />
                      </button>
                      <button onClick={() => { setCompareV1(v.id); setCompareV2(getLatestVersion()?.id); }} title="مقایسه">
                        🔍
                      </button>
                    </div>
                    {v.tags?.map(tag => (
                      <span key={tag} className="tag-badge">🏷️ {tag}</span>
                    ))}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor / Preview */}
        <div className="editor-content" style={{ fontSize: `${settings.fontSize}px` }}>
          <div className="editor-preview-toggle">
            <button onClick={() => setPreviewMode(false)} className={!previewMode ? 'active' : ''}>
              ✏️ ویرایش
            </button>
            <button onClick={() => setPreviewMode(true)} className={previewMode ? 'active' : ''}>
              <FaEye /> پیش‌نمایش
            </button>
          </div>
          
          {previewMode ? (
            <div 
              className="content-preview prose"
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          ) : (
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="شروع به نوشتن کنید... (Ctrl+S برای ذخیره)"
              className="content-textarea"
            />
          )}
        </div>
      </div>

      {/* ============ Diff Modal ============ */}
      <AnimatePresence>
        {showDiff && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDiff(false)}
          >
            <motion.div 
              className="diff-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>🔍 مقایسه نسخه‌ها</h3>
              <div className="diff-selectors">
                <select value={compareV1 || ''} onChange={e => setCompareV1(Number(e.target.value))}>
                  <option value="">نسخه ۱</option>
                  {allVersions.map(v => <option key={v.id} value={v.id}>v{v.version} - {v.message}</option>)}
                </select>
                <span>VS</span>
                <select value={compareV2 || ''} onChange={e => setCompareV2(Number(e.target.value))}>
                  <option value="">نسخه ۲</option>
                  {allVersions.map(v => <option key={v.id} value={v.id}>v{v.version} - {v.message}</option>)}
                </select>
              </div>
              
              {diff && (
                <div className="diff-content">
                  <div className="diff-pane">
                    <h4>نسخه {diff.version1?.version}</h4>
                    <pre>{diff.version1?.data}</pre>
                  </div>
                  <div className="diff-pane">
                    <h4>نسخه {diff.version2?.version}</h4>
                    <pre>{diff.version2?.data}</pre>
                  </div>
                </div>
              )}
              
              <button onClick={() => setShowDiff(false)}>بستن</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Functions
const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
};

export default ContentEditorPro;