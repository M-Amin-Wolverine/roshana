// src/pages/admin/AdminBulkOperationsPro.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrash, FaEdit, FaDownload, FaEnvelope, FaPrint,
  FaLock, FaUnlock, FaCheck, FaTimes, FaSpinner,
  FaFilter, FaSort, FaCopy, FaCut, FaArchive,
  FaTag, FaUserPlus, FaBan, FaCheckCircle,
  FaExclamationTriangle, FaArrowRight, FaHistory,
  FaUndo, FaRedo, FaPlus, FaMinus, FaSearch,
  FaSave, FaShare, FaBell, FaCalendar, FaStar,
  FaCloudUploadAlt, FaFileExport, FaFileImport,
  FaSync, FaPause, FaPlay, FaStop, FaCog,
  FaChartBar, FaDatabase, FaCode, FaImage,
  FaEye, FaEyeSlash, FaRandom
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// ==================== Operation Categories ====================
const OPERATION_CATEGORIES = {
  destructive: { label: 'مخرب', color: '#ef4444', icon: FaExclamationTriangle },
  modification: { label: 'تغییر', color: '#f59e0b', icon: FaEdit },
  export: { label: 'خروجی', color: '#10b981', icon: FaDownload },
  communication: { label: 'ارتباط', color: '#8b5cf6', icon: FaEnvelope },
  management: { label: 'مدیریت', color: '#3b82f6', icon: FaCog },
  automation: { label: 'خودکار', color: '#06b6d4', icon: FaSync }
};

// ==================== All Operations ====================
const DEFAULT_OPERATIONS = [
  // Destructive
  { id: 'delete', icon: FaTrash, label: 'حذف', category: 'destructive', requireConfirm: true, confirmationType: 'double', undoable: false, batchSize: 100 },
  { id: 'permanent-delete', icon: FaBan, label: 'حذف دائمی', category: 'destructive', requireConfirm: true, confirmationType: 'type', confirmText: 'حذف دائمی', undoable: false, batchSize: 50 },
  
  // Modification
  { id: 'edit', icon: FaEdit, label: 'ویرایش گروهی', category: 'modification', requireConfirm: false, undoable: true, batchSize: 200 },
  { id: 'tag', icon: FaTag, label: 'برچسب‌گذاری', category: 'modification', requireConfirm: false, undoable: true, configFields: [{ name: 'tag', type: 'text', label: 'برچسب', placeholder: 'نام برچسب...' }] },
  { id: 'assign', icon: FaUserPlus, label: 'تخصیص', category: 'modification', requireConfirm: true, undoable: true, configFields: [{ name: 'assignTo', type: 'select', label: 'تخصیص به', options: ['admin', 'editor', 'viewer'] }] },
  { id: 'status-change', icon: FaRandom, label: 'تغییر وضعیت', category: 'modification', requireConfirm: false, undoable: true, configFields: [{ name: 'status', type: 'select', label: 'وضعیت جدید', options: ['active', 'inactive', 'pending', 'draft', 'published'] }] },
  { id: 'priority-change', icon: FaStar, label: 'تغییر اولویت', category: 'modification', requireConfirm: false, undoable: true, configFields: [{ name: 'priority', type: 'select', label: 'اولویت', options: ['low', 'medium', 'high', 'critical'] }] },
  { id: 'move', icon: FaCut, label: 'انتقال به', category: 'modification', requireConfirm: true, undoable: true, configFields: [{ name: 'destination', type: 'select', label: 'مقصد', options: ['folder-1', 'folder-2', 'archive'] }] },
  { id: 'copy', icon: FaCopy, label: 'کپی به', category: 'modification', requireConfirm: false },
  
  // Export
  { id: 'export-csv', icon: FaFileExport, label: 'CSV', category: 'export', requireConfirm: false, batchSize: 10000 },
  { id: 'export-excel', icon: FaDownload, label: 'Excel', category: 'export', requireConfirm: false, batchSize: 5000 },
  { id: 'export-pdf', icon: FaPrint, label: 'PDF', category: 'export', requireConfirm: false, batchSize: 2000 },
  { id: 'export-json', icon: FaCode, label: 'JSON', category: 'export', requireConfirm: false, batchSize: 10000 },
  { id: 'export-zip', icon: FaArchive, label: 'ZIP', category: 'export', requireConfirm: false, batchSize: 500 },
  
  // Communication
  { id: 'email', icon: FaEnvelope, label: 'ارسال ایمیل', category: 'communication', requireConfirm: true, batchSize: 500, configFields: [{ name: 'template', type: 'select', label: 'قالب', options: ['notification', 'reminder', 'welcome', 'custom'] }] },
  { id: 'notify', icon: FaBell, label: 'ارسال اعلان', category: 'communication', requireConfirm: false, configFields: [{ name: 'message', type: 'textarea', label: 'پیام' }] },
  
  // Management
  { id: 'lock', icon: FaLock, label: 'قفل کردن', category: 'management', requireConfirm: true, undoable: true },
  { id: 'unlock', icon: FaUnlock, label: 'باز کردن قفل', category: 'management', requireConfirm: false, undoable: true },
  { id: 'archive', icon: FaArchive, label: 'بایگانی', category: 'management', requireConfirm: true, undoable: true },
  { id: 'restore', icon: FaUndo, label: 'بازیابی', category: 'management', requireConfirm: true, undoable: false },
  
  // Automation
  { id: 'approve', icon: FaCheckCircle, label: 'تأیید', category: 'automation', requireConfirm: false, undoable: true, batchSize: 500 },
  { id: 'reject', icon: FaTimes, label: 'رد', category: 'automation', requireConfirm: true, undoable: true },
  { id: 'schedule', icon: FaCalendar, label: 'زمان‌بندی', category: 'automation', requireConfirm: false, configFields: [{ name: 'datetime', type: 'datetime', label: 'تاریخ و ساعت' }] },
];

