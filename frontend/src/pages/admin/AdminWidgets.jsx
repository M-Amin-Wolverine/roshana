// src/pages/admin/AdminWidgets.jsx
// ═══════════════════════════════════════════════════════════════════════════
// 🚀 ENTERPRISE ADMIN DASHBOARD - نسخه فوق‌العاده خفن و حرفه‌ای
// ═══════════════════════════════════════════════════════════════════════════
import { io } from 'socket.io-client';
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaBook, FaChartLine, FaServer, FaClock, FaCalendar, 
  FaBell, FaComments, FaCog, FaPlus, FaTimes, FaArrowsAlt, 
  FaMoon, FaSun, FaExpand, FaCompress, FaDownload, FaShare, 
  FaShieldAlt, FaKey, FaTicketAlt, FaHome, FaFlask, FaNewspaper,
  FaCloudSun, FaRss, FaMoneyBill, FaCreditCard, FaChartBar,
  FaCalendarAlt, FaCheckCircle, FaUserShield, FaDatabase, FaSync,
  FaFilter, FaSearch, FaPalette, FaSave, FaTrash, FaEdit, FaEye,
  FaHistory, FaChartPie, FaChartArea, FaRobot, FaBrain, FaBellSlash,
  FaFileExport, FaFileImport, FaLock, FaUnlockAlt, FaUserSecret, FaBookOpen,
  FaGlobe       // <-- اضافه شود
} from 'react-icons/fa';
// نمودارهای recharts (درست)
import { 
  LineChart, Line, BarChart, Bar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from 'recharts';

// نمودارهای دایره‌ای از react-chartjs-2
import { useHotkeys } from 'react-hotkeys-hook';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

// ═══════════════════════════════════════════════════════════════════════════
// 📊 CONSTANTS & CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const ROLE_LEVELS = {
  admin: 100, it_manager: 90, vice_chancellor: 80, head_of_department: 70,
  security_manager: 65, financial_manager: 60, education_manager: 60,
  cultural_manager: 55, professor: 50, dormitory_manager: 45, supervisor: 45,
  staff: 40, support_agent: 30, librarian: 20, research_assistant: 15,
  student: 10, guest: 1
};

export const ROLE_NAMES = {
  admin: 'مدیر سیستم', it_manager: 'مدیر فناوری اطلاعات', vice_chancellor: 'معاون دانشگاه',
  head_of_department: 'مدیر گروه', security_manager: 'مدیر حراست', financial_manager: 'مدیر مالی',
  education_manager: 'مدیر آموزش', cultural_manager: 'مدیر فرهنگی', professor: 'استاد',
  dormitory_manager: 'مدیر خوابگاه', supervisor: 'ناظر', staff: 'کارمند',
  support_agent: 'پشتیبان فنی', librarian: 'کتابدار', research_assistant: 'دستیار پژوهشی',
  student: 'دانشجو', guest: 'مهمان'
};

export const ROLE_COLORS = {
  admin: '#DC2626', it_manager: '#7C3AED', vice_chancellor: '#2563EB',
  head_of_department: '#0891B2', security_manager: '#D97706', financial_manager: '#047857',
  education_manager: '#059669', cultural_manager: '#EA580C', professor: '#3B82F6',
  dormitory_manager: '#8B5CF6', supervisor: '#6B7280', staff: '#9CA3AF',
  support_agent: '#F59E0B', librarian: '#14B8A6', research_assistant: '#EC4899',
  student: '#10B981', guest: '#64748B'
};

