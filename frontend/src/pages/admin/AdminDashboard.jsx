// ============================================================
// AdminDashboard.jsx - نسخه نهایی و پیشرفته با تمام امکانات
// ============================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaBook, FaClipboardList, FaChartLine,
  FaUserPlus, FaGraduationCap, FaCalendarCheck,
  FaArrowUp, FaArrowDown, FaEye, FaDownload,
  FaFilter, FaSync, FaSearch, FaBell, FaCog,
  FaSignOutAlt, FaChevronLeft, FaChevronRight,
  FaTimes, FaCheck, FaSpinner, FaExclamationTriangle,
  FaChartBar, FaChartPie, FaTable, FaCalendarAlt,
  FaDollarSign, FaUserGraduate, FaUserTie, FaUserSecret
} from 'react-icons/fa';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
  RadialBarChart, RadialBar, ScatterChart, Scatter,
  Treemap, Sankey, Funnel, FunnelChart
} from 'recharts';
//import { saveAs } from 'file-saver';
//import * as XLSX from 'xlsx';
//import html2canvas from 'html2canvas';
//import { jsPDF } from 'jspdf';
import './Admin.css';

// ============================================================
// تایپ‌ها و ثابت‌ها
// ============================================================

const TIME_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom'
};

const ACTIVITY_TYPES = {
  USER: 'user',
  COURSE: 'course',
  ADMIN: 'admin',
  SUPPORT: 'support',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  ENROLLMENT: 'enrollment',
  CERTIFICATE: 'certificate'
};

const CHART_COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
  gradient: ['url(#colorGradient1)', 'url(#colorGradient2)', 'url(#colorGradient3)'],
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// ============================================================
// کامپوننت‌های کمکی
// ============================================================

// کامپوننت لودینگ با انیمیشن
const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} border-4 border-${color}-200 border-t-${color}-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// کامپوننت پیام خطا
const ErrorMessage = ({ message, onRetry }) => (
  <motion.div
    className="error-container"
    variants={ANIMATION_VARIANTS.scaleIn}
    initial="initial"
    animate="animate"
  >
    <FaExclamationTriangle className="error-icon" />
    <h4>خطا در بارگذاری داده‌ها</h4>
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="retry-btn">
        <FaSync /> تلاش مجدد
      </button>
    )}
  </motion.div>
);

// کامپوننت نوتیفیکیشن
const NotificationBadge = ({ count, onClick }) => (
  <motion.button
    className="notification-badge"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
  >
    <FaBell />
    {count > 0 && (
      <motion.span
        className="badge-count"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    )}
  </motion.button>
);

