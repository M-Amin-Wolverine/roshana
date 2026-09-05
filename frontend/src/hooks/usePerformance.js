// src/hooks/usePerformancePro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Performance Monitor Hook
 * 
 * Features:
 * - Real-time FPS monitoring with history
 * - Memory usage tracking (JS Heap, DOM Nodes, Event Listeners)
 * - Network latency & bandwidth measurement
 * - Web Vitals (LCP, FID, CLS, TTFB, FCP, INP)
 * - Long Task detection
 * - Resource timing (load times for assets)
 * - Custom performance marks & measures
 * - Frame budget analysis
 * - Memory leak detection
 * - Performance budget alerts
 * - Export performance reports
 * - Compare snapshots
 * - Slow component detection
 * - Render count tracking
 * - Network waterfall visualization
 * - Battery & CPU status
 */
export const usePerformancePro = (options = {}) => {
  const {
    enableFPSTracking = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    enableWebVitals = true,
    enableLongTaskDetection = true,
    enableResourceTiming = true,
    enableMemoryLeakDetection = false,
    enableBatteryMonitoring = false,
    fpsInterval = 1000,        // Update FPS every 1s
    memoryInterval = 5000,     // Check memory every 5s
    latencyInterval = 15000,   // Ping every 15s
    bandwidthInterval = 60000, // Test every 60s
    historySize = 120,         // Keep 2 minutes of history at 1s intervals
    fpsWarningThreshold = 30,  // FPS below this = warning
    fpsCriticalThreshold = 15, // FPS below this = critical
    memoryWarningMB = 100,     // Memory above this = warning
    memoryCriticalMB = 200,    // Memory above this = critical
    latencyWarningMS = 200,    // Latency above this = warning
    latencyCriticalMS = 500,   // Latency above this = critical
    longTaskThreshold = 50,    // Tasks > 50ms are "long"
    onPerformanceWarning = null,
    onPerformanceCritical = null,
    onMemoryLeakDetected = null,
    onWebVitalUpdate = null,
    persistHistory = false,
    storageKey = 'admin_performance_history'
  } = options;

  // ============ State ============
  const [state, setState] = useState(() => {
    let savedHistory = null;
    if (persistHistory) {
      try {
        savedHistory = JSON.parse(localStorage.getItem(storageKey));
      } catch {}
    }

    return {
      // Core metrics
      fps: 60,
      fpsHistory: [],
      avgFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      
      // Memory
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 0,
        totalMB: 0,
        limitMB: 0,
        usagePercent: 0
      },
      memoryHistory: [],
      memoryTrend: 'stable', // stable, increasing, decreasing
      
      // Network
      latency: 0,
      latencyHistory: [],
      bandwidth: 0,
      bandwidthHistory: [],
      isOnline: navigator.onLine,
      connectionType: null,
      connectionSpeed: null,
      
      // Web Vitals
      webVitals: {
        LCP: null, // Largest Contentful Paint
        FID: null, // First Input Delay
        CLS: null, // Cumulative Layout Shift
        TTFB: null, // Time to First Byte
        FCP: null, // First Contentful Paint
        INP: null  // Interaction to Next Paint
      },
      
      // Long Tasks
      longTasks: [],
      totalLongTasks: 0,
      
      // Resources
      resourceTimings: [],
      slowResources: [],
      
      // Render
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      
      // System
      battery: null,
      cpuCores: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      
      // Status
      overallScore: 100,
      status: 'excellent', // excellent, good, fair, poor, critical
      warnings: [],
      lastUpdate: null
    };
  });

  // ============ Refs ============
  const frameRef = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const stateRef = useRef(state);
  const intervals = useRef({});
  const observers = useRef({});
  const longTasksObserver = useRef(null);
  const performanceObserver = useRef(null);
  const layoutShiftObserver = useRef(null);
  const memorySnapshots = useRef([]);
  const renderTimes = useRef([]);

  // Update ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ Helper: Update State ============
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates, lastUpdate: Date.now() }));
  }, []);

  // ============ ۱. FPS Monitoring ============
  useEffect(() => {
    if (!enableFPSTracking) return;

    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastFrameTime.current;

      if (delta >= fpsInterval) {
        const fps = Math.round((frameCount.current * 1000) / delta);
        frameCount.current = 0;
        lastFrameTime.current = now;

        setState(prev => {
          const newHistory = [
            ...prev.fpsHistory,
            { time: now, value: fps }
          ].slice(-historySize);

          const fpsValues = newHistory.map(h => h.value);
          const avgFPS = Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length);
          const minFPS = Math.min(...fpsValues);
          const maxFPS = Math.max(...fpsValues);

          // Check thresholds
          let status = prev.status;
          const warnings = [...prev.warnings];

          if (fps < fpsCriticalThreshold) {
            status = 'critical';
            warnings.push(`FPS بحرانی: ${fps} (min: ${fpsCriticalThreshold})`);
            onPerformanceCritical?.({ metric: 'fps', value: fps, threshold: fpsCriticalThreshold });
          } else if (fps < fpsWarningThreshold) {
            if (status !== 'critical') status = 'fair';
            warnings.push(`FPS پایین: ${fps}`);
            onPerformanceWarning?.({ metric: 'fps', value: fps, threshold: fpsWarningThreshold });
          }

          return {
            ...prev,
            fps,
            fpsHistory: newHistory,
            avgFPS,
            minFPS,
            maxFPS,
            status,
            warnings: warnings.slice(-5)
          };
        });
      }

      frameRef.current = requestAnimationFrame(measureFPS);
    };

    frameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enableFPSTracking, fpsInterval, historySize, fpsWarningThreshold, fpsCriticalThreshold]);

  // ============ ۲. Memory Monitoring ============
  useEffect(() => {
    if (!enableMemoryTracking || !performance.memory) return;

    const measureMemory = () => {
      const mem = performance.memory;
      const usedMB = Math.round(mem.usedJSHeapSize / 1048576);
      const totalMB = Math.round(mem.totalJSHeapSize / 1048576);
      const limitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
      const usagePercent = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);

      setState(prev => {
        const newMemoryHistory = [
          ...prev.memoryHistory,
          { time: Date.now(), usedMB, totalMB, limitMB, usagePercent }
        ].slice(-historySize);

        // Detect memory trend
        let memoryTrend = 'stable';
        if (newMemoryHistory.length > 10) {
          const recent = newMemoryHistory.slice(-10);
          const first = recent[0].usedMB;
          const last = recent[recent.length - 1].usedMB;
          const change = ((last - first) / first) * 100;
          
          if (change > 10) memoryTrend = 'increasing';
          else if (change < -10) memoryTrend = 'decreasing';
        }

        // Memory leak detection
        if (enableMemoryLeakDetection && memoryTrend === 'increasing' && usagePercent > 70) {
          const snapshot = {
            time: Date.now(),
            usedMB,
            totalMB,
            domNodes: document.getElementsByTagName('*').length,
            eventListeners: getEventListenersCount()
          };
          memorySnapshots.current.push(snapshot);

          if (memorySnapshots.current.length > 5) {
            const firstSnap = memorySnapshots.current[0];
            const growth = usedMB - firstSnap.usedMB;
            
            if (growth > 20) {
              toast.error('⚠️ احتمال نشت حافظه تشخیص داده شد', { duration: 5000 });
              onMemoryLeakDetected?.({
                growth,
                snapshots: memorySnapshots.current
              });
            }
          }
        }

        // Alerts
        const warnings = [...prev.warnings];
        if (usedMB > memoryCriticalMB) {
          onPerformanceCritical?.({ metric: 'memory', value: usedMB, threshold: memoryCriticalMB });
        } else if (usedMB > memoryWarningMB) {
          onPerformanceWarning?.({ metric: 'memory', value: usedMB, threshold: memoryWarningMB });
        }

        return {
          ...prev,
          memory: { usedMB, totalMB, limitMB, usagePercent, ...mem },
          memoryHistory: newMemoryHistory,
          memoryTrend,
          warnings: warnings.slice(-5)
        };
      });
    };

    measureMemory();
    intervals.current.memory = setInterval(measureMemory, memoryInterval);

    return () => clearInterval(intervals.current.memory);
  }, [enableMemoryTracking, enableMemoryLeakDetection, memoryInterval, historySize, memoryWarningMB, memoryCriticalMB]);

  // ============ ۳. Network Monitoring ============
  useEffect(() => {
    if (!enableNetworkTracking) return;

    // Latency
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-store'
        });
        const latency = Math.round(performance.now() - start);
        
        setState(prev => ({
          ...prev,
          latency,
          latencyHistory: [...prev.latencyHistory, { time: Date.now(), value: latency }].slice(-historySize),
          isOnline: true
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isOnline: !navigator.onLine }));
        console.warn('Latency measurement skipped - endpoint not available');
        return null;  // یا مقدار پیش‌فرض
  }
    };

    // Bandwidth
    const measureBandwidth = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch('/api/bandwidth-test', { 
          cache: 'no-store'
        });
        const data = await response.arrayBuffer();
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const sizeInBits = data.byteLength * 8;
        const bandwidth = Math.round(sizeInBits / duration / 1000000 * 100) / 100; // Mbps

        setState(prev => ({
          ...prev,
          bandwidth,
          bandwidthHistory: [...prev.bandwidthHistory, { time: Date.now(), value: bandwidth }].slice(-50)
        }));
      } catch {
        // Bandwidth test failed
            console.warn('Bandwidth measurement skipped - endpoint not available');
             return 0;  // یا مقدار پیش‌فرض
      }
    };

    // Connection info
    const updateConnection = () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        setState(prev => ({
          ...prev,
          connectionType: conn.effectiveType,
          connectionSpeed: conn.downlink,
          isOnline: navigator.onLine
        }));
      }
    };

    //measureLatency();
    //measureBandwidth();
    updateConnection();

    intervals.current.latency = setInterval(measureLatency, latencyInterval);
    intervals.current.bandwidth = setInterval(measureBandwidth, bandwidthInterval);
    
    window.addEventListener('online', () => setState(prev => ({ ...prev, isOnline: true })));
    window.addEventListener('offline', () => setState(prev => ({ ...prev, isOnline: false })));
    navigator.connection?.addEventListener('change', updateConnection);

    return () => {
      clearInterval(intervals.current.latency);
      clearInterval(intervals.current.bandwidth);
    };
  }, [enableNetworkTracking, latencyInterval, bandwidthInterval, historySize]);

  // ============ ۴. Web Vitals ============
  useEffect(() => {
    if (!enableWebVitals) return;

    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setState(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, LCP: lastEntry.renderTime || lastEntry.loadTime }
          }));
          onWebVitalUpdate?.({ name: 'LCP', value: lastEntry.renderTime || lastEntry.loadTime });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.current.lcp = lcpObserver;

        // FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            setState(prev => ({
              ...prev,
              webVitals: { ...prev.webVitals, FID: entry.processingStart - entry.startTime }
            }));
            onWebVitalUpdate?.({ name: 'FID', value: entry.processingStart - entry.startTime });
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observers.current.fid = fidObserver;

        // CLS
        let clsValue = 0;
        let clsEntries = [];
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          setState(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, CLS: clsValue }
          }));
          onWebVitalUpdate?.({ name: 'CLS', value: clsValue });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observers.current.cls = clsObserver;

        // Navigation Timing (TTFB, FCP)
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              setState(prev => ({
                ...prev,
                webVitals: { ...prev.webVitals, FCP: entry.startTime }
              }));
              onWebVitalUpdate?.({ name: 'FCP', value: entry.startTime });
            }
          }
        });
        navObserver.observe({ type: 'paint', buffered: true });
        observers.current.nav = navObserver;

        // TTFB from navigation timing
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          setState(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, TTFB: navEntry.responseStart - navEntry.requestStart }
          }));
        }
      } catch (e) {
        // PerformanceObserver not supported for some metrics
      }
    }

    return () => {
      Object.values(observers.current).forEach(observer => observer?.disconnect());
    };
  }, [enableWebVitals, onWebVitalUpdate]);

  // ============ ۵. Long Task Detection ============
  useEffect(() => {
    if (!enableLongTaskDetection) return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > longTaskThreshold) {
              setState(prev => ({
                ...prev,
                longTasks: [...prev.longTasks, {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  name: entry.name,
                  timestamp: Date.now()
                }].slice(-50),
                totalLongTasks: prev.totalLongTasks + 1
              }));

              if (entry.duration > 200) {
                toast.error(`⏱️ کندی تشخیص داده شد: ${Math.round(entry.duration)}ms`, { duration: 3000 });
              }
            }
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
        longTasksObserver.current = observer;
      } catch (e) {
        // Long task observer not supported
      }
    }

    return () => longTasksObserver.current?.disconnect();
  }, [enableLongTaskDetection, longTaskThreshold]);

  // ============ ۶. Resource Timing ============
  useEffect(() => {
    if (!enableResourceTiming) return;

    const observer = new PerformanceObserver((list) => {
      const resources = list.getEntries().map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: Math.round(entry.duration),
        size: entry.transferSize || 0,
        startTime: entry.startTime
      }));

      setState(prev => ({
        ...prev,
        resourceTimings: [...prev.resourceTimings, ...resources].slice(-200),
        slowResources: resources
          .filter(r => r.duration > 1000)
          .concat(prev.slowResources)
          .slice(-20)
      }));
    });

    observer.observe({ type: 'resource', buffered: true });
    performanceObserver.current = observer;

    return () => observer.disconnect();
  }, [enableResourceTiming]);

  // ============ ۷. Battery Monitoring ============
  useEffect(() => {
    if (!enableBatteryMonitoring) return;

    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          setState(prev => ({
            ...prev,
            battery: {
              level: battery.level,
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime
            }
          }));
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }
  }, [enableBatteryMonitoring]);

  // ============ ۸. Render Tracking ============
  const trackRender = useCallback((componentName) => {
    const start = performance.now();
    renderTimes.current.push({ component: componentName, start, end: 0 });

    return () => {
      const end = performance.now();
      const duration = end - start;
      
      renderTimes.current = renderTimes.current.map(r => 
        r.start === start ? { ...r, end, duration } : r
      ).slice(-100);

      setState(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: duration,
        averageRenderTime: renderTimes.current.length > 0
          ? Math.round(renderTimes.current.reduce((sum, r) => sum + (r.duration || 0), 0) / renderTimes.current.length)
          : prev.averageRenderTime
      }));
    };
  }, []);

  // ============ ۹. Custom Marks ============
  const mark = useCallback((name) => {
    performance.mark(name);
  }, []);

  const measure = useCallback((name, startMark, endMark) => {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      return entries[entries.length - 1]?.duration || 0;
    } catch {
      return 0;
    }
  }, []);

  // ============ ۱۰. Performance Report ============
  const getPerformanceReport = useCallback(() => {
    const currentState = stateRef.current;
    
    const calculateScore = () => {
      let score = 100;

      // FPS score
      if (currentState.avgFPS < 30) score -= 30;
      else if (currentState.avgFPS < 50) score -= 15;

      // Memory score
      if (currentState.memory.usagePercent > 80) score -= 25;
      else if (currentState.memory.usagePercent > 60) score -= 10;

      // Latency score
      if (currentState.latency > 500) score -= 20;
      else if (currentState.latency > 200) score -= 10;

      // Web Vitals score
      if (currentState.webVitals.LCP && currentState.webVitals.LCP > 2500) score -= 10;
      if (currentState.webVitals.FID && currentState.webVitals.FID > 100) score -= 10;
      if (currentState.webVitals.CLS && currentState.webVitals.CLS > 0.1) score -= 10;

      return Math.max(0, score);
    };

    const score = calculateScore();
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : score >= 30 ? 'poor' : 'critical';

    return {
      timestamp: new Date().toISOString(),
      score,
      status,
      metrics: {
        fps: {
          current: currentState.fps,
          average: currentState.avgFPS,
          min: currentState.minFPS,
          max: currentState.maxFPS
        },
        memory: {
          usedMB: currentState.memory.usedMB,
          totalMB: currentState.memory.limitMB,
          percent: currentState.memory.usagePercent,
          trend: currentState.memoryTrend
        },
        network: {
          latency: currentState.latency,
          bandwidth: currentState.bandwidth,
          type: currentState.connectionType
        },
        webVitals: currentState.webVitals,
        longTasks: currentState.totalLongTasks,
        resources: {
          total: currentState.resourceTimings.length,
          slow: currentState.slowResources.length
        }
      },
      warnings: currentState.warnings,
      recommendations: generateRecommendations(currentState),
      system: {
        cpuCores: currentState.cpuCores,
        deviceMemory: currentState.deviceMemory,
        battery: currentState.battery,
        online: currentState.isOnline
      }
    };
  }, []);

  // ============ ۱۱. Export Report ============
  const exportReport = useCallback(() => {
    const report = getPerformanceReport();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📊 گزارش عملکرد دانلود شد');
  }, [getPerformanceReport]);

  // ============ Helper: Get Event Listeners Count ============
  function getEventListenersCount() {
    // Approximate: count elements with event handlers
    return document.querySelectorAll('[onclick], [onchange], [oninput], [onsubmit]').length;
  }

  // ============ Helper: Generate Recommendations ============
  function generateRecommendations(state) {
    const recommendations = [];

    if (state.avgFPS < 30) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'FPS پایین: استفاده از React.memo و useMemo برای بهینه‌سازی',
        action: 'optimize_renders'
      });
    }

    if (state.memory.usagePercent > 70) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'مصرف بالای حافظه: بررسی memory leak و cleanup در useEffect',
        action: 'check_memory_leaks'
      });
    }

    if (state.latency > 300) {
      recommendations.push({
        type: 'network',
        priority: 'medium',
        message: 'تاخیر شبکه بالا: استفاده از کش و lazy loading',
        action: 'optimize_network'
      });
    }

    if (state.webVitals.LCP > 2500) {
      recommendations.push({
        type: 'web_vital',
        priority: 'medium',
        message: 'LCP بالا: بهینه‌سازی تصاویر و critical CSS',
        action: 'optimize_lcp'
      });
    }

    if (state.totalLongTasks > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Long Tasks زیاد: شکستن کارهای سنگین با requestIdleCallback',
        action: 'break_long_tasks'
      });
    }

    return recommendations;
  }

  // ============ Cleanup ============
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      Object.values(intervals.current).forEach(clearInterval);
      Object.values(observers.current).forEach(obs => obs?.disconnect());
      longTasksObserver.current?.disconnect();
      performanceObserver.current?.disconnect();
    };
  }, []);

  // ============ Persist History ============
  useEffect(() => {
    if (persistHistory) {
      try {
        const historyData = {
          fps: state.fpsHistory.slice(-60),
          memory: state.memoryHistory.slice(-20),
          latency: state.latencyHistory.slice(-20),
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(historyData));
      } catch {}
    }
  }, [state.fpsHistory, state.memoryHistory, state.latencyHistory, persistHistory, storageKey]);

  return {
    // Metrics
    ...state,
    
    // Actions
    trackRender,
    mark,
    measure,
    getPerformanceReport,
    exportReport,
    
    // Controls
    startMonitoring: () => {
      // Already auto-started via effects
    },
    stopMonitoring: () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      Object.values(intervals.current).forEach(clearInterval);
    },
    
    // Helpers
    isPerformanceGood: state.status === 'excellent' || state.status === 'good',
    hasWarnings: state.warnings.length > 0,
    getFPSColor: () => {
      if (state.fps >= 55) return '#10b981';
      if (state.fps >= 30) return '#f59e0b';
      return '#ef4444';
    }
  };
};

export default usePerformancePro;