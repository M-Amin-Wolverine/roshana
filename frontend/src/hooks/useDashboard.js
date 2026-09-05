/* // ============================================================
// hooks/useDashboard.js - هوک‌های سفارشی داشبورد
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services/api';

// هوک اصلی داشبورد
export const useDashboard = (timeRange) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userDistribution, setUserDistribution] = useState([]);
  const [liveData, setLiveData] = useState(null);
  
  const wsRef = useRef(null);
  const abortControllerRef = useRef(null);

  // بارگذاری تمام داده‌ها
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    // لغو درخواست‌های قبلی
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // درخواست‌های موازی برای بهبود performance
      const [
        statsResponse,
        chartResponse,
        activitiesResponse,
        notificationsResponse,
        distributionResponse
      ] = await Promise.allSettled([
        dashboardService.getDashboardStats({ timeRange }),
        dashboardService.getChartData('performance', { timeRange }),
        dashboardService.getRecentActivities({ timeRange, limit: 20 }),
        dashboardService.getNotifications({ unreadOnly: false }),
        dashboardService.getUserDistribution()
      ]);

      // پردازش نتایج
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value);
      }
      
      if (chartResponse.status === 'fulfilled') {
        setChartData(chartResponse.value);
      }
      
      if (activitiesResponse.status === 'fulfilled') {
        setActivities(activitiesResponse.value);
      }
      
      if (notificationsResponse.status === 'fulfilled') {
        setNotifications(notificationsResponse.value);
      }
      
      if (distributionResponse.status === 'fulfilled') {
        setUserDistribution(distributionResponse.value);
      }

      // بررسی خطاها
      const errors = [
        statsResponse, chartResponse, activitiesResponse, 
        notificationsResponse, distributionResponse
      ].filter(r => r.status === 'rejected');

      if (errors.length > 0) {
        console.warn('Some data fetch failed:', errors);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Dashboard data fetch error:', error);
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // اتصال WebSocket برای داده‌های زنده
  const connectLiveUpdates = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    wsRef.current = dashboardService.connectToWebSocket(
      (data) => {
        setLiveData(data);
        
        // بروزرسانی داده‌ها بر اساس نوع پیام
        switch (data.type) {
          case 'stats_update':
            setStats(prev => ({ ...prev, ...data.stats }));
            break;
          case 'new_activity':
            setActivities(prev => [data.activity, ...prev].slice(0, 50));
            break;
          case 'notification':
            setNotifications(prev => [data.notification, ...prev]);
            break;
          case 'chart_update':
            setChartData(prev => {
              const newData = [...prev];
              const index = newData.findIndex(d => d.name === data.point.name);
              if (index >= 0) {
                newData[index] = { ...newData[index], ...data.point };
              }
              return newData;
            });
            break;
          default:
            break;
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
  }, []);

  // قطع اتصال WebSocket
  const disconnectLiveUpdates = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // رفرش دستی داده‌ها
  const refresh = useCallback(() => {
    return fetchAllData(false);
  }, [fetchAllData]);

  // بارگذاری اولیه
  useEffect(() => {
    fetchAllData();
    connectLiveUpdates();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      disconnectLiveUpdates();
    };
  }, [fetchAllData, connectLiveUpdates, disconnectLiveUpdates]);

  return {
    loading,
    error,
    stats,
    chartData,
    activities,
    notifications,
    userDistribution,
    liveData,
    refresh,
    isLiveConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};

// هوک جستجو
export const useSearch = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults(null);
      return;
    }
    
    setSearching(true);
    setSearchError(null);
    
    try {
      const results = await dashboardService.globalSearch(query);
      setSearchResults(results);
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setSearching(false);
    }
  }, []);
  
  return { searchResults, searching, searchError, search };
};

// هوک اکسپورت
export const useExport = () => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  const exportData = useCallback(async (format, params = {}) => {
    setExporting(true);
    setExportError(null);
    
    try {
      const blob = await dashboardService.exportReport(format, params);
      
      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      setExportError(error.message);
      return false;
    } finally {
      setExporting(false);
    }
  }, []);
  
  return { exporting, exportError, exportData };
}; */
// ============================================================
// 🚀 hooks/useDashboard.js - هوک‌های سفارشی پیشرفته داشبورد
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { dashboardService } from '../services/api';

// ============================================================
// 📊 ثابت‌ها و تنظیمات پیشرفته
// ============================================================

const DEFAULT_CONFIG = {
  ACTIVITIES_LIMIT: 20,
  MAX_ACTIVITIES_CACHE: 50,
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  SEARCH_MIN_CHARS: 2,
  DEBOUNCE_DELAY: 300,
  HEARTBEAT_INTERVAL: 30000
};

