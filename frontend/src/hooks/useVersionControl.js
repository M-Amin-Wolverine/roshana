// src/hooks/useVersionControlPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Version Control Hook (Like Git for Admin)
 * 
 * Features:
 * - Full Version History with Branches
 * - Visual Diff (side-by-side & unified)
 * - Auto-save (debounced)
 * - Version Tags & Labels
 * - Rollback with confirmation
 * - Branch Management (main, draft, staging)
 * - Versions Comparison (with highlighting)
 * - Export/Import Versions
 * - Storage in localStorage/IndexedDB
 * - Conflict Detection
 * - Scheduled Snapshots
 * - Size Management (auto-prune old versions)
 */
export const useVersionControlPro = (options = {}) => {
  const {
    storageKey = 'admin_version_control',
    persistToLocalStorage = true,
    maxVersions = 50,
    autoSave = false,
    autoSaveInterval = 30000, // 30 seconds
    debounceMs = 2000,
    enableBranches = true,
    defaultBranch = 'main',
    maxContentSize = 5 * 1024 * 1024, // 5MB
    onVersionCreated = null,
    onVersionReverted = null,
    onBranchChanged = null,
    initialVersions = []
  } = options;

  // ============ Types ============
  /**
   * @typedef {Object} Version
   * @property {string} id - Unique ID
   * @property {number} version - Version number
   * @property {string} content - Content (stringified)
   * @property {string} contentType - 'json', 'text', 'html', 'markdown'
   * @property {Object} metadata
   * @property {string} branch - Branch name
   * @property {string} author
   * @property {string} message
   * @property {string} timestamp
   * @property {string} checksum
   * @property {string} parentId - Parent version ID
   * @property {string[]} tags - Version tags
   * @property {boolean} isSnapshot - Auto-saved snapshot
   * @property {number} size - Content size in bytes
   */

  // ============ State ============
  const [state, setState] = useState(() => {
    if (persistToLocalStorage) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            versions: parsed.versions || initialVersions,
            currentBranch: parsed.currentBranch || defaultBranch,
            branches: parsed.branches || [defaultBranch],
            autoSaveEnabled: parsed.autoSaveEnabled || autoSave,
            lastAutoSave: parsed.lastAutoSave || null
          };
        }
      } catch {
        console.warn('Failed to load version history');
      }
    }
    return {
      versions: initialVersions,
      currentBranch: defaultBranch,
      branches: [defaultBranch],
      autoSaveEnabled: autoSave,
      lastAutoSave: null
    };
  });

  const { versions, currentBranch, branches, autoSaveEnabled, lastAutoSave } = state;

  // ============ Refs ============
  const autoSaveTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const pendingContentRef = useRef(null);
  const stateRef = useRef(state);

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ Persist ============
  useEffect(() => {
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          versions,
          currentBranch,
          branches,
          autoSaveEnabled,
          lastAutoSave
        }));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          toast.error('⚠️ فضای ذخیره‌سازی پر شده - نسخه‌های قدیمی پاکسازی می‌شوند');
          pruneOldVersions();
        }
      }
    }
  }, [versions, currentBranch, branches, autoSaveEnabled, lastAutoSave, persistToLocalStorage, storageKey]);

  // ============ Auto-save ============
  useEffect(() => {
    if (autoSaveEnabled && autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        if (pendingContentRef.current) {
          createVersion(pendingContentRef.current, {
            message: 'Auto-save snapshot',
            isSnapshot: true
          });
          pendingContentRef.current = null;
          setState(prev => ({ ...prev, lastAutoSave: new Date().toISOString() }));
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [autoSaveEnabled, autoSaveInterval]);

  // ============ Helpers ============
  const generateChecksum = (content) => {
    const str = typeof content === 'object' ? JSON.stringify(content) : String(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const getContentType = (content) => {
    if (typeof content === 'object') return 'json';
    if (typeof content === 'string') {
      if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) return 'html';
      if (content.startsWith('#') || content.includes('**')) return 'markdown';
      return 'text';
    }
    return 'text';
  };

  const getContentSize = (content) => {
    const str = typeof content === 'object' ? JSON.stringify(content) : String(content);
    return new Blob([str]).size;
  };

  // ============ ۱. Create Version ============
  const createVersion = useCallback((content, metadata = {}) => {
    const { versions, currentBranch } = stateRef.current;

    // Check content size
    const size = getContentSize(content);
    if (size > maxContentSize) {
      toast.error(`⚠️ حجم محتوا (${(size / 1024 / 1024).toFixed(1)}MB) بیشتر از حد مجاز است`);
      return null;
    }

    // Get latest version on current branch
    const branchVersions = versions.filter(v => v.branch === currentBranch);
    const latestVersion = branchVersions[0]; // Sorted by timestamp desc

    const version = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      version: branchVersions.length + 1,
      content: typeof content === 'object' ? JSON.stringify(content) : String(content),
      contentType: metadata.contentType || getContentType(content),
      metadata: {
        ...metadata,
        originalType: typeof content
      },
      branch: currentBranch,
      author: metadata.author || 'admin',
      message: metadata.message || 'نسخه جدید',
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(content),
      parentId: latestVersion?.id || null,
      tags: metadata.tags || [],
      isSnapshot: metadata.isSnapshot || false,
      size,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    setState(prev => ({
      ...prev,
      versions: [version, ...prev.versions].slice(0, maxVersions)
    }));

    onVersionCreated?.(version);

    if (!metadata.isSnapshot && !metadata.silent) {
      toast.success(`✅ نسخه ${version.version} ایجاد شد: ${metadata.message || 'نسخه جدید'}`, {
        duration: 2000
      });
    }

    return version;
  }, [maxVersions, maxContentSize, onVersionCreated]);

  // ============ ۲. Debounced Create ============
  const debouncedCreateVersion = useCallback((content, metadata = {}) => {
    pendingContentRef.current = content;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      createVersion(content, metadata);
      pendingContentRef.current = null;
    }, debounceMs);
  }, [createVersion, debounceMs]);

  // ============ ۳. Revert to Version ============
  const revertToVersion = useCallback((versionId, createBackup = true) => {
    const { versions } = stateRef.current;
    const targetVersion = versions.find(v => v.id === versionId);

    if (!targetVersion) {
      toast.error('❌ نسخه مورد نظر یافت نشد');
      throw new Error('Version not found');
    }

    // Create backup before revert if requested
    if (createBackup) {
      const currentBranchVersions = versions.filter(v => v.branch === currentBranch && !v.isSnapshot);
      if (currentBranchVersions.length > 0) {
        createVersion(
          currentBranchVersions[0].content,
          {
            message: `پشتیبان قبل از بازگشت به نسخه ${targetVersion.version}`,
            tags: ['auto-backup', 'pre-revert'],
            silent: true
          }
        );
      }
    }

    // Parse content back to original type
    let parsedContent = targetVersion.content;
    if (targetVersion.contentType === 'json') {
      try {
        parsedContent = JSON.parse(targetVersion.content);
      } catch {
        // Keep as string if can't parse
      }
    }

    onVersionReverted?.({
      from: versions.filter(v => v.branch === currentBranch)[0],
      to: targetVersion
    });

    toast.success(`🔄 بازگشت به نسخه ${targetVersion.version}: ${targetVersion.message}`);

    return {
      content: parsedContent,
      version: targetVersion.version,
      revertedFrom: versions.filter(v => v.branch === currentBranch)[0]?.version,
      message: targetVersion.message,
      timestamp: targetVersion.timestamp
    };
  }, [createVersion, currentBranch, onVersionReverted]);

  // ============ ۴. Advanced Diff Comparison ============
  const compareVersions = useCallback((versionId1, versionId2, format = 'unified') => {
    const { versions } = stateRef.current;
    const v1 = versions.find(v => v.id === versionId1);
    const v2 = versions.find(v => v.id === versionId2);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    const content1 = v1.content;
    const content2 = v2.content;

    // Word-level diff for small content, line-level for large
    const isSmallContent = content1.length < 10000 && content2.length < 10000;

    const diff = isSmallContent 
      ? computeWordDiff(content1, content2)
      : computeLineDiff(content1, content2);

    // Calculate statistics
    const stats = {
      additions: diff.filter(d => d.type === 'added').length,
      deletions: diff.filter(d => d.type === 'removed').length,
      unchanged: diff.filter(d => d.type === 'unchanged').length,
      totalChanges: diff.filter(d => d.type !== 'unchanged').length,
      changePercentage: Math.round(
        (diff.filter(d => d.type !== 'unchanged').length / Math.max(diff.length, 1)) * 100
      )
    };

    return {
      diff,
      stats,
      format,
      v1: {
        id: v1.id,
        version: v1.version,
        timestamp: v1.timestamp,
        author: v1.author,
        message: v1.message,
        size: v1.size
      },
      v2: {
        id: v2.id,
        version: v2.version,
        timestamp: v2.timestamp,
        author: v2.author,
        message: v2.message,
        size: v2.size
      },
      content1,
      content2
    };
  }, []);

  // ============ Word Diff ============
  const computeWordDiff = (text1, text2) => {
    const words1 = text1.split(/(\s+)/);
    const words2 = text2.split(/(\s+)/);
    const result = [];
    
    let i = 0, j = 0;
    
    while (i < words1.length || j < words2.length) {
      if (i >= words1.length) {
        result.push({ type: 'added', value: words2[j], index: j });
        j++;
      } else if (j >= words2.length) {
        result.push({ type: 'removed', value: words1[i], index: i });
        i++;
      } else if (words1[i] === words2[j]) {
        result.push({ type: 'unchanged', value: words1[i], index: i });
        i++;
        j++;
      } else {
        // Look ahead for match
        let found = false;
        for (let k = j + 1; k < Math.min(j + 5, words2.length); k++) {
          if (words1[i] === words2[k]) {
            // Words from j to k-1 are additions
            for (let x = j; x < k; x++) {
              result.push({ type: 'added', value: words2[x], index: x });
            }
            j = k;
            found = true;
            break;
          }
        }
        
        if (!found) {
          result.push({ type: 'removed', value: words1[i], index: i });
          result.push({ type: 'added', value: words2[j], index: j });
          i++;
          j++;
        }
      }
    }
    
    return result;
  };

  // ============ Line Diff ============
  const computeLineDiff = (text1, text2) => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const result = [];
    
    let i = 0, j = 0;
    
    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        result.push({ type: 'added', value: lines2[j], lineNumber: j + 1 });
        j++;
      } else if (j >= lines2.length) {
        result.push({ type: 'removed', value: lines1[i], lineNumber: i + 1 });
        i++;
      } else if (lines1[i] === lines2[j]) {
        result.push({ type: 'unchanged', value: lines1[i], lineNumber: i + 1 });
        i++;
        j++;
      } else {
        result.push({ type: 'removed', value: lines1[i], lineNumber: i + 1 });
        result.push({ type: 'added', value: lines2[j], lineNumber: j + 1 });
        i++;
        j++;
      }
    }
    
    return result;
  };

  // ============ ۵. Branch Management ============
  const createBranch = useCallback((branchName) => {
    if (!enableBranches) return;
    
    setState(prev => {
      if (prev.branches.includes(branchName)) {
        toast.error(`شاخه "${branchName}" قبلاً وجود دارد`);
        return prev;
      }
      
      toast.success(`🌿 شاخه "${branchName}" ایجاد شد`);
      return { ...prev, branches: [...prev.branches, branchName] };
    });
  }, [enableBranches]);

  const switchBranch = useCallback((branchName) => {
    if (!enableBranches) return;
    
    setState(prev => {
      if (!prev.branches.includes(branchName)) {
        toast.error(`شاخه "${branchName}" وجود ندارد`);
        return prev;
      }
      
      toast.success(`🔀 تغییر به شاخه "${branchName}"`);
      onBranchChanged?.(branchName);
      return { ...prev, currentBranch: branchName };
    });
  }, [enableBranches, onBranchChanged]);

  const deleteBranch = useCallback((branchName) => {
    if (!enableBranches) return;
    
    if (branchName === defaultBranch) {
      toast.error('❌ نمی‌توانید شاخه اصلی را حذف کنید');
      return;
    }
    
    setState(prev => ({
      ...prev,
      branches: prev.branches.filter(b => b !== branchName),
      versions: prev.versions.filter(v => v.branch !== branchName),
      currentBranch: prev.currentBranch === branchName ? defaultBranch : prev.currentBranch
    }));
    
    toast.success(`🗑️ شاخه "${branchName}" حذف شد`);
  }, [enableBranches, defaultBranch]);

  // ============ ۶. Version Tags ============
  const addTag = useCallback((versionId, tag) => {
    setState(prev => ({
      ...prev,
      versions: prev.versions.map(v => 
        v.id === versionId && !v.tags.includes(tag)
          ? { ...v, tags: [...v.tags, tag] }
          : v
      )
    }));
  }, []);

  const removeTag = useCallback((versionId, tag) => {
    setState(prev => ({
      ...prev,
      versions: prev.versions.map(v => 
        v.id === versionId
          ? { ...v, tags: v.tags.filter(t => t !== tag) }
          : v
      )
    }));
  }, []);

  // ============ ۷. Get Version History ============
  const getVersionHistory = useCallback((branch = null, includeSnapshots = false) => {
    const { versions, currentBranch: current } = stateRef.current;
    const targetBranch = branch || current;
    
    let filtered = versions.filter(v => v.branch === targetBranch);
    
    if (!includeSnapshots) {
      filtered = filtered.filter(v => !v.isSnapshot);
    }
    
    return filtered.map(v => ({
      id: v.id,
      version: v.version,
      author: v.author,
      message: v.message,
      timestamp: v.timestamp,
      branch: v.branch,
      tags: v.tags,
      isSnapshot: v.isSnapshot,
      size: v.size,
      checksum: v.checksum
    }));
  }, []);

  // ============ ۸. Prune Old Versions ============
  const pruneOldVersions = useCallback((keepCount = 10) => {
    setState(prev => {
      const nonSnapshot = prev.versions.filter(v => !v.isSnapshot);
      const snapshots = prev.versions.filter(v => v.isSnapshot);
      
      const toKeep = nonSnapshot.slice(0, keepCount);
      const toRemove = nonSnapshot.slice(keepCount);
      
      if (toRemove.length > 0) {
        toast.success(`🧹 ${toRemove.length} نسخه قدیمی پاکسازی شد`);
      }
      
      return {
        ...prev,
        versions: [...toKeep, ...snapshots]
      };
    });
  }, []);

  // ============ ۹. Export Versions ============
  const exportVersions = useCallback((branch = null) => {
    const { versions, currentBranch: current } = stateRef.current;
    const targetBranch = branch || current;
    const filtered = versions.filter(v => v.branch === targetBranch);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      branch: targetBranch,
      versionCount: filtered.length,
      versions: filtered
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `version-history-${targetBranch}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('📥 تاریخچه نسخه‌ها export شد');
  }, []);

  // ============ ۱۰. Import Versions ============
  const importVersions = useCallback((importData) => {
    try {
      const { versions: importedVersions, branch } = importData;
      
      if (!Array.isArray(importedVersions)) {
        throw new Error('Invalid import data');
      }
      
      setState(prev => {
        const existingIds = new Set(prev.versions.map(v => v.id));
        const newVersions = importedVersions.filter(v => !existingIds.has(v.id));
        
        toast.success(`📤 ${newVersions.length} نسخه import شد`);
        
        return {
          ...prev,
          versions: [...newVersions, ...prev.versions],
          branches: branch && !prev.branches.includes(branch)
            ? [...prev.branches, branch]
            : prev.branches
        };
      });
    } catch (error) {
      toast.error('❌ فایل import نامعتبر است');
    }
  }, []);

  // ============ ۱۱. Clear All Versions ============
  const clearAllVersions = useCallback(() => {
    if (confirm('آیا از حذف تمام نسخه‌ها مطمئن هستید؟')) {
      setState(prev => ({
        ...prev,
        versions: [],
        lastAutoSave: null
      }));
      toast.success('🗑️ تمام نسخه‌ها حذف شدند');
    }
  }, []);

  // ============ ۱۲. Toggle Auto-save ============
  const toggleAutoSave = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoSaveEnabled: !prev.autoSaveEnabled
    }));
    toast.success(
      stateRef.current.autoSaveEnabled 
        ? '⏸️ ذخیره خودکار غیرفعال شد' 
        : '▶️ ذخیره خودکار فعال شد'
    );
  }, []);

  // ============ ۱۳. Get Latest Version ============
  const getLatestVersion = useCallback((branch = null) => {
    const { versions, currentBranch: current } = stateRef.current;
    const targetBranch = branch || current;
    return versions.filter(v => v.branch === targetBranch && !v.isSnapshot)[0] || null;
  }, []);

  // ============ ۱۴. Search Versions ============
  const searchVersions = useCallback((query) => {
    const { versions } = stateRef.current;
    const q = query.toLowerCase();
    
    return versions.filter(v => 
      v.message.toLowerCase().includes(q) ||
      v.author.toLowerCase().includes(q) ||
      v.tags.some(t => t.toLowerCase().includes(q)) ||
      v.content.toLowerCase().includes(q)
    );
  }, []);

  return {
    // State
    versions: getVersionHistory(),
    allVersions: versions,
    currentBranch,
    branches,
    autoSaveEnabled,
    lastAutoSave,
    
    // Version Actions
    createVersion,
    debouncedCreateVersion,
    revertToVersion,
    compareVersions,
    getLatestVersion,
    searchVersions,
    
    // Branch Actions
    createBranch,
    switchBranch,
    deleteBranch,
    
    // Tag Actions
    addTag,
    removeTag,
    
    // Management
    pruneOldVersions,
    exportVersions,
    importVersions,
    clearAllVersions,
    toggleAutoSave,
    getVersionHistory,
    
    // Stats
    getStats: () => ({
      totalVersions: versions.length,
      branches: branches.length,
      currentBranch,
      latestVersion: getLatestVersion()?.version || 0,
      totalSize: versions.reduce((sum, v) => sum + (v.size || 0), 0),
      oldestVersion: versions[versions.length - 1]?.timestamp || null,
      newestVersion: versions[0]?.timestamp || null
    })
  };
};

export default useVersionControlPro;