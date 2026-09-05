// src/pages/admin/AdminDiffViewerPro.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import {
  FaTimes, FaHistory, FaArrowLeft, FaArrowRight,
  FaCode, FaExchangeAlt, FaPlus, FaMinus,
  FaUndo, FaCheck, FaTimes as FaX, FaFilter,
  FaSearch, FaDownload, FaUpload, FaCopy,
  FaChevronDown, FaChevronUp, FaExpand,
  FaCompress, FaEye, FaEyeSlash, FaPalette,
  FaFont, FaListUl, FaThLarge, FaBookmark,
  FaShare, FaPrint, FaFileExport, FaFileImport,
  FaComment, FaLock, FaUnlock, FaStar,
  FaRegStar, FaChevronLeft, FaChevronRight,
  FaStepBackward, FaStepForward, FaCodeBranch,
  FaMagic, FaSpellCheck, FaIndent, FaOutdent
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// ==================== Syntax Highlighting ====================
const syntaxHighlight = (code, language = 'javascript') => {
  // Simple syntax highlighting (in real app, use Prism.js or Shiki)
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw'];
  const types = ['string', 'number', 'boolean', 'void', 'null', 'undefined'];
  
  let highlighted = code
    // Strings
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span style="color: #a6e3a1">$&</span>')
    // Comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span style="color: #6c7086; font-style: italic">$&</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #fab387">$&</span>')
    // Keywords
    .replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span style="color: #cba6f7">$&</span>')
    // Function calls
    .replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span style="color: #89b4fa">$&</span>')
    // JSX tags
    .replace(/(<\/?)([\w]+)/g, '<span style="color: #f38ba8">$1</span><span style="color: #74c7ec">$2</span>')
    // Braces
    .replace(/[{}()[\]]/g, '<span style="color: #f9e2af">$&</span>');

  return highlighted;
};

// ==================== MiniMap Component ====================
const MiniMap = ({ content, scrollPosition, onScroll, width = 80 }) => {
  const lines = content.split('\n');
  const lineHeight = 16; // pixels per line in minimap
  const totalHeight = lines.length * lineHeight;
  const viewportHeight = Math.min(600, window.innerHeight * 0.4);
  const viewportTop = (scrollPosition / (totalHeight)) * viewportHeight;

  return (
    <div className="minimap" style={{ width, position: 'relative' }}>
      <div className="minimap-content" style={{ height: totalHeight }}>
        {lines.map((line, idx) => (
          <div 
            key={idx} 
            className="minimap-line"
            style={{ 
              height: lineHeight,
              background: line.trim() ? '#334155' : 'transparent',
              borderLeft: line.startsWith('+') ? '2px solid #10b981' : 
                         line.startsWith('-') ? '2px solid #ef4444' : 'none'
            }}
          />
        ))}
      </div>
      <div 
        className="minimap-viewport"
        style={{ 
          top: viewportTop,
          height: viewportHeight * 0.3,
          width: '100%'
        }}
        onClick={(e) => {
          const ratio = e.nativeEvent.offsetY / viewportHeight;
          onScroll(ratio * totalHeight);
        }}
      />
    </div>
  );
};

