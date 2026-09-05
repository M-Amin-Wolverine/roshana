// ============================================================
// src/pages/admin/AdminHeader.jsx - نسخه بهبود یافته
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaUserCircle, FaSearch, FaMoon, FaSun,
  FaSignOutAlt, FaUser, FaCog, FaBars, FaTimes,
  FaLanguage, FaChevronDown, FaCheck, FaEnvelope,
  FaCalendarAlt, FaClock, FaUserPlus, FaGraduationCap
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
//import { dashboardService } from '../../services/api';
import toast from 'react-hot-toast';

// ============================================================
// کامپوننت اصلی
// ============================================================

const AdminHeader = ({ 
  theme, 
  setTheme, 
  direction, 
  setDirection,
  sidebarCollapsed,
  onMenuClick,
  user: propUser 
}) => {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const user = propUser || authUser;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // ============================================================
  // React Query - Notifications
  // ============================================================

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => dashboardService.getNotifications({ unreadOnly: true }),
    refetchInterval: 30000, // هر ۳۰ ثانیه
    enabled: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // کلیک خارج از منوها
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // فوکوس روی اینپوت جستجو
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('با موفقیت خارج شدید');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('خطا در خروج از حساب');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

  const handleMarkAllRead = () => {
    toast.success('همه نوتیفیکیشن‌ها خوانده شدند');
    // اینجا می‌تونی API call بزنی
  };

  // ============================================================
  // Formatters
  // ============================================================

  const formatTime = (date) => {
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fa-IR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'شب بخیر';
    if (hour < 12) return 'صبح بخیر';
    if (hour < 18) return 'عصر بخیر';
    return 'شب بخیر';
  };

  // ============================================================
  // رندر
  // ============================================================

  return (
    <motion.header 
      className="admin-header-ultimate"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Left Section */}
      <div className="header-left">
        {/* Menu Toggle Button */}
        <motion.button 
          className="menu-toggle-btn"
          onClick={onMenuClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {sidebarCollapsed ? <FaBars /> : <FaTimes />}
        </motion.button>

        {/* Search Bar */}
        <div className={`search-wrapper ${showSearch ? 'expanded' : ''}`}>
          {!showSearch ? (
            <motion.button 
              className="search-toggle-btn"
              onClick={() => setShowSearch(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSearch />
            </motion.button>
          ) : (
            <motion.form 
              className="search-form"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              onSubmit={handleSearch}
            >
              <FaSearch className="search-icon" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="جستجوی سریع... (دوره، کاربر، گزارش)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <FaTimes />
                </button>
              )}
            </motion.form>
          )}
        </div>

        {/* Greeting */}
        <div className="greeting-text">
          <span>{getGreeting()}</span>
          <strong>{user?.firstName || user?.username || 'مدیر'}</strong>
        </div>
      </div>

      {/* Center Section - DateTime */}
      <div className="header-center">
        <div className="datetime-display">
          <div className="time-section">
            <FaClock className="time-icon" />
            <span className="time">{formatTime(currentTime)}</span>
          </div>
          <div className="date-section">
            <FaCalendarAlt className="date-icon" />
            <span className="date">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="header-right">
        {/* Direction Toggle */}
        <motion.button 
          className="direction-toggle"
          onClick={setDirection}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={direction === 'rtl' ? 'تغییر به انگلیسی' : 'Switch to Persian'}
        >
          <FaLanguage />
          <span>{direction === 'rtl' ? 'FA' : 'EN'}</span>
        </motion.button>

        {/* Theme Toggle */}
        <motion.button 
          className="theme-toggle"
          onClick={setTheme}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          title={theme === 'light' ? 'حالت تاریک' : 'حالت روشن'}
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </motion.button>

        {/* Notifications */}
        <div className="notifications-wrapper" ref={notificationRef}>
          <motion.button 
            className={`notifications-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaBell />
            {unreadCount > 0 && (
              <motion.span 
                className="notification-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Notifications Panel */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                className="notifications-panel"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="notifications-header">
                  <h4>نوتیفیکیشن‌ها</h4>
                  {unreadCount > 0 && (
                    <button className="mark-read-btn" onClick={handleMarkAllRead}>
                      <FaCheck /> خواندن همه
                    </button>
                  )}
                </div>
                
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">
                      <FaBell size={40} />
                      <p>نوتیفیکیشنی وجود ندارد</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <motion.div 
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={`notification-icon ${notification.type}`}>
                          {notification.type === 'user' && <FaUserPlus />}
                          {notification.type === 'course' && <FaGraduationCap />}
                          {notification.type === 'message' && <FaEnvelope />}
                          {!notification.type && <FaBell />}
                        </div>
                        <div className="notification-content">
                          <p className="notification-title">{notification.title}</p>
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                        {!notification.read && <span className="unread-dot" />}
                      </motion.div>
                    ))
                  )}
                </div>
                
                {notifications.length > 5 && (
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/admin/notifications')}
                  >
                    مشاهده همه نوتیفیکیشن‌ها
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <motion.button 
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar" />
            ) : (
              <FaUserCircle size={36} />
            )}
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role || 'مدیر سیستم'}</span>
            </div>
            <FaChevronDown className={`chevron ${showUserMenu ? 'rotated' : ''}`} />
          </motion.button>
          
          {/* User Menu Panel */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                className="user-menu-panel"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="menu-header">
                  <div className="user-avatar-large">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <FaUserCircle size={50} />
                    )}
                  </div>
                  <div className="user-details">
                    <strong>{user?.firstName} {user?.lastName}</strong>
                    <span>{user?.email}</span>
                    <span className="user-role-badge">{user?.role}</span>
                  </div>
                </div>
                
                <div className="menu-divider" />
                
                <button onClick={() => { navigate('/admin/profile'); setShowUserMenu(false); }}>
                  <FaUser /> پروفایل من
                </button>
                
                <button onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}>
                  <FaCog /> تنظیمات
                </button>
                
                <button onClick={() => { navigate('/admin/activity'); setShowUserMenu(false); }}>
                  <FaCalendarAlt /> فعالیت‌های من
                </button>
                
                <div className="menu-divider" />
                
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt /> خروج از حساب
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default AdminHeader;