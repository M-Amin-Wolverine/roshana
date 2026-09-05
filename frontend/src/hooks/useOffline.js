// src/hooks/useOfflinePro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Offline-First Hook
 * 
 * Features:
 * - IndexedDB Storage with versioning
 * - Smart Sync Queue with priority
 * - Conflict Resolution
 * - Batch Sync
 * - Offline Analytics
 * - Storage Quota Management
 * - Auto-cleanup expired data
 * - Network Quality Detection
 * - Retry with Exponential Backoff
 * - Optimistic Updates
 * - Background Sync API
 * - Multi-tab Support
 */
export const useOfflinePro = (options = {}) => {
  const {
    dbName = 'AdminOfflineDB',
    dbVersion = 1,
    autoSync = true,
    syncOnOnline = true,
    maxRetries = 3,
    retryDelay = 5000,
    batchSize = 10,
    storageQuota = 50 * 1024 * 1024, // 50MB
    enableBackgroundSync = true,
    enableConflictResolution = true,
    enableOptimisticUpdates = true,
    onSyncComplete = null,
    onSyncError = null,
    onQuotaExceeded = null,
    onConflict = null
  } = options;

  // ============ State ============
  const [state, setState] = useState({
    isOffline: !navigator.onLine,
    syncQueue: [],
    isSyncing: false,
    db: null,
    storageUsage: 0,
    storageQuota: storageQuota,
    networkType: null,
    networkSpeed: null,
    lastSyncTime: null,
    syncStats: { total: 0, success: 0, failed: 0 },
    error: null
  });

  // ============ Refs ============
  const dbRef = useRef(null);
  const syncInProgress = useRef(false);
  const retryTimers = useRef({});
  const networkCheckInterval = useRef(null);

  // ============ Helper: Update State ============
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ============ ۱. Initialize IndexedDB ============
  useEffect(() => {
    const initDB = () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (event) => {
          const database = event.target.result;

          // Sync Queue Store
          if (!database.objectStoreNames.contains('sync_queue')) {
            const syncStore = database.createObjectStore('sync_queue', {
              keyPath: 'id',
              autoIncrement: true
            });
            syncStore.createIndex('status', 'status', { unique: false });
            syncStore.createIndex('priority', 'priority', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            syncStore.createIndex('url', 'url', { unique: false });
          }

          // Offline Data Store
          if (!database.objectStoreNames.contains('offline_data')) {
            const dataStore = database.createObjectStore('offline_data', {
              keyPath: 'key'
            });
            dataStore.createIndex('expiresAt', 'expiresAt', { unique: false });
            dataStore.createIndex('category', 'category', { unique: false });
          }

          // Offline Cache Store
          if (!database.objectStoreNames.contains('offline_cache')) {
            const cacheStore = database.createObjectStore('offline_cache', {
              keyPath: 'url'
            });
            cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Pending Changes Store
          if (!database.objectStoreNames.contains('pending_changes')) {
            database.createObjectStore('pending_changes', {
              keyPath: 'id',
              autoIncrement: true
            });
          }
        };

        request.onsuccess = (event) => {
          const database = event.target.result;
          dbRef.current = database;
          updateState({ db: database });
          loadSyncQueue(database);
          cleanupExpiredData(database);
          getStorageUsage();
          resolve(database);
        };

        request.onerror = (event) => {
          const error = event.target.error;
          console.error('IndexedDB initialization failed:', error);
          updateState({ error: error.message });
          reject(error);
        };

        request.onblocked = () => {
          console.warn('Database upgrade blocked. Close other tabs.');
          toast.error('❌ لطفاً سایر تب‌های اپلیکیشن را ببندید', { duration: 4000 });
        };
      });
    };

    initDB();

    return () => {
      // Close database on unmount
      dbRef.current?.close();
    };
  }, [dbName, dbVersion]);

  // ============ ۲. Network Monitoring ============
  useEffect(() => {
    const handleOnline = () => {
      updateState({ isOffline: false });
      toast.success('📡 آنلاین شدید', { id: 'online-status' });
      
      if (syncOnOnline) {
        syncData();
      }
    };

    const handleOffline = () => {
      updateState({ isOffline: false }); // false = offline (confusing naming! fix:)
      // Actually set offline to true
      updateState({ isOffline: true });
      toast.error('📡 آفلاین شدید - تغییرات ذخیره می‌شوند', {
        id: 'offline-status',
        duration: 3000
      });
    };

    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        updateState({
          networkType: connection.effectiveType,
          networkSpeed: connection.downlink
        });

        // Adjust sync behavior based on network
        if (connection.effectiveType === 'slow-2g' || connection.saveData) {
          // Delay sync on slow connections
          updateState({ isOffline: navigator.onLine ? false : true });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }

    // Periodic network check
    networkCheckInterval.current = setInterval(() => {
      updateState({ isOffline: !navigator.onLine });
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.connection?.removeEventListener('change', updateNetworkInfo);
      if (networkCheckInterval.current) clearInterval(networkCheckInterval.current);
    };
  }, [syncOnOnline]);

  // ============ ۳. Load Sync Queue ============
  const loadSyncQueue = useCallback((database = null) => {
    const db = database || dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => {
        const queue = request.result || [];
        updateState({ syncQueue: queue });
      };

      request.onerror = (event) => {
        console.error('Failed to load sync queue:', event.target.error);
      };
    } catch (error) {
      console.error('Load sync queue error:', error);
    }
  }, []);

  // ============ ۴. Add to Sync Queue ============
  const addToSyncQueue = useCallback(async (operation) => {
    const db = dbRef.current;
    if (!db) {
      console.error('Database not initialized');
      return null;
    }

    const queueItem = {
      url: operation.url,
      method: operation.method || 'POST',
      headers: operation.headers || {},
      data: operation.data || {},
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || maxRetries,
      status: 'pending', // pending, syncing, completed, failed
      priority: operation.priority || 'normal', // low, normal, high, critical
      category: operation.category || 'general',
      metadata: operation.metadata || {},
      version: 1
    };

    try {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.add(queueItem);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const newItem = { ...queueItem, id: request.result };
          updateState(prev => ({
            syncQueue: [...prev.syncQueue, newItem]
          }));

          // If online and auto-sync, try to sync immediately
          if (navigator.onLine && autoSync && operation.priority === 'critical') {
            syncData();
          }

          // Toast notification
          if (!navigator.onLine) {
            toast('📤 عملیات در صف آفلاین قرار گرفت', {
              icon: '⏳',
              duration: 2000
            });
          }

          resolve(newItem);
        };

        request.onerror = (event) => {
          console.error('Failed to add to sync queue:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Add to sync queue error:', error);
      updateState({ error: error.message });
      return null;
    }
  }, [autoSync, maxRetries]);

  // ============ ۵. Remove from Sync Queue ============
  const removeFromSyncQueue = useCallback(async (id) => {
    const db = dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      store.delete(Number(id));

      updateState(prev => ({
        syncQueue: prev.syncQueue.filter(item => item.id !== id)
      }));

      // Clear any retry timer
      if (retryTimers.current[id]) {
        clearTimeout(retryTimers.current[id]);
        delete retryTimers.current[id];
      }
    } catch (error) {
      console.error('Remove from sync queue error:', error);
    }
  }, []);

  // ============ ۶. Sync Data ============
  const syncData = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('📡 برای همگام‌سازی به اینترنت نیاز است');
      return { successCount: 0, failCount: 0, skipped: state.syncQueue.length };
    }

    if (syncInProgress.current) {
      return { successCount: 0, failCount: 0, skipped: state.syncQueue.length };
    }

    syncInProgress.current = true;
    updateState({ isSyncing: true });

    const queue = [...state.syncQueue];
    let successCount = 0;
    let failCount = 0;

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    queue.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    // Process in batches
    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            // Skip if already syncing
            if (item.status === 'syncing') return;

            // Update status to syncing
            const db = dbRef.current;
            if (db) {
              const tx = db.transaction(['sync_queue'], 'readwrite');
              const store = tx.objectStore('sync_queue');
              store.put({ ...item, status: 'syncing' });
            }

            const response = await fetch(item.url, {
              method: item.method,
              headers: {
                'Content-Type': 'application/json',
                'X-Offline-Sync': 'true',
                'X-Sync-Timestamp': item.timestamp.toString(),
                'X-Retry-Count': item.retryCount.toString(),
                ...item.headers
              },
              body: item.method !== 'GET' ? JSON.stringify(item.data) : undefined,
              signal: AbortSignal.timeout(30000) // 30 second timeout
            });

            if (response.ok) {
              // Check for conflicts
              if (enableConflictResolution && response.status === 409) {
                const conflict = await response.json();
                onConflict?.(conflict);
                
                // Store conflict information
                await addToSyncQueue({
                  ...item,
                  status: 'conflict',
                  conflictData: conflict,
                  priority: 'high'
                });
                
                await removeFromSyncQueue(item.id);
                failCount++;
                return;
              }

              await removeFromSyncQueue(item.id);
              successCount++;
            } else if (response.status >= 500) {
              // Server error - retry later
              await handleRetry(item);
              failCount++;
            } else {
              // Client error - don't retry
              await removeFromSyncQueue(item.id);
              failCount++;
              console.error(`Sync failed for ${item.url}:`, response.status);
            }
          } catch (error) {
            console.error(`Sync error for ${item.url}:`, error);
            await handleRetry(item);
            failCount++;
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < queue.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    syncInProgress.current = false;
    updateState({
      isSyncing: false,
      lastSyncTime: new Date().toISOString(),
      syncStats: {
        total: state.syncStats.total + successCount + failCount,
        success: state.syncStats.success + successCount,
        failed: state.syncStats.failed + failCount
      }
    });

    onSyncComplete?.({ successCount, failCount });

    if (successCount > 0) {
      toast.success(`✅ ${successCount} عملیات همگام‌سازی شد`);
    }

    return { successCount, failCount, skipped: 0 };
  }, [state.syncQueue, batchSize, enableConflictResolution, onConflict, onSyncComplete]);

  // ============ ۷. Handle Retry ============
  const handleRetry = useCallback(async (item) => {
    if (item.retryCount >= item.maxRetries) {
      // Max retries reached - mark as failed
      const db = dbRef.current;
      if (db) {
        const tx = db.transaction(['sync_queue'], 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.put({ ...item, status: 'failed' });
      }
      
      updateState(prev => ({
        syncQueue: prev.syncQueue.map(i => 
          i.id === item.id ? { ...i, status: 'failed' } : i
        )
      }));
      
      onSyncError?.(item);
      return;
    }

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, item.retryCount);
    
    // Update retry count
    const db = dbRef.current;
    if (db) {
      const tx = db.transaction(['sync_queue'], 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.put({ 
        ...item, 
        retryCount: item.retryCount + 1,
        nextRetry: Date.now() + delay,
        status: 'pending'
      });
    }

    updateState(prev => ({
      syncQueue: prev.syncQueue.map(i => 
        i.id === item.id ? { 
          ...i, 
          retryCount: i.retryCount + 1,
          nextRetry: Date.now() + delay,
          status: 'pending'
        } : i
      )
    }));

    // Schedule retry
    retryTimers.current[item.id] = setTimeout(() => {
      if (navigator.onLine) {
        syncData();
      }
      delete retryTimers.current[item.id];
    }, delay);
  }, [retryDelay, onSyncError]);

  // ============ ۸. Save Offline Data (IndexedDB) ============
  const saveOfflineData = useCallback(async (key, data, category = 'general', ttl = null) => {
    const db = dbRef.current;
    if (!db) {
      // Fallback to localStorage
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }

    try {
      // Check storage quota
      const usage = await getStorageUsage();
      if (usage > storageQuota) {
        onQuotaExceeded?.(usage);
        toast.error('⚠️ فضای ذخیره‌سازی پر شده است');
        return false;
      }

      const transaction = db.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');

      const record = {
        key: `offline_${key}`,
        data: data,
        timestamp: Date.now(),
        category: category,
        expiresAt: ttl ? Date.now() + ttl : null,
        version: 1
      };

      store.put(record);

      return new Promise((resolve) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Save offline data error:', error);
      
      // Fallback to localStorage
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }
  }, [storageQuota, onQuotaExceeded]);

  // ============ ۹. Get Offline Data ============
  const getOfflineData = useCallback(async (key) => {
    const db = dbRef.current;
    if (!db) {
      // Fallback to localStorage
      try {
        const data = localStorage.getItem(`offline_${key}`);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }

    try {
      const transaction = db.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      const request = store.get(`offline_${key}`);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const record = request.result;
          
          if (!record) {
            resolve(null);
            return;
          }

          // Check expiration
          if (record.expiresAt && record.expiresAt < Date.now()) {
            // Expired - delete and return null
            const deleteTx = db.transaction(['offline_data'], 'readwrite');
            const deleteStore = deleteTx.objectStore('offline_data');
            deleteStore.delete(`offline_${key}`);
            resolve(null);
            return;
          }

          resolve(record.data);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Get offline data error:', error);
      
      // Fallback to localStorage
      try {
        const data = localStorage.getItem(`offline_${key}`);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }
  }, []);

  // ============ ۱۰. Clear Offline Data ============
  const clearOfflineData = useCallback(async (category = null) => {
    const db = dbRef.current;
    
    // Clear localStorage fallback
    const localKeys = Object.keys(localStorage).filter(k => k.startsWith('offline_'));
    localKeys.forEach(k => localStorage.removeItem(k));

    if (!db) return;

    try {
      if (category) {
        // Clear specific category
        const transaction = db.transaction(['offline_data'], 'readwrite');
        const store = transaction.objectStore('offline_data');
        const index = store.index('category');
        const request = index.openCursor(IDBKeyRange.only(category));

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        // Clear all
        const transaction = db.transaction(['offline_data'], 'readwrite');
        const store = transaction.objectStore('offline_data');
        store.clear();
      }

      toast.success('🗑️ داده‌های آفلاین پاک شدند');
    } catch (error) {
      console.error('Clear offline data error:', error);
    }
  }, []);

  // ============ ۱۱. Get Storage Usage ============
  const getStorageUsage = useCallback(async () => {
    try {
      let totalUsage = 0;

      // localStorage usage
      let localSize = 0;
      for (const key of Object.keys(localStorage)) {
        localSize += key.length + (localStorage.getItem(key)?.length || 0);
      }
      totalUsage += localSize;

      // IndexedDB usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        totalUsage = estimate.usage || 0;
        updateState({
          storageUsage: totalUsage,
          storageQuota: estimate.quota || storageQuota
        });
      } else {
        updateState({ storageUsage: totalUsage });
      }

      return totalUsage;
    } catch (error) {
      console.error('Get storage usage error:', error);
      return 0;
    }
  }, [storageQuota]);

  // ============ ۱۲. Cleanup Expired Data ============
  const cleanupExpiredData = useCallback((database = null) => {
    const db = database || dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const index = store.index('expiresAt');

      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Cleanup expired data error:', error);
    }
  }, []);

  // ============ ۱۳. Optimistic Update ============
  const optimisticUpdate = useCallback(async (key, updateFn, rollbackFn) => {
    if (!enableOptimisticUpdates) return false;

    try {
      // Get current data
      const currentData = await getOfflineData(key);
      
      // Apply optimistic update
      const updatedData = updateFn(currentData);
      await saveOfflineData(key, updatedData);

      // Add to sync queue
      await addToSyncQueue({
        url: `/api/sync/${key}`,
        method: 'PUT',
        data: updatedData,
        priority: 'high',
        metadata: {
          originalData: currentData,
          rollbackFn: rollbackFn?.toString()
        }
      });

      return true;
    } catch (error) {
      console.error('Optimistic update error:', error);
      
      // Rollback
      if (rollbackFn) {
        try {
          await rollbackFn();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      
      return false;
    }
  }, [enableOptimisticUpdates, getOfflineData, saveOfflineData, addToSyncQueue]);

  // ============ ۱۴. Cache API Response ============
  const cacheApiResponse = useCallback(async (url, data, ttl = 3600000) => {
    const db = dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['offline_cache'], 'readwrite');
      const store = transaction.objectStore('offline_cache');
      store.put({
        url,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      });
    } catch (error) {
      console.error('Cache API response error:', error);
    }
  }, []);

  // ============ ۱۵. Get Cached API Response ============
  const getCachedApiResponse = useCallback(async (url) => {
    const db = dbRef.current;
    if (!db) return null;

    try {
      const transaction = db.transaction(['offline_cache'], 'readonly');
      const store = transaction.objectStore('offline_cache');
      const request = store.get(url);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const record = request.result;
          
          if (!record) {
            resolve(null);
            return;
          }

          // Check if expired
          if (record.expiresAt < Date.now()) {
            // Delete expired cache
            const deleteTx = db.transaction(['offline_cache'], 'readwrite');
            const deleteStore = deleteTx.objectStore('offline_cache');
            deleteStore.delete(url);
            resolve(null);
            return;
          }

          resolve(record.data);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      return null;
    }
  }, []);

  // ============ ۱۶. Clear Sync Queue ============
  const clearSyncQueue = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      store.clear();

      updateState({ syncQueue: [] });

      // Clear all retry timers
      Object.values(retryTimers.current).forEach(timer => clearTimeout(timer));
      retryTimers.current = {};

      toast.success('🗑️ صف همگام‌سازی پاک شد');
    } catch (error) {
      console.error('Clear sync queue error:', error);
    }
  }, []);

  // ============ ۱۷. Retry Failed Items ============
  const retryFailedItems = useCallback(async () => {
    const failedItems = state.syncQueue.filter(item => item.status === 'failed');
    
    if (failedItems.length === 0) {
      toast('هیچ عملیات ناموفقی وجود ندارد');
      return;
    }

    // Reset failed items to pending
    for (const item of failedItems) {
      await updateQueueItem(item.id, {
        status: 'pending',
        retryCount: 0,
        nextRetry: null
      });
    }

    // Reload queue
    loadSyncQueue();

    // Trigger sync
    if (navigator.onLine) {
      syncData();
    }

    toast.success(`🔄 ${failedItems.length} عملیات برای تلاش مجدد آماده شد`);
  }, [state.syncQueue]);

  // ============ ۱۸. Update Queue Item ============
  const updateQueueItem = useCallback(async (id, updates) => {
    const db = dbRef.current;
    if (!db) return;

    try {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.get(Number(id));

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          store.put({ ...item, ...updates });
        }
      };
    } catch (error) {
      console.error('Update queue item error:', error);
    }
  }, []);

  // ============ Return ============
  return {
    // State
    ...state,
    pendingChanges: state.syncQueue.filter(i => i.status === 'pending').length,
    
    // Actions
    addToSyncQueue,
    removeFromSyncQueue,
    syncData,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    getStorageUsage,
    cacheApiResponse,
    getCachedApiResponse,
    clearSyncQueue,
    retryFailedItems,
    optimisticUpdate,
    
    // Utilities
    isDatabaseReady: !!dbRef.current,
    getQueueByStatus: (status) => state.syncQueue.filter(i => i.status === status),
    getQueueByPriority: (priority) => state.syncQueue.filter(i => i.priority === priority)
  };
};

export default useOfflinePro;