// ==================== Inline Comments ====================
const InlineComment = ({ comment, onResolve, onReply }) => {
  const [reply, setReply] = useState('');

  return (
    <motion.div 
      className={`inline-comment ${comment.resolved ? 'resolved' : ''}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{comment.timestamp}</span>
        <button onClick={() => onResolve(comment.id)}>
          {comment.resolved ? <FaCheck /> : <FaTimes />}
        </button>
      </div>
      <p className="comment-text">{comment.text}</p>
      
      {comment.replies?.map(r => (
        <div key={r.id} className="comment-reply">
          <strong>{r.author}: </strong>
          <span>{r.text}</span>
        </div>
      ))}
      
      <div className="reply-input">
        <input 
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder="پاسخ..."
          onKeyDown={e => {
            if (e.key === 'Enter' && reply.trim()) {
              onReply(comment.id, reply);
              setReply('');
            }
          }}
        />
      </div>
    </motion.div>
  );
};

// ==================== Main Component ====================
const AdminDiffViewerPro = ({ 
  onClose, 
  filePath = '/components/Dashboard.jsx',
  language = 'javascript',
  initialVersions = null 
}) => {
  // ============ State ============
  const [versions, setVersions] = useState(initialVersions || sampleVersions);
  const [selectedVersion1, setSelectedVersion1] = useState(versions[0]?.id);
  const [selectedVersion2, setSelectedVersion2] = useState(versions[1]?.id);
  const [diffMethod, setDiffMethod] = useState(DiffMethod.WORDS);
  const [showUnified, setShowUnified] = useState(false);
  const [filterLines, setFilterLines] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState(true);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [bookmarkedVersions, setBookmarkedVersions] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewMode, setViewMode] = useState('diff'); // diff, code1, code2, side-by-side-code
  const [activeTab, setActiveTab] = useState('diff'); // diff, history, comments, blame
  
  // ============ Refs ============
  const diffContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // ============ Computed ============
  const version1 = useMemo(() => 
    versions.find(v => v.id === selectedVersion1),
    [versions, selectedVersion1]
  );

  const version2 = useMemo(() => 
    versions.find(v => v.id === selectedVersion2),
    [versions, selectedVersion2]
  );

  // ============ Diff Stats ============
  const stats = useMemo(() => {
    if (!version1?.content || !version2?.content) return null;

    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');

    // Better diff calculation using LCS-like approach
    let added = 0, removed = 0, modified = 0, unchanged = 0;
    
    const lcs = computeLCS(lines1, lines2);
    
    added = lines2.length - lcs.length;
    removed = lines1.length - lcs.length;
    unchanged = lcs.length;
    modified = Math.min(added, removed);
    added -= modified;
    removed -= modified;

    const totalChanges = added + removed + modified;
    const changePercent = Math.round((totalChanges / Math.max(lines1.length, lines2.length)) * 100);

    return { 
      added, removed, modified, unchanged, 
      totalChanges, changePercent,
      linesInOld: lines1.length,
      linesInNew: lines2.length,
      addedPercent: Math.round((added / Math.max(lines2.length, 1)) * 100),
      removedPercent: Math.round((removed / Math.max(lines1.length, 1)) * 100)
    };
  }, [version1, version2]);

  // ============ LCS Algorithm ============
  const computeLCS = (arr1, arr2) => {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack
    const result = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  };

  // ============ Handlers ============
  const handleRevert = useCallback((versionId) => {
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return;

    if (!confirm(`آیا از بازگشت به ${targetVersion.version} مطمئن هستید؟\nاین عملیات یک نسخه جدید ایجاد می‌کند.`)) return;

    const newVersion = {
      id: `v${versions.length + 1}`,
      version: `نسخه ${versions.length + 1} (Revert)`,
      author: 'کاربر جاری',
      timestamp: new Date().toLocaleString('fa-IR'),
      message: `بازگشت به ${targetVersion.version}: ${targetVersion.message}`,
      content: targetVersion.content
    };

    setVersions(prev => [newVersion, ...prev]);
    setSelectedVersion1(newVersion.id);
    toast.success(`✅ به ${targetVersion.version} بازگشت داده شد`);
  }, [versions]);

  const handleSwapVersions = useCallback(() => {
    setSelectedVersion1(prev => {
      const temp = prev;
      setSelectedVersion2(selectedVersion1);
      return temp;
    });
  }, [selectedVersion1]);

  const handleAddComment = useCallback((lineNumber, text, side) => {
    const comment = {
      id: `comment-${Date.now()}`,
      lineNumber,
      side, // 'left' or 'right'
      text,
      author: 'کاربر جاری',
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      resolved: false,
      replies: []
    };
    setComments(prev => [...prev, comment]);
    toast.success('💬 نظر ثبت شد');
  }, []);

  const handleResolveComment = useCallback((commentId) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  }, []);

  const handleReplyToComment = useCallback((commentId, replyText) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), {
            id: `reply-${Date.now()}`,
            text: replyText,
            author: 'کاربر جاری',
            timestamp: new Date().toLocaleTimeString('fa-IR')
          }]
        };
      }
      return c;
    }));
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchQuery || !version1?.content || !version2?.content) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');

    lines1.forEach((line, idx) => {
      if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ side: 'left', lineNumber: idx + 1, content: line });
      }
    });

    lines2.forEach((line, idx) => {
      if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ side: 'right', lineNumber: idx + 1, content: line });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length === 0) {
      toast('هیچ نتیجه‌ای یافت نشد', { icon: '🔍' });
    }
  }, [searchQuery, version1, version2]);

  const handleExportDiff = useCallback((format = 'patch') => {
    if (!version1?.content || !version2?.content) return;

    let content;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (format) {
      case 'patch':
        content = generatePatch(version2.content, version1.content);
        downloadFile(content, `diff-${timestamp}.patch`, 'text/plain');
        break;
      case 'html':
        content = generateHTMLDiff(version2.content, version1.content, version2.version, version1.version);
        downloadFile(content, `diff-${timestamp}.html`, 'text/html');
        break;
      case 'json':
        content = JSON.stringify({
          oldVersion: version2,
          newVersion: version1,
          stats,
          timestamp: new Date().toISOString()
        }, null, 2);
        downloadFile(content, `diff-${timestamp}.json`, 'application/json');
        break;
    }

    toast.success(`📥 خروجی ${format.toUpperCase()} دانلود شد`);
  }, [version1, version2, stats]);

  const handleBookmark = useCallback((versionId) => {
    setBookmarkedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
        toast('🏷️ نشانه حذف شد');
      } else {
        newSet.add(versionId);
        toast('⭐ نشانه‌گذاری شد');
      }
      return newSet;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ============ Helper Functions ============
  const generatePatch = (oldContent, newContent) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    let patch = `--- a/file\n+++ b/file\n@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
    
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (i >= newLines.length) {
        patch += `-${oldLines[i]}\n`;
      } else if (i >= oldLines.length) {
        patch += `+${newLines[i]}\n`;
      } else if (oldLines[i] !== newLines[i]) {
        patch += `-${oldLines[i]}\n+${newLines[i]}\n`;
      } else {
        patch += ` ${oldLines[i]}\n`;
      }
    }
    
    return patch;
  };

  const generateHTMLDiff = (oldContent, newContent, oldTitle, newTitle) => {
    return `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Diff: ${oldTitle} → ${newTitle}</title>
  <style>
    body { background: #1e1e2e; color: #cdd6f4; font-family: monospace; padding: 20px; }
    .added { background: #10b98120; color: #10b981; }
    .removed { background: #ef444420; color: #ef4444; }
    .line { padding: 2px 10px; }
    .header { color: #94a3b8; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Diff Report</h2>
    <p>${oldTitle} → ${newTitle}</p>
    <p>Generated: ${new Date().toLocaleString('fa-IR')}</p>
  </div>
  <pre>${generatePatch(oldContent, newContent)}</pre>
</body>
</html>`;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============ Keyboard Shortcuts ============
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSwapVersions();
      }
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwapVersions, handleToggleFullscreen, onClose]);

  // ============ Themes ============
  const themes = {
    dark: {
      diffViewerBackground: '#1e1e2e',
      diffViewerColor: '#cdd6f4',
      addedBackground: '#10b98120',
      addedColor: '#10b981',
      removedBackground: '#ef444420',
      removedColor: '#ef4444',
      wordAddedBackground: '#10b98140',
      wordRemovedBackground: '#ef444440',
      addedGutterBackground: '#10b98130',
      removedGutterBackground: '#ef444430',
      gutterBackground: '#1e1e2e',
      gutterBackgroundDark: '#181825',
      highlightBackground: '#3b82f620',
      highlightGutterBackground: '#3b82f630'
    },
    light: {
      diffViewerBackground: '#ffffff',
      diffViewerColor: '#1a1a2e',
      addedBackground: '#d1fae5',
      addedColor: '#065f46',
      removedBackground: '#fee2e2',
      removedColor: '#991b1b',
      wordAddedBackground: '#a7f3d0',
      wordRemovedBackground: '#fecaca',
      addedGutterBackground: '#d1fae5',
      removedGutterBackground: '#fee2e2',
      gutterBackground: '#f8fafc',
      gutterBackgroundDark: '#f1f5f9',
      highlightBackground: '#dbeafe',
      highlightGutterBackground: '#bfdbfe'
    }
  };

  // ============ Render ============
  return (
    <motion.div 
      className={`admin-diff-viewer-pro ${isFullscreen ? 'fullscreen' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={diffContainerRef}
    >
      {/* ============ Header ============ */}
      <div className="diff-header">
        <div className="header-left">
          <FaCode className="title-icon" />
          <div>
            <h3>مقایسه تغییرات</h3>
            <span className="file-path">{filePath}</span>
          </div>
        </div>

        <div className="header-center">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'diff' ? 'active' : ''}
              onClick={() => setViewMode('diff')}
              title="نمای مقایسه"
            >
              <FaExchangeAlt /> مقایسه
            </button>
            <button 
              className={viewMode === 'code1' ? 'active' : ''}
              onClick={() => setViewMode('code1')}
              title="فقط نسخه جدید"
            >
              <FaEye /> نسخه جدید
            </button>
            <button 
              className={viewMode === 'code2' ? 'active' : ''}
              onClick={() => setViewMode('code2')}
              title="فقط نسخه قدیم"
            >
              <FaHistory /> نسخه قدیم
            </button>
          </div>

          <div className="separator" />

          {/* Diff Controls */}
          <button 
            className={`btn-icon ${showUnified ? '' : 'active'}`}
            onClick={() => setShowUnified(false)}
            title="Split View"
          >
            <FaThLarge />
          </button>
          <button 
            className={`btn-icon ${showUnified ? 'active' : ''}`}
            onClick={() => setShowUnified(true)}
            title="Unified View"
          >
            <FaListUl />
          </button>

          <select
            value={diffMethod}
            onChange={(e) => setDiffMethod(e.target.value)}
            className="diff-method-select"
          >
            <option value={DiffMethod.CHARS}>کاراکترها</option>
            <option value={DiffMethod.WORDS}>کلمات</option>
            <option value={DiffMethod.LINES}>خطوط</option>
            <option value={DiffMethod.SENTENCES}>جملات</option>
          </select>

          <button onClick={handleSwapVersions} title="جابجایی (Ctrl+S)">
            <FaExchangeAlt />
          </button>
        </div>

        <div className="header-right">
          {/* Theme Toggle */}
          <button 
            className="btn-icon"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          >
            <FaPalette />
          </button>

          {/* Font Size */}
          <div className="font-size-controls">
            <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))}>
              <FaFont size={10} />
            </button>
            <span>{fontSize}px</span>
            <button onClick={() => setFontSize(prev => Math.min(20, prev + 1))}>
              <FaFont size={14} />
            </button>
          </div>

          {/* Export */}
          <div className="export-dropdown">
            <button className="btn-export">
              <FaDownload /> Export
            </button>
            <div className="export-menu">
              <button onClick={() => handleExportDiff('patch')}>Patch (.patch)</button>
              <button onClick={() => handleExportDiff('html')}>HTML Report</button>
              <button onClick={() => handleExportDiff('json')}>JSON</button>
            </div>
          </div>

          <button onClick={handleToggleFullscreen}>
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* ============ Tabs ============ */}
      <div className="diff-tabs">
        <button 
          className={activeTab === 'diff' ? 'active' : ''}
          onClick={() => setActiveTab('diff')}
        >
          <FaExchangeAlt /> مقایسه
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> تاریخچه ({versions.length})
        </button>
        <button 
          className={activeTab === 'comments' ? 'active' : ''}
          onClick={() => setActiveTab('comments')}
        >
          <FaComment /> نظرات ({comments.length})
        </button>
      </div>

      {/* ============ Version Selectors ============ */}
      {activeTab === 'diff' && (
        <>
          <div className="version-selectors">
            <div className="version-selector left">
              <label>نسخه جدیدتر</label>
              <select value={selectedVersion1} onChange={e => setSelectedVersion1(e.target.value)}>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.version} - {v.message}
                  </option>
                ))}
              </select>
              {version1 && (
                <div className="version-meta">
                  <span className="version-author">{version1.author}</span>
                  <span className="version-time"><FaHistory size={10} /> {version1.timestamp}</span>
                </div>
              )}
            </div>

            <div className="version-arrow">
              <FaArrowLeft />
            </div>

            <div className="version-selector right">
              <label>نسخه قدیمی‌تر</label>
              <select value={selectedVersion2} onChange={e => setSelectedVersion2(e.target.value)}>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.version} - {v.message}
                  </option>
                ))}
              </select>
              {version2 && (
                <div className="version-meta">
                  <span className="version-author">{version2.author}</span>
                  <span className="version-time"><FaHistory size={10} /> {version2.timestamp}</span>
                </div>
              )}
            </div>
          </div>

          {/* ============ Diff Stats ============ */}
          {stats && (
            <div className="diff-stats-bar">
              <div className="stat-item added">
                <FaPlus size={12} />
                <span>{stats.added} اضافه</span>
                <small>({stats.addedPercent}%)</small>
              </div>
              <div className="stat-item removed">
                <FaMinus size={12} />
                <span>{stats.removed} حذف</span>
                <small>({stats.removedPercent}%)</small>
              </div>
              <div className="stat-item modified">
                <FaExchangeAlt size={12} />
                <span>{stats.modified} تغییر</span>
              </div>
              <div className="stat-item unchanged">
                <span>{stats.unchanged} بدون تغییر</span>
              </div>
              <div className="stat-item total">
                <span>{stats.linesInOld} → {stats.linesInNew} خط</span>
                <span className="change-percent">{stats.changePercent}% تغییر</span>
              </div>
            </div>
          )}

          {/* ============ Search Bar ============ */}
          <div className="search-bar">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در فایل... (Ctrl+F)"
            />
            <button onClick={handleSearch}><FaSearch /></button>
            {searchResults.length > 0 && (
              <div className="search-navigation">
                <button onClick={() => setCurrentSearchIndex(prev => Math.max(0, prev - 1))}>
                  <FaChevronUp />
                </button>
                <span>{currentSearchIndex + 1} / {searchResults.length}</span>
                <button onClick={() => setCurrentSearchIndex(prev => Math.min(searchResults.length - 1, prev + 1))}>
                  <FaChevronDown />
                </button>
              </div>
            )}
          </div>

          {/* ============ Actions ============ */}
          <div className="diff-actions-bar">
            <button className="btn-revert" onClick={() => handleRevert(selectedVersion2)}>
              <FaUndo /> بازگشت به نسخه قدیمی
            </button>
            <button className="btn-accept" onClick={() => toast.success('✅ تغییرات پذیرفته شد')}>
              <FaCheck /> پذیرش همه تغییرات
            </button>
            <button className="btn-reject" onClick={() => toast.error('❌ تغییرات رد شد')}>
              <FaX /> رد تغییرات
            </button>

            <div className="separator" />

            <button 
              className={`btn-icon ${wordWrap ? 'active' : ''}`}
              onClick={() => setWordWrap(!wordWrap)}
              title="Word Wrap"
            >
              <FaIndent />
            </button>
            <button 
              className={`btn-icon ${showWhitespace ? 'active' : ''}`}
              onClick={() => setShowWhitespace(!showWhitespace)}
              title="Show Whitespace"
            >
              <FaSpellCheck />
            </button>
            <button 
              className={`btn-icon ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(!showComments)}
              title="Show Comments"
            >
              <FaComment />
            </button>
          </div>

          {/* ============ Diff Content ============ */}
          <div className="diff-content-wrapper">
            {showMinimap && version1?.content && (
              <MiniMap 
                content={version1.content}
                scrollPosition={scrollPosition}
                onScroll={(pos) => {
                  setScrollPosition(pos);
                  diffContainerRef.current?.scrollTo({ top: pos, behavior: 'smooth' });
                }}
              />
            )}

            <div 
              className="diff-content"
              onScroll={(e) => setScrollPosition(e.target.scrollTop)}
            >
              {viewMode === 'diff' && version1?.content && version2?.content ? (
                <ReactDiffViewer
                  oldValue={version2.content}
                  newValue={version1.content}
                  splitView={!showUnified}
                  compareMethod={diffMethod}
                  leftTitle={`${version2.version} (${version2.author})`}
                  rightTitle={`${version1.version} (${version1.author})`}
                  hideLineNumbers={false}
                  showDiffOnly={filterLines !== 'all'}
                  useDarkTheme={theme === 'dark'}
                  styles={{
                    variables: themes[theme],
                    line: {
                      padding: '4px 10px',
                      fontSize: `${fontSize}px`,
                      fontFamily: "'Cascadia Code', 'Fira Code', Monaco, monospace",
                      direction: 'ltr',
                      wordBreak: wordWrap ? 'break-all' : 'normal',
                      whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
                    },
                    gutter: {
                      padding: '4px 10px',
                      minWidth: '40px',
                      fontSize: `${fontSize - 1}px`,
                      cursor: 'pointer'
                    },
                    content: {
                      cursor: 'text'
                    },
                    titleBlock: {
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }
                  }}
                  codeFoldMessageRenderer={(totalFoldedLines) => (
                    <div className="folded-lines">
                      <FaChevronDown size={10} /> {totalFoldedLines} خط پنهان — کلیک کنید
                    </div>
                  )}
                  renderContent={(source) => (
                    <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(source, language) }} />
                  )}
                  onLineNumberClick={(lineId, event) => {
                    setSelectedLine(lineId);
                    const comment = prompt('نظر خود را بنویسید:');
                    if (comment) {
                      const side = lineId.startsWith('L') ? 'left' : 'right';
                      handleAddComment(parseInt(lineId.slice(1)), comment, side);
                    }
                  }}
                />
              ) : viewMode === 'code1' && version1?.content ? (
                <pre className="single-code-view">
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(version1.content, language) }} />
                </pre>
              ) : viewMode === 'code2' && version2?.content ? (
                <pre className="single-code-view">
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(version2.content, language) }} />
                </pre>
              ) : (
                <div className="empty-state">
                  <FaCode size={48} />
                  <p>نسخه‌ای برای نمایش انتخاب نشده</p>
                </div>
              )}
            </div>

            {/* Comments Panel */}
            {showComments && comments.length > 0 && (
              <div className="comments-panel">
                <h4><FaComment /> نظرات خط‌به‌خط</h4>
                {comments.map(comment => (
                  <InlineComment
                    key={comment.id}
                    comment={comment}
                    onResolve={handleResolveComment}
                    onReply={handleReplyToComment}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ History Tab ============ */}
      {activeTab === 'history' && (
        <div className="version-timeline-full">
          <div className="timeline-header">
            <h4><FaHistory /> تاریخچه نسخه‌ها ({versions.length})</h4>
            <div className="timeline-filters">
              <input 
                type="text" 
                placeholder="فیلتر نسخه‌ها..." 
                className="timeline-search"
              />
              <button className="btn-icon" onClick={() => setBookmarkedVersions(new Set())}>
                <FaFilter />
              </button>
            </div>
          </div>

          <div className="timeline">
            {versions.map((version, idx) => (
              <motion.div
                key={version.id}
                className={`timeline-item ${
                  selectedVersion1 === version.id ? 'selected' : ''
                } ${selectedVersion2 === version.id ? 'compared' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="timeline-dot" style={{
                  background: idx === 0 ? '#10b981' : 
                             idx === versions.length - 1 ? '#64748b' : '#3b82f6'
                }} />
                
                <div className="timeline-content" onClick={() => {
                  setSelectedVersion1(version.id);
                  setActiveTab('diff');
                }}>
                  <div className="timeline-header">
                    <div className="timeline-version-info">
                      <strong>{version.version}</strong>
                      {bookmarkedVersions.has(version.id) && (
                        <FaStar className="bookmark-icon" />
                      )}
                      <span className={`version-badge ${idx === 0 ? 'latest' : ''}`}>
                        {idx === 0 ? 'آخرین' : idx === versions.length - 1 ? 'اولین' : ''}
                      </span>
                    </div>
                    <span className="timeline-author">{version.author}</span>
                  </div>
                  <p className="timeline-message">{version.message}</p>
                  <span className="timeline-time">
                    {version.timestamp}
                  </span>
                </div>

                <div className="timeline-actions">
                  <button
                    className="btn-bookmark"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(version.id);
                    }}
                  >
                    {bookmarkedVersions.has(version.id) ? <FaStar /> : <FaRegStar />}
                  </button>
                  <button
                    className="btn-compare"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVersion2(version.id);
                      setActiveTab('diff');
                    }}
                    title="انتخاب برای مقایسه"
                  >
                    <FaExchangeAlt />
                  </button>
                  <button
                    className="btn-revert-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevert(version.id);
                    }}
                    title="بازگشت"
                  >
                    <FaUndo />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Comments Tab ============ */}
      {activeTab === 'comments' && (
        <div className="comments-tab">
          <h4><FaComment /> نظرات ({comments.length})</h4>
          {comments.length === 0 ? (
            <div className="empty-state">
              <FaComment size={48} />
              <p>هیچ نظری ثبت نشده</p>
              <small>روی شماره خطوط کلیک کنید تا نظر ثبت کنید</small>
            </div>
          ) : (
            comments.map(comment => (
              <InlineComment
                key={comment.id}
                comment={comment}
                onResolve={handleResolveComment}
                onReply={handleReplyToComment}
              />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminDiffViewerPro;