// src/pages/admin/AdminFileManager.jsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  FaFolder, FaFile, FaImage, FaVideo, FaMusic, FaArchive,
  FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint,
  FaFileCode, FaTimes, FaUpload, FaDownload, FaTrash,
  FaEdit, FaCopy, FaCut, FaPaste, FaSearch, FaPlus,
  FaHome, FaArrowLeft, FaArrowRight, FaSync,
  FaList, FaTh, FaThLarge, FaSort, FaFilter,
  FaCloudUploadAlt, FaFolderPlus, FaFileAlt,
  FaRegFolder, FaRegFile, FaCheckSquare, FaUndo,
  FaRedo, FaCompress, FaExpand, FaEye, FaLock,
  FaShare, FaStar, FaHistory, FaTags, FaChevronRight,
  FaChevronDown, FaNetworkWired, FaDatabase, FaTerminal,
  FaCode, FaMarkdown, FaPalette, FaEllipsisV, FaGripVertical,
  FaColumns, FaCalendarAlt, FaClipboardList, FaLayerGroup,
  FaPlay, FaPause, FaStop, FaMicrochip, FaCloud
} from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';

// ==================== Types & Interfaces ====================
const FILE_ACTIONS = {
  CREATE: 'create',
  DELETE: 'delete',
  RENAME: 'rename',
  MOVE: 'move',
  COPY: 'copy',
  EDIT: 'edit',
  SHARE: 'share',
  COMPRESS: 'compress',
  EXTRACT: 'extract',
  PREVIEW: 'preview',
  LOCK: 'lock',
  TAG: 'tag',
  STAR: 'star',
  CHMOD: 'chmod'
};

const SORT_OPTIONS = {
  NAME: 'name',
  SIZE: 'size',
  TYPE: 'type',
  MODIFIED: 'modified',
  CREATED: 'created',
  ACCESSED: 'accessed',
  STARRED: 'starred',
  TAGS: 'tags'
};

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  DETAIL: 'detail',
  COLUMNS: 'columns',
  GALLERY: 'gallery'
};

// ==================== File Preview Components ====================
const FilePreview = ({ file, onClose }) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  const previewContent = useMemo(() => {
    // Image Preview
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return (
        <div className="preview-image-container">
          <img 
            src={file.preview || file.url} 
            alt={file.name}
            className="preview-image"
          />
          <div className="preview-toolbar">
            <button><FaExpand /> بزرگنمایی</button>
            <button><FaCompress /> کوچکنمایی</button>
            <button><FaDownload /> دانلود</button>
            <button><FaEdit /> ویرایش</button>
          </div>
        </div>
      );
    }
    
    // Video Preview
    if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) {
      return (
        <div className="preview-video-container">
          <video controls autoPlay className="preview-video">
            <source src={file.url} type={`video/${ext}`} />
          </video>
        </div>
      );
    }
    
    // Audio Preview
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return (
        <div className="preview-audio-container">
          <div className="audio-visualizer">
            {/* Audio visualizer bars */}
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className="audio-bar"
                animate={{ height: [10, Math.random() * 100 + 10, 10] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
              />
            ))}
          </div>
          <audio controls autoPlay className="preview-audio">
            <source src={file.url} type={`audio/${ext}`} />
          </audio>
        </div>
      );
    }
    
    // Code Preview
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'css', 'html', 'json', 'xml', 'md'].includes(ext)) {
      return (
        <div className="preview-code-container">
          <div className="code-toolbar">
            <span>{file.name}</span>
            <div>
              <button><FaCopy /> کپی</button>
              <button><FaCode /> ویرایش</button>
              <button><FaDownload /> دانلود</button>
            </div>
          </div>
          <pre className="code-preview">
            <code>{file.content || '// Preview not available'}</code>
          </pre>
        </div>
      );
    }
    
    // PDF Preview
    if (ext === 'pdf') {
      return (
        <div className="preview-pdf-container">
          <iframe 
            src={file.url} 
            className="pdf-viewer"
            title={file.name}
          />
        </div>
      );
    }
    
    // Markdown Preview
    if (ext === 'md') {
      return (
        <div className="preview-markdown-container">
          <div className="markdown-preview" 
            dangerouslySetInnerHTML={{ __html: marked(file.content || '') }} 
          />
        </div>
      );
    }
    
    // Default/Text Preview
    return (
      <div className="preview-default">
        <FaFile size={128} />
        <h3>{file.name}</h3>
        <p>پیش‌نمایش برای این نوع فایل در دسترس نیست</p>
        <div className="file-details">
          <span>حجم: {formatFileSize(file.size)}</span>
          <span>نوع: {ext?.toUpperCase() || 'نامشخص'}</span>
          <span>تاریخ: {formatDate(file.modified)}</span>
        </div>
      </div>
    );
  }, [file, ext]);
  
  return (
    <motion.div 
      className="file-preview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="file-preview-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="preview-close" onClick={onClose}>
          <FaTimes />
        </button>
        {previewContent}
      </motion.div>
    </motion.div>
  );
};