const WS_EVENTS = {
  STATS_UPDATE: 'stats_update',
  NEW_ACTIVITY: 'new_activity',
  NOTIFICATION: 'notification',
  CHART_UPDATE: 'chart_update',
  HEARTBEAT: 'heartbeat'
};

const EXPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  JSON: 'json'
};

// ============================================================
// 🎯 ریدوسر برای مدیریت وضعیت داشبورد
// ============================================================

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_CHART_DATA':
      return { ...state, chartData: action.payload };
    case 'UPDATE_CHART_POINT':
      const newChartData = [...state.chartData];
      const index = newChartData.findIndex(d => d.name === action.payload.name);
      if (index >= 0) {
        newChartData[index] = { ...newChartData[index], ...action.payload };
      }
      return { ...state, chartData: newChartData };
    case 'ADD_ACTIVITY':
      return { 
        ...state, 
        activities: [action.payload, ...state.activities].slice(0, DEFAULT_CONFIG.MAX_ACTIVITIES_CACHE) 
      };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'SET_USER_DISTRIBUTION':
      return { ...state, userDistribution: action.payload };
    case 'SET_LIVE_DATA':
      return { ...state, liveData: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const initialState = {
  loading: true,
  error: null,
  stats: {},
  chartData: [],
  activities: [],
  notifications: [],
  userDistribution: [],
  liveData: null
};

// ============================================================
// 🔧 هوک‌های کمکی (یوتیلیتی)
// ============================================================

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const useRetry = (retryCount = 3, delay = 1000) => {
  const [attempts, setAttempts] = useState(0);
  
  const retry = useCallback(async (fn) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        setAttempts(i + 1);
        return await fn();
      } catch (error) {
        if (i === retryCount - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }, [retryCount, delay]);
  
  return { retry, attempts };
};

// ============================================================
// 🎯 هوک اصلی داشبورد (نسخه خفن)
// ============================================================

export const useDashboard = (timeRange, options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 60000,
    enableWebSocket = true,
    retryOnError = true
  } = options;
  
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { retry } = useRetry(3, 2000);
  
  const wsRef = useRef(null);
  const abortControllerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatTimerRef = useRef(null);
  
  // بارگذاری تمام داده‌ها با قابلیت رترای
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    // لغو درخواست‌های قبلی
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const fetchData = async () => {
      try {
        // درخواست‌های موازی با timeout
        const fetchWithTimeout = (promise, timeout = 15000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('درخواست زمان‌بر شد')), timeout)
            )
          ]);
        };
        
        const [
          statsResponse,
          chartResponse,
          activitiesResponse,
          notificationsResponse,
          distributionResponse
        ] = await Promise.allSettled([
          fetchWithTimeout(dashboardService.getDashboardStats({ timeRange })),
          fetchWithTimeout(dashboardService.getChartData('performance', { timeRange })),
          fetchWithTimeout(dashboardService.getRecentActivities({ 
            timeRange, 
            limit: DEFAULT_CONFIG.ACTIVITIES_LIMIT 
          })),
          fetchWithTimeout(dashboardService.getNotifications({ unreadOnly: false })),
          fetchWithTimeout(dashboardService.getUserDistribution())
        ]);
        
        // پردازش نتایج با گزارش خطاهای جزئی
        const errors = [];
        
        if (statsResponse.status === 'fulfilled') {
          dispatch({ type: 'UPDATE_STATS', payload: statsResponse.value });
        } else {
          errors.push('آمار');
          console.error('Stats fetch failed:', statsResponse.reason);
        }
        
        if (chartResponse.status === 'fulfilled') {
          dispatch({ type: 'SET_CHART_DATA', payload: chartResponse.value });
        } else {
          errors.push('نمودار');
        }
        
        if (activitiesResponse.status === 'fulfilled') {
          dispatch({ type: 'SET_ACTIVITIES', payload: activitiesResponse.value });
        } else {
          errors.push('فعالیت‌ها');
        }
        
        if (notificationsResponse.status === 'fulfilled') {
          dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsResponse.value });
        } else {
          errors.push('اعلانات');
        }
        
        if (distributionResponse.status === 'fulfilled') {
          dispatch({ type: 'SET_USER_DISTRIBUTION', payload: distributionResponse.value });
        } else {
          errors.push('توزیع کاربران');
        }
        
        // گزارش خطاهای جزئی
        if (errors.length > 0 && errors.length < 5) {
          console.warn(`⚠️ خطا در دریافت: ${errors.join('، ')}`);
        } else if (errors.length === 5) {
          throw new Error('دریافت اطلاعات با مشکل مواجه شد');
        }
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Dashboard data fetch error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message || 'خطا در بارگذاری داشبورد' });
          throw error;
        }
      } finally {
        if (!silent) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    if (retryOnError) {
      try {
        await retry(fetchData);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'خطا پس از چندین بار تلاش' });
      }
    } else {
      await fetchData();
    }
  }, [timeRange, retry, retryOnError]);
  
  // اتصال WebSocket با قابلیت reconnect
  const connectLiveUpdates = useCallback(() => {
    if (!enableWebSocket) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const ws = dashboardService.connectToWebSocket(
      (data) => {
        // ریست کردن تعداد تلاش‌ها پس از اتصال موفق
        reconnectAttemptsRef.current = 0;
        
        dispatch({ type: 'SET_LIVE_DATA', payload: data });
        
        // بروزرسانی داده‌ها بر اساس نوع پیام
        switch (data.type) {
          case WS_EVENTS.STATS_UPDATE:
            dispatch({ type: 'UPDATE_STATS', payload: data.stats });
            break;
          case WS_EVENTS.NEW_ACTIVITY:
            dispatch({ type: 'ADD_ACTIVITY', payload: data.activity });
            break;
          case WS_EVENTS.NOTIFICATION:
            dispatch({ type: 'ADD_NOTIFICATION', payload: data.notification });
            break;
          case WS_EVENTS.CHART_UPDATE:
            dispatch({ type: 'UPDATE_CHART_POINT', payload: data.point });
            break;
          case WS_EVENTS.HEARTBEAT:
            // پاسخ به heartbeat
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
            break;
          default:
            break;
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        
        // تلاش برای reconnect با backoff
        if (reconnectAttemptsRef.current < DEFAULT_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = DEFAULT_CONFIG.RECONNECT_DELAY * reconnectAttemptsRef.current;
          console.log(`🔄 تلاش مجدد WebSocket در ${delay}ms...`);
          setTimeout(connectLiveUpdates, delay);
        } else {
          console.error('❌ حداکثر تلاش برای اتصال WebSocket رد شد');
        }
      }
    );
    
    wsRef.current = ws;
    
    // تنظیم heartbeat
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, DEFAULT_CONFIG.HEARTBEAT_INTERVAL);
  }, [enableWebSocket]);
  
  // قطع اتصال WebSocket
  const disconnectLiveUpdates = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
  }, []);
  
  // رفرش دستی داده‌ها
  const refresh = useCallback(() => {
    return fetchAllData(false);
  }, [fetchAllData]);
  
  // رفرش بیصدا (بدون تغییر وضعیت لودینگ)
  const silentRefresh = useCallback(() => {
    return fetchAllData(true);
  }, [fetchAllData]);
  
  // تنظیم رفرش خودکار
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        silentRefresh();
      }, refreshInterval);
      
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, silentRefresh]);
  
  // بارگذاری اولیه
  useEffect(() => {
    fetchAllData();
    if (enableWebSocket) connectLiveUpdates();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      disconnectLiveUpdates();
    };
  }, [fetchAllData, connectLiveUpdates, disconnectLiveUpdates, enableWebSocket]);
  
  // مقادیر memoized برای بهبود عملکرد
  const isLiveConnected = useMemo(() => 
    wsRef.current?.readyState === WebSocket.OPEN, 
    [wsRef.current?.readyState]
  );
  
  const hasError = useMemo(() => !!state.error, [state.error]);
  const isLoading = useMemo(() => state.loading, [state.loading]);
  const isEmpty = useMemo(() => 
    !state.loading && !state.error && Object.keys(state.stats).length === 0,
    [state.loading, state.error, state.stats]
  );
  
  return {
    // وضعیت‌ها
    loading: isLoading,
    error: state.error,
    stats: state.stats,
    chartData: state.chartData,
    activities: state.activities,
    notifications: state.notifications,
    userDistribution: state.userDistribution,
    liveData: state.liveData,
    
    // وضعیت‌های محاسباتی
    isLiveConnected,
    hasError,
    isEmpty,
    
    // توابع
    refresh,
    silentRefresh,
    reconnectWebSocket: connectLiveUpdates,
    disconnectWebSocket: disconnectLiveUpdates,
    
    // متادیتا
    metadata: {
      activitiesCount: state.activities.length,
      notificationsCount: state.notifications.length,
      lastUpdate: new Date().toISOString()
    }
  };
};