// مجوزهای پیشرفته ویجت‌ها
export const WIDGET_PERMISSIONS = {
  'system-status': { name: 'وضعیت سیستم', icon: 'FaServer', allowedRoles: ['admin', 'it_manager', 'security_manager', 'supervisor'], minLevel: 65, category: 'system', sensitive: true, auditLog: true, realtime: true },
  'api-monitor': { name: 'مانیتورینگ API', icon: 'FaChartLine', allowedRoles: ['admin', 'it_manager'], minLevel: 90, category: 'system', sensitive: true, realtime: true },
  'user-management': { name: 'مدیریت کاربران', icon: 'FaUsers', allowedRoles: ['admin', 'it_manager', 'vice_chancellor', 'security_manager'], minLevel: 65, category: 'users', sensitive: true, actions: ['create', 'edit', 'delete'] },
  'financial-stats': { name: 'آمار مالی', icon: 'FaMoneyBill', allowedRoles: ['admin', 'vice_chancellor', 'financial_manager'], minLevel: 60, category: 'financial', sensitive: true, exportable: true },
  'courses-stats': { name: 'دوره‌های آموزشی', icon: 'FaBook', allowedRoles: ['admin', 'vice_chancellor', 'head_of_department', 'education_manager', 'professor', 'supervisor'], minLevel: 40, category: 'education', exportable: true },
  'grades-analytics': { name: 'تحلیل نمرات', icon: 'FaChartBar', allowedRoles: ['admin', 'education_manager', 'head_of_department', 'professor'], minLevel: 50, category: 'education', sensitive: true },
  'attendance-tracker': { name: 'حضور و غیاب', icon: 'FaCheckCircle', allowedRoles: ['admin', 'education_manager', 'professor', 'supervisor'], minLevel: 50, category: 'education', realtime: true },
  'security-logs': { name: 'لاگ‌های امنیتی', icon: 'FaShieldAlt', allowedRoles: ['admin', 'security_manager', 'it_manager'], minLevel: 65, category: 'security', sensitive: true, auditLog: true },
  'tickets-system': { name: 'تیکت‌ها', icon: 'FaTicketAlt', allowedRoles: ['admin', 'support_agent', 'it_manager', 'professor', 'student'], minLevel: 10, category: 'support' },
  'live-chat': { name: 'چت زنده', icon: 'FaComments', allowedRoles: ['admin', 'support_agent', 'professor', 'student'], minLevel: 10, category: 'support', realtime: true },
  'library-stats': { name: 'کتابخانه', icon: 'FaBookOpen', allowedRoles: ['admin', 'librarian', 'professor', 'student'], minLevel: 10, category: 'library', exportable: true },
  'research-tools': { name: 'پژوهش', icon: 'FaFlask', allowedRoles: ['admin', 'research_assistant', 'professor'], minLevel: 15, category: 'research' },
  'events-calendar': { name: 'رویدادها', icon: 'FaCalendar', allowedRoles: 'all', minLevel: 1, category: 'cultural' },
  'notifications': { name: 'اعلان‌ها', icon: 'FaBell', allowedRoles: 'all', minLevel: 1, category: 'general' },
  'ai-predictions': { name: 'پیش‌بینی AI', icon: 'FaRobot', allowedRoles: ['admin', 'vice_chancellor', 'financial_manager'], minLevel: 60, category: 'ai', sensitive: true },
  'anomaly-detection': { name: 'تشخیص ناهنجاری', icon: 'FaBrain', allowedRoles: ['admin', 'security_manager', 'it_manager'], minLevel: 65, category: 'ai', sensitive: true, realtime: true },
  'heatmap-activity': { name: 'نقشه حرارتی', icon: 'FaChartArea', allowedRoles: ['admin', 'it_manager', 'education_manager'], minLevel: 50, category: 'analytics' },
  'geographic-map': { name: 'نقشه جغرافیایی', icon: 'FaGlobe', allowedRoles: ['admin', 'vice_chancellor'], minLevel: 60, category: 'analytics' }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// هوک مدیریت تم
const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
};