// کامپوننت جستجوی پیشرفته
const SearchBar = ({ value, onChange, onSearch, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={`search-bar ${isFocused ? 'focused' : ''}`}
      animate={{
        boxShadow: isFocused 
          ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
          : '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <FaSearch className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
      />
      {value && (
        <button onClick={() => onChange({ target: { value: '' } })} className="clear-btn">
          <FaTimes />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================
// کارت آمار پیشرفته
// ============================================================

const AdvancedStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color, 
  loading, 
  onClick,
  subtitle,
  chartData,
  suffix = '',
  prefix = '',
  formatter = (val) => val?.toLocaleString('fa-IR')
}) => {
  const trendValue = trend?.value || 0;
  const isPositive = trendValue > 0;
  const isNeutral = trendValue === 0;

  return (
    <motion.div 
      className={`stat-card advanced ${color} ${onClick ? 'clickable' : ''}`}
      whileHover={{ 
        y: -8, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
    >
      {loading ? (
        <div className="card-loading">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="stat-header">
            <div className="stat-title-section">
              <span className="stat-title">{title}</span>
              {subtitle && <span className="stat-subtitle">{subtitle}</span>}
            </div>
            <motion.div 
              className={`stat-icon ${color}`}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
            >
              <Icon />
            </motion.div>
          </div>

          <div className="stat-value-container">
            <span className="stat-prefix">{prefix}</span>
            <span className="stat-value">{formatter(value)}</span>
            <span className="stat-suffix">{suffix}</span>
          </div>

          {trend && (
            <div className="stat-trend">
              <motion.span 
                className={`trend-value ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {isPositive ? <FaArrowUp /> : isNeutral ? null : <FaArrowDown />}
                {Math.abs(trendValue).toFixed(1)}%
              </motion.span>
              <span className="trend-label">{trend.label}</span>
            </div>
          )}

          {chartData && (
            <div className="mini-chart">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="currentColor" 
                    fill={`url(#gradient-${color})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

// ============================================================
// کامپوننت نمودار سفارشی
// ============================================================

const CustomChartCard = ({ 
  title, 
  subtitle,
  children, 
  loading, 
  onExport, 
  onFilter,
  filters,
  className = '',
  actions = []
}) => {
  const chartRef = useRef(null);

  return (
    <motion.div 
      className={`chart-card advanced ${className}`}
      variants={ANIMATION_VARIANTS.slideUp}
      initial="initial"
      animate="animate"
      ref={chartRef}
    >
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        <div className="chart-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className="chart-action-btn"
              onClick={action.onClick}
              title={action.title}
            >
              {action.icon}
            </button>
          ))}
          {onFilter && (
            <motion.button 
              className="chart-action-btn filter-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFilter}
            >
              <FaFilter />
            </motion.button>
          )}
          {onExport && (
            <motion.button 
              className="chart-action-btn export-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExport}
            >
              <FaDownload />
            </motion.button>
          )}
        </div>
      </div>

      {filters && (
        <div className="chart-filters">
          {filters}
        </div>
      )}

      <div className="chart-content">
        {loading ? (
          <div className="chart-loading">
            <LoadingSpinner size="xl" />
            <p>در حال بارگذاری نمودار...</p>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

// ============================================================
// کامپوننت فعالیت‌های اخیر پیشرفته
// ============================================================

const ActivityTimeline = ({ activities, loading, onViewAll, maxItems = 10 }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    return activities
      .filter(activity => filter === 'all' || activity.type === filter)
      .filter(activity => 
        !searchTerm || 
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, maxItems);
  }, [activities, filter, searchTerm, maxItems]);

  const getActivityIcon = (type) => {
    const icons = {
      [ACTIVITY_TYPES.USER]: FaUserPlus,
      [ACTIVITY_TYPES.COURSE]: FaGraduationCap,
      [ACTIVITY_TYPES.ADMIN]: FaUserTie,
      [ACTIVITY_TYPES.SUPPORT]: FaClipboardList,
      [ACTIVITY_TYPES.PAYMENT]: FaDollarSign,
      [ACTIVITY_TYPES.SYSTEM]: FaCog,
      [ACTIVITY_TYPES.ENROLLMENT]: FaUserGraduate,
      [ACTIVITY_TYPES.CERTIFICATE]: FaCheck
    };
    return icons[type] || FaBell;
  };

  const getActivityColor = (type) => {
    const colors = {
      [ACTIVITY_TYPES.USER]: 'blue',
      [ACTIVITY_TYPES.COURSE]: 'green',
      [ACTIVITY_TYPES.ADMIN]: 'purple',
      [ACTIVITY_TYPES.SUPPORT]: 'orange',
      [ACTIVITY_TYPES.PAYMENT]: 'emerald',
      [ACTIVITY_TYPES.SYSTEM]: 'gray',
      [ACTIVITY_TYPES.ENROLLMENT]: 'indigo',
      [ACTIVITY_TYPES.CERTIFICATE]: 'teal'
    };
    return colors[type] || 'gray';
  };

  return (
    <motion.div 
      className="activity-timeline"
      variants={ANIMATION_VARIANTS.slideUp}
      initial="initial"
      animate="animate"
    >
      <div className="timeline-header">
        <div className="header-left">
          <h3>فعالیت‌های اخیر</h3>
          <NotificationBadge count={activities?.length || 0} />
        </div>
        <div className="header-right">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در فعالیت‌ها..."
          />
          <select 
            className="activity-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">همه</option>
            <option value={ACTIVITY_TYPES.USER}>کاربران</option>
            <option value={ACTIVITY_TYPES.COURSE}>دوره‌ها</option>
            <option value={ACTIVITY_TYPES.PAYMENT}>پرداخت‌ها</option>
            <option value={ACTIVITY_TYPES.SUPPORT}>پشتیبانی</option>
          </select>
        </div>
      </div>

      <div className="timeline-content">
        {loading ? (
          <div className="timeline-loading">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="timeline-empty">
            <FaClipboardList className="empty-icon" />
            <p>هیچ فعالیتی یافت نشد</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="activities-list"
              variants={ANIMATION_VARIANTS.staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);

                return (
                  <motion.div 
                    key={activity.id}
                    className={`activity-item ${activity.type}`}
                    variants={ANIMATION_VARIANTS.slideUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  >
                    <div className="activity-timeline-indicator">
                      <div className={`timeline-dot ${color}`} />
                      {index < filteredActivities.length - 1 && <div className="timeline-line" />}
                    </div>
                    
                    <motion.div 
                      className={`activity-icon ${color}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent />
                    </motion.div>

                    <div className="activity-content">
                      <div className="activity-header">
                        <strong>{activity.user}</strong>
                        <span className="activity-badge">{activity.type}</span>
                      </div>
                      <p className="activity-action">{activity.action}</p>
                      {activity.details && (
                        <p className="activity-details">{activity.details}</p>
                      )}
                      <div className="activity-meta">
                        <span className="activity-time">
                          <FaCalendarAlt className="meta-icon" />
                          {activity.time}
                        </span>
                        {activity.ip && (
                          <span className="activity-ip">
                            IP: {activity.ip}
                          </span>
                        )}
                      </div>
                    </div>

                    {activity.status && (
                      <div className={`activity-status ${activity.status}`}>
                        {activity.status === 'success' && <FaCheck />}
                        {activity.status === 'pending' && <FaSpinner className="spinning" />}
                        {activity.status === 'failed' && <FaTimes />}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {onViewAll && filteredActivities.length > 0 && (
          <motion.button 
            className="view-all-btn"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewAll}
          >
            <FaEye /> مشاهده همه فعالیت‌ها
            <FaChevronLeft className="arrow-icon" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================
// کامپوننت اصلی داشبورد
// ============================================================

const AdminDashboard = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [timeRange, setTimeRange] = useState(TIME_RANGES.WEEK);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('line');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isExporting, setIsExporting] = useState(false);
  
  const dashboardRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // ============================================================
  // توابع کمکی
  // ============================================================

  const formatCurrency = useCallback((value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('IRR', 'تومان');
  }, []);

  const formatNumber = useCallback((value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fa-IR').format(value);
  }, []);

  const formatPercent = useCallback((value) => {
    if (!value && value !== 0) return '0%';
    return `${value.toFixed(1)}%`;
  }, []);

  // ============================================================
  // بارگذاری داده‌ها
  // ============================================================

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // شبیه‌سازی API Call با دیتای غنی‌تر
      await new Promise(resolve => setTimeout(resolve, 1000));

      // آمار پیشرفته با ترندهای واقعی‌تر
      setStats({
        totalUsers: { 
          value: 12450, 
          trend: { value: 12.5, label: 'نسبت به ماه قبل' },
          chartData: generateTrendData(7, 10000, 12500),
          subtitle: 'کاربر فعال: ۸,۴۵۰'
        },
        activeCourses: { 
          value: 148, 
          trend: { value: 8.3, label: 'نسبت به ماه قبل' },
          chartData: generateTrendData(7, 130, 150),
          subtitle: 'در حال برگزاری: ۴۲'
        },
        pendingRequests: { 
          value: 23, 
          trend: { value: -5.2, label: 'نسبت به هفته قبل' },
          chartData: generateTrendData(7, 30, 20, true),
          subtitle: 'پشتیبانی: ۱۵'
        },
        totalRevenue: { 
          value: 1256000000, 
          trend: { value: 15.7, label: 'نسبت به ماه قبل' },
          chartData: generateTrendData(7, 900000000, 1300000000),
          subtitle: 'سود خالص: ۴۵۰,۰۰۰,۰۰۰'
        }
      });

      // داده‌های نمودار پیشرفته
      const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      setChartData(weekDays.map((day, index) => ({
        name: day,
        بازدید: generateRandomNumber(1200, 2800),
        بازدیدکننده_جدید: generateRandomNumber(400, 900),
        ثبت‌نام: generateRandomNumber(80, 180),
        فروش: generateRandomNumber(8500000, 25000000),
        تکمیل_دوره: generateRandomNumber(15, 45),
        درآمد: generateRandomNumber(12000000, 35000000),
        هزینه: generateRandomNumber(5000000, 15000000),
        سود: generateRandomNumber(5000000, 20000000)
      })));

      // فعالیت‌های اخیر با جزئیات بیشتر
      setRecentActivities([
        { 
          id: 1, 
          user: 'علی رضایی', 
          action: 'ثبت‌نام در دوره React پیشرفته', 
          time: '۱۰ دقیقه پیش', 
          type: ACTIVITY_TYPES.USER,
          status: 'success',
          details: 'پرداخت موفق - مبلغ: ۲,۵۰۰,۰۰۰ تومان',
          ip: '192.168.1.100'
        },
        { 
          id: 2, 
          user: 'سارا محمدی', 
          action: 'تکمیل دوره Node.js', 
          time: '۳۰ دقیقه پیش', 
          type: ACTIVITY_TYPES.COURSE,
          status: 'success',
          details: 'دریافت گواهینامه با نمره ۹۵',
          ip: '192.168.1.101'
        },
        { 
          id: 3, 
          user: 'مدیر سیستم', 
          action: 'ایجاد دوره جدید "Docker Essentials"', 
          time: '۱ ساعت پیش', 
          type: ACTIVITY_TYPES.ADMIN,
          status: 'success',
          ip: '192.168.1.1'
        },
        { 
          id: 4, 
          user: 'محمد کریمی', 
          action: 'ارسال تیکت پشتیبانی', 
          time: '۲ ساعت پیش', 
          type: ACTIVITY_TYPES.SUPPORT,
          status: 'pending',
          details: 'مشکل در دسترسی به ویدیوهای دوره',
          ip: '192.168.1.102'
        },
        { 
          id: 5, 
          user: 'نیما احمدی', 
          action: 'پرداخت دوره جامع DevOps', 
          time: '۳ ساعت پیش', 
          type: ACTIVITY_TYPES.PAYMENT,
          status: 'success',
          details: 'مبلغ: ۴,۸۰۰,۰۰۰ تومان - کد پیگیری: ۱۲۳۴۵۶',
          ip: '192.168.1.103'
        },
        { 
          id: 6, 
          user: 'زهرا کرمانی', 
          action: 'دریافت گواهینامه پایان دوره', 
          time: '۴ ساعت پیش', 
          type: ACTIVITY_TYPES.CERTIFICATE,
          status: 'success',
          details: 'دوره: برنامه‌نویسی پایتون',
          ip: '192.168.1.104'
        },
        { 
          id: 7, 
          user: 'سیستم', 
          action: 'بکاپ‌گیری خودکار', 
          time: '۵ ساعت پیش', 
          type: ACTIVITY_TYPES.SYSTEM,
          status: 'success',
          details: 'حجم: ۲.۴ گیگابایت',
          ip: 'localhost'
        },
      ]);

      // نوتیفیکیشن‌ها
      setNotifications([
        { id: 1, title: 'کاربر جدید', message: '۵ کاربر جدید ثبت‌نام کردند', time: '۵ دقیقه پیش', read: false },
        { id: 2, title: 'پرداخت موفق', message: 'پرداخت ۲,۵۰۰,۰۰۰ تومان انجام شد', time: '۱۵ دقیقه پیش', read: false },
        { id: 3, title: 'تیکت پشتیبانی', message: 'یک تیکت جدید در انتظار پاسخ است', time: '۱ ساعت پیش', read: true },
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'خطا در بارگذاری اطلاعات داشبورد');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // توابع تولید داده‌های تصادفی
  // ============================================================

  const generateTrendData = (points, min, max, descending = false) => {
    const data = [];
    const step = (max - min) / points;
    
    for (let i = 0; i < points; i++) {
      const value = descending 
        ? max - (step * i) + (Math.random() * step - step / 2)
        : min + (step * i) + (Math.random() * step - step / 2);
      data.push({ value: Math.max(0, value) });
    }
    
    return data;
  };

  const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // ============================================================
  // توابع صادرات
  // ============================================================

  const exportToExcel = useCallback(() => {
    try {
      setIsExporting(true);
      
      const workbook = XLSX.utils.book_new();
      
      // شیت آمار
      const statsSheet = XLSX.utils.json_to_sheet([
        { 'عنوان': 'کل کاربران', 'مقدار': stats.totalUsers?.value, 'رشد': `${stats.totalUsers?.trend?.value}%` },
        { 'عنوان': 'دوره‌های فعال', 'مقدار': stats.activeCourses?.value, 'رشد': `${stats.activeCourses?.trend?.value}%` },
        { 'عنوان': 'درخواست‌های در انتظار', 'مقدار': stats.pendingRequests?.value, 'رشد': `${stats.pendingRequests?.trend?.value}%` },
        { 'عنوان': 'درآمد کل', 'مقدار': formatCurrency(stats.totalRevenue?.value), 'رشد': `${stats.totalRevenue?.trend?.value}%` },
      ]);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'آمار کلی');
      
      // شیت نمودار
      const chartSheet = XLSX.utils.json_to_sheet(chartData);
      XLSX.utils.book_append_sheet(workbook, chartSheet, 'داده‌های نمودار');
      
      // شیت فعالیت‌ها
      const activitiesSheet = XLSX.utils.json_to_sheet(
        recentActivities.map(a => ({
          'کاربر': a.user,
          'عملیات': a.action,
          'زمان': a.time,
          'نوع': a.type,
          'وضعیت': a.status
        }))
      );
      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'فعالیت‌ها');
      
      XLSX.writeFile(workbook, `dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      setError('خطا در خروجی اکسل');
    } finally {
      setIsExporting(false);
    }
  }, [stats, chartData, recentActivities, formatCurrency]);

  const exportToPDF = useCallback(async () => {
    if (!dashboardRef.current) return;
    
    try {
      setIsExporting(true);
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      setError('خطا در خروجی PDF');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportChartAsImage = useCallback(async (chartRef, filename) => {
    try {
      const canvas = await html2canvas(chartRef, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob((blob) => {
        saveAs(blob, `${filename}-${new Date().getTime()}.png`);
      });
    } catch (error) {
      console.error('Chart export error:', error);
      setError('خطا در ذخیره نمودار');
    }
  }, []);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, timeRange]);

  // رفرش خودکار
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchDashboardData(true);
      }, refreshInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refreshInterval, fetchDashboardData]);

  // ============================================================
  // محاسبات و داده‌های محاسبه‌شده
  // ============================================================

  const totalStats = useMemo(() => {
    if (!chartData.length) return null;
    
    return {
      totalVisits: chartData.reduce((sum, day) => sum + day.بازدید, 0),
      totalRegistrations: chartData.reduce((sum, day) => sum + day.ثبت‌نام, 0),
      totalRevenue: chartData.reduce((sum, day) => sum + day.فروش, 0),
      avgConversion: (chartData.reduce((sum, day) => sum + (day.ثبت‌نام / day.بازدید) * 100, 0) / chartData.length).toFixed(1),
      totalProfit: chartData.reduce((sum, day) => sum + (day.سود || 0), 0)
    };
  }, [chartData]);

  const userDistributionData = useMemo(() => [
    { name: 'دانشجویان فعال', value: 8450, color: '#3B82F6' },
    { name: 'اساتید', value: 145, color: '#10B981' },
    { name: 'مدیران', value: 12, color: '#F59E0B' },
    { name: 'کاربران غیرفعال', value: 3800, color: '#EF4444' },
    { name: 'مهمان', value: 2043, color: '#8B5CF6' }
  ], []);

  const chartActions = useMemo(() => [
    {
      icon: <FaChartBar />,
      title: 'نمودار میله‌ای',
      onClick: () => setSelectedChartType('bar')
    },
    {
      icon: <FaChartLine />,
      title: 'نمودار خطی',
      onClick: () => setSelectedChartType('line')
    },
    {
      icon: <FaTable />,
      title: 'نمای جدول',
      onClick: () => setSelectedChartType('table')
    }
  ], []);

  // ============================================================
  // رندر
  // ============================================================

  return (
    <motion.div 
      className="admin-dashboard advanced"
      ref={dashboardRef}
      initial="initial"
      animate="animate"
      variants={ANIMATION_VARIANTS.fadeIn}
    >
      {/* هدر پیشرفته داشبورد */}
      <motion.div 
        className="dashboard-header advanced"
        variants={ANIMATION_VARIANTS.slideUp}
      >
        <div className="header-left">
          <div className="title-section">
            <h1>داشبورد مدیریت پیشرفته</h1>
            <p className="last-update">
              آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}
            </p>
          </div>
          <SearchBar
            placeholder="جستجوی سریع در داشبورد..."
            onSearch={() => console.log('Search')}
          />
        </div>

        <div className="header-right">
          <div className="time-range-group">
            <select 
              className="time-range-select advanced"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value={TIME_RANGES.TODAY}>امروز</option>
              <option value={TIME_RANGES.WEEK}>هفته جاری</option>
              <option value={TIME_RANGES.MONTH}>ماه جاری</option>
              <option value={TIME_RANGES.QUARTER}>سه ماهه</option>
              <option value={TIME_RANGES.YEAR}>سال جاری</option>
            </select>

            <select 
              className="refresh-interval-select"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={0}>غیرفعال</option>
              <option value={10000}>هر ۱۰ ثانیه</option>
              <option value={30000}>هر ۳۰ ثانیه</option>
              <option value={60000}>هر ۱ دقیقه</option>
              <option value={300000}>هر ۵ دقیقه</option>
            </select>
          </div>

          <div className="header-actions">
            <NotificationBadge 
              count={notifications.filter(n => !n.read).length}
              onClick={() => setShowNotifications(!showNotifications)}
            />

            <motion.button 
              className="btn-icon advanced"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchDashboardData()}
              disabled={loading}
            >
              <FaSync className={loading ? 'spinning' : ''} />
            </motion.button>

            <div className="export-group">
              <motion.button 
                className="btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToExcel}
                disabled={isExporting}
              >
                <FaDownload /> Excel
              </motion.button>
              
              <motion.button 
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <FaDownload /> PDF
              </motion.button>
            </div>

            <motion.button 
              className="btn-icon advanced"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaCog />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* منوی نوتیفیکیشن */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            className="notifications-panel"
            variants={ANIMATION_VARIANTS.scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="notifications-header">
              <h4>نوتیفیکیشن‌ها</h4>
              <button onClick={() => setShowNotifications(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="notifications-list">
              {notifications.map(notification => (
                <motion.div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  whileHover={{ x: 5 }}
                >
                  <h5>{notification.title}</h5>
                  <p>{notification.message}</p>
                  <span>{notification.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نمایش خطا */}
      <AnimatePresence>
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => fetchDashboardData()} 
          />
        )}
      </AnimatePresence>

      {/* کارت‌های آمار پیشرفته */}
      <motion.div 
        className="stats-grid advanced"
        variants={ANIMATION_VARIANTS.staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AdvancedStatCard 
          title="کل کاربران"
          subtitle={stats.totalUsers?.subtitle}
          value={stats.totalUsers?.value}
          icon={FaUsers}
          trend={stats.totalUsers?.trend}
          color="blue"
          loading={loading}
          chartData={stats.totalUsers?.chartData}
          formatter={formatNumber}
          onClick={() => console.log('Navigate to users')}
        />
        <AdvancedStatCard 
          title="دوره‌های فعال"
          subtitle={stats.activeCourses?.subtitle}
          value={stats.activeCourses?.value}
          icon={FaBook}
          trend={stats.activeCourses?.trend}
          color="green"
          loading={loading}
          chartData={stats.activeCourses?.chartData}
          formatter={formatNumber}
        />
        <AdvancedStatCard 
          title="درخواست‌های در انتظار"
          subtitle={stats.pendingRequests?.subtitle}
          value={stats.pendingRequests?.value}
          icon={FaClipboardList}
          trend={stats.pendingRequests?.trend}
          color="orange"
          loading={loading}
          chartData={stats.pendingRequests?.chartData}
          formatter={formatNumber}
        />
        <AdvancedStatCard 
          title="درآمد کل"
          subtitle={stats.totalRevenue?.subtitle}
          value={stats.totalRevenue?.value}
          icon={FaChartLine}
          trend={stats.totalRevenue?.trend}
          color="purple"
          loading={loading}
          chartData={stats.totalRevenue?.chartData}
          formatter={formatCurrency}
        />
      </motion.div>

      {/* نمودارهای اصلی */}
      <div className="charts-grid advanced">
        <CustomChartCard 
          title="تحلیل عملکرد هفتگی"
          subtitle={`نرخ تبدیل: ${totalStats?.avgConversion || 0}% | کل بازدید: ${formatNumber(totalStats?.totalVisits || 0)}`}
          loading={loading}
          actions={chartActions}
          onExport={() => exportChartAsImage(document.querySelector('.chart-card'), 'performance-chart')}
        >
          <ResponsiveContainer width="100%" height={350}>
            {selectedChartType === 'line' ? (
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  formatter={(value) => formatNumber(value)}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="بازدید" 
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorGradient1)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="ثبت‌نام" 
                  fill="#10B981"
                  radius={[8, 8, 0, 0]}
                  barSize={30}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="درآمد" 
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            ) : selectedChartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="بازدید" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="ثبت‌نام" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="تکمیل_دوره" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <div className="data-table-view">
                <table>
                  <thead>
                    <tr>
                      <th>روز</th>
                      <th>بازدید</th>
                      <th>ثبت‌نام</th>
                      <th>فروش</th>
                      <th>نرخ تبدیل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((day, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td>{day.name}</td>
                        <td>{formatNumber(day.بازدید)}</td>
                        <td>{formatNumber(day.ثبت‌نام)}</td>
                        <td>{formatCurrency(day.فروش)}</td>
                        <td>{((day.ثبت‌نام / day.بازدید) * 100).toFixed(1)}%</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ResponsiveContainer>
        </CustomChartCard>

        <CustomChartCard 
          title="تحلیل فروش و درآمد"
          subtitle={`سود کل: ${formatCurrency(totalStats?.totalProfit || 0)}`}
          loading={loading}
          onExport={() => exportChartAsImage(document.querySelectorAll('.chart-card')[1], 'revenue-chart')}
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="فروش" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="هزینه" 
                stackId="2"
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.3}
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="سود" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.3}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CustomChartCard>
      </div>

      {/* بخش پایینی داشبورد */}
      <div className="dashboard-bottom advanced">
        <div className="bottom-left">
          <ActivityTimeline 
            activities={recentActivities}
            loading={loading}
            onViewAll={() => console.log('View all activities')}
            maxItems={8}
          />
        </div>

        <div className="bottom-right">
          <motion.div 
            className="distribution-chart"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
          >
            <div className="chart-header">
              <h3>توزیع کاربران</h3>
              <button className="btn-icon">
                <FaDownload />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, x, y }) => (
                    <text 
                      x={x} 
                      y={y} 
                      fill="#64748b" 
                      textAnchor={x > 200 ? 'start' : 'end'} 
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`${name}: ${(percent * 100).toFixed(1)}%`}
                    </text>
                  )}
                  outerRadius={90}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            className="quick-stats-grid"
            variants={ANIMATION_VARIANTS.staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="quick-stat-card"
              variants={ANIMATION_VARIANTS.slideUp}
              whileHover={{ scale: 1.02 }}
            >
              <div className="quick-stat-icon success">
                <FaCheck />
              </div>
              <div className="quick-stat-content">
                <span>نرخ تکمیل دوره</span>
                <strong>۷۸٪</strong>
                <small className="trend positive">
                  <FaArrowUp /> ۵.۲٪
                </small>
              </div>
            </motion.div>

            <motion.div 
              className="quick-stat-card"
              variants={ANIMATION_VARIANTS.slideUp}
              whileHover={{ scale: 1.02 }}
            >
              <div className="quick-stat-icon info">
                <FaGraduationCap />
              </div>
              <div className="quick-stat-content">
                <span>رضایت کاربران</span>
                <strong>۴.۸/۵</strong>
                <small className="trend positive">
                  <FaArrowUp /> ۰.۲
                </small>
              </div>
            </motion.div>

            <motion.div 
              className="quick-stat-card"
              variants={ANIMATION_VARIANTS.slideUp}
              whileHover={{ scale: 1.02 }}
            >
              <div className="quick-stat-icon warning">
                <FaCalendarCheck />
              </div>
              <div className="quick-stat-content">
                <span>حضور و غیاب</span>
                <strong>۹۲٪</strong>
                <small className="trend positive">
                  <FaArrowUp /> ۳٪
                </small>
              </div>
            </motion.div>

            <motion.div 
              className="quick-stat-card"
              variants={ANIMATION_VARIANTS.slideUp}
              whileHover={{ scale: 1.02 }}
            >
              <div className="quick-stat-icon purple">
                <FaDollarSign />
              </div>
              <div className="quick-stat-content">
                <span>میانگین فروش</span>
                <strong>{formatCurrency(3250000)}</strong>
                <small className="trend positive">
                  <FaArrowUp /> ۱۲٪
                </small>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* منوی میانبر شناور */}
      <motion.div 
        className="floating-actions"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          className="fab-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <FaChevronRight style={{ transform: 'rotate(-90deg)' }} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;