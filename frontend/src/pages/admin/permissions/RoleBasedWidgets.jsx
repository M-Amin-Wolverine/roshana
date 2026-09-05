// src/pages/admin/permissions/RoleBasedWidgets.jsx

export const ROLE_LEVELS = {
  admin: 100,
  it_manager: 90,
  vice_chancellor: 80,
  head_of_department: 70,
  security_manager: 65,
  financial_manager: 60,
  education_manager: 60,
  cultural_manager: 55,
  professor: 50,
  dormitory_manager: 45,
  supervisor: 45,
  staff: 40,
  support_agent: 30,
  librarian: 20,
  research_assistant: 15,
  student: 10,
  guest: 1
};

// تعریف مجوزهای هر ویجت
export const WIDGET_PERMISSIONS = {
  // ویجت‌های مدیریت سیستمی
  'system-status': {
    name: 'وضعیت سیستم',
    icon: 'FaServer',
    allowedRoles: ['admin', 'it_manager', 'security_manager', 'supervisor'],
    minLevel: 65,
    category: 'system',
    sensitive: true,
    auditLog: true
  },
  
  'api-monitor': {
    name: 'مانیتورینگ API',
    icon: 'FaChartLine',
    allowedRoles: ['admin', 'it_manager', 'security_manager'],
    minLevel: 90,
    category: 'system',
    sensitive: true,
    realtime: true
  },
  
  'user-management': {
    name: 'مدیریت کاربران',
    icon: 'FaUsers',
    allowedRoles: ['admin', 'it_manager', 'vice_chancellor', 'security_manager', 'supervisor'],
    minLevel: 65,
    category: 'users',
    sensitive: true,
    actions: ['create', 'edit', 'delete', 'suspend']
  },
  
  // ویجت‌های مالی
  'financial-stats': {
    name: 'آمار مالی',
    icon: 'FaChartLine',
    allowedRoles: ['admin', 'vice_chancellor', 'financial_manager', 'supervisor'],
    minLevel: 60,
    category: 'financial',
    sensitive: true,
    exportable: true
  },
  
  'salary-management': {
    name: 'مدیریت حقوق',
    icon: 'FaMoneyBill',
    allowedRoles: ['admin', 'financial_manager'],
    minLevel: 60,
    category: 'financial',
    sensitive: true,
    auditLog: true
  },
  
  'tuition-monitor': {
    name: 'شهریه‌ها',
    icon: 'FaCreditCard',
    allowedRoles: ['admin', 'vice_chancellor', 'financial_manager', 'education_manager', 'head_of_department', 'supervisor'],
    minLevel: 60,
    category: 'financial',
    exportable: true
  },
  
  // ویجت‌های آموزشی
  'courses-stats': {
    name: 'دوره‌های آموزشی',
    icon: 'FaBook',
    allowedRoles: ['admin', 'vice_chancellor', 'head_of_department', 'education_manager', 'professor', 'supervisor', 'staff'],
    minLevel: 40,
    category: 'education',
    exportable: true
  },
  
  'grades-analytics': {
    name: 'تحلیل نمرات',
    icon: 'FaChartBar',
    allowedRoles: ['admin', 'education_manager', 'head_of_department', 'professor', 'supervisor'],
    minLevel: 50,
    category: 'education',
    sensitive: true
  },
  
  'schedule-widget': {
    name: 'برنامه هفتگی',
    icon: 'FaCalendarAlt',
    allowedRoles: ['admin', 'education_manager', 'head_of_department', 'professor', 'student', 'staff', 'supervisor'],
    minLevel: 10,
    category: 'education'
  },
  
  'attendance-tracker': {
    name: 'حضور و غیاب',
    icon: 'FaCheckCircle',
    allowedRoles: ['admin', 'education_manager', 'head_of_department', 'professor', 'supervisor'],
    minLevel: 50,
    category: 'education',
    realtime: true
  },
  
  // ویجت‌های فرهنگی و رفاهی
  'events-calendar': {
    name: 'رویدادهای فرهنگی',
    icon: 'FaCalendar',
    allowedRoles: ['admin', 'cultural_manager', 'vice_chancellor', 'professor', 'student', 'supervisor'],
    minLevel: 10,
    category: 'cultural'
  },
  
  'dormitory-status': {
    name: 'وضعیت خوابگاه',
    icon: 'FaHome',
    allowedRoles: ['admin', 'dormitory_manager', 'vice_chancellor', 'supervisor'],
    minLevel: 45,
    category: 'welfare',
    sensitive: true
  },
  
  'club-management': {
    name: 'مدیریت تشکل‌ها',
    icon: 'FaUsers',
    allowedRoles: ['admin', 'cultural_manager', 'vice_chancellor'],
    minLevel: 55,
    category: 'cultural'
  },
  
  // ویجت‌های امنیتی
  'security-logs': {
    name: 'لاگ‌های امنیتی',
    icon: 'FaShieldAlt',
    allowedRoles: ['admin', 'security_manager', 'it_manager', 'supervisor'],
    minLevel: 65,
    category: 'security',
    sensitive: true,
    auditLog: true
  },
  
  'access-reports': {
    name: 'گزارش دسترسی‌ها',
    icon: 'FaKey',
    allowedRoles: ['admin', 'security_manager', 'supervisor'],
    minLevel: 65,
    category: 'security',
    sensitive: true
  },
  
  // ویجت‌های پشتیبانی
  'tickets-system': {
    name: 'سیستم تیکت‌ها',
    icon: 'FaTicketAlt',
    allowedRoles: ['admin', 'support_agent', 'it_manager', 'professor', 'student', 'staff'],
    minLevel: 10,
    category: 'support'
  },
  
  'live-chat': {
    name: 'چت پشتیبانی',
    icon: 'FaComments',
    allowedRoles: ['admin', 'support_agent', 'it_manager', 'professor', 'student'],
    minLevel: 10,
    category: 'support',
    realtime: true
  },
  
  // ویجت‌های کتابخانه
  'library-stats': {
    name: 'آمار کتابخانه',
    icon: 'FaLibrary',
    allowedRoles: ['admin', 'librarian', 'vice_chancellor', 'professor', 'student', 'supervisor'],
    minLevel: 10,
    category: 'library',
    exportable: true
  },
  
  'borrow-management': {
    name: 'مدیریت امانت',
    icon: 'FaBookOpen',
    allowedRoles: ['admin', 'librarian'],
    minLevel: 20,
    category: 'library',
    sensitive: true
  },
  
  // ویجت‌های پژوهشی
  'research-tools': {
    name: 'ابزارهای پژوهشی',
    icon: 'FaFlask',
    allowedRoles: ['admin', 'research_assistant', 'professor', 'vice_chancellor'],
    minLevel: 15,
    category: 'research'
  },
  
  'publications': {
    name: 'مقالات و نشریات',
    icon: 'FaNewspaper',
    allowedRoles: ['admin', 'research_assistant', 'professor', 'student', 'vice_chancellor'],
    minLevel: 10,
    category: 'research'
  },
  
  // ویجت‌های عمومی
  'notifications': {
    name: 'اعلان‌ها',
    icon: 'FaBell',
    allowedRoles: ['admin', 'it_manager', 'vice_chancellor', 'education_manager', 'cultural_manager', 'professor', 'student', 'staff', 'support_agent'],
    minLevel: 1,
    category: 'general'
  },
  
  'weather-widget': {
    name: 'آب و هوا',
    icon: 'FaCloudSun',
    allowedRoles: 'all',
    minLevel: 1,
    category: 'general'
  },
  
  'news-feed': {
    name: 'اخبار دانشگاه',
    icon: 'FaRss',
    allowedRoles: 'all',
    minLevel: 1,
    category: 'general'
  }
};

// کامپوننت اصلی با کنترل دسترسی
export const RoleBasedWidgetGrid = ({ userRole, userLevel, widgets, onLayoutChange, onRemoveWidget }) => {
  const [accessibleWidgets, setAccessibleWidgets] = useState([]);
  const [widgetOrder, setWidgetOrder] = useState([]);
  
  // فیلتر ویجت‌ها بر اساس نقش و سطح دسترسی
  useEffect(() => {
    const filtered = widgets.filter(widget => {
      const permissions = WIDGET_PERMISSIONS[widget.type];
      if (!permissions) return false;
      
      // بررسی دسترسی مستقیم نقش
      if (permissions.allowedRoles === 'all') return true;
      
      // بررسی نقش در لیست مجاز
      if (Array.isArray(permissions.allowedRoles)) {
        return permissions.allowedRoles.includes(userRole);
      }
      
      // بررسی سطح دسترسی
      if (permissions.minLevel) {
        return userLevel >= permissions.minLevel;
      }
      
      return false;
    });
    
    setAccessibleWidgets(filtered);
    setWidgetOrder(filtered.map(w => w.id));
  }, [userRole, userLevel, widgets]);
  
  // لاگ کردن دسترسی‌های حساس
  const logSensitiveAccess = (widget) => {
    if (WIDGET_PERMISSIONS[widget.type]?.auditLog) {
      console.log(`[AUDIT] User ${userRole} accessed ${widget.type} at ${new Date().toISOString()}`);
      // اینجا می‌تونی به API بفرستی
    }
  };
  
  return (
    <div className="role-based-widgets">
      {/* هدر با اطلاعات نقش کاربر */}
      <div className="role-header" style={{ backgroundColor: ROLE_COLORS[userRole] }}>
        <div className="role-info">
          <span className="role-badge">
            نقش: {ROLE_NAMES[userRole]}
          </span>
          <span className="role-level">
            سطح دسترسی: {userLevel}
          </span>
        </div>
        <div className="widget-count">
          {accessibleWidgets.length} ویجت در دسترس
        </div>
      </div>
      
      {/* گرید ویجت‌ها */}
      <div className="widgets-grid">
        <Reorder.Group axis="y" values={widgetOrder} onReorder={setWidgetOrder}>
          {widgetOrder.map(id => {
            const widget = accessibleWidgets.find(w => w.id === id);
            if (!widget) return null;
            
            logSensitiveAccess(widget);
            
            return (
              <Reorder.Item key={widget.id} value={widget.id}>
                <WidgetWrapper 
                  widget={widget} 
                  userRole={userRole}
                  permissions={WIDGET_PERMISSIONS[widget.type]}
                  onRemove={() => onRemoveWidget(widget.id)}
                />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
      
      {/* بخش ویجت‌های پیشنهادی بر اساس نقش */}
      <SuggestedWidgets userRole={userRole} userLevel={userLevel} />
    </div>
  );
};

// ویجت پیشنهادی هوشمند
export const SuggestedWidgets = ({ userRole, userLevel }) => {
  const getSuggestions = () => {
    const suggestions = {
      admin: ['system-status', 'security-logs', 'financial-stats', 'user-management'],
      it_manager: ['system-status', 'api-monitor', 'security-logs', 'user-management'],
      financial_manager: ['financial-stats', 'salary-management', 'tuition-monitor'],
      education_manager: ['courses-stats', 'grades-analytics', 'attendance-tracker', 'schedule-widget'],
      professor: ['courses-stats', 'grades-analytics', 'attendance-tracker', 'tickets-system'],
      student: ['schedule-widget', 'library-stats', 'notifications', 'tuition-monitor'],
      cultural_manager: ['events-calendar', 'club-management', 'notifications'],
      security_manager: ['security-logs', 'access-reports', 'system-status'],
      support_agent: ['tickets-system', 'live-chat', 'notifications'],
      librarian: ['library-stats', 'borrow-management'],
      research_assistant: ['research-tools', 'publications']
    };
    
    return suggestions[userRole] || ['notifications', 'news-feed'];
  };
  
  return (
    <div className="suggested-widgets">
      <h4>💡 ویجت‌های پیشنهادی برای {ROLE_NAMES[userRole]}</h4>
      <div className="suggestions-list">
        {getSuggestions().map(widgetType => (
          <button key={widgetType} className="suggest-widget-btn">
            + {WIDGET_PERMISSIONS[widgetType]?.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// هوک سفارشی برای مدیریت دسترسی
export const useWidgetAccess = (userRole, userLevel) => {
  const canAccess = (widgetType, action = 'read') => {
    const permissions = WIDGET_PERMISSIONS[widgetType];
    if (!permissions) return false;
    
    // دسترسی کامل ادمین
    if (userRole === 'admin') return true;
    
    // بررسی سطح دسترسی
    if (userLevel < (permissions.minLevel || 0)) return false;
    
    // بررسی نقش
    if (permissions.allowedRoles !== 'all' && 
        !permissions.allowedRoles?.includes(userRole)) {
      return false;
    }
    
    // بررسی اکشن خاص
    if (permissions.actions && !permissions.actions.includes(action)) {
      return false;
    }
    
    return true;
  };
  
  const getAccessibleWidgets = (widgets) => {
    return widgets.filter(w => canAccess(w.type));
  };
  
  const getWidgetsByCategory = (category) => {
    return Object.entries(WIDGET_PERMISSIONS)
      .filter(([_, perms]) => perms.category === category && canAccess(_))
      .map(([type, perms]) => ({ type, ...perms }));
  };
  
  return { canAccess, getAccessibleWidgets, getWidgetsByCategory };
};