// هوک مدیریت ویجت‌ها با کش
const useWidgetsManager = (initialWidgets, userRole) => {
  const [widgets, setWidgets] = useState(() => {
    const cached = localStorage.getItem(`widgets-${userRole}`);
    return cached ? JSON.parse(cached) : initialWidgets;
  });
  const [layout, setLayout] = useState(() => {
    const cached = localStorage.getItem(`layout-${userRole}`);
    return cached ? JSON.parse(cached) : {};
  });
  
  const addWidget = useCallback((widget) => {
    setWidgets(prev => [...prev, { ...widget, id: Date.now() }]);
  }, []);
  
  const removeWidget = useCallback((id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);
  
  const updateWidgetSize = useCallback((id, size) => {
    setLayout(prev => ({ ...prev, [id]: { ...prev[id], size } }));
  }, []);
  
  // ذخیره خودکار
  useEffect(() => {
    localStorage.setItem(`widgets-${userRole}`, JSON.stringify(widgets));
    localStorage.setItem(`layout-${userRole}`, JSON.stringify(layout));
  }, [widgets, layout, userRole]);
  
  return { widgets, layout, addWidget, removeWidget, updateWidgetSize };
};

// هوک دسترسی
const useWidgetAccess = (userRole, userLevel) => {
  const canAccess = useCallback((widgetType, action = 'read') => {
    const perms = WIDGET_PERMISSIONS[widgetType];
    if (!perms) return false;
    if (userRole === 'admin') return true;
    if (userLevel < (perms.minLevel || 0)) return false;
    if (perms.allowedRoles !== 'all' && !perms.allowedRoles?.includes(userRole)) return false;
    if (perms.actions && !perms.actions.includes(action)) return false;
    return true;
  }, [userRole, userLevel]);
  
  const filterWidgets = useCallback((widgets) => widgets.filter(w => canAccess(w.type)), [canAccess]);
  
  return { canAccess, filterWidgets };
};

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 AI & ANALYTICS COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ویجت پیش‌بینی هوشمند
const AIPredictionsWidget = ({ data, onRemove }) => {
  const [predictions, setPredictions] = useState([]);
  const [confidence, setConfidence] = useState(85);
  
  useEffect(() => {
    // شبیه‌سازی الگوریتم پیش‌بینی
    const generatePredictions = () => {
      const historical = data.historical || [];
      const trend = historical.length > 0 ? (historical[historical.length-1] - historical[0]) / historical.length : 0;
      const future = Array.from({ length: 7 }, (_, i) => ({
        day: `روز ${i+1}`,
        predicted: Math.max(0, Math.floor((historical[historical.length-1] || 100) + trend * (i+1) + Math.random() * 10)),
        upperBound: 0,
        lowerBound: 0
      }));
      
      future.forEach(f => {
        f.upperBound = f.predicted * 1.1;
        f.lowerBound = f.predicted * 0.9;
      });
      
      setPredictions(future);
    };
    
    generatePredictions();
    const interval = setInterval(generatePredictions, 30000);
    return () => clearInterval(interval);
  }, [data]);
  
  return (
    <motion.div className="widget ai-widget" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="widget-header">
        <h3><FaRobot /> پیش‌بینی هوشمند AI</h3>
        <div className="widget-actions">
          <span className="confidence-badge">دقت مدل: {confidence}%</span>
          <button onClick={onRemove}><FaTimes /></button>
        </div>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={predictions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="upperBound" fill="#8884d820" stroke="#8884d8" />
            <Area type="monotone" dataKey="lowerBound" fill="#8884d820" stroke="#8884d8" />
            <Line type="monotone" dataKey="predicted" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="ai-insights">
          <p>🔮 پیش‌بینی رشد: {predictions[6]?.predicted - predictions[0]?.predicted > 0 ? '📈 صعودی' : '📉 نزولی'}</p>
          <p>⚡ فاکتورهای موثر: فصل آموزشی، رویدادهای پیش رو</p>
        </div>
      </div>
    </motion.div>
  );
};

// ویجت تشخیص ناهنجاری
const AnomalyDetectionWidget = ({ data, onRemove }) => {
  const [anomalies, setAnomalies] = useState([]);
  
  useEffect(() => {
    const detectAnomalies = () => {
      const metrics = data.metrics || [];
      const mean = metrics.reduce((a,b) => a + b, 0) / metrics.length;
      const stdDev = Math.sqrt(metrics.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / metrics.length);
      const detected = metrics.map((val, idx) => ({
        index: idx,
        value: val,
        isAnomaly: Math.abs(val - mean) > 2 * stdDev
      })).filter(a => a.isAnomaly);
      
      setAnomalies(detected);
      
      if (detected.length > 0) {
        Swal.fire({
          title: '⚠️ ناهنجاری تشخیص داده شد!',
          text: `${detected.length} مورد غیرعادی در داده‌ها یافت شد`,
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000
        });
      }
    };
    
    detectAnomalies();
    const interval = setInterval(detectAnomalies, 15000);
    return () => clearInterval(interval);
  }, [data]);
  
  return (
    <motion.div className="widget anomaly-widget" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="widget-header">
        <h3><FaBrain /> تشخیص ناهنجاری</h3>
        <div className="widget-actions">
          {anomalies.length > 0 && <span className="anomaly-badge">{anomalies.length} ناهنجاری</span>}
          <button onClick={onRemove}><FaTimes /></button>
        </div>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data.metrics?.map((v, i) => ({ index: i, value: v })) || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" />
            {anomalies.map(a => (
              <circle key={a.index} cx={a.index * 20} cy={a.value} r={6} fill="red" />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="anomaly-list">
          {anomalies.slice(0, 3).map(a => (
            <div key={a.index} className="anomaly-item">
              <span className="anomaly-time">نقطه {a.index + 1}</span>
              <span className="anomaly-value">مقدار: {a.value.toFixed(2)}</span>
              <span className="anomaly-severity">شدت: بالا</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// نقشه حرارتی فعالیت
const HeatmapWidget = ({ data, onRemove }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  const [heatmapData, setHeatmapData] = useState([]);
  
  useEffect(() => {
    // تولید داده‌های شبیه‌سازی شده
    const generated = days.map((day, dayIdx) => ({
      day,
      hours: hours.map(hour => ({
        hour,
        activity: Math.floor(Math.random() * 100) * (dayIdx === 3 ? 1.5 : 1)
      }))
    }));
    setHeatmapData(generated);
  }, []);
  
  const getColor = (value) => {
    if (value < 20) return '#ebedf0';
    if (value < 40) return '#9be9a8';
    if (value < 60) return '#40c463';
    if (value < 80) return '#30a14e';
    return '#216e39';
  };
  
  return (
    <motion.div className="widget heatmap-widget" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="widget-header">
        <h3><FaChartArea /> نقشه حرارتی فعالیت</h3>
        <div className="widget-actions">
          <button onClick={onRemove}><FaTimes /></button>
        </div>
      </div>
      <div className="widget-content">
        <div className="heatmap-container">
          <div className="heatmap-hours">
            <div></div>
            {hours.map(h => <span key={h} className="hour-label">{h}:00</span>)}
          </div>
          {heatmapData.map(day => (
            <div key={day.day} className="heatmap-row">
              <span className="day-label">{day.day}</span>
              {day.hours.map(cell => (
                <div
                  key={cell.hour}
                  className="heatmap-cell"
                  style={{ backgroundColor: getColor(cell.activity) }}
                  title={`${day.day} ${cell.hour}:00 - ${cell.activity} فعالیت`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>کم فعالی</span>
          <div className="legend-gradient" />
          <span>بیشترین فعالیت</span>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 ENHANCED WIDGETS (نسخه ارتقا یافته ویجت‌های قبلی)
// ═══════════════════════════════════════════════════════════════════════════

// ویجت آمار کاربران پیشرفته
export const EnhancedUsersStatsWidget = ({ data, onRemove, onResize, userRole }) => {
  const [realtime, setRealtime] = useState(data.online);
  
  useEffect(() => {
    const socket = io('http://localhost:5000');  // یا آدرس واقعی سرورت

    socket.on('connect', () => {
      console.log('✅ متصل به سرور');
    });

    socket.on('online-users-count', (count) => {
      setRealtime(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  
  return (
    <motion.div className="widget enhanced-users-widget" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -2 }}>
      <div className="widget-header">
        <h3><FaUsers /> آمار کاربران</h3>
        <div className="widget-actions">
          <button onClick={onResize}><FaArrowsAlt /></button>
          <button onClick={() => { /* export to PDF */ }}><FaFileExport /></button>
          <button onClick={onRemove}><FaTimes /></button>
        </div>
      </div>
      <div className="widget-content">
        <div className="enhanced-stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <span className="stat-value">{data.total.toLocaleString()}</span>
            <span className="stat-label">کل کاربران</span>
            <span className="stat-trend positive">+{data.newToday} امروز</span>
          </div>
          <div className="stat-card">
            <FaUserShield className="stat-icon" />
            <span className="stat-value">{realtime}</span>
            <span className="stat-label">آنلاین</span>
            <div className="online-indicator"><span className="pulse"></span></div>
          </div>
          <div className="stat-card">
            <FaChartLine className="stat-icon" />
            <span className="stat-value">{data.growthRate}%</span>
            <span className="stat-label">نرخ رشد</span>
            <span className="stat-trend positive">{data.monthlyGrowth}% ماهانه</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.history}>
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="url(#userGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
  
};

// ویجت سیستم با دیاگرام زنده
const EnhancedSystemStatusWidget = ({ data, onRemove }) => {
  const [metrics, setMetrics] = useState(data);
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = {
        ...metrics,
        cpu: Math.floor(Math.random() * 40) + 20,
        memory: Math.floor(Math.random() * 30) + 40,
        disk: Math.floor(Math.random() * 20) + 30,
        responseTime: Math.floor(Math.random() * 100) + 50,
        rps: Math.floor(Math.random() * 500) + 200
      };
      setMetrics(newMetrics);
      setHistory(prev => [...prev.slice(-20), { time: new Date().toLocaleTimeString(), cpu: newMetrics.cpu, rps: newMetrics.rps }]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div className="widget system-widget" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="widget-header">
        <h3><FaServer /> وضعیت سیستم لحظه‌ای</h3>
        <div className="widget-actions">
          <span className={`status-badge ${metrics.cpu > 70 ? 'warning' : 'healthy'}`}>
            {metrics.cpu > 70 ? '⚠️ فشار بالا' : '✓ عملیاتی'}
          </span>
          <button onClick={onRemove}><FaTimes /></button>
        </div>
      </div>
      <div className="widget-content">
        <div className="metrics-grid">
          {[
            { label: 'CPU', value: metrics.cpu, color: '#3b82f6', icon: '💻' },
            { label: 'RAM', value: metrics.memory, color: '#10b981', icon: '🧠' },
            { label: 'DISK', value: metrics.disk, color: '#f59e0b', icon: '💾' },
            { label: 'RPS', value: metrics.rps, color: '#8b5cf6', icon: '⚡' }
          ].map(metric => (
            <div key={metric.label} className="metric-card">
              <span className="metric-icon">{metric.icon}</span>
              <div className="metric-bar-container">
                <div className="metric-bar" style={{ width: `${metric.value}%`, backgroundColor: metric.color }} />
              </div>
              <span className="metric-value">{metric.value}{metric.label === 'RPS' ? '' : '%'}</span>
              <span className="metric-label">{metric.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={history}>
            <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="rps" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// دکمه افزودن ویجت با جستجو
const AddWidgetButton = ({ onAdd, userRole, userLevel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { canAccess } = useWidgetAccess(userRole, userLevel);
  
  const availableWidgets = Object.entries(WIDGET_PERMISSIONS)
    .filter(([type]) => canAccess(type))
    .map(([type, config]) => ({ type, ...config }));
  
  const filtered = availableWidgets.filter(w => 
    w.name.includes(search) || w.category.includes(search)
  );
  
  return (
    <div className="add-widget-container">
      <button className="add-widget-btn" onClick={() => setIsOpen(true)}>
        <FaPlus /> افزودن ویجت جدید
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div className="widget-modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <div className="modal-header">
              <h3>➕ افزودن ویجت</h3>
              <input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={() => setIsOpen(false)}><FaTimes /></button>
            </div>
            <div className="widgets-list-modal">
              {filtered.map(widget => (
                <div key={widget.type} className="widget-option" onClick={() => { onAdd(widget); setIsOpen(false); }}>
                  <span className="widget-icon">📊</span>
                  <div className="widget-info">
                    <span className="widget-name">{widget.name}</span>
                    <span className="widget-category">{widget.category}</span>
                  </div>
                  {widget.sensitive && <FaLock className="sensitive-icon" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// کامپوننت export به PDF/Excel
const ExportDashboard = ({ widgets, userRole }) => {
  const exportToPDF = async () => {
    const element = document.getElementById('dashboard-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
    pdf.save(`dashboard-${userRole}-${Date.now()}.pdf`);
    
    Swal.fire('موفق!', 'داشبورد با موفقیت ذخیره شد', 'success');
  };
  
  return (
    <div className="export-buttons">
      <button onClick={exportToPDF} className="export-btn"><FaFileExport /> PDF</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - ENTERPRISE WIDGET GRID
// ═══════════════════════════════════════════════════════════════════════════

  export const AdminWidgetsGrid = ({ userRole, userLevel, initialWidgets }) => {
    const { theme, toggleTheme } = useTheme();
    const { widgets, layout, addWidget, removeWidget, updateWidgetSize } = useWidgetsManager(initialWidgets, userRole);
    const { filterWidgets } = useWidgetAccess(userRole, userLevel);
    const [widgetOrder, setWidgetOrder] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    
    const accessibleWidgets = filterWidgets(widgets);
    
    useEffect(() => {
      setWidgetOrder(accessibleWidgets.map(w => w.id));
    }, [accessibleWidgets]);
    
    // هوتکی‌ها
    const exportDashboardToPDF = async () => {
    const element = document.getElementById('dashboard-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
    pdf.save(`dashboard-${userRole}-${Date.now()}.pdf`);
    Swal.fire('موفق!', 'داشبورد ذخیره شد', 'success');
  };

  useHotkeys('ctrl+e', exportDashboardToPDF);
  useHotkeys('ctrl+d', () => toggleTheme());
  useHotkeys('ctrl+f', () => document.getElementById('search-input')?.focus());
  useHotkeys('esc', () => setIsFullscreen(false));
  
  const renderWidget = (widget) => {
    const props = { 
      data: widget.data, 
      onRemove: () => removeWidget(widget.id),
      onResize: () => updateWidgetSize(widget.id, layout[widget.id]?.size === 'large' ? 'normal' : 'large'),
      userRole
    };
    
    switch (widget.type) {
      case 'users-stats': return <EnhancedUsersStatsWidget {...props} />;
      case 'system-status': return <EnhancedSystemStatusWidget {...props} />;
      case 'ai-predictions': return <AIPredictionsWidget {...props} />;
      case 'anomaly-detection': return <AnomalyDetectionWidget {...props} />;
      case 'heatmap-activity': return <HeatmapWidget {...props} />;
      default: return <div className="widget-placeholder">ویجت {widget.type} در حال توسعه</div>;
    }
  };
  
  return (
    <div className={`enterprise-dashboard ${theme}`} id="dashboard-content">
      {/* هدر پیشرفته */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 داشبورد مدیریتی فرتاک</h1>
          <div className="role-indicator" style={{ backgroundColor: ROLE_COLORS[userRole] }}>
            <FaUserShield /> {ROLE_NAMES[userRole]} | سطح {userLevel}
          </div>
        </div>
        
        <div className="header-right">
          <span className="last-update">🕐 آخرین بروزرسانی: {lastUpdate.toLocaleTimeString()}</span>
          <button onClick={toggleTheme} className="icon-btn">
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="icon-btn">
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <ExportDashboard widgets={accessibleWidgets} userRole={userRole} />
          <button onClick={() => window.location.reload()} className="icon-btn">
            <FaSync />
          </button>
        </div>
      </div>
      
      {/* آمار سریع */}
      <div className="quick-stats">
        <div className="quick-stat"><span>📊</span> {accessibleWidgets.length} ویجت فعال</div>
        <div className="quick-stat"><span>👥</span> {ROLE_LEVELS[userRole]} سطح دسترسی</div>
        <div className="quick-stat"><span>⚡</span> Real-time Active</div>
      </div>
      
      {/* گرید اصلی ویجت‌ها */}
      <div className={`widgets-grid ${isFullscreen ? 'fullscreen' : ''}`}>
        <Reorder.Group axis="y" values={widgetOrder} onReorder={setWidgetOrder}>
          {widgetOrder.map(id => {
            const widget = accessibleWidgets.find(w => w.id === id);
            return widget ? (
              <Reorder.Item 
                key={widget.id} 
                value={widget.id}
                className={`widget-wrapper ${layout[widget.id]?.size || 'normal'}`}
              >
                {renderWidget(widget)}
              </Reorder.Item>
            ) : null;
          })}
        </Reorder.Group>
      </div>
      
      <AddWidgetButton onAdd={addWidget} userRole={userRole} userLevel={userLevel} />
      
      {/* فوتر با اطلاعات سیستمی */}
      <div className="dashboard-footer">
        <span>© 2024 فرتاک | v3.0.0</span>
        <span>🔒 امنیت بالا | ⚡ پاسخگویی لحظه‌ای | 🌙 پشتیبانی از تم تاریک</span>
      </div>
      
      <style>{`
        .enterprise-dashboard {
          direction: rtl;
          padding: 20px;
          background: var(--bg-primary);
          min-height: 100vh;
          transition: all 0.3s ease;
        }
        
        [data-theme="light"] {
          --bg-primary: #f3f4f6;
          --bg-secondary: #ffffff;
          --text-primary: #1f2937;
          --border-color: #e5e7eb;
        }
        
        [data-theme="dark"] {
          --bg-primary: #111827;
          --bg-secondary: #1f2937;
          --text-primary: #f9fafb;
          --border-color: #374151;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
          padding: 15px 25px;
          border-radius: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .role-indicator {
          padding: 5px 15px;
          border-radius: 20px;
          color: white;
          font-size: 14px;
          margin-right: 15px;
        }
        
        .widget {
          background: var(--bg-secondary);
          border-radius: 15px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        .widget:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.15);
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--border-color);
        }
        
        .widget-header h3 {
          margin: 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .widget-actions {
          display: flex;
          gap: 8px;
        }
        
        .widget-actions button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          border-radius: 5px;
          transition: all 0.2s;
        }
        
        .widget-actions button:hover {
          background: var(--border-color);
        }
        
        .enhanced-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          text-align: center;
          padding: 10px;
          background: var(--bg-primary);
          border-radius: 10px;
        }
        
        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          display: block;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          text-align: center;
        }
        
        .metric-bar-container {
          background: var(--border-color);
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin: 8px 0;
        }
        
        .metric-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .heatmap-container {
          overflow-x: auto;
        }
        
        .heatmap-row {
          display: flex;
          gap: 2px;
          margin-bottom: 2px;
        }
        
        .heatmap-cell {
          width: 30px;
          height: 30px;
          border-radius: 3px;
          transition: transform 0.2s;
        }
        
        .heatmap-cell:hover {
          transform: scale(1.1);
          cursor: pointer;
        }
        
        .add-widget-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 20px;
        }
        
        .add-widget-btn:hover {
          transform: scale(1.02);
        }
        
        .widget-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg-secondary);
          border-radius: 20px;
          width: 500px;
          max-width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .quick-stats {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .quick-stat {
          background: var(--bg-secondary);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .widgets-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .widget-wrapper.normal {
          width: 100%;
        }
        
        .widget-wrapper.large {
          width: 100%;
          grid-column: span 2;
        }
        
        .dashboard-footer {
          text-align: center;
          padding: 20px;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
        
        .confidence-badge, .anomaly-badge, .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          margin-left: 10px;
        }
        
        .confidence-badge { background: #10b98120; color: #10b981; }
        .anomaly-badge { background: #ef444420; color: #ef4444; }
        .status-badge.healthy { background: #10b98120; color: #10b981; }
        .status-badge.warning { background: #f59e0b20; color: #f59e0b; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .online-indicator .pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 1.5s infinite;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .enhanced-stats-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// نمونه داده اولیه
export const demoWidgets = [
  { id: 1, type: 'users-stats', data: { total: 15234, online: 234, newToday: 45, growthRate: 12.5, monthlyGrowth: 8.3, history: Array.from({ length: 30 }, (_, i) => ({ date: `روز ${i+1}`, users: Math.floor(Math.random() * 500) + 1000 })) } },
  { id: 2, type: 'system-status', data: { cpu: 45, memory: 62, disk: 38, responseTime: 85, rps: 340 } },
  { id: 3, type: 'ai-predictions', data: { historical: [1200, 1250, 1300, 1280, 1350, 1400, 1450] } },
  { id: 4, type: 'anomaly-detection', data: { metrics: [100, 105, 98, 95, 110, 102, 108, 95, 97, 150, 92, 100, 105, 98, 200, 95, 102] } },
  { id: 5, type: 'heatmap-activity', data: {} }
];

// export پیشفرض
export default AdminWidgetsGrid;