// ==================== Progress Component ====================
const OperationProgress = ({ total, completed, failed, isRunning, operation, elapsedTime }) => {
  const percent = Math.round((completed / total) * 100);
  
  return (
    <div className="operation-progress-detailed">
      <div className="progress-header">
        <div className="progress-info">
          <operation.icon style={{ color: OPERATION_CATEGORIES[operation.category]?.color }} />
          <div>
            <span className="progress-title">{operation.label}</span>
            <span className="progress-subtitle">
              {completed}/{total} • {percent}% • {elapsedTime}s
            </span>
          </div>
        </div>
        <div className="progress-actions">
          <button onClick={() => {}} title="توقف"><FaPause /></button>
        </div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            style={{ background: OPERATION_CATEGORIES[operation.category]?.color }}
          />
          {failed > 0 && (
            <motion.div 
              className="progress-fill failed"
              initial={{ width: 0 }}
              animate={{ width: `${(failed / total) * 100}%` }}
            />
          )}
        </div>
      </div>
      
      <div className="progress-stats">
        <span className="stat success">✅ {completed - failed} موفق</span>
        {failed > 0 && <span className="stat error">❌ {failed} ناموفق</span>}
        <span className="stat remaining">⏳ {total - completed} باقی‌مانده</span>
        <span className="stat speed">⚡ {(completed / Math.max(elapsedTime, 1)).toFixed(1)} آیتم/ثانیه</span>
      </div>
    </div>
  );
};

// ==================== Undo Snapshot ====================
const useUndo = () => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveSnapshot = useCallback((items) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        items: JSON.parse(JSON.stringify(items)),
        timestamp: Date.now()
      });
      return newHistory.slice(-20); // Keep last 20 snapshots
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return null;
    setHistoryIndex(prev => prev - 1);
    return history[historyIndex]?.items;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return null;
    setHistoryIndex(prev => prev + 1);
    return history[historyIndex + 1]?.items;
  }, [history, historyIndex]);

  return { saveSnapshot, undo, redo, canUndo: historyIndex >= 0, canRedo: historyIndex < history.length - 1 };
};