// ============================================================
// 🔍 هوک جستجوی پیشرفته
// ============================================================

export const useSearch = (options = {}) => {
  const { debounceDelay = DEFAULT_CONFIG.DEBOUNCE_DELAY, minChars = DEFAULT_CONFIG.SEARCH_MIN_CHARS } = options;
  
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [query, setQuery] = useState('');
  
  const debouncedQuery = useDebounce(query, debounceDelay);
  
  const saveToHistory = useCallback((searchQuery, results) => {
    if (!searchQuery || searchQuery.length < minChars) return;
    
    setSearchHistory(prev => {
      const newHistory = [
        { query: searchQuery, timestamp: Date.now(), resultCount: results?.length || 0 },
        ...prev.filter(h => h.query !== searchQuery)
      ].slice(0, 10);
      return newHistory;
    });
  }, [minChars]);
  
  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < minChars) {
      setSearchResults(null);
      return;
    }
    
    setSearching(true);
    setSearchError(null);
    
    try {
      const results = await dashboardService.globalSearch(searchQuery);
      setSearchResults(results);
      saveToHistory(searchQuery, results);
      return results;
    } catch (error) {
      setSearchError(error.message);
      console.error('Search error:', error);
      return null;
    } finally {
      setSearching(false);
    }
  }, [minChars, saveToHistory]);
  
  // جستجوی خودکار با debounce
  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, search]);
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults(null);
    setSearchError(null);
  }, []);
  
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);
  
  return { 
    searchResults, 
    searching, 
    searchError, 
    search,
    query,
    setQuery,
    clearSearch,
    searchHistory,
    clearHistory,
    hasResults: searchResults && (searchResults.users?.length > 0 || searchResults.documents?.length > 0)
  };
};

