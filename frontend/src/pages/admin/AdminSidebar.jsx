// ============================================================
// AdminSidebar.jsx - نسخه Ultra Mega Pro 🚀
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTachometerAlt, FaUsers, FaBook, FaClipboardList, 
  FaChartLine, FaCog, FaHeadset, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaDatabase,
  FaUserGraduate, FaLayerGroup, FaChalkboardTeacher,
  FaUserCircle, FaKey, FaNewspaper, FaImages,
  FaCode, FaServer, FaRobot, FaComments, FaCloud,
  FaShieldAlt, FaVideo, FaPoll, FaBox, FaUserTie,
  FaUserShield, FaCalendarAlt, FaEnvelope, FaBell,
  FaQuestionCircle, FaSearch, FaStar, FaFire,
  FaGem, FaCrown, FaUserAstronaut, FaUserSecret,
  FaIdCard, FaGlobe, FaBolt, FaClock, FaHistory,
  FaUserPlus, FaUsersCog, FaUniversity, FaSchool,
  FaBuilding, FaGraduationCap
} from 'react-icons/fa';
import { 
  MdDashboard, MdSettings, MdNotifications, 
  MdWorkflow, MdDraw, MdTerminal, MdStorage,
  MdCloudQueue, MdSecurity, MdApi
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// منوی کامل با همه بخش‌ها
// ═══════════════════════════════════════════════════════════
const FULL_MENU_ITEMS = [
  {
    id: 'dashboard',
    path: '/admin',
    name: 'داشبورد',
    icon: FaTachometerAlt,
    exact: true,
    shortcut: 'Alt+1'
  },
  {
    id: 'users',
    path: '/admin/users',
    name: 'مدیریت کاربران',
    icon: FaUsers,
    shortcut: 'Alt+2',
    children: [
      { path: '/admin/users', name: 'همه کاربران', icon: FaUsersCog, exact: true },
      { path: '/admin/users/students', name: 'دانشجویان', icon: FaUserGraduate },
      { path: '/admin/users/professors', name: 'اساتید', icon: FaChalkboardTeacher },
      { path: '/admin/users/staff', name: 'کارکنان', icon: FaUserTie },
      { path: '/admin/users/admins', name: 'مدیران', icon: FaUserShield }
    ]
  },
  {
    id: 'courses',
    path: '/admin/courses',
    name: 'مدیریت دوره‌ها',
    icon: FaBook,
    shortcut: 'Alt+3',
    children: [
      { path: '/admin/courses', name: 'همه دوره‌ها', icon: FaLayerGroup },
      { path: '/admin/courses/live', name: 'کلاس‌های آنلاین', icon: FaVideo },
      { path: '/admin/courses/categories', name: 'دسته‌بندی‌ها', icon: FaFolder }
    ]
  },
  {
    id: 'cms',
    path: '/admin/cms',
    name: 'مدیریت محتوا',
    icon: FaCode,
    shortcut: 'Alt+4',
    children: [
      { path: '/admin/news', name: 'اخبار', icon: FaNewspaper },
      { path: '/admin/sliders', name: 'اسلایدرها', icon: FaImages },
      { path: '/admin/site-settings', name: 'تنظیمات سایت', icon: FaCog }
    ]
  },
  {
    id: 'requests',
    path: '/admin/requests',
    name: 'درخواست‌ها',
    icon: FaClipboardList,
    badge: 12,
    shortcut: 'Alt+5'
  },
  {
    id: 'reports',
    path: '/admin/reports',
    name: 'گزارشات',
    icon: FaChartLine,
    shortcut: 'Alt+6',
    children: [
      { path: '/admin/reports/users', name: 'گزارش کاربران', icon: FaUsers },
      { path: '/admin/reports/courses', name: 'گزارش دوره‌ها', icon: FaBook },
      { path: '/admin/reports/financial', name: 'گزارش مالی', icon: FaChartLine }
    ]
  },
  {
    id: 'modules',
    path: '/admin/modules',
    name: 'مدیریت ماژول‌ها',
    icon: FaBox,
    shortcut: 'Alt+7',
    children: [
      { path: '/admin/modules', name: 'همه ماژول‌ها', icon: FaServer },
      { path: '/admin/modules/live', name: 'Live Classes', icon: FaVideo },
      { path: '/admin/modules/automation', name: 'Automation', icon: FaRobot },
      { path: '/admin/modules/security', name: 'Security', icon: FaShieldAlt }
    ]
  },
  {
    id: 'database',
    path: '/admin/database',
    name: 'مدیریت دیتابیس',
    icon: FaDatabase,
    badge: 294,
    shortcut: 'Alt+8'
  },
  {
    id: 'license',
    path: '/admin/license',
    name: 'لایسنس',
    icon: FaKey,
    shortcut: 'Alt+9',
    badge: null // اگه منقضی بشه ⚠️
  },
  {
    id: 'workflow',
    path: '/admin/workflow',
    name: 'گردش کار',
    icon: MdWorkflow,
    children: [
      { path: '/admin/workflow', name: 'همه گردش‌کارها', icon: MdWorkflow },
      { path: '/admin/workflow/templates', name: 'قالب‌ها', icon: FaClone }
    ]
  },
  {
    id: 'collaboration',
    path: '/admin/collaboration',
    name: 'همکاری',
    icon: FaComments,
    children: [
      { path: '/admin/collaboration/chat', name: 'چت', icon: FaComments },
      { path: '/admin/collaboration/whiteboard', name: 'وایت‌بورد', icon: MdDraw },
      { path: '/admin/collaboration/files', name: 'فایل‌ها', icon: FaFolder }
    ]
  },
  {
    id: 'terminal',
    path: '/admin/terminal',
    name: 'ترمینال',
    icon: MdTerminal
  },
  {
    id: 'settings',
    path: '/admin/settings',
    name: 'تنظیمات',
    icon: FaCog,
    shortcut: 'Alt+,'
  },
  {
    id: 'support',
    path: '/admin/support',
    name: 'پشتیبانی',
    icon: FaHeadset,
    badge: 3,
    shortcut: 'Alt+H'
  }
];

// ═══════════════════════════════════════════════════════════
// کامپوننت اصلی
// ═══════════════════════════════════════════════════════════
const AdminSidebar = ({ collapsed: controlledCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (controlledCollapsed !== undefined) return !controlledCollapsed;
    const saved = localStorage.getItem('admin-sidebar-state');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [expandedItems, setExpandedItems] = useState(() => {
    const saved = localStorage.getItem('admin-expanded-items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [hoveredItem, setHoveredItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [menuItems, setMenuItems] = useState(FULL_MENU_ITEMS);

  // Sync with parent
  useEffect(() => {
    if (controlledCollapsed !== undefined) {
      setSidebarOpen(!controlledCollapsed);
    }
  }, [controlledCollapsed]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('admin-sidebar-state', JSON.stringify(sidebarOpen));
    onToggle?.(!sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('admin-expanded-items', JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Fetch license info for badge
  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/license/info`);
        const data = await res.json();
        if (data.success) {
          setLicenseInfo(data.data);
          
          // Update license badge
          setMenuItems(prev => prev.map(item => {
            if (item.id === 'license' && data.data?.daysRemaining <= 30) {
              return { ...item, badge: '⚠️' };
            }
            return item;
          }));
        }
      } catch {}
    };
    fetchLicense();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const shortcut = `Alt+${e.key}`;
        const item = FULL_MENU_ITEMS.find(i => i.shortcut === shortcut);
        if (item) {
          e.preventDefault();
          navigate(item.path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Helpers
  const isActive = useCallback((path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const toggleExpand = useCallback((id) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('👋 خروج موفق');
      navigate('/login');
    } catch {
      toast.error('خطا در خروج');
    }
  };

  // Filter menu
  const filteredMenu = searchQuery
    ? menuItems.filter(item => {
        const matchName = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchChildren = item.children?.some(c => 
          c.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchName || matchChildren;
      })
    : menuItems;

  // Render menu item
  const renderMenuItem = (item, depth = 0) => {
    const active = isActive(item.path, item.exact);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isHovered = hoveredItem === item.id;

    return (
      <div key={item.id || item.path} className="menu-item-wrapper">
        <motion.button
          className={`sidebar-item ${active ? 'active' : ''} ${depth > 0 ? 'child-item' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          whileHover={{ x: sidebarOpen ? 5 : 0 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Active Indicator */}
          {active && depth === 0 && (
            <motion.div 
              className="active-indicator"
              layoutId="activeIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          <span className="item-icon">
            <item.icon />
          </span>
          
          {sidebarOpen && (
            <motion.span 
              className="item-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {item.name}
            </motion.span>
          )}
          
          {/* Badges */}
          {sidebarOpen && item.badge && (
            <span className={`item-badge ${item.badge === '⚠️' ? 'warning' : ''}`}>
              {item.badge}
            </span>
          )}
          
          {/* Shortcut */}
          {sidebarOpen && item.shortcut && (
            <kbd className="item-shortcut">{item.shortcut}</kbd>
          )}
          
          {/* Expand/Collapse */}
          {sidebarOpen && hasChildren && (
            <motion.span 
              className="expand-icon"
              animate={{ rotate: isExpanded ? -90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaChevronLeft />
            </motion.span>
          )}

          {/* Tooltip for collapsed mode */}
          {!sidebarOpen && isHovered && hasChildren && (
            <motion.div 
              className="tooltip-submenu"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="tooltip-title">{item.name}</div>
              {item.children.map(child => (
                <button
                  key={child.path}
                  className="tooltip-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(child.path);
                  }}
                >
                  <child.icon />
                  <span>{child.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </motion.button>

        {/* Submenu */}
        <AnimatePresence>
          {sidebarOpen && isExpanded && hasChildren && (
            <motion.div
              className="submenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {item.children.map(child => renderMenuItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <motion.aside 
      className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* ============ Logo ============ */}
      <div className="sidebar-header">
        <div 
          className="sidebar-logo" 
          onClick={() => navigate('/admin')}
          title="رفتن به داشبورد"
        >
          <motion.div 
            className="logo-icon"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            🎓
          </motion.div>
          {sidebarOpen && (
            <motion.div 
              className="logo-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h1>فرتاک</h1>
              <span className="logo-subtitle">پنل مدیریت</span>
            </motion.div>
          )}
        </div>
        
        <motion.button 
          className="sidebar-toggle-btn"
          onClick={() => {
            const newState = !sidebarOpen;
            setSidebarOpen(newState);
            onToggle?.(!newState);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={sidebarOpen ? 'جمع کردن منو (Alt+B)' : 'باز کردن منو (Alt+B)'}
        >
          {sidebarOpen ? <FaChevronRight /> : <FaChevronLeft />}
        </motion.button>
      </div>

      {/* ============ Search (only in expanded mode) ============ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="sidebar-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="جستجو در منو..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <FaTimes />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ User Info ============ */}
      {user && (
        <div className="sidebar-user-info">
          <div className="user-avatar-wrapper">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <FaUserCircle size={sidebarOpen ? 48 : 28} />
              )}
              <span className="online-dot" />
            </div>
          </div>
          {sidebarOpen && (
            <motion.div 
              className="user-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h4>{user.fullName || user.username || 'مدیر سیستم'}</h4>
              <span className="user-role">
                {user.role === 'admin' ? '👑 مدیر ارشد' : 
                 user.role === 'super_admin' ? '⚜️ مدیر کل' :
                 user.role || 'کاربر'}
              </span>
              <span className="user-email">{user.email}</span>
            </motion.div>
          )}
        </div>
      )}

      {/* ============ Menu Items ============ */}
      <nav className="sidebar-nav">
        {filteredMenu.map(item => renderMenuItem(item))}
        
        {filteredMenu.length === 0 && (
          <div className="no-results">
            <FaSearch />
            <p>موردی یافت نشد</p>
          </div>
        )}
      </nav>

      {/* ============ Footer ============ */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-item logout-btn"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          {sidebarOpen && <span>خروج از حساب</span>}
        </button>
        
        {sidebarOpen && (
          <div className="sidebar-version">
            <span>نسخه ۴.۰.۰</span>
            <small>© ۱۴۰۴ فرتاک</small>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;