// ==================== Main Component ====================
const AdminBulkOperationsPro = ({
  selectedItems = [],
  onClear,
  onOperation,
  itemType = 'item',
  customOperations = [],
  enableUndo = true,
  enableBatching = true,
  maxBatchSize = 100,
  defaultBatchSize = 50,
  onProgress = null,
  preserveSelection = false
}) => {
  // ============ State ============
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const [operationConfig, setOperationConfig] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [batchSize, setBatchSize] = useState(defaultBatchSize);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorItems, setErrorItems] = useState([]);

  // ============ Refs ============
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ============ Undo System ============
  const { saveSnapshot, undo, redo, canUndo, canRedo } = useUndo();

  // ============ All Operations ============
  const allOperations = useMemo(() => [...DEFAULT_OPERATIONS, ...customOperations], [customOperations]);

  // ============ Filtered Operations ============
  const filteredOperations = useMemo(() => {
    return allOperations.filter(op => {
      if (selectedCategory !== 'all' && op.category !== selectedCategory) return false;
      if (searchQuery && !op.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allOperations, selectedCategory, searchQuery]);

  // ============ Timer ============
  useEffect(() => {
    if (isProcessing) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isProcessing]);

  // ============ Handlers ============
  const handleOperation = useCallback((operation) => {
    if (isProcessing) return;

    if (operation.requireConfirm) {
      setCurrentOperation(operation);
      setShowOperationModal(true);
      return;
    }

    executeOperation(operation);
  }, [isProcessing, selectedItems]);

  const executeOperation = useCallback(async (operation, config = {}) => {
    if (isProcessing) return;

    // Save snapshot for undo
    if (enableUndo && operation.undoable) {
      saveSnapshot(selectedItems);
    }

    setIsProcessing(true);
    setProgress({ total: selectedItems.length, completed: 0, failed: 0 });
    setElapsedTime(0);
    setErrorItems([]);
    abortControllerRef.current = new AbortController();

    const finalConfig = { ...operationConfig, ...config };
    const items = [...selectedItems];
    const batchSizeToUse = operation.batchSize || batchSize;
    let completed = 0;
    let failed = 0;
    const errors = [];

    try {
      // Process in batches if enabled
      if (enableBatching && items.length > batchSizeToUse) {
        for (let i = 0; i < items.length; i += batchSizeToUse) {
          if (abortControllerRef.current.signal.aborted) break;

          const batch = items.slice(i, i + batchSizeToUse);
          
          try {
            const result = await processBatch(operation, batch, finalConfig);
            completed += result.success;
            failed += result.failed;
            errors.push(...(result.errors || []));
          } catch (error) {
            failed += batch.length;
            errors.push(...batch.map(item => ({ item, error: error.message })));
          }

          setProgress({ total: items.length, completed, failed });
          onProgress?.({ completed, failed, total: items.length, percent: Math.round((completed / items.length) * 100) });

          // Small delay between batches
          if (i + batchSizeToUse < items.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // Single batch
        const result = await processBatch(operation, items, finalConfig);
        completed = result.success;
        failed = result.failed;
        errors.push(...(result.errors || []));
        setProgress({ total: items.length, completed, failed });
      }

      setErrorItems(errors);

      // Add to history
      setProcessingHistory(prev => [{
        id: `history-${Date.now()}`,
        operation: operation.label,
        timestamp: new Date().toISOString(),
        total: items.length,
        completed,
        failed,
        duration: elapsedTime
      }, ...prev].slice(0, 20));

      // Show result toast
      if (failed === 0) {
        toast.success(
          `✅ "${operation.label}" روی ${completed} ${itemType} با موفقیت انجام شد`,
          {
            duration: 5000,
            action: enableUndo && operation.undoable ? {
              label: '↩️ بازگشت',
              onClick: () => handleUndo()
            } : undefined
          }
        );
      } else {
        toast.error(
          `⚠️ "${operation.label}": ${completed} موفق، ${failed} ناموفق`,
          { duration: 6000 }
        );
      }

      // Clear selection unless preserve
      if (!preserveSelection) {
        setTimeout(() => onClear?.(), 1500);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error(`❌ خطا: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
      setShowOperationModal(false);
      setCurrentOperation(null);
      setOperationConfig({});
      abortControllerRef.current = null;
    }
  }, [isProcessing, selectedItems, operationConfig, enableBatching, batchSize, enableUndo, itemType, preserveSelection, onClear, onProgress, saveSnapshot, elapsedTime]);

  const processBatch = async (operation, items, config) => {
    // Simulate processing with random failures
    const successCount = items.length - Math.floor(Math.random() * 3); // 0-2 random failures
    const failedCount = items.length - successCount;
    const errors = Array(failedCount).fill(null).map((_, i) => ({
      item: items[successCount + i],
      error: 'خطای شبیه‌سازی شده'
    }));

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Call actual handler
    if (onOperation) {
      await onOperation(operation.id, items.slice(0, successCount), config);
    }

    return { success: successCount, failed: failedCount, errors };
  };

  const handleUndo = useCallback(async () => {
    const previousItems = undo();
    if (previousItems) {
      toast.success('↩️ عملیات قبلی بازگردانده شد');
      if (onOperation) {
        await onOperation('undo', selectedItems, { previousItems });
      }
    }
  }, [undo, selectedItems, onOperation]);

  const handleRedo = useCallback(() => {
    const nextItems = redo();
    if (nextItems) {
      toast.success('↪️ عملیات دوباره انجام شد');
    }
  }, [redo]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    toast('⏹️ عملیات متوقف شد');
  }, []);

  const handleRetryFailed = useCallback(() => {
    if (errorItems.length === 0) return;
    // Retry failed items
    executeOperation(currentOperation, { retryItems: errorItems.map(e => e.item) });
  }, [errorItems, currentOperation]);

  // ============ If no items selected ============
  if (selectedItems.length === 0) return null;

  return (
    <>
      {/* ============ Main Bar ============ */}
      <motion.div
        className="bulk-operations-bar-pro"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Left: Info */}
        <div className="bulk-info-section">
          <div className="bulk-count-badge">
            <span className="count-number">{selectedItems.length.toLocaleString()}</span>
            <span className="count-label">{itemType}</span>
          </div>
          
          <div className="selection-actions">
            <button onClick={onClear} title="لغو انتخاب (Esc)">
              <FaTimes size={12} />
            </button>
            {enableUndo && (
              <>
                <button 
                  onClick={handleUndo} 
                  disabled={!canUndo}
                  title="بازگشت (Ctrl+Z)"
                >
                  <FaUndo size={12} />
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={!canRedo}
                  title="بازانجام (Ctrl+Y)"
                >
                  <FaRedo size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Center: Operations */}
        <div className="bulk-operations-section">
          {/* Quick Actions (first 5) */}
          <div className="quick-operations">
            {filteredOperations.slice(0, 6).map(operation => (
              <motion.button
                key={operation.id}
                className="bulk-action-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOperation(operation)}
                disabled={isProcessing}
                style={{ '--action-color': OPERATION_CATEGORIES[operation.category]?.color || '#6C5CE7' }}
                title={operation.label}
              >
                <operation.icon size={16} />
                <span className="btn-label">{operation.label}</span>
              </motion.button>
            ))}
          </div>

          {/* More Operations Dropdown */}
          {filteredOperations.length > 6 && (
            <div className="more-operations">
              <button 
                className="btn-more"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <FaPlus size={12} />
                <span>{filteredOperations.length - 6} عملیات دیگر</span>
                <FaChevronDown size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Progress / Actions */}
        <div className="bulk-right-section">
          {isProcessing && (
            <div className="mini-progress">
              <div className="mini-progress-bar">
                <motion.div 
                  className="mini-progress-fill"
                  animate={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="mini-progress-text">
                {progress.completed}/{progress.total}
              </span>
              <button onClick={handleCancel} className="btn-cancel-mini">
                <FaTimes size={10} />
              </button>
            </div>
          )}

          <button 
            className="btn-history"
            onClick={() => setShowHistory(!showHistory)}
            title="تاریخچه"
          >
            <FaHistory size={14} />
          </button>
        </div>
      </motion.div>

      {/* ============ Advanced Panel ============ */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            className="bulk-advanced-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="advanced-header">
              <div className="search-operations">
                <input
                  type="text"
                  placeholder="جستجوی عملیات..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <FaSearch size={12} />
              </div>

              <div className="category-filters">
                <button 
                  className={selectedCategory === 'all' ? 'active' : ''}
                  onClick={() => setSelectedCategory('all')}
                >
                  همه
                </button>
                {Object.entries(OPERATION_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    className={selectedCategory === key ? 'active' : ''}
                    onClick={() => setSelectedCategory(key)}
                    style={{ '--cat-color': cat.color }}
                  >
                    <cat.icon size={12} />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="advanced-operations-grid">
              {filteredOperations.map(operation => (
                <motion.button
                  key={operation.id}
                  className="operation-card"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOperation(operation)}
                  disabled={isProcessing}
                  style={{ '--action-color': OPERATION_CATEGORIES[operation.category]?.color }}
                >
                  <operation.icon size={20} />
                  <span className="operation-label">{operation.label}</span>
                  <span className="operation-category">
                    {OPERATION_CATEGORIES[operation.category]?.label}
                  </span>
                  {operation.batchSize && (
                    <span className="operation-batch">حداکثر {operation.batchSize}</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Batch Settings */}
            <div className="batch-settings">
              <label>اندازه بچ:</label>
              <input 
                type="range" 
                min="10" 
                max={maxBatchSize} 
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
              />
              <span>{batchSize}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ History Panel ============ */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="bulk-history-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4><FaHistory /> تاریخچه عملیات</h4>
            {processingHistory.length === 0 ? (
              <p className="empty-text">هنوز عملیاتی انجام نشده</p>
            ) : (
              processingHistory.map(item => (
                <div key={item.id} className="history-item">
                  <span className="history-time">
                    {new Date(item.timestamp).toLocaleTimeString('fa-IR')}
                  </span>
                  <span className="history-operation">{item.operation}</span>
                  <span className="history-stats">
                    {item.completed}/{item.total}
                    {item.failed > 0 && <span className="failed-badge">{item.failed} خطا</span>}
                  </span>
                  <span className="history-duration">{item.duration}s</span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Confirmation Modal ============ */}
      <AnimatePresence>
        {showOperationModal && currentOperation && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && setShowOperationModal(false)}
          >
            <motion.div 
              className="modal-content bulk-modal-pro"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-title">
                  <currentOperation.icon 
                    style={{ color: OPERATION_CATEGORIES[currentOperation.category]?.color }} 
                    size={28} 
                  />
                  <div>
                    <h3>{currentOperation.label}</h3>
                    <span className="modal-subtitle">
                      {OPERATION_CATEGORIES[currentOperation.category]?.label}
                    </span>
                  </div>
                </div>
                {!isProcessing && (
                  <button onClick={() => setShowOperationModal(false)}>
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                {/* Warning */}
                {currentOperation.category === 'destructive' && (
                  <div className="warning-box critical">
                    <FaExclamationTriangle size={28} />
                    <div>
                      <p className="warning-title">عملیات مخرب!</p>
                      <p className="warning-text">
                        این عملیات قابل بازگشت نیست. لطفاً با دقت ادامه دهید.
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="operation-summary">
                  <div className="summary-item">
                    <span className="summary-label">آیتم‌های انتخاب شده</span>
                    <span className="summary-value">{selectedItems.length.toLocaleString()} {itemType}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">عملیات</span>
                    <span className="summary-value" style={{ color: OPERATION_CATEGORIES[currentOperation.category]?.color }}>
                      {currentOperation.label}
                    </span>
                  </div>
                  {currentOperation.undoable && (
                    <div className="summary-item">
                      <span className="summary-label">قابلیت بازگشت</span>
                      <span className="summary-value success">✅ دارد</span>
                    </div>
                  )}
                </div>

                {/* Selected Items Preview */}
                <div className="selected-items-preview">
                  <h4>پیش‌نمایش آیتم‌ها:</h4>
                  <div className="items-scroll">
                    <AnimatePresence>
                      {selectedItems.slice(0, 10).map((item, idx) => (
                        <motion.div 
                          key={idx} 
                          className="selected-item"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <span className="item-index">{idx + 1}</span>
                          <FaArrowRight size={8} />
                          <span className="item-name">
                            {typeof item === 'string' ? item : item.label || item.name || item.id || `آیتم #${idx + 1}`}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {selectedItems.length > 10 && (
                      <motion.p 
                        className="more-items"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        ... و {selectedItems.length - 10} مورد دیگر
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Operation Config */}
                {currentOperation.configFields?.map(field => (
                  <div key={field.name} className="operation-config">
                    <label>{field.label}:</label>
                    {field.type === 'select' ? (
                      <select
                        value={operationConfig[field.name] || ''}
                        onChange={e => setOperationConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                      >
                        <option value="">انتخاب {field.label}...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        value={operationConfig[field.name] || ''}
                        onChange={e => setOperationConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={operationConfig[field.name] || ''}
                        onChange={e => setOperationConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}

                {/* Progress */}
                {isProcessing && (
                  <OperationProgress 
                    total={progress.total}
                    completed={progress.completed}
                    failed={progress.failed}
                    isRunning={isProcessing}
                    operation={currentOperation}
                    elapsedTime={elapsedTime}
                  />
                )}

                {/* Error Items */}
                {errorItems.length > 0 && (
                  <div className="error-items-section">
                    <h4>❌ آیتم‌های ناموفق ({errorItems.length})</h4>
                    <div className="error-items-list">
                      {errorItems.slice(0, 5).map((err, idx) => (
                        <div key={idx} className="error-item">
                          <span>{err.item?.name || err.item?.id || `آیتم ${idx + 1}`}</span>
                          <span className="error-reason">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                {!isProcessing ? (
                  <>
                    <button 
                      className="btn-cancel"
                      onClick={() => setShowOperationModal(false)}
                    >
                      انصراف
                    </button>
                    <button 
                      className="btn-confirm"
                      onClick={() => executeOperation(currentOperation)}
                      style={{ backgroundColor: OPERATION_CATEGORIES[currentOperation.category]?.color }}
                    >
                      <FaCheck /> تایید و اجرا
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-cancel" onClick={handleCancel}>
                      <FaStop /> توقف
                    </button>
                    {errorItems.length > 0 && (
                      <button 
                        className="btn-retry"
                        onClick={handleRetryFailed}
                      >
                        <FaSync /> تلاش مجدد ({errorItems.length})
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminBulkOperationsPro;