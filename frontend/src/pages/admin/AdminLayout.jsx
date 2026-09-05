// ============================================================
// src/pages/admin/AdminLayout.jsx - نسخه ULTRA MEGA خفن 🚀🔥
// Enterprise-Grade Admin Dashboard with ALL Advanced Features
// ============================================================

import { 
  useState, useEffect, Suspense, useCallback, useMemo, useRef, Fragment,
  lazy, createContext, useContext, useReducer 
} from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useHotkeys } from 'react-hotkeys-hook';
import { 
  FaGraduationCap, FaSpinner, FaBars, FaBell, FaSearch, 
  FaUserCircle, FaChevronDown, FaSignOutAlt, FaCog, FaUser,
  FaHome, FaUsers, FaBook, FaClipboardList, FaChartLine,
  FaDatabase, FaHeadset, FaMoon, FaSun, FaLanguage,
  FaSync, FaExpand, FaCompress, FaWifi, FaExclamationTriangle,
  FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight,
  FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaUserShield,
  FaBellSlash, FaRocket, FaBug, FaTerminal, FaCode, FaUndo,
  FaRedo, FaSave, FaTrash, FaEdit, FaCopy, FaPaste, FaCut,
  FaFolder, FaFile, FaImage, FaVideo, FaMusic, FaArchive,
  FaDownload, FaUpload, FaPrint, FaShare, FaEnvelope,
  FaComment, FaStickyNote, FaTag, FaFilter, FaSort,
  FaPlus, FaMinus, FaStar, FaHeart, FaEye, FaEyeSlash,
  FaLock, FaUnlock, FaGlobe, FaClock, FaCalendar, FaHistory,
  FaChartBar, FaChartPie, FaTable, FaList, FaTh, FaThLarge,
  FaMicrophone, FaKeyboard, FaMouse, FaGamepad, FaTrophy,
  FaMedal, FaCrown, FaFire, FaBolt, FaCloud, FaServer,
  FaDatabase as FaDB, FaMemory, FaMicrochip, FaHdd,
  FaWifi as FaNetwork, FaBluetooth, FaUsb, FaPlug,
  FaUserPlus, FaNewspaper, FaImages, FaFileAlt, 
  FaExternalLinkAlt, FaThumbtack, FaCloudUploadAlt
} from 'react-icons/fa';
import { 
  MdDashboard, MdSettings, MdNotifications, MdHelp,
  MdOutlineFullscreen, MdOutlineFullscreenExit, MdTerminal,
  MdDevices, MdWidgets, MdViewWeek, MdViewColumn,
  MdDragHandle, MdMoreVert, MdMoreHoriz, MdCheckBox,
  MdCheckBoxOutlineBlank, MdRadioButtonChecked, MdRadioButtonUnchecked,
  MdToggleOn, MdToggleOff, MdSlideshow, MdTouchApp,
  MdGesture, MdSwipe, MdCompare, MdDifference, MdTimeline,
  MdMap  // <-- این رو اضافه کن
} from 'react-icons/md';
import { 
  SiJavascript, SiPython, SiReact, SiNodedotjs, SiDocker,
  SiKubernetes, SiGooglecloud, SiGithub,
  SiGitlab, SiJira, SiSlack, SiTrello, SiFigma
} from 'react-icons/si';
import { VscTerminalCmd, VscSearchStop, VscDebugStart } from 'react-icons/vsc';
import { BiCommand, BiSelectMultiple, BiMove, BiRename } from 'react-icons/bi';
import { 
  BsLayoutSidebar, BsLayoutSidebarInset, BsLayoutThreeColumns,
  BsGrid, BsSoundwave, BsVolumeUp, BsVolumeMute
} from 'react-icons/bs';
import { 
  TbArrowsMaximize, TbArrowsMinimize, TbArrowsMove, 
  TbArrowsSplit, TbArrowsJoin, TbArrowsShuffle 
} from 'react-icons/tb';
import { 
  HiOutlineCommandLine, HiOutlineCpuChip, HiOutlineCube,
  HiOutlineCog6Tooth, HiOutlineWrenchScrewdriver 
} from 'react-icons/hi2';
import { 
  LuWorkflow, LuTimer, LuTimerOff
} from 'react-icons/lu';
import Split from 'react-split';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import CommandPalette from 'react-command-palette';
import { TourProvider, useTour } from '@reactour/tour';
import { Chart, registerables } from 'chart.js';
import { Line, Bar, Doughnut, Pie, Scatter, Radar } from 'react-chartjs-2';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart, Legend 
} from 'recharts';

// 🔄 پکیج‌های جایگزین جدید
import ReactDiffViewer from 'react-diff-viewer';  // جایگزین react-diff-viewer-continued
//import FileManager from '@nolesh/react-file-manager';       // جایگزین react-file-manager
import Terminal from 'react-console-emulator-fork';         // جایگزین react-console-emulator
import { Droppable, Draggable } from 'gridnd';              // جایگزین react-dashboard
import 'gridnd/style.css';
import * as JoyrideModule from 'react-joyride';
const Joyride = JoyrideModule.default;
// ⚠️ هوک‌ها رو فعلاً کامنت می‌کنیم تا موقع اجرا خطا ندن
import { useServiceWorkerPro as useServiceWorker} from '../../hooks/useServiceWorker';
import { useOfflinePro as useOffline } from '../../hooks/useOffline';
import { useActivityLogPro as useActivityLog } from '../../hooks/useActivityLog';
import { useNotificationsPro as useNotifications } from '../../hooks/useNotifications';
import { usePerformancePro as usePerformance } from '../../hooks/usePerformance';
import { useWorkflowPro as useWorkflow } from '../../hooks/useWorkflow';
import { useCollaborationPro as useCollaboration } from '../../hooks/useCollaboration';
import { useGamificationPro as useGamification } from '../../hooks/useGamification';
import { useVersionControlPro as useVersionControl } from '../../hooks/useVersionControl';
import { useAccessibilityPro as useAccessibility } from '../../hooks/useAccessibility';
import { getApiUrl, API_ENDPOINTS, WS_URL, WS_EVENTS } from '../../config';
// ⚠️ کامپوننت‌های missing رو فعلاً کامنت می‌کنیم
import AdminTourSteps from './AdminTourSteps';
import AdminShortcuts from './AdminShortcuts';
import AdminWidgets from './AdminWidgets';
import AdminTerminal from './AdminTerminal';
import AdminFileManager from './AdminFileManager';
import AdminWorkflowManager from './AdminWorkflowManager';
import AdminCollaborationPanel from './AdminCollaborationPanel';
import AdminDiffViewer from './AdminDiffViewer';
import AdminBulkOperations from './AdminBulkOperations';

import './Admin.css';

Chart.register(...registerables);

// ============================================================
// 🎯 کامپوننت جداگانه برای آیتم منو (برای رفع خطای هوک)
// ============================================================
const SidebarMenuItem = ({ 
  item, 
  isChild, 
  location, 
  navigate, 
  expandedMenu, 
  toggleMenu, 
  sidebarCollapsed, 
  hoveredMenuItem, 
  setHoveredMenuItem, 
  menuOrder, 
  setMenuOrder, 
  addNewTab, 
  toggleSplitView 
}) => {
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenu.includes(item.id);
  const isHovered = hoveredMenuItem === item.id;

  // ✅ این هوک‌ها الان توی یک کامپوننت جداگانه هستن و مشکلی ندارن
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPES.MENU_ITEM,
    item: { id: item.id, index: menuOrder.indexOf(item.id) },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPES.MENU_ITEM,
    hover: (draggedItem) => {
      if (draggedItem.id !== item.id) {
        const draggedIndex = menuOrder.indexOf(draggedItem.id);
        const hoverIndex = menuOrder.indexOf(item.id);
        if (draggedIndex === hoverIndex) return;
        const newOrder = [...menuOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(hoverIndex, 0, draggedItem.id);
        setMenuOrder(newOrder);
        draggedItem.index = hoverIndex;
      }
    }
  });

  return (
    <div 
      ref={node => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="menu-item-wrapper"
    >
      <motion.div
        className={`sidebar-menu-item ${isActive ? 'active' : ''} ${isChild ? 'child' : ''}`}
        onClick={() => {
          if (hasChildren) {
            toggleMenu(item.id);
          } else {
            navigate(item.path);
          }
        }}
        onMouseEnter={() => setHoveredMenuItem(item.id)}
        onMouseLeave={() => setHoveredMenuItem(null)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="drag-handle">
          <MdDragHandle />
        </span>
        <span className="menu-icon">
          <item.icon />
        </span>
        {!sidebarCollapsed && (
          <motion.span 
            className="menu-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {item.label}
            {item.description && !isChild && (
              <small className="menu-description">{item.description}</small>
            )}
          </motion.span>
        )}
        {!sidebarCollapsed && item.badge && (
          <span className="menu-badge">{item.badge}</span>
        )}
        {!sidebarCollapsed && item.shortcut && (
          <kbd className="menu-shortcut">{item.shortcut}</kbd>
        )}
        {!sidebarCollapsed && hasChildren && (
          <span className="expand-icon">
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        )}
        
        {sidebarCollapsed && isHovered && hasChildren && (
          <div className="tooltip-submenu">
            {item.children.map(child => (
              <button
                key={child.path}
                className="tooltip-submenu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(child.path);
                }}
              >
                <child.icon />
                <span>{child.label}</span>
                {child.badge && <span className="badge">{child.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {!sidebarCollapsed && isExpanded && hasChildren && (
          <motion.div
            className="submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children.map(child => (
              <SidebarMenuItem
                key={child.path}
                item={{ ...child, id: child.path }}
                isChild={true}
                location={location}
                navigate={navigate}
                expandedMenu={expandedMenu}
                toggleMenu={toggleMenu}
                sidebarCollapsed={sidebarCollapsed}
                hoveredMenuItem={hoveredMenuItem}
                setHoveredMenuItem={setHoveredMenuItem}
                menuOrder={menuOrder}
                setMenuOrder={setMenuOrder}
                addNewTab={addNewTab}
                toggleSplitView={toggleSplitView}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════
// 🎯 Context برای مدیریت وضعیت‌های پیچیده
// ═══════════════════════════════════════════════════════════
const AdminLayoutContext = createContext();

// ═══════════════════════════════════════════════════════════
// 🎨 Action Types برای Reducer
// ═══════════════════════════════════════════════════════════
const ACTIONS = {
  ADD_TAB: 'ADD_TAB',
  REMOVE_TAB: 'REMOVE_TAB',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  UPDATE_TAB: 'UPDATE_TAB',
  PIN_TAB: 'PIN_TAB',
  TOGGLE_SPLIT: 'TOGGLE_SPLIT',
  SET_SPLIT_SIZES: 'SET_SPLIT_SIZES',
  ADD_WIDGET: 'ADD_WIDGET',
  REMOVE_WIDGET: 'REMOVE_WIDGET',
  UPDATE_WIDGET_LAYOUT: 'UPDATE_WIDGET_LAYOUT',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  TOGGLE_COMMAND_PALETTE: 'TOGGLE_COMMAND_PALETTE',
  SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  SET_PERFORMANCE_METRICS: 'SET_PERFORMANCE_METRICS',
  TOGGLE_TERMINAL: 'TOGGLE_TERMINAL',
  TOGGLE_FILE_MANAGER: 'TOGGLE_FILE_MANAGER',
  TOGGLE_COLLABORATION_PANEL: 'TOGGLE_COLLABORATION_PANEL',
  SET_WORKFLOW_RULES: 'SET_WORKFLOW_RULES',
  UPDATE_WORKFLOW_RULE: 'UPDATE_WORKFLOW_RULE',
  ADD_ACHIEVEMENT: 'ADD_ACHIEVEMENT',
  SET_BACKUP_SCHEDULE: 'SET_BACKUP_SCHEDULE',
  SET_AUDIT_LOG_FILTER: 'SET_AUDIT_LOG_FILTER',
  TOGGLE_ACCESSIBILITY_MODE: 'TOGGLE_ACCESSIBILITY_MODE',
  SET_KEYBOARD_SHORTCUTS: 'SET_KEYBOARD_SHORTCUTS'
};

// ═══════════════════════════════════════════════════════════
// 🎯 Reducer برای مدیریت State پیچیده
// ═══════════════════════════════════════════════════════════
const adminLayoutReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_TAB:
      const existingTab = state.tabs.find(t => t.path === action.payload.path);
      if (existingTab) {
        return { ...state, activeTab: existingTab.id };
      }
      const newTab = {
        id: `tab-${Date.now()}`,
        ...action.payload,
        pinned: false,
        loading: false
      };
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTab: newTab.id
      };
      
    case ACTIONS.REMOVE_TAB:
      const filteredTabs = state.tabs.filter(t => t.id !== action.payload);
      const newActiveTab = state.activeTab === action.payload 
        ? filteredTabs[filteredTabs.length - 1]?.id 
        : state.activeTab;
      return {
        ...state,
        tabs: filteredTabs,
        activeTab: newActiveTab
      };
      
    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
      
    case ACTIONS.PIN_TAB:
      return {
        ...state,
        tabs: state.tabs.map(t => 
          t.id === action.payload ? { ...t, pinned: !t.pinned } : t
        )
      };
      
    case ACTIONS.TOGGLE_SPLIT:
      return {
        ...state,
        splitView: {
          ...state.splitView,
          enabled: action.payload ?? !state.splitView.enabled
        }
      };
      
    case ACTIONS.SET_SPLIT_SIZES:
      return {
        ...state,
        splitView: { ...state.splitView, sizes: action.payload }
      };
      
    case ACTIONS.TOGGLE_COMMAND_PALETTE:
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
      
    case ACTIONS.SET_SELECTED_ITEMS:
      return { ...state, selectedItems: action.payload };
      
    case ACTIONS.TOGGLE_TERMINAL:
      return { ...state, terminalOpen: !state.terminalOpen };
      
    case ACTIONS.TOGGLE_FILE_MANAGER:
      return { ...state, fileManagerOpen: !state.fileManagerOpen };
      
    case ACTIONS.TOGGLE_COLLABORATION_PANEL:
      return { ...state, collaborationPanelOpen: !state.collaborationPanelOpen };
      
    case ACTIONS.ADD_ACHIEVEMENT:
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };
      
    case ACTIONS.TOGGLE_ACCESSIBILITY_MODE:
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          highContrast: !state.accessibility.highContrast
        }
      };
      
    default:
      return state;
  }
};

// ═══════════════════════════════════════════════════════════
// 🎨 ثابت‌ها و تنظیمات پیشرفته
// ═══════════════════════════════════════════════════════════
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const HEADER_HEIGHT = 70;
const ITEM_TYPES = {
  MENU_ITEM: 'MENU_ITEM',
  WIDGET: 'WIDGET',
  TAB: 'TAB'
};

// تنظیمات نوتیفیکیشن پیشرفته
const NOTIFICATION_PRIORITIES = {
  LOW: { color: '#6b7280', icon: 'ℹ️', sound: null },
  MEDIUM: { color: '#3b82f6', icon: '📢', sound: '/sounds/notification.mp3' },
  HIGH: { color: '#f59e0b', icon: '⚠️', sound: '/sounds/warning.mp3' },
  CRITICAL: { color: '#ef4444', icon: '🚨', sound: '/sounds/alert.mp3' }
};

// منوی کامل ادمین با قابلیت Drag & Drop
const ADMIN_MENU = [
  {
    id: 'dashboard',
    path: '/admin/dashboard',
    icon: MdDashboard,
    label: 'داشبورد',
    badge: null,
    description: 'نمای کلی سیستم',
    shortcut: 'Alt+D',
    keywords: ['home', 'overview', 'stats']
  },
  {
    id: 'users',
    path: '/admin/users',
    icon: FaUsers,
    label: 'مدیریت کاربران',
    badge: null,
    description: 'دانشجویان، اساتید، کارکنان',
    shortcut: 'Alt+U',
    keywords: ['students', 'teachers', 'staff', 'admins'],
    children: [
      { path: '/admin/users/students', icon: FaUserGraduate, label: 'دانشجویان', badge: null },
      { path: '/admin/users/professors', icon: FaChalkboardTeacher, label: 'اساتید', badge: null },
      { path: '/admin/users/staff', icon: FaUserTie, label: 'کارکنان', badge: null },
      { path: '/admin/users/admins', icon: FaUserShield, label: 'مدیران', badge: null }
    ]
  },
  {
    id: 'courses',
    path: '/admin/courses',
    icon: FaBook,
    label: 'مدیریت دوره‌ها',
    badge: null,
    description: 'دوره‌های آموزشی و LMS',
    shortcut: 'Alt+C',
    keywords: ['classes', 'learning', 'education'],
    children: [
      { path: '/admin/courses/all', icon: FaBook, label: 'همه دوره‌ها', badge: null },
      { path: '/admin/courses/categories', icon: FaFolder, label: 'دسته‌بندی‌ها', badge: null },
      { path: '/admin/courses/live', icon: FaRocket, label: 'کلاس‌های آنلاین', badge: 3 }
    ]
  },
  {
    id: 'requests',
    path: '/admin/requests',
    icon: FaClipboardList,
    label: 'درخواست‌ها',
    badge: 12,
    description: 'درخواست‌های pending',
    shortcut: 'Alt+R',
    keywords: ['pending', 'approvals', 'tickets']
  },
  {
    id: 'reports',
    path: '/admin/reports',
    icon: FaChartLine,
    label: 'گزارشات',
    badge: null,
    description: 'آمار و تحلیل‌ها',
    shortcut: 'Alt+P',
    keywords: ['analytics', 'statistics', 'insights'],
    children: [
      { path: '/admin/reports/users', icon: FaUsers, label: 'گزارش کاربران', badge: null },
      { path: '/admin/reports/courses', icon: FaBook, label: 'گزارش دوره‌ها', badge: null },
      { path: '/admin/reports/finance', icon: FaChartBar, label: 'گزارش مالی', badge: null },
      { path: '/admin/reports/custom', icon: FaChartPie, label: 'گزارش سفارشی', badge: null }
    ]
  },
  {
    id: 'database',
    path: '/admin/database',
    icon: FaDB,
    label: 'مدیریت دیتابیس',
    badge: 294,
    description: 'مرورگر ۲۹۴ جدول',
    shortcut: 'Alt+B',
    keywords: ['sql', 'tables', 'query', 'backup']
  },
  {
    id: 'cms',
    path: '/admin/cms',
    icon: FaCode,
    label: 'مدیریت محتوا',
    badge: null,
    description: 'اخبار، اسلایدر، صفحات',
    shortcut: 'Alt+M',
    keywords: ['content', 'pages', 'news', 'slider'],
    children: [
      { path: '/admin/cms/news', icon: FaNewspaper, label: 'اخبار', badge: null },
      { path: '/admin/cms/sliders', icon: FaImages, label: 'اسلایدرها', badge: null },
      { path: '/admin/cms/pages', icon: FaFileAlt, label: 'صفحات', badge: null },
      { path: '/admin/cms/comments', icon: FaComment, label: 'نظرات', badge: 8 }
    ]
  },
  {
    id: 'workflow',
    path: '/admin/workflow',
    icon: LuWorkflow,
    label: 'گردش کار',
    badge: null,
    description: 'خودکارسازی فرآیندها',
    shortcut: 'Alt+W',
    keywords: ['automation', 'rules', 'triggers']
  },
  {
    id: 'settings',
    path: '/admin/settings',
    icon: FaCog,
    label: 'تنظیمات',
    badge: null,
    description: 'تنظیمات سیستم',
    shortcut: 'Alt+S',
    keywords: ['configuration', 'preferences', 'system']
  },
  {
    id: 'support',
    path: '/admin/support',
    icon: FaHeadset,
    label: 'پشتیبانی',
    badge: 5,
    description: 'تیکت‌های پشتیبانی',
    shortcut: 'Alt+H',
    keywords: ['help', 'tickets', 'contact']
  }
];

// ═══════════════════════════════════════════════════════════
// 🎯 کامپوننت‌های جانبی
// ═══════════════════════════════════════════════════════════

// کامپوننت Quick Actions
const QuickActions = ({ onAction }) => {
  const actions = [
    { icon: FaPlus, label: 'کاربر جدید', action: 'new-user', color: '#3b82f6' },
    { icon: FaBook, label: 'دوره جدید', action: 'new-course', color: '#10b981' },
    { icon: FaChartBar, label: 'گزارش سریع', action: 'quick-report', color: '#f59e0b' },
    { icon: FaCog, label: 'تنظیمات سریع', action: 'quick-settings', color: '#8b5cf6' },
    { icon: FaDatabase, label: 'بک‌آپ', action: 'backup', color: '#ec4899' }
  ];

  return (
    <motion.div 
      className="quick-actions-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h4>⚡ اقدامات سریع</h4>
      <div className="quick-actions-grid">
        {actions.map(action => (
          <motion.button
            key={action.action}
            className="quick-action-btn"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(action.action)}
            style={{ '--action-color': action.color }}
          >
            <action.icon />
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// کامپوننت Performance Monitor
const PerformanceMonitor = ({ metrics }) => {
  return (
    <motion.div 
      className="performance-monitor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="perf-header">
        <HiOutlineCpuChip />
        <span>مانیتور عملکرد</span>
      </div>
      <div className="perf-metrics">
        <div className="perf-item">
          <span>FPS</span>
          <span className={`value ${metrics.fps > 50 ? 'good' : 'warning'}`}>
            {metrics.fps}
          </span>
        </div>
        <div className="perf-item">
          <span>Memory</span>
          <span className="value">{metrics.memory}MB</span>
        </div>
        <div className="perf-item">
          <span>Network</span>
          <span className="value">{metrics.latency}ms</span>
        </div>
      </div>
      <div className="perf-chart">
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={metrics.history}>
            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f620" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// کامپوننت MiniMap
const MiniMap = ({ sections, activeSection, onSectionClick }) => {
  return (
    <motion.div 
      className="minimap"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {sections.map(section => (
        <button
          key={section.id}
          className={`minimap-section ${activeSection === section.id ? 'active' : ''}`}
          onClick={() => onSectionClick(section.id)}
          title={section.label}
        >
          <span className="minimap-dot" />
          <span className="minimap-label">{section.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

// کامپوننت Context Menu
const ContextMenu = ({ x, y, items, onClose }) => {
  return (
    <motion.div
      className="context-menu"
      style={{ top: y, left: x }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.divider && <div className="context-menu-divider" />}
          <button
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <item.icon />}
            <span>{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        </React.Fragment>
      ))}
    </motion.div>
  );
};

// کامپوننت Bulk Operations Bar
const BulkOperationsBar = ({ selectedCount, onClear, operations }) => {
  if (selectedCount === 0) return null;
  
  return (
    <motion.div
      className="bulk-operations-bar"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <div className="bulk-info">
        <BiSelectMultiple />
        <span>{selectedCount} آیتم انتخاب شده</span>
      </div>
      <div className="bulk-actions">
        {operations.map(op => (
          <button key={op.id} onClick={op.onClick} title={op.label}>
            <op.icon />
            <span>{op.label}</span>
          </button>
        ))}
      </div>
      <button className="bulk-clear" onClick={onClear}>
        <FaTimes />
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 کامپوننت اصلی AdminLayout
// ═══════════════════════════════════════════════════════════
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme, isDark, direction, toggleDirection } = useTheme();
  
  // Refs
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);
  const audioRef = useRef(new Audio());
  
  // Custom Hooks
  const { isOffline, syncStatus, pendingChanges, syncData } = useOffline();
  const { activities, logActivity, filterActivities } = useActivityLog();
  const { 
    notifications, 
    addNotification, 
    removeNotification, 
    markAsRead,
    requestPermission 
  } = useNotifications();
  const { metrics, startMonitoring } = usePerformance();
  const { workflows, executeWorkflow } = useWorkflow();
  const { collaborators, shareView, lockResource } = useCollaboration();
  const { 
    achievements, 
    level, 
    experience, 
    addAchievement, 
    addExperience 
  } = useGamification();
  const { versions, createVersion, revertToVersion } = useVersionControl();
  const accessibility = useAccessibility() || {};
  const accessibilitySettings = accessibility.settings || { highContrast: false };
  const toggleHighContrast = accessibility.toggleHighContrast || (() => {});  
  // State with Reducer
  const [state, dispatch] = useReducer(adminLayoutReducer, {
    tabs: [],
    activeTab: null,
    splitView: { enabled: false, sizes: [50, 50] },
    widgets: [],
    commandPaletteOpen: false,
    selectedItems: [],
    terminalOpen: false,
    fileManagerOpen: false,
    collaborationPanelOpen: false,
    achievements: [],
    accessibility: { highContrast: false },
    viewMode: 'default'
  });
  
  // Local State
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });
  const [expandedMenu, setExpandedMenu] = useState(() => {
    const saved = localStorage.getItem('admin-expanded-menu');
    return saved ? JSON.parse(saved) : ['dashboard'];
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);
  const [pageTitle, setPageTitle] = useState('داشبورد');
  const [systemStatus, setSystemStatus] = useState('healthy');
  const [contextMenu, setContextMenu] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [menuOrder, setMenuOrder] = useState(() => {
    const saved = localStorage.getItem('admin-menu-order');
    return saved ? JSON.parse(saved) : ADMIN_MENU.map(m => m.id);
  });
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [globalSearchIndex, setGlobalSearchIndex] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Handler Functions (تعریف قبل از useMemo و useHotkeys)
  // ═══════════════════════════════════════════════════════════
  
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  
  const toggleMenu = (menuId) => {
    setExpandedMenu(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };
  
  const handleLogout = async () => {
    logActivity('user_logout', { user: user?.username });
    
    toast.promise(
      logout(),
      {
        loading: 'در حال خروج...',
        success: '👋 خروج موفق',
        error: '❌ خطا در خروج'
      }
    );
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      addAchievement({
        id: 'fullscreen-master',
        title: 'استاد تمام‌صفحه',
        description: 'از حالت تمام‌صفحه استفاده کردید',
        icon: '🖥️'
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleSave = () => {
    toast.success('💾 تغییرات ذخیره شدند');
    logActivity('save_changes', { path: location.pathname });
  };
  
  const handleUndo = () => {
    toast('↩️ عملیات برگشت داده شد', { icon: '↩️' });
  };
  
  const handleRedo = () => {
    toast('↪️ عملیات بازگردانی شد', { icon: '↪️' });
  };
  
  const focusSearch = () => {
    document.querySelector('.global-search-input')?.focus();
  };
  
  const addNewTab = (path = '/admin/dashboard', label = 'داشبورد') => {
    dispatch({
      type: ACTIONS.ADD_TAB,
      payload: { path, label }
    });
    addExperience(5);
  };
  
  const closeCurrentTab = () => {
    if (state.activeTab) {
      dispatch({ type: ACTIONS.REMOVE_TAB, payload: state.activeTab });
    }
  };
  
  const reopenLastTab = () => {
    toast('↩️ آخرین تب بسته شده باز شد');
  };
  
  const nextTab = () => {
    const currentIndex = state.tabs.findIndex(t => t.id === state.activeTab);
    const nextIndex = (currentIndex + 1) % state.tabs.length;
    dispatch({ 
      type: ACTIONS.SET_ACTIVE_TAB, 
      payload: state.tabs[nextIndex]?.id 
    });
  };
  
  const prevTab = () => {
    const currentIndex = state.tabs.findIndex(t => t.id === state.activeTab);
    const prevIndex = (currentIndex - 1 + state.tabs.length) % state.tabs.length;
    dispatch({ 
      type: ACTIONS.SET_ACTIVE_TAB, 
      payload: state.tabs[prevIndex]?.id 
    });
  };
  
  const switchTab = (index) => {
    if (state.tabs[index]) {
      dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: state.tabs[index].id });
    }
  };
  
  const toggleSplitView = () => {
    dispatch({ type: ACTIONS.TOGGLE_SPLIT });
  };
  
  const toggleVerticalSplit = () => {
    dispatch({ type: ACTIONS.TOGGLE_SPLIT });
    dispatch({ type: ACTIONS.SET_SPLIT_SIZES, payload: [30, 70] });
  };
  
  const toggleTerminal = () => {
    dispatch({ type: ACTIONS.TOGGLE_TERMINAL });
  };
  
  const toggleFileManager = () => {
    dispatch({ type: ACTIONS.TOGGLE_FILE_MANAGER });
  };
  
  const toggleCollaborationPanel = () => {
    dispatch({ type: ACTIONS.TOGGLE_COLLABORATION_PANEL });
  };
  
  const selectAll = () => {
    toast.info('همه آیتم‌ها انتخاب شدند');
  };
  
  const clearSelection = () => {
    dispatch({ type: ACTIONS.SET_SELECTED_ITEMS, payload: [] });
  };
  
  const showShortcutsHelp = () => {
    toast.custom(<AdminShortcuts />, { duration: 10000 });
  };
  
  const openDocumentation = () => {
    window.open('/docs/admin', '_blank');
  };
  
  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-user':
        navigate('/admin/users/new');
        break;
      case 'new-course':
        navigate('/admin/courses/new');
        break;
      case 'quick-report':
        navigate('/admin/reports/quick');
        break;
      case 'quick-settings':
        setShowQuickActions(false);
        break;
      case 'backup':
        handleBackup();
        break;
      default:
        toast(`اجرای ${action}`);
    }
    
    logActivity('quick_action', { action });
    addExperience(10);
    setShowQuickActions(false);
  };
  
  const handleBackup = async () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 3000)),
      {
        loading: 'در حال تهیه بک‌آپ...',
        success: '✅ بک‌آپ با موفقیت تهیه شد',
        error: '❌ خطا در تهیه بک‌آپ'
      }
    );
    
    addAchievement({
      id: 'backup-master',
      title: 'محافظ داده‌ها',
      description: 'اولین بک‌آپ را تهیه کردید',
      icon: '💾'
    });
  };
  
  const clearCache = () => {
    toast.success('🧹 کش با موفقیت پاک شد');
  };
  
  const handleMenuDrag = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(menuOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setMenuOrder(items);
  };
  
  const clearNotifications = () => {
    notifications.forEach(n => removeNotification(n.id));
    toast.success('🧹 نوتیفیکیشن‌ها پاک شدند');
  };
  
  const markAllAsRead = () => {
    notifications.forEach(n => markAsRead(n.id));
    toast.success('✅ همه خوانده شدند');
  };
  
  const handleGlobalSearch = (query) => {
    if (!query || !globalSearchIndex) {
      setQuickSearchResults([]);
      return;
    }
    
    const results = [];
    const q = query.toLowerCase();
    
    ADMIN_MENU.forEach(item => {
      if (item.label.toLowerCase().includes(q)) {
        results.push({
          type: 'menu',
          title: item.label,
          description: item.description,
          path: item.path,
          icon: item.icon
        });
      }
    });
    
    setQuickSearchResults(results.slice(0, 10));
  };
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Memoized Values (بعد از توابع)
  // ═══════════════════════════════════════════════════════════
  
  const orderedMenu = useMemo(() => {
    const menuMap = Object.fromEntries(ADMIN_MENU.map(m => [m.id, m]));
    return menuOrder.map(id => menuMap[id]).filter(Boolean);
  }, [menuOrder]);
  
  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter(x => x);
    return pathnames.map((name, index) => ({
      name: name === 'admin' ? 'پنل مدیریت' : name,
      path: '/' + pathnames.slice(0, index + 1).join('/')
    }));
  }, [location.pathname]);
  
  const filteredMenu = useMemo(() => {
    if (!searchQuery) return orderedMenu;
    
    const query = searchQuery.toLowerCase();
    return orderedMenu.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(query);
      const matchKeywords = item.keywords?.some(k => k.includes(query));
      const matchChildren = item.children?.some(child => 
        child.label.toLowerCase().includes(query)
      );
      return matchLabel || matchKeywords || matchChildren;
    });
  }, [searchQuery, orderedMenu]);
  
  const commandPaletteCommands = useMemo(() => {
    const commands = [];
    
    ADMIN_MENU.forEach(item => {
      commands.push({
        name: item.label,
        command: () => navigate(item.path),
        hotkey: item.shortcut,
        icon: item.icon
      });
      
      item.children?.forEach(child => {
        commands.push({
          name: `${item.label} > ${child.label}`,
          command: () => navigate(child.path),
          icon: child.icon
        });
      });
    });
    
    commands.push(
      { name: 'کاربر جدید', command: () => handleQuickAction('new-user'), hotkey: 'Cmd+Shift+N', icon: FaUserPlus },
      { name: 'دوره جدید', command: () => handleQuickAction('new-course'), hotkey: 'Cmd+Shift+E', icon: FaBook },
      { name: 'بک‌آپ دیتابیس', command: handleBackup, icon: FaDatabase },
      { name: 'پاکسازی کش', command: clearCache, icon: FaTrash },
      { name: 'تغییر تم', command: toggleTheme, hotkey: 'Cmd+D', icon: isDark ? FaSun : FaMoon },
      { name: 'تمام‌صفحه', command: toggleFullscreen, hotkey: 'Cmd+Shift+F', icon: FaExpand },
      { name: 'تنظیمات', command: () => navigate('/admin/settings'), hotkey: 'Cmd+,', icon: FaCog },
      { name: 'خروج', command: handleLogout, icon: FaSignOutAlt }
    );
    
    return commands;
  }, [isDark, navigate, handleBackup, clearCache, toggleTheme, handleLogout, toggleFullscreen, handleQuickAction]);
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Keyboard Shortcuts (بعد از توابع و useMemo)
  // ═══════════════════════════════════════════════════════════
  
  useHotkeys('mod+k, mod+p', (e) => {
    e.preventDefault();
    dispatch({ type: ACTIONS.TOGGLE_COMMAND_PALETTE });
  });
  
  useHotkeys('mod+[', () => navigate(-1));
  useHotkeys('mod+]', () => navigate(1));
  useHotkeys('mod+1', () => navigate('/admin/dashboard'));
  useHotkeys('mod+2', () => navigate('/admin/users'));
  useHotkeys('mod+3', () => navigate('/admin/courses'));
  
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    toggleSidebar();
  });
  
  useHotkeys('mod+d', (e) => {
    e.preventDefault();
    toggleTheme();
  });
  useHotkeys('mod+shift+f', toggleFullscreen);
  useHotkeys('mod+shift+h', toggleHighContrast);
  
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    handleSave();
  });
  useHotkeys('mod+z', handleUndo);
  useHotkeys('mod+shift+z, mod+y', handleRedo);
  useHotkeys('mod+f', (e) => {
    e.preventDefault();
    focusSearch();
  });
  useHotkeys('mod+r', (e) => {
    e.preventDefault();
    handleRefresh();
  });
  
  useHotkeys('mod+t', (e) => {
    e.preventDefault();
    addNewTab();
  });
  useHotkeys('mod+w', (e) => {
    e.preventDefault();
    closeCurrentTab();
  });
  useHotkeys('mod+shift+t', reopenLastTab);
  useHotkeys('mod+tab', nextTab);
  useHotkeys('mod+shift+tab', prevTab);
  useHotkeys('mod+1', () => switchTab(0));
  useHotkeys('mod+2', () => switchTab(1));
  useHotkeys('mod+3', () => switchTab(2));
  useHotkeys('mod+4', () => switchTab(3));
  useHotkeys('mod+5', () => switchTab(4));
  useHotkeys('mod+6', () => switchTab(5));
  useHotkeys('mod+7', () => switchTab(6));
  useHotkeys('mod+8', () => switchTab(7));
  useHotkeys('mod+9', () => switchTab(8));
  
  useHotkeys('mod+\\', toggleSplitView);
  useHotkeys('mod+shift+\\', toggleVerticalSplit);
  
  useHotkeys('mod+`', toggleTerminal);
  useHotkeys('mod+shift+f', toggleFileManager);
  useHotkeys('mod+shift+c', toggleCollaborationPanel);
  
  useHotkeys('mod+a', (e) => {
    e.preventDefault();
    selectAll();
  });
  useHotkeys('mod+shift+a', clearSelection);
  useHotkeys('escape', () => {
    setContextMenu(null);
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowQuickActions(false);
  });
  
  useHotkeys('mod+shift+n', () => handleQuickAction('new-user'));
  useHotkeys('mod+shift+e', () => handleQuickAction('new-course'));
  useHotkeys('mod+shift+r', () => handleQuickAction('quick-report'));
  
  useHotkeys('mod+/', showShortcutsHelp);
  useHotkeys('mod+shift+/', () => setShowTour(true));
  useHotkeys('F1', openDocumentation);
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Effects
  // ═══════════════════════════════════════════════════════════
  
  useEffect(() => {
    console.log('🔐 AdminLayout - authLoading:', authLoading);
    console.log('🔐 AdminLayout - local loading:', loading);
    console.log('🔐 AdminLayout - isAuthenticated:', isAuthenticated);
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location]);


  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('admin-expanded-menu', JSON.stringify(expandedMenu));
  }, [expandedMenu]);
  
  useEffect(() => {
    localStorage.setItem('admin-menu-order', JSON.stringify(menuOrder));
  }, [menuOrder]);
  
  useEffect(() => {
    const currentMenuItem = ADMIN_MENU.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    if (currentMenuItem) {
      setPageTitle(currentMenuItem.label);
      dispatch({
        type: ACTIONS.ADD_TAB,
        payload: {
          path: location.pathname,
          label: currentMenuItem.label,
          icon: currentMenuItem.icon
        }
      });
    }
  }, [location.pathname]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      
      const menuItems = [
        { 
          label: 'باز کردن در تب جدید', 
          icon: FaPlus, 
          onClick: () => addNewTab(),
          shortcut: '⌘T'
        },
        { divider: true },
        { 
          label: 'کپی', 
          icon: FaCopy, 
          onClick: () => document.execCommand('copy'),
          shortcut: '⌘C'
        },
        { 
          label: 'برش', 
          icon: FaCut, 
          onClick: () => document.execCommand('cut'),
          shortcut: '⌘X'
        },
        { 
          label: 'چسباندن', 
          icon: FaPaste, 
          onClick: () => document.execCommand('paste'),
          shortcut: '⌘V'
        },
        { divider: true },
        { 
          label: 'رفرش', 
          icon: FaSync, 
          onClick: handleRefresh,
          shortcut: '⌘R'
        },
        { 
          label: 'تمام‌صفحه', 
          icon: FaExpand, 
          onClick: toggleFullscreen,
          shortcut: '⌘⇧F'
        },
        { divider: true },
        { 
          label: 'تنظیمات', 
          icon: FaCog, 
          onClick: () => navigate('/admin/settings'),
          shortcut: '⌘,'
        }
      ];
      
      setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems });
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [addNewTab, handleRefresh, navigate, toggleFullscreen]);
  
  /* useEffect(() => {
    if (!isAuthenticated) return;
    
    let ws = null;
    let reconnectTimer = null;
    
    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
          setWsConnected(true);
          addNotification({
            title: 'اتصال برقرار شد',
            message: 'اتصال WebSocket به سرور برقرار شد',
            priority: 'LOW',
            icon: '🟢'
          });
        };
        
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        
        ws.onerror = () => setWsConnected(false);
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === WS_EVENTS.NOTIFICATION) {
              addNotification(data.payload);
              
              if (soundEnabled && data.payload.priority) {
                const sound = NOTIFICATION_PRIORITIES[data.payload.priority]?.sound;
                if (sound) {
                  audioRef.current.src = sound;
                  audioRef.current.play();
                }
              }
              
              if (Notification.permission === 'granted') {
                new Notification(data.payload.title, {
                  body: data.payload.message,
                  icon: '/logo192.png',
                  badge: '/logo192.png',
                  tag: data.payload.id,
                  requireInteraction: data.payload.priority === 'CRITICAL'
                });
              }
            }
            
            if (data.type === WS_EVENTS.SYSTEM_ANNOUNCEMENT) {
              addNotification({
                ...data.payload,
                priority: 'HIGH'
              });
            }
            
            if (data.type === 'RESOURCE_LOCKED') {
              toast(`🔒 ${data.payload.resource} توسط ${data.payload.user} قفل شد`, { icon: '🔒' });
            }
          } catch (e) {
            console.error('WebSocket message error:', e);
          }
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
      }
    };
    
    connect();
    
    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [isAuthenticated, soundEnabled, addNotification]); */
  useEffect(() => {
  if (!isAuthenticated) return;
  
  let ws = null;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_DELAY = 3000;
  
  const connect = () => {
    try {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttempts = 0;
        
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 30000);
        
        addNotification({
          title: 'اتصال برقرار شد',
          message: 'اتصال WebSocket به سرور برقرار شد',
          priority: 'LOW',
          icon: '🟢'
        });
      };
      
      ws.onclose = (event) => {
        setWsConnected(false);
        
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_DELAY * Math.pow(1.5, reconnectAttempts);
          reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        } else {
          startFallbackPolling();
        }
      };
      
      ws.onerror = () => {
        setWsConnected(false);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') return;
          
          if (data.type === WS_EVENTS.NOTIFICATION) {
            addNotification(data.payload);
            
            if (soundEnabled && data.payload.priority) {
              const sound = NOTIFICATION_PRIORITIES[data.payload.priority]?.sound;
              if (sound) {
                audioRef.current.src = sound;
                audioRef.current.play();
              }
            }
            
            if (Notification.permission === 'granted') {
              new Notification(data.payload.title, {
                body: data.payload.message,
                icon: '/logo192.png',
                tag: data.payload.id,
                requireInteraction: data.payload.priority === 'CRITICAL'
              });
            }
          }
          
          if (data.type === WS_EVENTS.SYSTEM_ANNOUNCEMENT) {
            addNotification({
              ...data.payload,
              priority: 'HIGH'
            });
          }
          
          if (data.type === 'RESOURCE_LOCKED') {
            toast(`🔒 ${data.payload.resource} توسط ${data.payload.user} قفل شد`, { icon: '🔒' });
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_DELAY * Math.pow(1.5, reconnectAttempts);
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      }
    }
  };
  
  const startFallbackPolling = () => {
    if (fallbackInterval) clearInterval(fallbackInterval);
    fallbackInterval = setInterval(async () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        data.notifications?.forEach(n => addNotification(n));
      } catch (e) {}
    }, 15000);
  };
  
  let fallbackInterval = null;
  connect();
  
  return () => {
    if (ws) ws.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (fallbackInterval) clearInterval(fallbackInterval);
  };
}, [isAuthenticated, soundEnabled, addNotification]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  useEffect(() => {
    startMonitoring();
  }, [startMonitoring]);
  
  useEffect(() => {
    const buildSearchIndex = async () => {
      const index = {
        menu: ADMIN_MENU,
        users: [],
        courses: [],
        pages: []
      };
      setGlobalSearchIndex(index);
    };
    
    buildSearchIndex();
  }, []);
  
  useEffect(() => {
    if (mainContentRef.current) {
      const headings = mainContentRef.current.querySelectorAll('h1, h2, h3');
      const sectionsList = Array.from(headings).map((h, index) => ({
        id: `section-${index}`,
        label: h.textContent,
        element: h
      }));
      setSections(sectionsList);
    }
  }, [location.pathname]);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = section.element;
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);
  
  // ═══════════════════════════════════════════════════════════
  // 🎨 Render Components
  // ═══════════════════════════════════════════════════════════
  
  const renderTabs = () => (
    <div className="admin-tabs-container">
      <div className="admin-tabs">
        {state.tabs.map(tab => (
          <motion.div
            key={tab.id}
            className={`admin-tab ${state.activeTab === tab.id ? 'active' : ''} ${tab.pinned ? 'pinned' : ''}`}
            layoutId={tab.id}
            onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab.id })}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                items: [
                  { label: 'بستن', icon: FaTimes, onClick: () => dispatch({ type: ACTIONS.REMOVE_TAB, payload: tab.id }) },
                  { label: 'بستن سایر تب‌ها', icon: FaTimes, onClick: () => {
                    state.tabs.filter(t => t.id !== tab.id).forEach(t => 
                      dispatch({ type: ACTIONS.REMOVE_TAB, payload: t.id })
                    );
                  }},
                  { label: 'بستن تب‌های سمت راست', icon: FaChevronRight, onClick: () => {} },
                  { divider: true },
                  { label: tab.pinned ? 'برداشتن پین' : 'پین کردن', icon: FaThumbtack, onClick: () => 
                    dispatch({ type: ACTIONS.PIN_TAB, payload: tab.id })
                  },
                  { label: 'باز کردن در پنجره جدید', icon: FaExternalLinkAlt, onClick: () => 
                    window.open(tab.path, '_blank')
                  },
                  { divider: true },
                  { label: 'رفرش', icon: FaSync, onClick: handleRefresh }
                ]
              });
            }}
          >
            {tab.icon && <tab.icon />}
            <span>{tab.label}</span>
            {tab.loading && <FaSpinner className="spinning" />}
            <button 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: ACTIONS.REMOVE_TAB, payload: tab.id });
              }}
            >
              <FaTimes />
            </button>
          </motion.div>
        ))}
        <button className="new-tab-btn" onClick={() => addNewTab()}>
          <FaPlus />
        </button>
      </div>
    </div>
  );
  
  const renderCommandPalette = () => (
    <CommandPalette
      commands={commandPaletteCommands}
      open={state.commandPaletteOpen}
      onRequestClose={() => dispatch({ type: ACTIONS.TOGGLE_COMMAND_PALETTE })}
      placeholder="جستجوی دستورات... (⌘K)"
      theme={{
        modal: 'command-palette-modal',
        overlay: 'command-palette-overlay',
        container: 'command-palette-container',
        header: 'command-palette-header',
        input: 'command-palette-input',
        suggestionsContainer: 'command-palette-suggestions',
        suggestion: 'command-palette-suggestion',
        suggestionHighlighted: 'highlighted'
      }}
      renderCommand={(command) => (
        <div className="command-item">
          {command.icon && <command.icon />}
          <span>{command.name}</span>
          {command.hotkey && <kbd>{command.hotkey}</kbd>}
        </div>
      )}
    />
  );
  
  const renderGlobalSearch = () => (
    <div className="global-search-wrapper">
      <FaSearch className="search-icon" />
      <input
        type="text"
        className="global-search-input"
        placeholder="جستجوی سریع... (⌘K)"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleGlobalSearch(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setSearchQuery('');
            setQuickSearchResults([]);
          }
        }}
      />
      {searchQuery && (
        <button className="clear-search" onClick={() => setSearchQuery('')}>
          <FaTimes />
        </button>
      )}
      
      <AnimatePresence>
        {quickSearchResults.length > 0 && (
          <motion.div
            className="quick-search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {quickSearchResults.map((result, index) => (
              <Link
                key={index}
                to={result.path}
                className="search-result-item"
                onClick={() => {
                  setSearchQuery('');
                  setQuickSearchResults([]);
                }}
              >
                {result.icon && <result.icon />}
                <div>
                  <h4>{result.title}</h4>
                  {result.description && <p>{result.description}</p>}
                </div>
                <span className="result-type">{result.type}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
  const renderNotificationPanel = () => (
    <motion.div
      className="notification-panel"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="notification-header">
        <h4>🔔 نوتیفیکیشن‌ها</h4>
        <div className="notification-actions">
          <button onClick={markAllAsRead}>✅ خواندن همه</button>
          <button onClick={clearNotifications}>🧹 پاک کردن</button>
          <button onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <BsVolumeUp /> : <BsVolumeMute />}
          </button>
        </div>
      </div>
      
      <div className="notification-filters">
        <button className="filter-btn active">همه</button>
        <button className="filter-btn critical">🚨 حیاتی</button>
        <button className="filter-btn unread">خوانده نشده</button>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="empty-state">📭 نوتیفیکیشنی وجود ندارد</p>
        ) : (
          notifications.slice(0, 20).map((notification, i) => {
            const priority = NOTIFICATION_PRIORITIES[notification.priority] || NOTIFICATION_PRIORITIES.LOW;
            
            return (
              <motion.div
                key={notification.id || i}
                className={`notification-item priority-${notification.priority?.toLowerCase()}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ borderRightColor: priority.color }}
              >
                <span className="notification-icon">{notification.icon || priority.icon}</span>
                <div className="notification-content">
                  <div className="notification-title">
                    <strong>{notification.title}</strong>
                    <span className="notification-time">{notification.time || 'همین الان'}</span>
                  </div>
                  <p>{notification.message}</p>
                  {notification.actions && (
                    <div className="notification-actions">
                      {notification.actions.map((action, idx) => (
                        <button key={idx} onClick={action.onClick}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className="notification-dismiss"
                  onClick={() => removeNotification(notification.id)}
                >
                  <FaTimes />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
  
  const renderUserMenu = () => (
    <motion.div
      className="user-menu-panel"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="user-menu-header">
        <FaUserCircle size={48} />
        <div>
          <h4>{user?.fullName || user?.username || 'مدیر سیستم'}</h4>
          <span className="user-role">{user?.role === 'admin' ? 'مدیر ارشد' : user?.role}</span>
          <span className="user-email">{user?.email}</span>
        </div>
      </div>
      
      <div className="user-stats">
        <div className="stat-item">
          <span className="stat-label">سطح</span>
          <span className="stat-value level">{level}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">تجربه</span>
          <span className="stat-value xp">{experience} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-progress" style={{ width: `${(experience % 100)}%` }} />
        </div>
      </div>
      
      {achievements.length > 0 && (
        <div className="recent-achievements">
          <h5>🏆 دستاوردهای اخیر</h5>
          <div className="achievement-badges">
            {achievements.slice(-3).map(achievement => (
              <span key={achievement.id} className="badge" title={achievement.title}>
                {achievement.icon}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="user-menu-divider" />
      
      <Link to="/admin/profile" className="user-menu-item">
        <FaUser /> پروفایل
        <kbd>⌘P</kbd>
      </Link>
      <Link to="/admin/settings" className="user-menu-item">
        <FaCog /> تنظیمات
        <kbd>⌘,</kbd>
      </Link>
      <Link to="/admin/activity" className="user-menu-item">
        <FaHistory /> تاریخچه فعالیت
      </Link>
      
      <div className="user-menu-divider" />
      
      <button className="user-menu-item" onClick={() => setShowTour(true)}>
        <MdSlideshow /> تور آموزشی
      </button>
      <button className="user-menu-item" onClick={showShortcutsHelp}>
        <FaKeyboard /> میانبرهای کیبورد
        <kbd>⌘/</kbd>
      </button>
      
      <div className="user-menu-divider" />
      
      <button className="user-menu-item danger" onClick={handleLogout}>
        <FaSignOutAlt /> خروج
        <kbd>⌘Q</kbd>
      </button>
    </motion.div>
  );
  
/*   const renderSidebarMenuItem = (item, isChild = false) => {
    const isActive = location.pathname === item.path || 
                     location.pathname.startsWith(item.path + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenu.includes(item.id);
    const isHovered = hoveredMenuItem === item.id;
    
    const [{ isDragging }, drag] = useDrag({
      type: ITEM_TYPES.MENU_ITEM,
      item: { id: item.id, index: menuOrder.indexOf(item.id) },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });
    
    const [, drop] = useDrop({
      accept: ITEM_TYPES.MENU_ITEM,
      hover: (draggedItem) => {
        if (draggedItem.id !== item.id) {
          const draggedIndex = menuOrder.indexOf(draggedItem.id);
          const hoverIndex = menuOrder.indexOf(item.id);
          
          if (draggedIndex === hoverIndex) return;
          
          const newOrder = [...menuOrder];
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(hoverIndex, 0, draggedItem.id);
          setMenuOrder(newOrder);
          
          draggedItem.index = hoverIndex;
        }
      }
    });
    
    return (
      <div 
        key={item.id || item.path} 
        className="menu-item-wrapper"
        ref={node => drag(drop(node))}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <motion.div
          className={`sidebar-menu-item ${isActive ? 'active' : ''} ${isChild ? 'child' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              navigate(item.path);
            }
          }}
          onMouseEnter={() => setHoveredMenuItem(item.id)}
          onMouseLeave={() => setHoveredMenuItem(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              items: [
                { 
                  label: 'باز کردن در تب جدید', 
                  icon: FaPlus, 
                  onClick: () => addNewTab(item.path, item.label) 
                },
                { 
                  label: 'باز کردن در Split View', 
                  icon: TbArrowsSplit, 
                  onClick: () => {
                    toggleSplitView();
                    addNewTab(item.path, item.label);
                  }
                },
                { divider: true },
                { 
                  label: 'پین کردن به منو', 
                  icon: FaThumbtack, 
                  onClick: () => {} 
                },
                { 
                  label: 'مخفی کردن از منو', 
                  icon: FaEyeSlash, 
                  onClick: () => {} 
                }
              ]
            });
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="drag-handle">
            <MdDragHandle />
          </span>
          
          <span className="menu-icon">
            <item.icon />
          </span>
          
          {!sidebarCollapsed && (
            <motion.span 
              className="menu-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {item.label}
              {item.description && !isChild && (
                <small className="menu-description">{item.description}</small>
              )}
            </motion.span>
          )}
          
          {!sidebarCollapsed && item.badge && (
            <span className="menu-badge">{item.badge}</span>
          )}
          
          {!sidebarCollapsed && item.shortcut && (
            <kbd className="menu-shortcut">{item.shortcut}</kbd>
          )}
          
          {!sidebarCollapsed && hasChildren && (
            <span className="expand-icon">
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          )}
          
          {sidebarCollapsed && isHovered && hasChildren && (
            <div className="tooltip-submenu">
              {item.children.map(child => (
                <button
                  key={child.path}
                  className="tooltip-submenu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(child.path);
                  }}
                >
                  <child.icon />
                  <span>{child.label}</span>
                  {child.badge && <span className="badge">{child.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </motion.div>
        
        <AnimatePresence>
          {!sidebarCollapsed && isExpanded && hasChildren && (
            <motion.div
              className="submenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.children.map(child => renderSidebarMenuItem({ ...child, id: child.path }, true))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }; */
  
  const renderFloatingActions = () => (
    <div className="floating-actions">
      <motion.button 
        className="fab terminal"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTerminal}
        title="ترمینال (⌘`)"
      >
        <FaTerminal />
      </motion.button>
      
      <motion.button 
        className="fab files"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleFileManager}
        title="مدیریت فایل (⌘⇧F)"
      >
        <FaFolder />
      </motion.button>
      
      <motion.button 
        className="fab collaborate"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCollaborationPanel}
        title="همکاری (⌘⇧C)"
      >
        <FaUsers />
        {collaborators.length > 0 && (
          <span className="fab-badge">{collaborators.length}</span>
        )}
      </motion.button>
      
      <motion.button 
        className="fab quick-actions"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowQuickActions(!showQuickActions)}
      >
        <FaBolt />
      </motion.button>
      
      <motion.button 
        className="fab performance"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPerformance(!showPerformance)}
      >
        <HiOutlineCpuChip />
      </motion.button>
      
      <motion.button 
        className="fab minimap"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMiniMap(!showMiniMap)}
      >
        <MdMap />
      </motion.button>
      
      <motion.button 
        className="fab help"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={showShortcutsHelp}
      >
        <MdHelp />
      </motion.button>
      
      {process.env.NODE_ENV === 'development' && (
        <>
          <motion.button 
            className="fab debug"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => console.log({ state, activities, workflows, versions })}
          >
            <FaBug />
          </motion.button>
          
          <motion.button 
            className="fab devtools"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.__REACT_DEVTOOLS_GLOBAL_HOOK__}
          >
            <SiReact />
          </motion.button>
        </>
      )}
    </div>
  );
  
  const renderSplitView = () => {
    if (!state.splitView.enabled) {
      return (
        <main className="admin-content" ref={mainContentRef}>
          <Suspense fallback={
            <div className="page-loading">
              <FaSpinner className="spinning" size={30} />
              <p>در حال بارگذاری...</p>
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="content-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      );
    }
    
    return (
      <Split
        className="admin-split-view"
        sizes={state.splitView.sizes}
        minSize={300}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
        onDragEnd={(sizes) => 
          dispatch({ type: ACTIONS.SET_SPLIT_SIZES, payload: sizes })
        }
      >
        <div className="split-pane">
          <Outlet />
        </div>
        <div className="split-pane">
          <Outlet />
        </div>
      </Split>
    );
  };
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Loading Screen
  // ═══════════════════════════════════════════════════════════
  
  if (authLoading || loading) {
    return (
      <div className="admin-loading-screen">
        <motion.div 
          className="loading-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="loading-icon"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FaGraduationCap size={80} />
          </motion.div>
          <h2>پنل مدیریت فرتاک</h2>
          <div className="loading-progress">
            <motion.div 
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p>در حال بارگذاری پنل مدیریت...</p>
          <div className="loading-tips">
            <span>💡 نکته: از ⌘K برای جستجوی سریع استفاده کنید</span>
          </div>
          <span className="welcome-text">خوش آمدید {user?.fullName || user?.username}</span>
        </motion.div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 Main Render
  // ═══════════════════════════════════════════════════════════
  
  return (
    <DndProvider backend={HTML5Backend}>
      <AdminLayoutContext.Provider value={{ state, dispatch, logActivity, addAchievement }}>
        <TourProvider steps={AdminTourSteps}>
          <div 
            className={`admin-layout ${theme} ${sidebarCollapsed ? 'collapsed' : 'expanded'} ${accessibilitySettings?.highContrast ? 'high-contrast' : ''}`}
            dir={direction}
            data-theme={theme}
          >
            <Toaster 
              position={direction === 'rtl' ? 'top-left' : 'top-right'}
              toastOptions={{
                duration: 4000,
                style: {
                  background: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  fontFamily: 'Vazirmatn, sans-serif'
                }
              }}
            />
            
            {renderCommandPalette()}
            
            {showTour && (
              <Joyride
                steps={AdminTourSteps}
                run={showTour}
                continuous
                showProgress
                showSkipButton
                styles={{
                  options: {
                    primaryColor: '#3b82f6',
                    zIndex: 10000
                  }
                }}
                callback={(data) => {
                  if (data.status === 'finished' || data.status === 'skipped') {
                    setShowTour(false);
                    addAchievement({
                      id: 'tour-complete',
                      title: 'کاوشگر حرفه‌ای',
                      description: 'تور آموزشی را کامل کردید',
                      icon: '🎓'
                    });
                  }
                }}
                locale={{
                  back: 'قبلی',
                  close: 'بستن',
                  last: 'پایان',
                  next: 'بعدی',
                  skip: 'رد کردن'
                }}
              />
            )}
            
            <motion.aside 
              className="admin-sidebar"
              animate={{ width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            >
              <div className="sidebar-header">
                <div className="sidebar-logo" onClick={() => navigate('/admin/dashboard')}>
                  <motion.div 
                    className="logo-icon"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    🎓
                  </motion.div>
                  {!sidebarCollapsed && (
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
                
                <button 
                  className="sidebar-toggle"
                  onClick={toggleSidebar}
                  title={`${sidebarCollapsed ? 'باز کردن' : 'بستن'} سایدبار (⌘B)`}
                >
                  {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
              </div>
              
              {!sidebarCollapsed && renderGlobalSearch()}
              
              <nav className="sidebar-nav">
                {filteredMenu.map(item => (
                      <SidebarMenuItem
                        key={item.id}
                        item={item}
                        isChild={false}
                        location={location}
                        navigate={navigate}
                        expandedMenu={expandedMenu}
                        toggleMenu={toggleMenu}
                        sidebarCollapsed={sidebarCollapsed}
                        hoveredMenuItem={hoveredMenuItem}
                        setHoveredMenuItem={setHoveredMenuItem}
                        menuOrder={menuOrder}
                        setMenuOrder={setMenuOrder}
                        addNewTab={addNewTab}
                        toggleSplitView={toggleSplitView}
                      />
                    ))}
              </nav>
              
              <div className="sidebar-footer">
                <div className="sidebar-status">
                  <span className={`status-indicator ${systemStatus} ${wsConnected ? 'connected' : ''}`} />
                  {!sidebarCollapsed && (
                    <span>
                      {wsConnected ? '🟢 آنلاین' : '🔴 آفلاین'}
                    </span>
                  )}
                </div>
                
                {!sidebarCollapsed && (
                  <div className="sidebar-version">
                    <span>نسخه ۴.۰.۰</span>
                    <small>© ۱۴۰۴ فرتاک</small>
                  </div>
                )}
              </div>
            </motion.aside>
            
            <div className="admin-main-wrapper">
              <header className="admin-header">
                <div className="header-left">
                  <button className="header-icon-btn" onClick={toggleSidebar} title="تغییر سایدبار (⌘B)">
                    <FaBars />
                  </button>
                  
                  <div className="breadcrumbs">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={crumb.path}>
                        {index > 0 && <span className="separator">/</span>}
                        <Link to={crumb.path}>{crumb.name}</Link>
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="page-title">{pageTitle}</h2>
                </div>
                
                <div className="header-right">
                  <div className="connection-status">
                    {isOnline ? (
                      <span className="online"><FaWifi /> آنلاین</span>
                    ) : (
                      <span className="offline"><FaExclamationTriangle /> آفلاین</span>
                    )}
                    {wsConnected && <span className="ws-badge">⚡</span>}
                  </div>
                  
                  {isOffline && pendingChanges > 0 && (
                    <button className="sync-btn" onClick={syncData}>
                      <FaCloudUploadAlt />
                      <span>{pendingChanges} تغییر در صف</span>
                    </button>
                  )}
                  
                  <button className="header-icon-btn" onClick={handleRefresh} title="رفرش (⌘R)">
                    <FaSync className={loading ? 'spinning' : ''} />
                  </button>
                  
                  <button className="header-icon-btn" onClick={toggleFullscreen} title="تمام‌صفحه (⌘⇧F)">
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                  </button>
                  
                  <button className="header-icon-btn" onClick={toggleSplitView} title="Split View (⌘\)">
                    <TbArrowsSplit />
                  </button>
                  
                  <div className="notification-wrapper">
                    <button 
                      className="header-icon-btn"
                      onClick={() => setShowNotifications(!showNotifications)}
                      title="نوتیفیکیشن‌ها"
                    >
                      <FaBell />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="notification-badge">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showNotifications && renderNotificationPanel()}
                    </AnimatePresence>
                  </div>
                  
                  <button className="header-icon-btn" onClick={toggleTheme} title="تغییر تم (⌘D)">
                    {isDark ? <FaSun /> : <FaMoon />}
                  </button>
                  
                  <button className="header-icon-btn" onClick={toggleDirection} title="تغییر جهت">
                    <FaLanguage />
                  </button>
                  
                  <div className="user-wrapper">
                    <button 
                      className="user-btn"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <FaUserCircle size={32} />
                      <span>{user?.fullName || user?.username || 'مدیر'}</span>
                      <FaChevronDown className={showUserMenu ? 'rotate' : ''} />
                    </button>
                    
                    <AnimatePresence>
                      {showUserMenu && renderUserMenu()}
                    </AnimatePresence>
                  </div>
                </div>
              </header>
              
              {renderTabs()}
              
              {renderSplitView()}
              
              <AnimatePresence>
                {state.terminalOpen && (
                  <motion.div
                    className="terminal-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 300, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <AdminTerminal onClose={toggleTerminal} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {state.fileManagerOpen && (
                  <motion.div
                    className="filemanager-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <AdminFileManager onClose={toggleFileManager} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {state.collaborationPanelOpen && (
                  <AdminCollaborationPanel 
                    onClose={toggleCollaborationPanel}
                    collaborators={collaborators}
                  />
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence>
              {showQuickActions && (
                <QuickActions 
                  onAction={handleQuickAction}
                  onClose={() => setShowQuickActions(false)}
                />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showPerformance && (
                <PerformanceMonitor metrics={metrics} />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showMiniMap && sections.length > 0 && (
                <MiniMap 
                  sections={sections}
                  activeSection={activeSection}
                  onSectionClick={(id) => {
                    const section = sections.find(s => s.id === id);
                    section?.element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {contextMenu && (
                <ContextMenu
                  {...contextMenu}
                  onClose={() => setContextMenu(null)}
                />
              )}
            </AnimatePresence>
            
            <BulkOperationsBar
              selectedCount={state.selectedItems.length}
              onClear={clearSelection}
              operations={[
                { id: 'delete', icon: FaTrash, label: 'حذف', onClick: () => {} },
                { id: 'export', icon: FaDownload, label: 'خروجی', onClick: () => {} },
                { id: 'edit', icon: FaEdit, label: 'ویرایش گروهی', onClick: () => {} }
              ]}
            />
            
            {renderFloatingActions()}
          </div>
        </TourProvider>
      </AdminLayoutContext.Provider>
    </DndProvider>
  );
};
// ═══════════════════════════════════════════════════════════
// 🎯 Custom Hooks Export
// ═══════════════════════════════════════════════════════════

export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayout');
  }
  return context;
};

export default AdminLayout;