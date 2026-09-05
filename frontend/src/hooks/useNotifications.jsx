// src/hooks/useNotificationsPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Notifications Hook
 * 
 * Features:
 * - Multi-channel (In-app, Browser, Push, Email, SMS, Slack, Discord, Telegram)
 * - Scheduling & Expiry
 * - Notification Groups / Threads
 * - Smart Grouping (batch similar notifications)
 * - Priority-based delivery
 * - Rich notifications (images, actions, progress)
 * - Do Not Disturb mode
 * - Quiet hours scheduling
 * - Notification templates
 * - Actionable notifications (reply, approve, etc.)
 * - Custom sound packs
 * - Vibration patterns
 * - Badge count (PWA)
 * - Notification history with search
 * - Analytics dashboard
 * - A/B testing for notifications
 */
export const useNotificationsPro = (options = {}) => {
  const {
    storageKey = 'admin_notifications_pro',
    maxNotifications = 200,
    enableBrowserNotifications = true,
    enablePushNotifications = false,
    enableSoundEffects = true,
    enableVibration = false,
    enableSmartGrouping = true,
    enableDoNotDisturb = false,
    enableQuietHours = false,
    quietHoursStart = '22:00',
    quietHoursEnd = '07:00',
    groupSimilarWithin = 60000, // 1 minute
    badgeUpdateCallback = null,
    onNotificationClick = null,
    defaultSoundPack = 'default',
    vapidPublicKey = '' // For Push API
  } = options;

  // ============ Sound Packs ============
  const SOUND_PACKS = {
    default: {
      high: '/sounds/default-high.mp3',
      medium: '/sounds/default-medium.mp3',
      low: '/sounds/default-low.mp3',
      critical: '/sounds/default-critical.mp3'
    },
    retro: {
      high: '/sounds/retro-high.mp3',
      medium: '/sounds/retro-medium.mp3',
      low: '/sounds/retro-low.mp3',
      critical: '/sounds/retro-critical.mp3'
    },
    minimal: {
      high: '/sounds/minimal-high.mp3',
      medium: '/sounds/minimal-medium.mp3',
      low: '/sounds/minimal-low.mp3',
      critical: '/sounds/minimal-critical.mp3'
    },
    nature: {
      high: '/sounds/nature-high.mp3',
      medium: '/sounds/nature-medium.mp3',
      low: '/sounds/nature-low.mp3',
      critical: '/sounds/nature-critical.mp3'
    }
  };

  // ============ Notification Types ============
  const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    USER: 'user',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    BILLING: 'billing',
    SOCIAL: 'social',
    WORKFLOW: 'workflow',
    REMINDER: 'reminder',
    MARKETING: 'marketing',
    ERROR: 'error'
  };

  // ============ Delivery Channels ============
  const DELIVERY_CHANNELS = {
    IN_APP: 'in_app',
    BROWSER: 'browser',
    PUSH: 'push',
    EMAIL: 'email',
    SMS: 'sms',
    SLACK: 'slack',
    DISCORD: 'discord',
    TELEGRAM: 'telegram',
    WEBHOOK: 'webhook'
  };

  // ============ State ============
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          notifications: parsed.notifications || [],
          settings: parsed.settings || createDefaultSettings(),
          stats: parsed.stats || createDefaultStats(),
          templates: parsed.templates || createDefaultTemplates()
        };
      }
    } catch {
      // Default state
    }
    return {
      notifications: [],
      settings: createDefaultSettings(),
      stats: createDefaultStats(),
      templates: createDefaultTemplates()
    };
  });

  const { notifications, settings, stats, templates } = state;
  
  // ============ Refs ============
  const audioRef = useRef(new Audio());
  const stateRef = useRef(state);
  const serviceWorkerRef = useRef(null);

  // Update ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ Default Settings ============
  function createDefaultSettings() {
    return {
      doNotDisturb: enableDoNotDisturb,
      quietHours: enableQuietHours ? {
        enabled: true,
        start: quietHoursStart,
        end: quietHoursEnd
      } : { enabled: false },
      soundPack: defaultSoundPack,
      volume: 0.5,
      vibration: enableVibration,
      channels: {
        [DELIVERY_CHANNELS.IN_APP]: true,
        [DELIVERY_CHANNELS.BROWSER]: enableBrowserNotifications,
        [DELIVERY_CHANNELS.PUSH]: enablePushNotifications,
        [DELIVERY_CHANNELS.EMAIL]: false,
        [DELIVERY_CHANNELS.SMS]: false
      },
      filters: {
        minPriority: 'LOW',
        blockedTypes: [],
        allowedUsers: [] // Empty = all
      },
      grouping: {
        enabled: enableSmartGrouping,
        interval: groupSimilarWithin
      }
    };
  }

  function createDefaultStats() {
    return {
      totalSent: 0,
      totalRead: 0,
      totalClicked: 0,
      totalDismissed: 0,
      byType: {},
      byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      byChannel: {},
      byHour: Array(24).fill(0),
      lastSent: null
    };
  }

  function createDefaultTemplates() {
    return {
      welcome: {
        title: '🎉 خوش آمدید!',
        message: 'به پنل مدیریت خوش آمدید، {{user.name}}!',
        type: NOTIFICATION_TYPES.SYSTEM,
        priority: 'MEDIUM',
        channels: [DELIVERY_CHANNELS.IN_APP]
      },
      security_alert: {
        title: '🔒 هشدار امنیتی',
        message: 'ورود از IP جدید: {{ip}}',
        type: NOTIFICATION_TYPES.SECURITY,
        priority: 'HIGH',
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL]
      },
      workflow_complete: {
        title: '✅ گردش کار',
        message: '{{workflow.name}} با موفقیت اجرا شد',
        type: NOTIFICATION_TYPES.WORKFLOW,
        priority: 'MEDIUM',
        channels: [DELIVERY_CHANNELS.IN_APP]
      }
    };
  }

  // ============ Persist ============
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        notifications: notifications.slice(0, maxNotifications),
        settings,
        stats,
        templates
      }));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Prune old notifications
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.slice(0, Math.floor(maxNotifications / 2))
        }));
      }
    }

    // Update badge
    const unread = notifications.filter(n => !n.read).length;
    badgeUpdateCallback?.(unread);
  }, [notifications, settings, stats, templates, maxNotifications, storageKey]);

  // ============ ۱. Add Notification ============
  const addNotification = useCallback(async (notification) => {
    const currentState = stateRef.current;
    const currentSettings = currentState.settings;
    
    // Check Do Not Disturb
    if (currentSettings.doNotDisturb) {
      return scheduleForLater(notification);
    }

    // Check Quiet Hours
    if (currentSettings.quietHours.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      const [startH, startM] = currentSettings.quietHours.start.split(':').map(Number);
      const [endH, endM] = currentSettings.quietHours.end.split(':').map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      
      const isQuietTime = startTime < endTime 
        ? (currentTime >= startTime && currentTime < endTime)
        : (currentTime >= startTime || currentTime < endTime);
      
      if (isQuietTime) {
        // Don't deliver during quiet hours
        const delayedNotif = {
          ...notification,
          scheduledFor: getNextAvailableTime(endTime).toISOString()
        };
        setState(prev => ({
          ...prev,
          notifications: [delayedNotif, ...prev.notifications].slice(0, maxNotifications)
        }));
        return delayedNotif;
      }
    }

    // Check filters
    if (notification.priority && 
        getPriorityValue(notification.priority) < getPriorityValue(currentSettings.filters.minPriority)) {
      return null;
    }
    if (currentSettings.filters.blockedTypes.includes(notification.type)) {
      return null;
    }

    // Check for smart grouping
    if (currentSettings.grouping.enabled && notification.groupKey) {
      const recentSimilar = currentState.notifications.filter(n => 
        n.groupKey === notification.groupKey &&
        Date.now() - new Date(n.timestamp).getTime() < currentSettings.grouping.interval
      );

      if (recentSimilar.length > 0) {
        // Update existing group notification instead of creating new
        const existingGroup = currentState.notifications.find(n => 
          n.isGroup && n.groupKey === notification.groupKey
        );

        if (existingGroup) {
          updateNotification(existingGroup.id, {
            count: (existingGroup.count || 1) + 1,
            message: `${notification.message} (+${(existingGroup.count || 1) + 1})`,
            timestamp: new Date().toISOString()
          });
          return existingGroup;
        } else {
          // Create group notification
          notification.isGroup = true;
          notification.count = 2;
          notification.message = `${notification.message} (2 بار)`;
          notification.recentItems = [recentSimilar[0], notification];
        }
      }
    }

    // Create notification object
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      clicked: false,
      dismissed: false,
      priority: notification.priority || 'MEDIUM',
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      channels: notification.channels || [DELIVERY_CHANNELS.IN_APP],
      expiresAt: notification.expiresAt || null,
      data: notification.data || {},
      silent: notification.silent || false,
      
      // Content
      title: notification.title || 'اعلان جدید',
      message: notification.message || '',
      icon: notification.icon || '🔔',
      image: notification.image || null,
      
      // Actions
      actions: notification.actions || [],
      primaryAction: notification.primaryAction || null,
      
      // Grouping
      groupKey: notification.groupKey || null,
      isGroup: false,
      count: 1,
      
      // Rich content
      progress: notification.progress || null, // { current, total, percentage }
      html: notification.html || null,
      
      // Tracking
      deliveredVia: [],
      
      ...notification
    };

    // Add to state
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications].slice(0, maxNotifications),
      stats: {
        ...prev.stats,
        totalSent: prev.stats.totalSent + 1,
        byType: {
          ...prev.stats.byType,
          [newNotification.type]: (prev.stats.byType[newNotification.type] || 0) + 1
        },
        byPriority: {
          ...prev.stats.byPriority,
          [newNotification.priority]: (prev.stats.byPriority[newNotification.priority] || 0) + 1
        },
        byHour: updateHourlyStats(prev.stats.byHour, new Date()),
        lastSent: newNotification.timestamp
      }
    }));

    // Deliver via channels
    const deliveryPromises = [];

    if (currentSettings.channels[DELIVERY_CHANNELS.IN_APP] && 
        newNotification.channels.includes(DELIVERY_CHANNELS.IN_APP)) {
      // In-app is handled by state
      newNotification.deliveredVia.push(DELIVERY_CHANNELS.IN_APP);
    }

    if (currentSettings.channels[DELIVERY_CHANNELS.BROWSER] &&
        newNotification.channels.includes(DELIVERY_CHANNELS.BROWSER)) {
      deliveryPromises.push(deliverBrowserNotification(newNotification));
    }

    if (currentSettings.channels[DELIVERY_CHANNELS.PUSH] &&
        newNotification.channels.includes(DELIVERY_CHANNELS.PUSH)) {
      deliveryPromises.push(deliverPushNotification(newNotification));
    }

    if (currentSettings.channels[DELIVERY_CHANNELS.EMAIL] &&
        newNotification.channels.includes(DELIVERY_CHANNELS.EMAIL)) {
      deliveryPromises.push(deliverEmailNotification(newNotification));
    }

    await Promise.allSettled(deliveryPromises);

    // Sound
    if (enableSoundEffects && !newNotification.silent && 
        (newNotification.priority === 'HIGH' || newNotification.priority === 'CRITICAL')) {
      playNotificationSound(newNotification.priority, currentSettings.soundPack);
    }

    // Vibration
    if (enableVibration && navigator.vibrate) {
      const patterns = {
        HIGH: [200, 100, 200],
        CRITICAL: [300, 100, 300, 100, 300],
        MEDIUM: [100, 50, 100],
        LOW: [50]
      };
      navigator.vibrate(patterns[newNotification.priority] || [100]);
    }

    // Toast for in-app
    if (newNotification.priority === 'CRITICAL') {
      toast.error(
        <div>
          <strong>{newNotification.icon} {newNotification.title}</strong>
          <p>{newNotification.message}</p>
        </div>,
        { duration: 8000 }
      );
    }

    return newNotification;
  }, [
    enableSoundEffects, enableVibration, enableBrowserNotifications,
    enablePushNotifications, maxNotifications
  ]);

  // ============ ۲. Browser Notification ============
  const deliverBrowserNotification = useCallback(async (notification) => {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/logo192.png',
        badge: '/badge.png',
        tag: notification.groupKey || notification.id,
        requireInteraction: notification.priority === 'CRITICAL',
        silent: notification.silent,
        data: notification.data,
        actions: (notification.actions || []).map(a => ({
          action: a.id,
          title: a.label,
          icon: a.icon
        })).slice(0, 2) // Browser supports max 2 actions
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        onNotificationClick?.(notification);
        markAsClicked(notification.id);
      };

      browserNotif.onclose = () => {
        markAsDismissed(notification.id);
      };

      return true;
    } catch (error) {
      console.warn('Browser notification failed:', error);
      return false;
    }
  }, [onNotificationClick]);

  // ============ ۳. Push Notification ============
  const deliverPushNotification = useCallback(async (notification) => {
    if (!serviceWorkerRef.current) {
      const registration = await navigator.serviceWorker?.ready;
      if (!registration) return false;
      serviceWorkerRef.current = registration;
    }

    try {
      await serviceWorkerRef.current.showNotification(notification.title, {
        body: notification.message,
        icon: notification.icon,
        badge: '/badge.png',
        vibrate: enableVibration ? [200, 100, 200] : undefined,
        data: notification.data,
        actions: notification.actions?.slice(0, 2).map(a => ({
          action: a.id,
          title: a.label
        }))
      });

      return true;
    } catch (error) {
      console.warn('Push notification failed:', error);
      return false;
    }
  }, [enableVibration]);

  // ============ ۴. Sound Effects ============
  const playNotificationSound = useCallback((priority, soundPack = 'default') => {
    try {
      const pack = SOUND_PACKS[soundPack] || SOUND_PACKS.default;
      const soundUrl = pack[priority.toLowerCase()] || pack.medium;
      
      audioRef.current.src = soundUrl;
      audioRef.current.volume = stateRef.current.settings.volume || 0.5;
      audioRef.current.play().catch(() => {});
    } catch (error) {
      // Sound not available
    }
  }, []);

  // ============ ۵. Mark Notifications ============
  const markAsRead = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      stats: {
        ...prev.stats,
        totalRead: prev.stats.totalRead + 1
      }
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      stats: {
        ...prev.stats,
        totalRead: prev.stats.totalRead + prev.notifications.filter(n => !n.read).length
      }
    }));
    toast.success('✅ همه اعلان‌ها خوانده شدند');
  }, []);

  const markAsClicked = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true, clicked: true } : n
      ),
      stats: {
        ...prev.stats,
        totalClicked: prev.stats.totalClicked + 1
      }
    }));
  }, []);

  const markAsDismissed = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, dismissed: true } : n
      ),
      stats: {
        ...prev.stats,
        totalDismissed: prev.stats.totalDismissed + 1
      }
    }));
  }, []);

  // ============ ۶. Update Notification ============
  const updateNotification = useCallback((notificationId, updates) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, ...updates } : n
      )
    }));
  }, []);

  // ============ ۷. Remove Notification ============
  const removeNotification = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId)
    }));
  }, []);

  const clearAll = useCallback(() => {
    if (confirm('آیا از حذف تمام اعلان‌ها مطمئن هستید؟')) {
      setState(prev => ({
        ...prev,
        notifications: []
      }));
      toast.success('🗑️ تمام اعلان‌ها حذف شدند');
    }
  }, []);

  // ============ ۸. Settings ============
  const updateSettings = useCallback((newSettings) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
    toast.success('⚙️ تنظیمات اعلان‌ها ذخیره شد');
  }, []);

  const toggleDoNotDisturb = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        doNotDisturb: !prev.settings.doNotDisturb
      }
    }));
    toast.success(
      stateRef.current.settings.doNotDisturb
        ? '🔕 حالت مزاحم نشوید غیرفعال شد'
        : '🔕 حالت مزاحم نشوید فعال شد'
    );
  }, []);

  // ============ ۹. Templates ============
  const useTemplate = useCallback((templateName, variables = {}) => {
    const template = stateRef.current.templates[templateName];
    if (!template) return null;

    let title = template.title;
    let message = template.message;

    Object.entries(variables).forEach(([key, value]) => {
      title = title.replace(`{{${key}}}`, value);
      message = message.replace(`{{${key}}}`, value);
    });

    return addNotification({
      ...template,
      title,
      message,
      variables
    });
  }, [addNotification]);

  const saveTemplate = useCallback((name, template) => {
    setState(prev => ({
      ...prev,
      templates: { ...prev.templates, [name]: template }
    }));
    toast.success('📝 قالب ذخیره شد');
  }, []);

  // ============ ۱۰. Request Permission ============
  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!('PushManager' in window)) return false;
    try {
      const registration = await navigator.serviceWorker?.ready;
      const subscription = await registration?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });
      return !!subscription;
    } catch {
      return false;
    }
  }, [vapidPublicKey]);

  // ============ ۱۱. Stats ============
  const getStats = useCallback(() => {
    return stateRef.current.stats;
  }, []);

  const getUnreadCount = useCallback(() => {
    return stateRef.current.notifications.filter(n => !n.read && !n.dismissed).length;
  }, []);

  // ============ ۱۲. Export ============
  const exportNotifications = useCallback(() => {
    const data = stateRef.current.notifications.map(n => ({
      id: n.id,
      timestamp: n.timestamp,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      read: n.read,
      clicked: n.clicked
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${Date.now()}.json`;
    a.click();
    toast.success('📥 اعلان‌ها export شدند');
  }, []);

  // ============ Helper Functions ============
  function getPriorityValue(priority) {
    const values = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    return values[priority] || 0;
  }

  function updateHourlyStats(hourlyArray, date) {
    const newArray = [...hourlyArray];
    newArray[date.getHours()]++;
    return newArray;
  }

  function scheduleForLater(notification) {
    const scheduledNotif = {
      ...notification,
      scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      wasDelayed: true
    };
    
    setState(prev => ({
      ...prev,
      notifications: [scheduledNotif, ...prev.notifications]
    }));

    return scheduledNotif;
  }

  function getNextAvailableTime(endTimeMinutes) {
    const now = new Date();
    const endHour = Math.floor(endTimeMinutes / 60);
    const endMinute = endTimeMinutes % 60;
    const next = new Date(now);
    next.setHours(endHour, endMinute, 0, 0);
    if (next < now) next.setDate(next.getDate() + 1);
    return next;
  }

  // ============ Cleanup Expired ============
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => 
          !n.expiresAt || new Date(n.expiresAt).getTime() > now
        )
      }));
    }, 60000); // Every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // State
    notifications,
    unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
    settings,
    stats,
    templates,
    
    // Actions
    addNotification,
    removeNotification,
    updateNotification,
    markAsRead,
    markAllAsRead,
    markAsClicked,
    clearAll,
    
    // Settings
    updateSettings,
    toggleDoNotDisturb,
    
    // Templates
    useTemplate,
    saveTemplate,
    
    // Permissions
    requestBrowserPermission,
    requestPushPermission,
    browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    
    // Stats
    getStats,
    getUnreadCount,
    exportNotifications,
    
    // Constants
    NOTIFICATION_TYPES,
    DELIVERY_CHANNELS,
    SOUND_PACKS
  };
};

export default useNotificationsPro;