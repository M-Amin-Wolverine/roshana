// src/hooks/useActivityLogPro.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Activity Log Hook (Audit Trail System)
 * 
 * Features:
 * - Comprehensive Activity Logging
 * - Real-time Log Streaming (WebSocket)
 * - Advanced Filtering & Search
 * - Anomaly Detection
 * - Session Tracking
 * - Geolocation Tracking
 * - Risk Scoring
 * - Retention Policies
 * - Export (JSON/CSV/PDF/Excel)
 * - Visual Analytics (Heatmap, Timeline)
 * - Alert Rules
 * - Data Masking (PII Protection)
 * - Performance Impact Tracking
 */
export const useActivityLogPro = (options = {}) => {
  const {
    storageKey = 'admin_activity_log_pro',
    maxActivities = 5000,
    persistToLocalStorage = true,
    syncToServer = true,
    serverEndpoint = '/api/activity-log',
    enableWebSocket = false,
    enableAnomalyDetection = true,
    enableGeolocation = false,
    enableSessionTracking = true,
    enableRiskScoring = true,
    retentionDays = 30,
    batchSyncSize = 10,
    syncInterval = 10000, // 10 seconds
    maskPII = true,
    onAnomalyDetected = null,
    onRiskThreshold = null,
    onSyncComplete = null
  } = options;

  // ============ Types ============
  const ACTIVITY_TYPES = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'export',
    IMPORT: 'import',
    SHARE: 'share',
    LOCK: 'lock',
    UNLOCK: 'unlock',
    PERMISSION_CHANGE: 'permission_change',
    SETTINGS_CHANGE: 'settings_change',
    BULK_OPERATION: 'bulk_operation',
    TERMINAL_COMMAND: 'terminal_command',
    FILE_UPLOAD: 'file_upload',
    FILE_DOWNLOAD: 'file_download',
    API_CALL: 'api_call',
    WORKFLOW_EXECUTE: 'workflow_execute',
    SEARCH: 'search',
    VIEW: 'view',
    ERROR: 'error'
  };

  const SEVERITY_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  };

  const RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  // ============ State ============
  const [state, setState] = useState(() => {
    let savedActivities = [];
    
    if (persistToLocalStorage) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          savedActivities = parsed.activities || [];
        }
      } catch {
        console.warn('Failed to load activity log');
      }
    }

    return {
      activities: savedActivities,
      filters: {
        userId: null,
        action: null,
        severity: null,
        riskLevel: null,
        dateRange: null,
        searchQuery: '',
        resourceId: null,
        ipAddress: null,
        sessionId: null
      },
      syncQueue: [],
      isSyncing: false,
      lastSyncTime: null,
      stats: {
        total: savedActivities.length,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      },
      currentSession: enableSessionTracking ? {
        id: `session-${Date.now()}`,
        startedAt: new Date().toISOString(),
        actions: 0
      } : null
    };
  });

  const { activities, filters, syncQueue, isSyncing, currentSession } = state;

  // ============ Refs ============
  const stateRef = useRef(state);
  const wsRef = useRef(null);
  const syncTimerRef = useRef(null);
  const anomalyPatternsRef = useRef({
    suspiciousIPs: new Set(),
    userActionCounts: {},
    timeWindowActions: []
  });

  // Update ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ Persist ============
  useEffect(() => {
    if (persistToLocalStorage) {
      try {
        // Cleanup old activities before saving
        const cleanedActivities = cleanupOldActivities(state.activities);
        
        localStorage.setItem(storageKey, JSON.stringify({
          activities: cleanedActivities,
          lastSaved: new Date().toISOString()
        }));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          // Prune old activities
          setState(prev => ({
            ...prev,
            activities: prev.activities.slice(0, Math.floor(maxActivities / 2))
          }));
          toast.error('⚠️ فضای ذخیره‌سازی پر شد - فعالیت‌های قدیمی حذف شدند');
        }
      }
    }
  }, [activities, persistToLocalStorage, storageKey, maxActivities]);

  // ============ WebSocket Connection ============
  useEffect(() => {
    if (!enableWebSocket) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('wss://your-server.com/activity-stream');
        
        ws.onopen = () => {
          console.log('Activity log WebSocket connected');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'activity') {
            addActivityToState(data.activity);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
      }
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [enableWebSocket]);

  // ============ Sync Timer ============
  useEffect(() => {
    if (syncToServer && syncInterval > 0) {
      syncTimerRef.current = setInterval(() => {
        syncActivitiesToServer();
      }, syncInterval);
    }

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [syncToServer, syncInterval]);

  // ============ Cleanup Old Activities ============
  const cleanupOldActivities = useCallback((activityList) => {
    if (retentionDays <= 0) return activityList;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    return activityList
      .filter(a => new Date(a.timestamp) > cutoffDate)
      .slice(0, maxActivities);
  }, [retentionDays, maxActivities]);

  // ============ Add Activity to State ============
  const addActivityToState = useCallback((activity) => {
    setState(prev => ({
      ...prev,
      activities: [activity, ...prev.activities].slice(0, maxActivities),
      stats: {
        ...prev.stats,
        total: prev.stats.total + 1,
        today: isToday(activity.timestamp) ? prev.stats.today + 1 : prev.stats.today,
        thisWeek: isThisWeek(activity.timestamp) ? prev.stats.thisWeek + 1 : prev.stats.thisWeek,
        thisMonth: isThisMonth(activity.timestamp) ? prev.stats.thisMonth + 1 : prev.stats.thisMonth
      },
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        actions: prev.currentSession.actions + 1
      } : null
    }));
  }, [maxActivities]);

  // ============ ۱. Log Activity ============
  const logActivity = useCallback(async (action, details = {}) => {
    const timestamp = new Date().toISOString();
    
    // Calculate risk score
    const riskScore = enableRiskScoring ? calculateRiskScore(action, details) : 0;
    const riskLevel = getRiskLevel(riskScore);
    
    // Determine severity
    const severity = determineSeverity(action, details);

    // Build activity object
    const activity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      user: details.user || 'admin',
      userId: details.userId || 'admin',
      action,
      category: getActionCategory(action),
      details: maskPII ? maskSensitiveData(details) : details,
      severity,
      riskScore,
      riskLevel,
      ip: details.ip || '127.0.0.1',
      userAgent: navigator.userAgent,
      sessionId: currentSession?.id || null,
      resourceId: details.resourceId || null,
      resourceType: details.resourceType || null,
      duration: details.duration || 0,
      success: details.error ? false : true,
      errorMessage: details.error || null,
      metadata: {
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };

    // Add geolocation if enabled
    if (enableGeolocation) {
      try {
        const position = await getCurrentPosition();
        activity.geolocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (error) {
        // Geolocation not available
      }
    }

    // Add to state
    addActivityToState(activity);

    // Anomaly detection
    if (enableAnomalyDetection) {
      const isAnomalous = detectAnomaly(activity);
      if (isAnomalous) {
        activity.isAnomalous = true;
        toast.warning(`⚠️ فعالیت مشکوک: ${action}`, { duration: 4000 });
        onAnomalyDetected?.(activity);
      }
    }

    // Risk threshold alert
    if (enableRiskScoring && riskLevel === RISK_LEVELS.CRITICAL) {
      toast.error(`🚨 فعالیت با ریسک بالا: ${action}`, { duration: 5000 });
      onRiskThreshold?.(activity);
    }

    // Add to sync queue
    if (syncToServer) {
      setState(prev => ({
        ...prev,
        syncQueue: [...prev.syncQueue, activity]
      }));

      // Sync immediately for critical activities
      if (severity === SEVERITY_LEVELS.CRITICAL) {
        syncActivitiesToServer();
      }
    }

    return activity;
  }, [
    currentSession, enableAnomalyDetection, enableGeolocation, 
    enableRiskScoring, maskPII, syncToServer, addActivityToState,
    onAnomalyDetected, onRiskThreshold
  ]);

  // ============ ۲. Anomaly Detection ============
  const detectAnomaly = useCallback((activity) => {
    const patterns = anomalyPatternsRef.current;
    let isAnomalous = false;

    // Check for rapid actions from same user
    const recentActions = patterns.timeWindowActions.filter(
      a => a.user === activity.user && 
      Date.now() - new Date(a.timestamp).getTime() < 60000 // Last minute
    );

    if (recentActions.length > 20) {
      isAnomalous = true; // More than 20 actions per minute
    }

    // Check for suspicious IPs
    if (patterns.suspiciousIPs.has(activity.ip)) {
      isAnomalous = true;
    }

    // Check for unusual hours
    const hour = new Date(activity.timestamp).getHours();
    if (activity.action === ACTIVITY_TYPES.DELETE && (hour < 6 || hour > 22)) {
      isAnomalous = true;
    }

    // Check for bulk operations
    if (activity.action === ACTIVITY_TYPES.BULK_OPERATION && 
        activity.details?.count > 100) {
      isAnomalous = true;
    }

    // Update patterns
    patterns.timeWindowActions.push(activity);
    if (patterns.timeWindowActions.length > 100) {
      patterns.timeWindowActions.shift();
    }

    // Track user action counts
    patterns.userActionCounts[activity.user] = 
      (patterns.userActionCounts[activity.user] || 0) + 1;

    return isAnomalous;
  }, []);

  // ============ ۳. Risk Scoring ============
  const calculateRiskScore = useCallback((action, details) => {
    let score = 0;

    // Base risk by action type
    const actionRisk = {
      [ACTIVITY_TYPES.DELETE]: 20,
      [ACTIVITY_TYPES.PERMISSION_CHANGE]: 25,
      [ACTIVITY_TYPES.SETTINGS_CHANGE]: 15,
      [ACTIVITY_TYPES.BULK_OPERATION]: 30,
      [ACTIVITY_TYPES.TERMINAL_COMMAND]: 10
    };
    score += actionRisk[action] || 5;

    // Bulk operation size
    if (details.count > 100) score += 20;
    if (details.count > 500) score += 30;

    // Sensitive resources
    const sensitiveResources = ['users', 'permissions', 'settings', 'database'];
    if (sensitiveResources.includes(details.resourceType)) {
      score += 15;
    }

    // Failed attempts
    if (details.failedAttempts > 3) score += 10;

    // Unusual time
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) score += 5;

    return Math.min(score, 100);
  }, []);

  const getRiskLevel = (score) => {
    if (score >= 75) return RISK_LEVELS.CRITICAL;
    if (score >= 50) return RISK_LEVELS.HIGH;
    if (score >= 25) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  };

  // ============ ۴. Determine Severity ============
  const determineSeverity = (action, details) => {
    if (details.error) return SEVERITY_LEVELS.ERROR;
    if (action === ACTIVITY_TYPES.DELETE && details.count > 100) return SEVERITY_LEVELS.CRITICAL;
    if (action === ACTIVITY_TYPES.PERMISSION_CHANGE) return SEVERITY_LEVELS.WARNING;
    if (action === ACTIVITY_TYPES.SETTINGS_CHANGE) return SEVERITY_LEVELS.WARNING;
    return SEVERITY_LEVELS.INFO;
  };

  // ============ ۵. Sync to Server ============
  const syncActivitiesToServer = useCallback(async () => {
    const { syncQueue: queue, isSyncing } = stateRef.current;
    
    if (isSyncing || queue.length === 0) return;
    if (!navigator.onLine) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    const batch = queue.slice(0, batchSyncSize);
    let syncedCount = 0;

    try {
      const response = await fetch(serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: batch }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        syncedCount = batch.length;
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }

    setState(prev => ({
      ...prev,
      syncQueue: prev.syncQueue.filter((_, i) => i >= syncedCount),
      isSyncing: false,
      lastSyncTime: new Date().toISOString()
    }));

    if (syncedCount > 0) {
      onSyncComplete?.({ count: syncedCount });
    }
  }, [batchSyncSize, serverEndpoint, onSyncComplete]);

  // ============ ۶. Filtering ============
  const filterActivities = useCallback((filterCriteria) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filterCriteria }
    }));
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const f = state.filters;
      
      if (f.userId && activity.userId !== f.userId) return false;
      if (f.action && activity.action !== f.action) return false;
      if (f.severity && activity.severity !== f.severity) return false;
      if (f.riskLevel && activity.riskLevel !== f.riskLevel) return false;
      if (f.resourceId && activity.resourceId !== f.resourceId) return false;
      if (f.ipAddress && activity.ip !== f.ipAddress) return false;
      if (f.sessionId && activity.sessionId !== f.sessionId) return false;
      
      if (f.dateRange) {
        const activityDate = new Date(activity.timestamp);
        if (f.dateRange.start && activityDate < new Date(f.dateRange.start)) return false;
        if (f.dateRange.end && activityDate > new Date(f.dateRange.end)) return false;
      }
      
      if (f.searchQuery) {
        const query = f.searchQuery.toLowerCase();
        const searchable = [
          activity.action,
          activity.user,
          activity.userId,
          activity.category,
          activity.severity,
          activity.ip,
          JSON.stringify(activity.details)
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(query)) return false;
      }
      
      return true;
    });
  }, [activities, state.filters]); // Add useMemo import

  // ============ ۷. Statistics ============
  const getActivityStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const stats = {
      total: activities.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byAction: {},
      byUser: {},
      byCategory: {},
      bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
      byRisk: { low: 0, medium: 0, high: 0, critical: 0 },
      byHour: Array(24).fill(0),
      byDayOfWeek: Array(7).fill(0),
      anomalousCount: 0,
      failedCount: 0,
      successRate: 0,
      averageRiskScore: 0,
      topUsers: [],
      topActions: [],
      peakHour: 0,
      totalDuration: 0
    };

    let totalRiskScore = 0;

    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      
      // Time-based counts
      if (date >= today) stats.today++;
      if (date >= weekAgo) stats.thisWeek++;
      if (date >= monthAgo) stats.thisMonth++;

      // By action
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;

      // By user
      stats.byUser[activity.userId] = (stats.byUser[activity.userId] || 0) + 1;

      // By category
      stats.byCategory[activity.category] = (stats.byCategory[activity.category] || 0) + 1;

      // By severity
      stats.bySeverity[activity.severity]++;

      // By risk
      stats.byRisk[activity.riskLevel]++;

      // By hour
      stats.byHour[date.getHours()]++;

      // By day of week
      stats.byDayOfWeek[date.getDay()]++;

      // Anomalies
      if (activity.isAnomalous) stats.anomalousCount++;

      // Failed
      if (!activity.success) stats.failedCount++;

      // Risk score
      totalRiskScore += activity.riskScore;

      // Duration
      stats.totalDuration += activity.duration || 0;
    });

    // Calculate rates
    stats.successRate = activities.length > 0 
      ? Math.round(((activities.length - stats.failedCount) / activities.length) * 100)
      : 100;
    stats.averageRiskScore = activities.length > 0 
      ? Math.round(totalRiskScore / activities.length)
      : 0;

    // Top users
    stats.topUsers = Object.entries(stats.byUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([user, count]) => ({ user, count }));

    // Top actions
    stats.topActions = Object.entries(stats.byAction)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Peak hour
    stats.peakHour = stats.byHour.indexOf(Math.max(...stats.byHour));

    return stats;
  }, [activities]);

  // ============ ۸. Export ============
  const exportActivities = useCallback((format = 'json', dateRange = null) => {
    let data = filteredActivities;
    
    if (dateRange) {
      data = data.filter(a => {
        const d = new Date(a.timestamp);
        if (dateRange.start && d < new Date(dateRange.start)) return false;
        if (dateRange.end && d > new Date(dateRange.end)) return false;
        return true;
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'csv': {
        const headers = [
          'ID', 'Timestamp', 'User', 'Action', 'Category', 
          'Severity', 'Risk Score', 'IP', 'Success', 'Details'
        ];
        const rows = data.map(a => [
          a.id,
          a.timestamp,
          a.user,
          a.action,
          a.category,
          a.severity,
          a.riskScore,
          a.ip,
          a.success,
          JSON.stringify(a.details)
        ]);
        const csv = '\uFEFF' + [headers, ...rows].map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        downloadFile(csv, `activity-log-${timestamp}.csv`, 'text/csv');
        break;
      }
      
      case 'json': {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `activity-log-${timestamp}.json`, 'application/json');
        break;
      }
      
      case 'excel': {
        // Simple XLS format (HTML table)
        const html = `
          <table>
            <tr>
              <th>ID</th><th>Timestamp</th><th>User</th><th>Action</th>
              <th>Category</th><th>Severity</th><th>Risk</th><th>IP</th>
            </tr>
            ${data.map(a => `
              <tr>
                <td>${a.id}</td><td>${a.timestamp}</td><td>${a.user}</td>
                <td>${a.action}</td><td>${a.category}</td><td>${a.severity}</td>
                <td>${a.riskScore}</td><td>${a.ip}</td>
              </tr>
            `).join('')}
          </table>
        `;
        downloadFile(html, `activity-log-${timestamp}.xls`, 'application/vnd.ms-excel');
        break;
      }
    }

    toast.success(`📥 گزارش با فرمت ${format.toUpperCase()} دانلود شد`);
  }, [filteredActivities]);

  // ============ ۹. Clear Activities ============
  const clearActivities = useCallback(() => {
    if (confirm('آیا از حذف تمام فعالیت‌ها مطمئن هستید؟ این عملیات قابل بازگشت نیست.')) {
      setState(prev => ({
        ...prev,
        activities: [],
        syncQueue: []
      }));
      localStorage.removeItem(storageKey);
      toast.success('🗑️ تمام فعالیت‌ها حذف شدند');
    }
  }, [storageKey]);

  // ============ ۱۰. Search ============
  const searchActivities = useCallback((query) => {
    filterActivities({ searchQuery: query });
  }, [filterActivities]);

  // ============ Helper Functions ============
  function getActionCategory(action) {
    const categories = {
      [ACTIVITY_TYPES.CREATE]: 'data',
      [ACTIVITY_TYPES.READ]: 'access',
      [ACTIVITY_TYPES.UPDATE]: 'data',
      [ACTIVITY_TYPES.DELETE]: 'data',
      [ACTIVITY_TYPES.LOGIN]: 'auth',
      [ACTIVITY_TYPES.LOGOUT]: 'auth',
      [ACTIVITY_TYPES.EXPORT]: 'io',
      [ACTIVITY_TYPES.IMPORT]: 'io',
      [ACTIVITY_TYPES.FILE_UPLOAD]: 'io',
      [ACTIVITY_TYPES.FILE_DOWNLOAD]: 'io',
      [ACTIVITY_TYPES.SETTINGS_CHANGE]: 'config',
      [ACTIVITY_TYPES.PERMISSION_CHANGE]: 'security',
      [ACTIVITY_TYPES.TERMINAL_COMMAND]: 'system',
      [ACTIVITY_TYPES.WORKFLOW_EXECUTE]: 'automation'
    };
    return categories[action] || 'general';
  }

  function maskSensitiveData(details) {
    const masked = { ...details };
    
    // Mask passwords
    if (masked.password) masked.password = '********';
    if (masked.token) masked.token = masked.token.substring(0, 8) + '...';
    if (masked.email) masked.email = masked.email.replace(/(.{3}).*(@.*)/, '$1***$2');
    if (masked.phone) masked.phone = masked.phone.replace(/(\d{3})\d+(\d{2})/, '$1****$2');
    if (masked.creditCard) masked.creditCard = '****-****-****-' + masked.creditCard.slice(-4);
    
    return masked;
  }

  function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  function getOSInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      });
    });
  }

  function isToday(dateStr) {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  }

  function isThisWeek(dateStr) {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return new Date(dateStr) >= weekAgo;
  }

  function isThisMonth(dateStr) {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return new Date(dateStr) >= monthAgo;
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    // State
    activities: filteredActivities,
    allActivities: activities,
    filters,
    syncQueue,
    isSyncing,
    lastSyncTime: state.lastSyncTime,
    currentSession,
    
    // Actions
    logActivity,
    clearActivities,
    filterActivities,
    searchActivities,
    syncActivitiesToServer,
    
    // Analytics
    getActivityStats,
    exportActivities,
    
    // Helpers
    ACTIVITY_TYPES,
    SEVERITY_LEVELS,
    RISK_LEVELS,
    getActionCategory
  };
};

// Fix import at top
import React from 'react';

export default useActivityLogPro;