// ============================================================
// 📥 هوک اکسپورت پیشرفته با پشتیبانی از فرمت‌های مختلف
// ============================================================

export const useExport = (options = {}) => {
  const { onSuccess, onError, defaultFormat = EXPORT_FORMATS.CSV } = options;
  
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExport, setLastExport] = useState(null);
  
  const exportData = useCallback(async (format, params = {}) => {
    const exportFormat = format || defaultFormat;
    setExporting(true);
    setExportError(null);
    setExportProgress(0);
    
    try {
      // شبیه‌سازی پیشرفت (برای فایل‌های بزرگ)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const blob = await dashboardService.exportReport(exportFormat, params);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // ایجاد لینک دانلود با نام فایل هوشمند
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dashboard-report-${timestamp}.${exportFormat}`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('aria-label', 'دانلود گزارش');
      document.body.appendChild(link);
      link.click();
      
      // پاکسازی
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      const exportInfo = {
        format: exportFormat,
        timestamp: Date.now(),
        filename,
        size: blob.size
      };
      setLastExport(exportInfo);
      
      if (onSuccess) onSuccess(exportInfo);
      
      return true;
    } catch (error) {
      const errorMessage = error.message || 'خطا در خروجی‌گیری گزارش';
      setExportError(errorMessage);
      if (onError) onError(error);
      console.error('Export error:', error);
      return false;
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [defaultFormat, onSuccess, onError]);
  
  const exportToPDF = useCallback((params = {}) => exportData(EXPORT_FORMATS.PDF, params), [exportData]);
  const exportToCSV = useCallback((params = {}) => exportData(EXPORT_FORMATS.CSV, params), [exportData]);
  const exportToExcel = useCallback((params = {}) => exportData(EXPORT_FORMATS.EXCEL, params), [exportData]);
  const exportToJSON = useCallback((params = {}) => exportData(EXPORT_FORMATS.JSON, params), [exportData]);
  
  return { 
    exporting, 
    exportError, 
    exportProgress,
    lastExport,
    exportData,
    exportToPDF,
    exportToCSV,
    exportToExcel,
    exportToJSON,
    isExporting: exporting,
    hasError: !!exportError
  };
};

// ============================================================
// 📈 هوک کمکی برای آمار لحظه‌ای
// ============================================================

export const useRealtimeStats = (timeRange, updateInterval = 5000) => {
  const [realtimeStats, setRealtimeStats] = useState({});
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef(null);
  
  const fetchRealtimeStats = useCallback(async () => {
    try {
      const stats = await dashboardService.getRealtimeStats({ timeRange });
      setRealtimeStats(stats);
    } catch (error) {
      console.error('Realtime stats error:', error);
    }
  }, [timeRange]);
  
  useEffect(() => {
    if (!isActive) return;
    
    fetchRealtimeStats();
    intervalRef.current = setInterval(fetchRealtimeStats, updateInterval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRealtimeStats, updateInterval, isActive]);
  
  const pause = useCallback(() => setIsActive(false), []);
  const resume = useCallback(() => setIsActive(true), []);
  
  return {
    realtimeStats,
    isActive,
    pause,
    resume,
    refresh: fetchRealtimeStats
  };
};

// خروجی پیش‌فرض برای import ساده
export default useDashboard;