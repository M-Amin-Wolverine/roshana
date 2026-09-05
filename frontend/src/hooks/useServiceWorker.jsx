// src/hooks/useServiceWorkerPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Service Worker Hook
 * 
 * Features:
 * - Service Worker Lifecycle Management
 * - Update Detection & Auto-Update
 * - Background Sync
 * - Periodic Background Sync
 * - Push Notifications
 * - Cache Management
 * - Offline Analytics
 * - App Install Prompt
 * - Connection Status
 * - Performance Monitoring
 */
export const useServiceWorkerPro = (options = {}) => {
  const {
    autoUpdate = false,           // آپدیت خودکار
    notifyUpdate = true,          // نوتیفیکیشن آپدیت
    enableBackgroundSync = true,  // همگام‌سازی پس‌زمینه
    enablePushNotifications = false, // نوتیفیکیشن Push
    enablePeriodicSync = false,   // همگام‌سازی دوره‌ای
    enableOfflineAnalytics = true, // آنالیتیکس آفلاین
    cacheStrategy = 'stale-while-revalidate', // استراتژی کش
    precacheUrls = [],            // URLهای پیش‌کش
    onUpdateAvailable = null,     // کالبک آپدیت
    onCachingComplete = null,     // کالبک کش کامل
    onNetworkChange = null,       // کالبک تغییر شبکه
  } = options;

  // ============ State ============
  const [state, setState] = useState({
    registration: null,
    updateAvailable: false,
    cachingComplete: false,
    isOnline: navigator.onLine,
    connectionType: null,
    connectionSpeed: null,
    installPrompt: null,
    canInstall: false,
    pushSubscription: null,
    syncTags: [],
    cacheStats: { total: 0, used: 0, quota: 0 },
    lastUpdateCheck: null,
    updateProgress: 0,
    error: null,
    isLoading: true
  });

  // ============ Refs ============
  const updateCheckInterval = useRef(null);
  const connectionCheckInterval = useRef(null);
  const offlineQueue = useRef([]);
  const metricsRef = useRef({ swStartTime: 0, swReadyTime: 0, cacheHitRate: 0 });

  // ============ Helper: Update State ============
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ============ Helper: Log/Metric ============
  const logMetric = useCallback((name, value) => {
    if (enableOfflineAnalytics) {
      metricsRef.current[name] = value;
      // In real app: Send to analytics
      navigator.serviceWorker?.controller?.postMessage({
        type: 'METRIC',
        name,
        value,
        timestamp: Date.now()
      });
    }
  }, [enableOfflineAnalytics]);

  // ============ ۱. Connection Monitoring ============
  const monitorConnection = useCallback(() => {
    const updateConnectionInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        updateState({
          connectionType: connection.effectiveType, // 4g, 3g, 2g, slow-2g
          connectionSpeed: connection.downlink,      // Mbps
          isOnline: navigator.onLine && connection.effectiveType !== 'slow-2g'
        });
        
        onNetworkChange?.({
          type: connection.effectiveType,
          speed: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      } else {
        updateState({ isOnline: navigator.onLine });
      }
    };

    updateConnectionInfo();

    window.addEventListener('online', () => {
      updateState({ isOnline: true });
      updateConnectionInfo();
      toast.success('📡 آنلاین شدید');
      syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      updateState({ isOnline: false });
      toast.error('📡 آفلاین شدید', { id: 'offline-toast' });
    });

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateConnectionInfo);
      window.removeEventListener('offline', updateConnectionInfo);
      navigator.connection?.removeEventListener('change', updateConnectionInfo);
    };
  }, [onNetworkChange]);

  // ============ ۲. Service Worker Registration ============
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      updateState({ error: 'Service Worker not supported', isLoading: false });
      return null;
    }

    try {
      metricsRef.current.swStartTime = performance.now();
      updateState({ isLoading: true });

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // همیشه از شبکه چک کن
        type: 'module'          // استفاده از ES modules
      });

      const swReadyTime = performance.now() - metricsRef.current.swStartTime;
      metricsRef.current.swReadyTime = swReadyTime;
      logMetric('sw_ready_time', swReadyTime);

      updateState({ registration: reg });

      // ============ Handle Waiting Worker ============
      if (reg.waiting) {
        handleWaitingWorker(reg.waiting);
      }

      // ============ Handle Installing Worker ============
      if (reg.installing) {
        handleInstallingWorker(reg.installing);
      }

      // ============ Listen for New Updates ============
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          handleInstallingWorker(newWorker);
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleWaitingWorker(newWorker);
            }
          });
        }
      });

      // ============ Listen for Controller Change ============
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logMetric('sw_activated', Date.now());
        
        if (autoUpdate) {
          window.location.reload();
        } else {
          toast.success('✨ نسخه جدید فعال شد! صفحه را رفرش کنید.', {
            duration: 5000,
            action: {
              label: 'رفرش',
              onClick: () => window.location.reload()
            }
          });
        }
      });

      // ============ Listen for Messages ============
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      // ============ Setup Background Sync ============
      if (enableBackgroundSync) {
        await setupBackgroundSync(reg);
      }

      // ============ Setup Periodic Sync ============
      if (enablePeriodicSync) {
        await setupPeriodicSync(reg);
      }

      // ============ Setup Push Notifications ============
      if (enablePushNotifications) {
        await setupPushNotifications(reg);
      }

      updateState({ isLoading: false });
      logMetric('sw_registered', Date.now());

      return reg;

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      updateState({ error: error.message, isLoading: false });
      logMetric('sw_error', error.message);
      return null;
    }
  }, [
    autoUpdate, enableBackgroundSync, enablePeriodicSync, 
    enablePushNotifications, logMetric
  ]);

  // ============ Handle Installing Worker ============
  const handleInstallingWorker = useCallback((worker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        logMetric('sw_installed', Date.now());
        
        // Track update progress
        updateState({ updateProgress: 50 });
      }
    });
  }, [logMetric]);

  // ============ Handle Waiting Worker ============
  const handleWaitingWorker = useCallback((worker) => {
    updateState({ 
      updateAvailable: true,
      updateProgress: 100 
    });
    
    logMetric('update_available', Date.now());
    
    if (notifyUpdate) {
      const updateToast = toast(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>🔄 نسخه جدید آماده است!</strong>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              برای دریافت آخرین تغییرات، اپلیکیشن را به‌روزرسانی کنید.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => {
                  updateApp();
                  toast.dismiss(t.id);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                🔄 به‌روزرسانی
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#334155',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                بعداً
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );
    }
    
    onUpdateAvailable?.({
      version: worker.scriptURL,
      timestamp: Date.now()
    });

    if (autoUpdate) {
      // Auto update after 5 seconds
      setTimeout(() => updateApp(), 5000);
    }
  }, [autoUpdate, notifyUpdate, onUpdateAvailable]);

  // ============ Handle SW Messages ============
  const handleSWMessage = useCallback((event) => {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHING_COMPLETE':
        updateState({ cachingComplete: true });
        onCachingComplete?.();
        toast.success('📦 تمام فایل‌ها کش شد - آماده کار آفلاین!', { id: 'cache-complete' });
        logMetric('caching_complete', Date.now());
        break;

      case 'CACHING_PROGRESS':
        updateState({ updateProgress: data.progress });
        break;

      case 'CACHE_STATS':
        updateState({ cacheStats: data.stats });
        break;

      case 'BACKGROUND_SYNC_COMPLETE':
        toast.success('🔄 همگام‌سازی انجام شد', { id: 'sync-complete' });
        break;

      case 'BACKGROUND_SYNC_FAILED':
        toast.error('❌ خطا در همگام‌سازی', { id: 'sync-failed' });
        break;

      case 'OFFLINE_ACTION_QUEUED':
        offlineQueue.current.push(data.action);
        toast('📤 عملیات در صف آفلاین قرار گرفت', { 
          icon: '⏳',
          id: 'offline-queue' 
        });
        break;

      case 'PUSH_NOTIFICATION_CLICKED':
        // Handle notification click
        if (data.url) {
          window.location.href = data.url;
        }
        break;

      case 'NETWORK_STATUS':
        updateState({ 
          isOnline: data.online,
          connectionType: data.type 
        });
        break;

      default:
        break;
    }
  }, [onCachingComplete, logMetric]);

  // ============ ۳. Background Sync Setup ============
  const setupBackgroundSync = useCallback(async (reg) => {
    if (!('sync' in reg)) return;

    const syncTags = [
      'sync-messages',
      'sync-uploads',
      'sync-settings',
      'sync-analytics'
    ];

    for (const tag of syncTags) {
      try {
        await reg.sync.register(tag);
        updateState(prev => ({ 
          syncTags: [...prev.syncTags, tag] 
        }));
      } catch (error) {
        console.warn(`Background sync '${tag}' failed:`, error);
      }
    }
  }, []);

  // ============ ۴. Periodic Sync Setup ============
  const setupPeriodicSync = useCallback(async (reg) => {
    if (!('periodicSync' in reg)) return;

    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync'
      });

      if (status.state === 'granted') {
        await reg.periodicSync.register('content-sync', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
      }
    } catch (error) {
      console.warn('Periodic sync failed:', error);
    }
  }, []);

  // ============ ۵. Push Notifications Setup ============
  const setupPushNotifications = useCallback(async (reg) => {
    if (!('PushManager' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with your key
        
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        updateState({ pushSubscription: subscription });
        logMetric('push_subscribed', Date.now());

        // Send subscription to server
        await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    } catch (error) {
      console.warn('Push notification setup failed:', error);
    }
  }, [logMetric]);

  // ============ ۶. App Install Prompt ============
  const captureInstallPrompt = useCallback(() => {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      updateState({ 
        installPrompt: event,
        canInstall: true 
      });
    });

    window.addEventListener('appinstalled', () => {
      updateState({ 
        installPrompt: null,
        canInstall: false 
      });
      logMetric('app_installed', Date.now());
      toast.success('✅ اپلیکیشن نصب شد!');
    });
  }, [logMetric]);

  // ============ ۷. Cache Management ============
  const getCacheStats = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      updateState({
        cacheStats: {
          total: estimate.quota || 0,
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
        }
      });
    }
  }, []);

  // ============ ۸. Offline Queue Sync ============
  const syncOfflineQueue = useCallback(async () => {
    if (offlineQueue.current.length === 0) return;

    const queue = [...offlineQueue.current];
    offlineQueue.current = [];

    for (const action of queue) {
      try {
        postMessage({ type: 'SYNC_ACTION', action });
      } catch (error) {
        offlineQueue.current.push(action); // Re-queue
        console.error('Sync failed:', error);
      }
    }
  }, []);

  // ============ ۹. Clear All Caches ============
  const clearAllCaches = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      updateState({ cachingComplete: false });
      toast.success('🗑️ تمام کش‌ها پاک شدند');
    }
  }, []);

  // ============ ۱۰. Update App ============
  const updateApp = useCallback(() => {
    const { registration } = state;

    if (registration?.waiting) {
      // Send skip waiting message
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      let reloadTimeout;
      
      registration.waiting.addEventListener('statechange', (event) => {
        if (event.target.state === 'activated') {
          // Clear timeout for safety
          if (reloadTimeout) clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            updateState({ updateAvailable: false });
            window.location.reload();
          }, 100);
        }
      });

      // Backup: Set timeout in case service worker doesn't activate
      reloadTimeout = setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else if (registration?.installing) {
      registration.installing.addEventListener('statechange', (event) => {
        if (event.target.state === 'activated') {
          window.location.reload();
        }
      });
    }
  }, [state.registration]);

  // ============ ۱۱. Unregister ============
  const unregister = useCallback(async () => {
    const { registration } = state;
    
    if (registration) {
      const success = await registration.unregister();
      
      if (success) {
        updateState({ 
          registration: null, 
          updateAvailable: false,
          cachingComplete: false
        });
        toast.success('Service Worker غیرفعال شد');
      } else {
        toast.error('خطا در غیرفعال‌سازی Service Worker');
      }
      
      return success;
    }
    return false;
  }, [state.registration]);

  // ============ ۱۲. Check For Updates ============
  const checkForUpdates = useCallback(async () => {
    const { registration } = state;
    
    if (registration) {
      try {
        await registration.update();
        updateState({ lastUpdateCheck: new Date().toISOString() });
        logMetric('update_check', Date.now());
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }
  }, [state.registration, logMetric]);

  // ============ ۱۳. Post Message ============
  const postMessage = useCallback((message) => {
    const { registration } = state;
    
    if (registration?.active) {
      registration.active.postMessage(message);
    } else if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }, [state.registration]);

  // ============ ۱۴. Install App ============
  const installApp = useCallback(async () => {
    const { installPrompt } = state;
    
    if (!installPrompt) return;
    
    installPrompt.prompt();
    
    const { outcome } = await installPrompt.userChoice;
    logMetric('install_choice', outcome);
    
    updateState({ installPrompt: null });
    
    return outcome;
  }, [state.installPrompt, logMetric]);

  // ============ ۱۵. Add to Offline Queue ============
  const addToOfflineQueue = useCallback((action) => {
    offlineQueue.current.push({
      ...action,
      timestamp: Date.now(),
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Notify service worker
    postMessage({ 
      type: 'OFFLINE_ACTION_QUEUED', 
      action 
    });
  }, [postMessage]);

  // ============ ۱۶. Get Offline Queue ============
  const getOfflineQueue = useCallback(() => {
    return [...offlineQueue.current];
  }, []);

  // ============ ۱۷. Clear Offline Queue ============
  const clearOfflineQueue = useCallback(() => {
    offlineQueue.current = [];
  }, []);

  // ============ ۱۸. Get Metrics ============
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // ============ Initialization ============
  useEffect(() => {
    let cleanup;

    const init = async () => {
      // Register SW
      const reg = await registerServiceWorker();
      
      if (reg) {
        // Monitor connection
        cleanup = monitorConnection();
        
        // Capture install prompt
        captureInstallPrompt();
        
        // Get initial cache stats
        getCacheStats();

        // Periodic update check (every 30 minutes)
        updateCheckInterval.current = setInterval(() => {
          checkForUpdates();
        }, 30 * 60 * 1000);

        // Periodic connection check
        connectionCheckInterval.current = setInterval(() => {
          getCacheStats();
        }, 5 * 60 * 1000);

        // Precache custom URLs if specified
        if (precacheUrls.length > 0) {
          postMessage({ 
            type: 'PRECACHE_URLS', 
            urls: precacheUrls 
          });
        }
      }
    };

    init();

    return () => {
      cleanup?.();
      if (updateCheckInterval.current) clearInterval(updateCheckInterval.current);
      if (connectionCheckInterval.current) clearInterval(connectionCheckInterval.current);
    };
  }, []);

  // ============ Return ============
  return {
    // State
    ...state,
    
    // Actions
    updateApp,
    unregister,
    checkForUpdates,
    postMessage,
    installApp,
    clearAllCaches,
    addToOfflineQueue,
    getOfflineQueue,
    clearOfflineQueue,
    syncOfflineQueue,
    getCacheStats,
    getMetrics,
    
    // Utilities
    isSupported: 'serviceWorker' in navigator,
    isControlled: !!navigator.serviceWorker?.controller
  };
};

// ==================== Helper: Convert VAPID key ====================
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export default useServiceWorkerPro;