// ==================== Compression Dialog ====================
const CompressionDialog = ({ files, onCompress, onClose }) => {
  const [format, setFormat] = useState('zip');
  const [compressionLevel, setCompressionLevel] = useState('normal');
  const [password, setPassword] = useState('');
  const [splitSize, setSplitSize] = useState(0); // 0 = no split
  
  return (
    <motion.div 
      className="dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="dialog-content"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3><FaCompress /> فشرده‌سازی فایل‌ها</h3>
        <p>{files.length} فایل انتخاب شده</p>
        
        <div className="dialog-field">
          <label>فرمت:</label>
          <select value={format} onChange={e => setFormat(e.target.value)}>
            <option value="zip">ZIP</option>
            <option value="rar">RAR</option>
            <option value="7z">7Z</option>
            <option value="tar">TAR</option>
            <option value="tar.gz">TAR.GZ</option>
          </select>
        </div>
        
        <div className="dialog-field">
          <label>سطح فشرده‌سازی:</label>
          <select value={compressionLevel} onChange={e => setCompressionLevel(e.target.value)}>
            <option value="fast">سریع (حجم بیشتر)</option>
            <option value="normal">معمولی</option>
            <option value="maximum">حداکثر (کندتر)</option>
            <option value="ultra">فوق‌العاده (خیلی کند)</option>
          </select>
        </div>
        
        <div className="dialog-field">
          <label>رمز عبور (اختیاری):</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="برای محافظت از فایل فشرده"
          />
        </div>
        
        <div className="dialog-field">
          <label>حجم هر بخش (MB):</label>
          <input 
            type="number" 
            value={splitSize} 
            onChange={e => setSplitSize(Number(e.target.value))}
            placeholder="0 = بدون تقسیم"
            min="0"
          />
        </div>
        
        <div className="dialog-actions">
          <button onClick={onClose}>انصراف</button>
          <button 
            className="primary"
            onClick={() => onCompress({ format, compressionLevel, password, splitSize })}
          >
            شروع فشرده‌سازی
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== Share Dialog ====================
const ShareDialog = ({ file, onShare, onClose }) => {
  const [shareType, setShareType] = useState('link');
  const [permission, setPermission] = useState('view');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [emailShares, setEmailShares] = useState(['']);
  
  const generateLink = () => {
    const link = `https://yourdomain.com/share/${Math.random().toString(36).substr(2, 9)}`;
    setGeneratedLink(link);
    toast.success('لینک اشتراک‌گذاری ایجاد شد');
  };
  
  const addEmailField = () => {
    setEmailShares(prev => [...prev, '']);
  };
  
  const updateEmail = (index, value) => {
    setEmailShares(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  
  return (
    <motion.div 
      className="dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="dialog-content share-dialog"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3><FaShare /> اشتراک‌گذاری: {file?.name}</h3>
        
        <div className="share-tabs">
          <button 
            className={shareType === 'link' ? 'active' : ''}
            onClick={() => setShareType('link')}
          >
            لینک
          </button>
          <button 
            className={shareType === 'email' ? 'active' : ''}
            onClick={() => setShareType('email')}
          >
            ایمیل
          </button>
          <button 
            className={shareType === 'embed' ? 'active' : ''}
            onClick={() => setShareType('embed')}
          >
            Embed
          </button>
        </div>
        
        {shareType === 'link' && (
          <div className="share-link-section">
            <div className="dialog-field">
              <label>سطح دسترسی:</label>
              <select value={permission} onChange={e => setPermission(e.target.value)}>
                <option value="view">مشاهده</option>
                <option value="comment">نظر دادن</option>
                <option value="edit">ویرایش</option>
              </select>
            </div>
            
            <div className="dialog-field">
              <label>تاریخ انقضا (اختیاری):</label>
              <input 
                type="date" 
                value={expiryDate} 
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
            
            <div className="dialog-field">
              <label>رمز عبور (اختیاری):</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="رمز برای دسترسی به فایل"
              />
            </div>
            
            {generatedLink && (
              <div className="generated-link">
                <input value={generatedLink} readOnly />
                <button onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  toast.success('لینک کپی شد');
                }}>
                  <FaCopy />
                </button>
              </div>
            )}
          </div>
        )}
        
        {shareType === 'email' && (
          <div className="share-email-section">
            {emailShares.map((email, idx) => (
              <div key={idx} className="dialog-field">
                <label>ایمیل {idx + 1}:</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => updateEmail(idx, e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            ))}
            <button onClick={addEmailField} className="btn-link">
              <FaPlus /> افزودن ایمیل دیگر
            </button>
            <textarea 
              placeholder="پیام (اختیاری)..."
              className="share-message"
            />
          </div>
        )}
        
        {shareType === 'embed' && (
          <div className="share-embed-section">
            <div className="dialog-field">
              <label>سایز:</label>
              <select>
                <option>Responsive</option>
                <option>800x600</option>
                <option>640x480</option>
                <option>Custom</option>
              </select>
            </div>
            <textarea 
              readOnly 
              value={`<iframe src="${generatedLink || 'https://...'}" width="100%" height="600"></iframe>`}
              className="embed-code"
            />
          </div>
        )}
        
        <div className="dialog-actions">
          <button onClick={onClose}>انصراف</button>
          <button className="primary" onClick={shareType === 'link' ? generateLink : () => onShare()}>
            {shareType === 'link' ? 'ایجاد لینک' : 'اشتراک‌گذاری'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== File Version History ====================
const VersionHistory = ({ file, onClose }) => {
  const [versions] = useState([
    { id: 1, version: 'v3.2', date: '2024-01-15', size: 2048, author: 'کاربر ۱' },
    { id: 2, version: 'v3.1', date: '2024-01-14', size: 1980, author: 'کاربر ۱' },
    { id: 3, version: 'v3.0', date: '2024-01-13', size: 1850, author: 'کاربر ۲' },
    { id: 4, version: 'v2.0', date: '2024-01-10', size: 1500, author: 'کاربر ۱' },
    { id: 5, version: 'v1.0', date: '2024-01-01', size: 1000, author: 'کاربر ۱' }
  ]);
  
  return (
    <motion.div 
      className="dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="dialog-content version-history"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3><FaHistory /> تاریخچه نسخه‌ها: {file?.name}</h3>
        
        <div className="version-list">
          {versions.map(v => (
            <motion.div 
              key={v.id} 
              className="version-item"
              whileHover={{ x: 4 }}
            >
              <div className="version-info">
                <span className="version-badge">{v.version}</span>
                <span className="version-date">{formatDate(v.date)}</span>
                <span className="version-size">{formatFileSize(v.size)}</span>
                <span className="version-author">{v.author}</span>
              </div>
              <div className="version-actions">
                <button onClick={() => toast.success('نسخه بازیابی شد')}>
                  <FaUndo /> بازیابی
                </button>
                <button><FaDownload /> دانلود</button>
                <button><FaEye /> پیش‌نمایش</button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="dialog-actions">
          <button onClick={onClose}>بستن</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== Enhanced File Icon System ====================
const getFileIcon = (fileName, type, metadata = {}) => {
  if (type === 'folder') {
    if (metadata.color) {
      return <FaFolder style={{ color: metadata.color }} className="file-icon folder" />;
    }
    if (metadata.isShared) return <FaFolder className="file-icon folder-shared" />;
    if (metadata.isStarred) return <FaFolder className="file-icon folder-starred" />;
    return <FaFolder className="file-icon folder" />;
  }
  
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    // Documents
    pdf: { icon: FaFilePdf, class: 'pdf', color: '#E53935' },
    doc: { icon: FaFileWord, class: 'word', color: '#1565C0' },
    docx: { icon: FaFileWord, class: 'word', color: '#1565C0' },
    xls: { icon: FaFileExcel, class: 'excel', color: '#2E7D32' },
    xlsx: { icon: FaFileExcel, class: 'excel', color: '#2E7D32' },
    ppt: { icon: FaFilePowerpoint, class: 'ppt', color: '#D84315' },
    pptx: { icon: FaFilePowerpoint, class: 'ppt', color: '#D84315' },
    
    // Images
    jpg: { icon: FaImage, class: 'image', color: '#FF6F00' },
    jpeg: { icon: FaImage, class: 'image', color: '#FF6F00' },
    png: { icon: FaImage, class: 'image', color: '#FF6F00' },
    gif: { icon: FaImage, class: 'image', color: '#FF6F00' },
    svg: { icon: FaImage, class: 'image', color: '#FF6F00' },
    webp: { icon: FaImage, class: 'image', color: '#FF6F00' },
    psd: { icon: FaPalette, class: 'image', color: '#2196F3' },
    ai: { icon: FaPalette, class: 'image', color: '#FF6F00' },
    
    // Video
    mp4: { icon: FaVideo, class: 'video', color: '#7B1FA2' },
    webm: { icon: FaVideo, class: 'video', color: '#7B1FA2' },
    avi: { icon: FaVideo, class: 'video', color: '#7B1FA2' },
    mov: { icon: FaVideo, class: 'video', color: '#7B1FA2' },
    
    // Audio
    mp3: { icon: FaMusic, class: 'audio', color: '#0097A7' },
    wav: { icon: FaMusic, class: 'audio', color: '#0097A7' },
    flac: { icon: FaMusic, class: 'audio', color: '#0097A7' },
    
    // Archives
    zip: { icon: FaArchive, class: 'archive', color: '#795548' },
    rar: { icon: FaArchive, class: 'archive', color: '#795548' },
    tar: { icon: FaArchive, class: 'archive', color: '#795548' },
    gz: { icon: FaArchive, class: 'archive', color: '#795548' },
    '7z': { icon: FaArchive, class: 'archive', color: '#795548' },
    
    // Code
    js: { icon: FaFileCode, class: 'code', color: '#F7DF1E' },
    jsx: { icon: FaFileCode, class: 'code', color: '#61DAFB' },
    ts: { icon: FaFileCode, class: 'code', color: '#3178C6' },
    tsx: { icon: FaFileCode, class: 'code', color: '#61DAFB' },
    py: { icon: FaFileCode, class: 'code', color: '#3776AB' },
    css: { icon: FaFileCode, class: 'code', color: '#1572B6' },
    html: { icon: FaFileCode, class: 'code', color: '#E34C26' },
    json: { icon: FaFileCode, class: 'code', color: '#000000' },
    xml: { icon: FaFileCode, class: 'code', color: '#006699' },
    md: { icon: FaMarkdown, class: 'code', color: '#083fa1' },
    sql: { icon: FaDatabase, class: 'code', color: '#CC2927' },
    
    // System
    exe: { icon: FaMicrochip, class: 'system', color: '#4A148C' },
    dll: { icon: FaMicrochip, class: 'system', color: '#4A148C' },
    sh: { icon: FaTerminal, class: 'code', color: '#4EAA25' },
    bat: { icon: FaTerminal, class: 'code', color: '#4EAA25' }
  };
  
  const IconComponent = iconMap[ext];
  if (IconComponent) {
    return <IconComponent.icon className={`file-icon ${IconComponent.class}`} />;
  }
  
  return <FaFile className="file-icon default" />;
};

// ==================== Main File Manager Component ====================
const AdminFileManager = ({ onClose, initialPath = '/' }) => {
  // ============ State ============
  const [files, setFiles] = useState(initialFiles);
  const [currentPath, setCurrentPath] = useState(['root']);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NAME);
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);
  const [newName, setNewName] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [showCompressionDialog, setShowCompressionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [favorites, setFavorites] = useState(new Set());
  const [tags, setTags] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [diskUsage, setDiskUsage] = useState({ used: 0, total: 100, percentage: 0 });
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'name', 'size', 'type', 'modified', 'actions'
  ]);
  
  // ============ Refs ============
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const contentRef = useRef(null);
  
  // ============ Virtual Scrolling ============
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedFiles.length,
    getScrollElement: () => contentRef.current,
    estimateSize: () => viewMode === VIEW_MODES.GRID ? 120 : 48,
    overscan: 5
  });
  
  // ============ Effects ============
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'a': e.preventDefault(); handleSelectAll(); break;
          case 'c': e.preventDefault(); handleCopy(selectedFiles); break;
          case 'x': e.preventDefault(); handleCut(selectedFiles); break;
          case 'v': e.preventDefault(); handlePaste(); break;
          case 'z': e.preventDefault(); handleUndo(); break;
          case 'y': e.preventDefault(); handleRedo(); break;
          case 'f': e.preventDefault(); document.querySelector('.filemanager-search input')?.focus(); break;
          case 'n': e.preventDefault(); handleCreateFolder(); break;
          case 'u': e.preventDefault(); fileInputRef.current?.click(); break;
          case 'delete': e.preventDefault(); handleDelete(selectedFiles, true); break;
          default: break;
        }
      } else {
        switch(e.key) {
          case 'Delete': handleDelete(selectedFiles, true); break;
          case 'F2': handleRenameStart(selectedFiles[0]); break;
          case 'Escape': 
            setContextMenu(null);
            setPreviewFile(null);
            setSelectedFiles([]);
            break;
          default: break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, clipboard]);
  
  // ============ History Management ============
  const saveToHistory = (action) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      action,
      files: JSON.parse(JSON.stringify(files)),
      timestamp: new Date().toISOString()
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const handleUndo = () => {
    if (historyIndex >= 0) {
      setFiles(JSON.parse(JSON.stringify(history[historyIndex].files)));
      setHistoryIndex(prev => prev - 1);
      toast.success('عملیات undo شد');
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 2) {
      setFiles(JSON.parse(JSON.stringify(history[historyIndex + 2].files)));
      setHistoryIndex(prev => prev + 1);
      toast.success('عملیات redo شد');
    }
  };
  
  // ============ File Operations ============
  const handleUpload = async (uploadFiles) => {
    setUploadQueue(uploadFiles.map(f => ({ name: f.name, progress: 0, status: 'pending' })));
    setIsUploading(true);
    
    const newFiles = [];
    
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      
      setUploadQueue(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ));
      
      // Simulate upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadQueue(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress } : f
        ));
      }
      
      const newFile = {
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        type: 'file',
        size: file.size,
        modified: new Date().toISOString(),
        mimeType: file.type,
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };
      
      newFiles.push(newFile);
      
      setUploadQueue(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'completed', progress: 100 } : f
      ));
    }
    
    saveToHistory(FILE_ACTIONS.CREATE);
    setFiles(prev => [...prev, ...newFiles]);
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadQueue([]);
      setUploadProgress(0);
    }, 1000);
    
    toast.success(`✅ ${newFiles.length} فایل با موفقیت آپلود شد`);
  };
  
  const handleCreateFolder = (name = null) => {
    const folderName = name || prompt('نام پوشه جدید:');
    if (!folderName) return;
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      type: 'folder',
      size: 0,
      modified: new Date().toISOString(),
      children: []
    };
    
    saveToHistory(FILE_ACTIONS.CREATE);
    setFiles(prev => [...prev, newFolder]);
    toast.success(`📁 پوشه "${folderName}" ایجاد شد`);
  };
  
  const handleDelete = (fileIds, permanent = false) => {
    if (fileIds.length === 0) return;
    
    const message = permanent
      ? `آیا از حذف دائمی ${fileIds.length} آیتم مطمئن هستید؟`
      : `آیا از انتقال ${fileIds.length} آیتم به سطل زباله مطمئن هستید؟`;
    
    if (!confirm(message)) return;
    
    saveToHistory(FILE_ACTIONS.DELETE);
    
    if (permanent) {
      setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
    } else {
      // Soft delete - move to trash
      setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
      // In real app, would move to trash
    }
    
    setSelectedFiles(prev => prev.filter(id => !fileIds.includes(id)));
    toast.success(`🗑️ ${fileIds.length} آیتم ${permanent ? 'حذف دائمی' : 'به سطل زباله منتقل'} شد`);
  };
  
  const handleRenameStart = (fileId) => {
    if (!fileId) return;
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    setRenamingFile(fileId);
    setNewName(file.name);
  };
  
  const handleRename = (fileId, newName) => {
    if (!newName.trim()) return;
    
    saveToHistory(FILE_ACTIONS.RENAME);
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, name: newName } : f
    ));
    setRenamingFile(null);
    toast.success('✏️ نام فایل تغییر کرد');
  };
  
  const handleCopy = (fileIds) => {
    if (fileIds.length === 0) return;
    setClipboard({ action: 'copy', files: fileIds });
    toast.success(`📋 ${fileIds.length} آیتم کپی شد`);
  };
  
  const handleCut = (fileIds) => {
    if (fileIds.length === 0) return;
    setClipboard({ action: 'cut', files: fileIds });
    toast.success(`✂️ ${fileIds.length} آیتم برش داده شد`);
  };
  
  const handlePaste = () => {
    if (!clipboard) return;
    
    saveToHistory(FILE_ACTIONS.COPY);
    
    if (clipboard.action === 'copy') {
      const filesToCopy = files.filter(f => clipboard.files.includes(f.id));
      const newFiles = filesToCopy.map(f => ({
        ...f,
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Copy of ${f.name}`
      }));
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`📋 ${newFiles.length} فایل کپی شد`);
    } else if (clipboard.action === 'cut') {
      // Move files
      toast.success(`✂️ ${clipboard.files.length} فایل جابجا شد`);
    }
    
    setClipboard(null);
  };
  
  const handleDownload = (fileIds) => {
    if (!Array.isArray(fileIds)) fileIds = [fileIds];
    
    const downloadFiles = files.filter(f => fileIds.includes(f.id) && f.type === 'file');
    
    if (downloadFiles.length === 1) {
      // Single file download
      const file = downloadFiles[0];
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 2000)),
        {
          loading: `در حال دانلود ${file.name}...`,
          success: `✅ ${file.name} دانلود شد`,
          error: '❌ خطا در دانلود'
        }
      );
    } else if (downloadFiles.length > 1) {
      // Multiple files - download as zip
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 3000)),
        {
          loading: `در حال فشرده‌سازی و دانلود ${downloadFiles.length} فایل...`,
          success: `✅ ${downloadFiles.length} فایل دانلود شد`,
          error: '❌ خطا در دانلود'
        }
      );
    }
  };
  
  const handleCompress = (fileIds) => {
    setShowCompressionDialog(true);
  };
  
  const handleShare = (fileId) => {
    const file = files.find(f => f.id === fileId);
    setShowShareDialog(file);
  };
  
  const handleToggleFavorite = (fileId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(fileId)) {
        newFavorites.delete(fileId);
        toast('⭐ از علاقه‌مندی‌ها حذف شد');
      } else {
        newFavorites.add(fileId);
        toast('⭐ به علاقه‌مندی‌ها اضافه شد');
      }
      return newFavorites;
    });
  };
  
  const handleAddTag = (fileId, tag) => {
    setTags(prev => ({
      ...prev,
      [fileId]: [...(prev[fileId] || []), tag]
    }));
    toast.success(`🏷️ برچسب "${tag}" اضافه شد`);
  };
  
  // ============ Context Menu ============
  const getContextMenuItems = (fileId = null) => {
    if (fileId) {
      const file = files.find(f => f.id === fileId);
      const isFolder = file?.type === 'folder';
      const isStarred = favorites.has(fileId);
      
      return [
        { label: 'باز کردن', icon: <FaFolder />, onClick: () => {}, show: isFolder },
        { label: 'پیش‌نمایش', icon: <FaEye />, onClick: () => setPreviewFile(file), show: !isFolder },
        { label: 'دانلود', icon: <FaDownload />, onClick: () => handleDownload([fileId]) },
        { label: 'اشتراک‌گذاری', icon: <FaShare />, onClick: () => handleShare(fileId) },
        { divider: true },
        { label: 'کپی', icon: <FaCopy />, onClick: () => handleCopy([fileId]) },
        { label: 'برش', icon: <FaCut />, onClick: () => handleCut([fileId]) },
        { divider: true },
        { label: isStarred ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی', 
          icon: <FaStar color={isStarred ? '#FFD700' : undefined} />, 
          onClick: () => handleToggleFavorite(fileId) 
        },
        { label: 'افزودن برچسب', icon: <FaTags />, onClick: () => {
          const tag = prompt('نام برچسب:');
          if (tag) handleAddTag(fileId, tag);
        }},
        { divider: true },
        { label: 'تغییر نام', icon: <FaEdit />, onClick: () => handleRenameStart(fileId) },
        { label: 'تاریخچه نسخه‌ها', icon: <FaHistory />, onClick: () => setShowVersionHistory(file) },
        { label: 'فشرده‌سازی', icon: <FaCompress />, onClick: () => handleCompress([fileId]) },
        { divider: true },
        { label: 'حذف', icon: <FaTrash />, onClick: () => handleDelete([fileId]), danger: true },
      ].filter(item => item.show !== false);
    } else {
      return [
        { label: 'پوشه جدید', icon: <FaFolderPlus />, onClick: () => handleCreateFolder() },
        { label: 'فایل جدید', icon: <FaFileAlt />, onClick: () => {
          const name = prompt('نام فایل:');
          if (name) {
            const newFile = {
              id: `file-${Date.now()}`,
              name,
              type: 'file',
              size: 0,
              modified: new Date().toISOString(),
              content: ''
            };
            saveToHistory(FILE_ACTIONS.CREATE);
            setFiles(prev => [...prev, newFile]);
          }
        }},
        { label: 'آپلود فایل', icon: <FaCloudUploadAlt />, onClick: () => fileInputRef.current?.click() },
        { label: 'آپلود پوشه', icon: <FaUpload />, onClick: () => folderInputRef.current?.click() },
        { divider: true },
        { label: 'چسباندن', icon: <FaPaste />, onClick: handlePaste, disabled: !clipboard },
        { label: 'انتخاب همه', icon: <FaCheckSquare />, onClick: handleSelectAll },
        { divider: true },
        { label: 'Undo', icon: <FaUndo />, onClick: handleUndo, disabled: historyIndex < 0 },
        { label: 'Redo', icon: <FaRedo />, onClick: handleRedo, disabled: historyIndex >= history.length - 1 },
        { label: 'رفرش', icon: <FaSync />, onClick: () => {
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 1000);
          toast.success('🔄 رفرش شد');
        }},
        { divider: true },
        { label: 'مرتب‌سازی', icon: <FaSort />, submenu: [
          { label: 'نام', onClick: () => handleSort(SORT_OPTIONS.NAME) },
          { label: 'حجم', onClick: () => handleSort(SORT_OPTIONS.SIZE) },
          { label: 'نوع', onClick: () => handleSort(SORT_OPTIONS.TYPE) },
          { label: 'تاریخ', onClick: () => handleSort(SORT_OPTIONS.MODIFIED) },
        ]},
        { label: 'نحوه نمایش', icon: <FaTh />, submenu: [
          { label: 'گرید', icon: <FaTh />, onClick: () => setViewMode(VIEW_MODES.GRID) },
          { label: 'لیست', icon: <FaList />, onClick: () => setViewMode(VIEW_MODES.LIST) },
          { label: 'جزئیات', icon: <FaThLarge />, onClick: () => setViewMode(VIEW_MODES.DETAIL) },
          { label: 'ستونی', icon: <FaColumns />, onClick: () => setViewMode(VIEW_MODES.COLUMNS) },
          { label: 'گالری', icon: <FaImage />, onClick: () => setViewMode(VIEW_MODES.GALLERY) },
        ]},
      ];
    }
  };
  
  const handleContextMenu = (e, fileId = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: getContextMenuItems(fileId)
    });
  };
  
  // ============ Others ============
  const handleSelectAll = () => {
    if (selectedFiles.length === filteredAndSortedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredAndSortedFiles.map(f => f.id));
    }
  };
  
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(q) ||
        (tags[f.id] && tags[f.id].some(t => t.toLowerCase().includes(q)))
      );
    }
    
    // Sort
    result.sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      let comparison = 0;
      switch (sortBy) {
        case SORT_OPTIONS.NAME:
          comparison = a.name.localeCompare(b.name);
          break;
        case SORT_OPTIONS.SIZE:
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case SORT_OPTIONS.TYPE:
          const extA = a.name.split('.').pop() || '';
          const extB = b.name.split('.').pop() || '';
          comparison = extA.localeCompare(extB);
          break;
        case SORT_OPTIONS.MODIFIED:
          comparison = new Date(a.modified) - new Date(b.modified);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [files, searchQuery, sortBy, sortOrder, tags]);
  
  const totalSize = useMemo(() => 
    files.reduce((sum, f) => sum + (f.size || 0), 0),
    [files]
  );
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const onDrop = useCallback((acceptedFiles) => {
    handleUpload(acceptedFiles);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    noClick: true 
  });
  
  // ============ Render ============
  return (
    <motion.div 
      className="admin-file-manager-pro"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="filemanager-header">
        <div className="header-left">
          <FaFolder className="title-icon" />
          <span>مدیریت فایل</span>
          {isLoading && <FaSync className="spinning" />}
        </div>
        
        <div className="header-center">
          <div className="disk-usage">
            <div className="disk-bar">
              <div className="disk-fill" style={{ width: `${diskUsage.percentage}%` }} />
            </div>
            <span>{formatFileSize(diskUsage.used)} / {formatFileSize(diskUsage.total)}</span>
          </div>
        </div>
        
        <div className="header-right">
          {/* View Modes */}
          <div className="view-modes">
            <button onClick={() => setViewMode(VIEW_MODES.GRID)} className={viewMode === VIEW_MODES.GRID ? 'active' : ''}>
              <FaTh />
            </button>
            <button onClick={() => setViewMode(VIEW_MODES.LIST)} className={viewMode === VIEW_MODES.LIST ? 'active' : ''}>
              <FaList />
            </button>
            <button onClick={() => setViewMode(VIEW_MODES.DETAIL)} className={viewMode === VIEW_MODES.DETAIL ? 'active' : ''}>
              <FaThLarge />
            </button>
            <button onClick={() => setViewMode(VIEW_MODES.COLUMNS)} className={viewMode === VIEW_MODES.COLUMNS ? 'active' : ''}>
              <FaColumns />
            </button>
          </div>
          
          <div className="separator" />
          
          {/* Actions */}
          <button onClick={handleCreateFolder} title="پوشه جدید (Ctrl+N)">
            <FaFolderPlus /> پوشه جدید
          </button>
          
          <label className="upload-btn">
            <FaCloudUploadAlt /> آپلود
            <input ref={fileInputRef} type="file" multiple onChange={(e) => handleUpload(Array.from(e.target.files))} hidden />
          </label>
          
          <input ref={folderInputRef} type="file" webkitdirectory="" multiple onChange={(e) => handleUpload(Array.from(e.target.files))} hidden />
          
          {clipboard && (
            <button onClick={handlePaste} title="چسباندن (Ctrl+V)">
              <FaPaste /> چسباندن ({clipboard.files.length})
            </button>
          )}
          
          <button onClick={handleUndo} disabled={historyIndex < 0} title="Undo (Ctrl+Z)">
            <FaUndo />
          </button>
          
          <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">
            <FaRedo />
          </button>
          
          {/* Selected Actions */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div 
                className="selected-actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="separator" />
                <span className="selected-count">{selectedFiles.length} انتخاب شده</span>
                <button onClick={() => handleDownload(selectedFiles)}>
                  <FaDownload /> دانلود
                </button>
                <button onClick={() => handleCopy(selectedFiles)}>
                  <FaCopy /> کپی
                </button>
                <button onClick={() => handleCut(selectedFiles)}>
                  <FaCut /> برش
                </button>
                <button onClick={() => handleShare(selectedFiles[0])}>
                  <FaShare /> اشتراک
                </button>
                <button onClick={() => handleDelete(selectedFiles)} className="danger">
                  <FaTrash /> حذف
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="separator" />
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </div>
      
      {/* Upload Queue */}
      <AnimatePresence>
        {isUploading && uploadQueue.length > 0 && (
          <motion.div 
            className="upload-queue"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="queue-header">
              <span>در حال آپلود {uploadQueue.length} فایل</span>
              <button onClick={() => { setIsUploading(false); setUploadQueue([]); }}>
                <FaTimes />
              </button>
            </div>
            {uploadQueue.map((item, idx) => (
              <div key={idx} className="queue-item">
                <span className="queue-name">{item.name}</span>
                <div className="queue-progress">
                  <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                </div>
                <span className="queue-status">
                  {item.status === 'uploading' ? `${item.progress}%` : 
                   item.status === 'completed' ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Breadcrumbs & Navigation */}
      <div className="filemanager-nav">
        <div className="nav-buttons">
          <button><FaArrowLeft /></button>
          <button><FaArrowRight /></button>
          <button><FaSync /></button>
        </div>
        
        <div className="filemanager-breadcrumbs">
          {currentPath.map((path, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <FaChevronRight className="breadcrumb-arrow" />}
              <button className={`breadcrumb-item ${idx === currentPath.length - 1 ? 'current' : ''}`}>
                {path}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Search & Filters */}
      <div className="filemanager-toolbar">
        <div className="filemanager-search">
          <FaSearch />
          <input
            type="text"
            placeholder="جستجو در فایل‌ها... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="filter-chips">
          <button className={`filter-chip ${!showDeleted ? 'active' : ''}`}
            onClick={() => setShowDeleted(false)}>
            همه فایل‌ها
          </button>
          <button className={`filter-chip ${showDeleted ? 'active' : ''}`}
            onClick={() => setShowDeleted(true)}>
            <FaTrash /> سطل زباله
          </button>
          {['مهم', 'کاری', 'شخصی', 'موقت'].map(tag => (
            <button key={tag} className="filter-chip">🏷️ {tag}</button>
          ))}
        </div>
      </div>
      
      {/* Column Headers (List/Detail view) */}
      {(viewMode === VIEW_MODES.LIST || viewMode === VIEW_MODES.DETAIL) && (
        <div className="filemanager-columns-header">
          <div className="col-checkbox">
            <input
              type="checkbox"
              checked={selectedFiles.length === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
              onChange={handleSelectAll}
            />
          </div>
          {selectedColumns.includes('name') && (
            <button className="col-name sort-btn" onClick={() => handleSort(SORT_OPTIONS.NAME)}>
              نام {sortBy === SORT_OPTIONS.NAME && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          )}
          {selectedColumns.includes('size') && (
            <button className="col-size sort-btn" onClick={() => handleSort(SORT_OPTIONS.SIZE)}>
              حجم {sortBy === SORT_OPTIONS.SIZE && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          )}
          {selectedColumns.includes('type') && (
            <button className="col-type sort-btn" onClick={() => handleSort(SORT_OPTIONS.TYPE)}>
              نوع {sortBy === SORT_OPTIONS.TYPE && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          )}
          {selectedColumns.includes('modified') && (
            <button className="col-modified sort-btn" onClick={() => handleSort(SORT_OPTIONS.MODIFIED)}>
              تاریخ {sortBy === SORT_OPTIONS.MODIFIED && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          )}
          {selectedColumns.includes('actions') && (
            <div className="col-actions">عملیات</div>
          )}
        </div>
      )}
      
      {/* Files Content */}
      <div 
        ref={contentRef}
        className={`filemanager-content ${viewMode}`}
        {...getRootProps()}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              className="drop-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <FaCloudUploadAlt size={64} />
              </motion.div>
              <p>فایل‌ها را اینجا رها کنید...</p>
              <small>یا کلیک کنید برای انتخاب فایل</small>
            </motion.div>
          )}
        </AnimatePresence>
        
        {viewMode === VIEW_MODES.COLUMNS ? (
          <div className="columns-view">
            {/* Miller Columns */}
            <div className="column">
              <div className="column-header">root</div>
              {filteredAndSortedFiles.filter(f => f.type === 'folder').map(f => (
                <div key={f.id} className="column-item">
                  <FaFolder /> {f.name}
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === VIEW_MODES.GALLERY ? (
          <div className="gallery-view">
            {filteredAndSortedFiles
              .filter(f => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.name.split('.').pop()?.toLowerCase()))
              .map(file => (
                <motion.div
                  key={file.id}
                  className="gallery-item"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setPreviewFile(file)}
                >
                  <img src={file.thumbnail} alt={file.name} />
                  <div className="gallery-overlay">
                    <span>{file.name}</span>
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          <div className="files-grid" style={{ 
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative'
          }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const file = filteredAndSortedFiles[virtualRow.index];
              if (!file) return null;
              
              const isSelected = selectedFiles.includes(file.id);
              const isStarred = favorites.has(file.id);
              const fileTags = tags[file.id] || [];
              
              return (
                <motion.div
                  key={file.id}
                  className={`file-item ${isSelected ? 'selected' : ''} ${isStarred ? 'starred' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      setSelectedFiles(prev => 
                        prev.includes(file.id) 
                          ? prev.filter(id => id !== file.id)
                          : [...prev, file.id]
                      );
                    } else if (e.shiftKey && selectedFiles.length > 0) {
                      // Range selection
                      const lastSelected = selectedFiles[selectedFiles.length - 1];
                      const currentIdx = filteredAndSortedFiles.findIndex(f => f.id === file.id);
                      const lastIdx = filteredAndSortedFiles.findIndex(f => f.id === lastSelected);
                      const range = filteredAndSortedFiles.slice(
                        Math.min(currentIdx, lastIdx),
                        Math.max(currentIdx, lastIdx) + 1
                      );
                      setSelectedFiles(range.map(f => f.id));
                    } else {
                      setSelectedFiles([file.id]);
                    }
                  }}
                  onDoubleClick={() => {
                    if (file.type === 'folder') {
                      setCurrentPath(prev => [...prev, file.name]);
                    } else {
                      setPreviewFile(file);
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                  draggable
                >
                  {(viewMode === VIEW_MODES.GRID || viewMode === VIEW_MODES.GALLERY) ? (
                    // Grid View
                    <div className="file-item-grid">
                      <div className="file-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedFiles(prev => 
                              prev.includes(file.id)
                                ? prev.filter(id => id !== file.id)
                                : [...prev, file.id]
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {isStarred && <FaStar className="star-indicator" />}
                      
                      <div className="file-icon-wrapper">
                        {getFileIcon(file.name, file.type, { isStarred, color: file.color })}
                      </div>
                      
                      {renamingFile === file.id ? (
                        <input
                          className="rename-input"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleRename(file.id, newName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(file.id, newName);
                            if (e.key === 'Escape') setRenamingFile(null);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="file-name" title={file.name}>
                          {file.name}
                        </span>
                      )}
                      
                      {fileTags.length > 0 && (
                        <div className="file-tags">
                          {fileTags.map((tag, idx) => (
                            <span key={idx} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // List/Detail View
                    <div className="file-item-row">
                      <div className="col-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedFiles(prev => 
                              prev.includes(file.id)
                                ? prev.filter(id => id !== file.id)
                                : [...prev, file.id]
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {selectedColumns.includes('name') && (
                        <div className="col-name">
                          {getFileIcon(file.name, file.type, { size: 20 })}
                          {renamingFile === file.id ? (
                            <input
                              className="rename-input"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onBlur={() => handleRename(file.id, newName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(file.id, newName);
                                if (e.key === 'Escape') setRenamingFile(null);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="file-name" title={file.name}>{file.name}</span>
                          )}
                          {isStarred && <FaStar className="star-indicator" />}
                        </div>
                      )}
                      
                      {selectedColumns.includes('size') && (
                        <div className="col-size">
                          {file.type === 'file' ? formatFileSize(file.size) : '--'}
                        </div>
                      )}
                      
                      {selectedColumns.includes('type') && (
                        <div className="col-type">
                          {file.type === 'folder' ? 'پوشه' : file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      )}
                      
                      {selectedColumns.includes('modified') && (
                        <div className="col-modified">
                          {formatDate(file.modified)}
                        </div>
                      )}
                      
                      {selectedColumns.includes('actions') && (
                        <div className="col-actions">
                          <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}>
                            <FaEye />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownload([file.id]); }}>
                            <FaDownload />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleShare(file.id); }}>
                            <FaShare />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete([file.id]); }}>
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        
        {filteredAndSortedFiles.length === 0 && !isDragActive && (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaRegFolder size={64} />
            <h3>پوشه خالی است</h3>
            <p>فایل‌ها را بکشید و رها کنید یا از دکمه آپلود استفاده کنید</p>
            <button onClick={open} className="upload-empty-btn">
              <FaCloudUploadAlt /> آپلود فایل
            </button>
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <div className="filemanager-footer">
        <span className="footer-item">
          <FaFile /> {filteredAndSortedFiles.length} آیتم
        </span>
        <span className="footer-separator">|</span>
        <span className="footer-item">
          <FaCheckSquare /> {selectedFiles.length} انتخاب شده
        </span>
        <span className="footer-separator">|</span>
        <span className="footer-item">
          <FaHdd /> {formatFileSize(totalSize)}
        </span>
        
        <div className="footer-right">
          <button onClick={() => {}}>
            <FaCloud /> همگام‌سازی
          </button>
          <button onClick={() => setShowVersionHistory(null)}>
            <FaHistory /> تاریخچه
          </button>
        </div>
      </div>
      
      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.divider && <div className="context-menu-divider" />}
                {item.submenu ? (
                  <div className="context-menu-item has-submenu">
                    {item.icon}
                    <span>{item.label}</span>
                    <FaChevronRight className="submenu-arrow" />
                    <div className="submenu">
                      {item.submenu.map((subItem, subIdx) => (
                        <button key={subIdx} onClick={() => {
                          subItem.onClick?.();
                          setContextMenu(null);
                        }}>
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => {
                      item.onClick?.();
                      setContextMenu(null);
                    }}
                    disabled={item.disabled}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <AnimatePresence>
        {previewFile && (
          <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
        
        {showCompressionDialog && (
          <CompressionDialog
            files={selectedFiles.map(id => files.find(f => f.id === id))}
            onCompress={(options) => {
              toast.success('فشرده‌سازی شروع شد...');
              setShowCompressionDialog(false);
            }}
            onClose={() => setShowCompressionDialog(false)}
          />
        )}
        
        {showShareDialog && (
          <ShareDialog
            file={showShareDialog}
            onShare={() => {
              toast.success('با موفقیت به اشتراک گذاشته شد');
              setShowShareDialog(null);
            }}
            onClose={() => setShowShareDialog(null)}
          />
        )}
        
        {showVersionHistory && (
          <VersionHistory
            file={showVersionHistory}
            onClose={() => setShowVersionHistory(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminFileManager;