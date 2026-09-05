// components/layout/AdminLayout.jsx - لایه مدیریت پیشرفته
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import Sidebar from '../Sidebar'
import Header from '../Header'

// ==================== کامپوننت‌های کمکی ====================

// 📊 آمار کارت‌ها
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', // positive, negative, neutral
  icon, 
  color = '#22d3ee',
  loading = false,
}) => (
  <div style={statCardStyle}>
    <div style={statHeaderStyle}>
      <div style={{ ...statIconWrapperStyle, background: `${color}20` }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      {change && (
        <span style={{
          ...statChangeStyle,
          color: changeType === 'positive' ? '#10b981' : changeType === 'negative' ? '#ef4444' : '#9ca3af',
        }}>
          {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'} {change}
        </span>
      )}
    </div>
    <div style={statContentStyle}>
      <h3 style={statValueStyle}>{loading ? '...' : value}</h3>
      <p style={statTitleStyle}>{title}</p>
    </div>
    <div style={{ ...statIndicatorStyle, background: color }} />
  </div>
)

// 📈 نمودار آماری ساده
const MiniChart = ({ data = [], color = '#22d3ee' }) => {
  const max = Math.max(...data, 1)
  
  return (
    <div style={miniChartContainerStyle}>
      <div style={miniChartBarsStyle}>
        {data.map((value, index) => (
          <div
            key={index}
            style={{
              ...miniChartBarStyle,
              height: `${(value / max) * 100}%`,
              background: color,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// 👥 لیست کاربران اخیر
const RecentUsers = ({ users = [], onViewAll, onUserClick }) => {
  const getRoleBadge = (role) => {
    const roles = {
      student: { label: 'دانشجو', color: '#10b981' },
      teacher: { label: 'استاد', color: '#3b82f6' },
      admin: { label: 'مدیر', color: '#f59e0b' },
      superadmin: { label: 'مدیر ارشد', color: '#ef4444' },
    }
    return roles[role] || roles.student
  }

  return (
    <div style={recentUsersContainerStyle}>
      <div style={recentUsersHeaderStyle}>
        <h3 style={recentUsersTitleStyle}>کاربران اخیر</h3>
        <button style={viewAllButtonStyle} onClick={onViewAll}>
          مشاهده همه
        </button>
      </div>
      <div style={recentUsersListStyle}>
        {users.length === 0 ? (
          <p style={emptyTextStyle}>کاربری یافت نشد</p>
        ) : (
          users.slice(0, 5).map((user) => (
            <div 
              key={user.id} 
              style={recentUserItemStyle}
              onClick={() => onUserClick?.(user.id)}
            >
              <div style={userAvatarStyle}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={userAvatarImgStyle} />
                ) : (
                  <span style={userAvatarTextStyle}>{user.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div style={userInfoStyle}>
                <span style={userNameStyle}>{user.name}</span>
                <span style={userEmailStyle}>{user.email}</span>
              </div>
              <span style={{
                ...roleBadgeStyle,
                background: `${getRoleBadge(user.role).color}20`,
                color: getRoleBadge(user.role).color,
              }}>
                {getRoleBadge(user.role).label}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// 🔔 اعلان‌های مدیریتی
const AdminNotifications = ({ notifications = [], onMarkRead, onClear }) => {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div style={notificationsContainerStyle}>
      <div style={notificationsHeaderStyle}>
        <h3 style={notificationsTitleStyle}>
          اعلان‌ها
          {unreadCount > 0 && (
            <span style={unreadBadgeStyle}>{unreadCount}</span>
          )}
        </h3>
        {onClear && (
          <button style={clearButtonStyle} onClick={onClear}>
            پاک کردن همه
          </button>
        )}
      </div>
      <div style={notificationsListStyle}>
        {notifications.length === 0 ? (
          <p style={emptyTextStyle}>اعلانی وجود ندارد</p>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              style={{
                ...notificationItemStyle,
                background: notification.read ? 'transparent' : 'rgba(34, 211, 238, 0.05)',
                borderRight: notification.read ? 'none' : '3px solid #22d3ee',
              }}
              onClick={() => onMarkRead?.(notification.id)}
            >
              <div style={notificationIconStyle}>
                {notification.icon || '🔔'}
              </div>
              <div style={notificationContentStyle}>
                <p style={notificationTitleStyle}>{notification.title}</p>
                <p style={notificationTimeStyle}>{notification.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ⚡ اقدامات سریع
const QuickActions = ({ actions = [], onAction }) => {
  return (
    <div style={quickActionsContainerStyle}>
      <h3 style={quickActionsTitleStyle}>اقدامات سریع</h3>
      <div style={quickActionsGridStyle}>
        {actions.map((action, index) => (
          <button
            key={index}
            style={quickActionButtonStyle}
            onClick={() => onAction?.(action)}
          >
            <span style={quickActionIconStyle}>{action.icon}</span>
            <span style={quickActionLabelStyle}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// 💾 وضعیت سیستم
const SystemStatus = ({ 
  status = {
    api: 'online',
    database: 'online',
    cache: 'online',
    queue: 'online',
  }
}) => {
  const getStatusColor = (s) => {
    switch (s) {
      case 'online': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'offline': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const statusItems = [
    { key: 'api', label: 'API', ...status.api },
    { key: 'database', label: 'دیتابیس', ...status.database },
    { key: 'cache', label: 'کش', ...status.cache },
    { key: 'queue', label: 'صف', ...status.queue },
  ]

  return (
    <div style={systemStatusContainerStyle}>
      <h3 style={systemStatusTitleStyle}>وضعیت سیستم</h3>
      <div style={systemStatusGridStyle}>
        {statusItems.map((item) => (
          <div key={item.key} style={systemStatusItemStyle}>
            <div style={{
              ...statusDotStyle,
              background: getStatusColor(item.status),
              boxShadow: `0 0 8px ${getStatusColor(item.status)}`,
            }} />
            <span style={systemStatusLabelStyle}>{item.label}</span>
            <span style={{
              ...systemStatusValueStyle,
              color: getStatusColor(item.status),
            }}>
              {item.status === 'online' ? 'آنلاین' : item.status === 'warning' ? 'هشدار' : 'آفلاین'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 📅 تقویم رویدادها
const EventsCalendar = ({ events = [] }) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  const getEventsForDay = (day) => {
    return events.filter(e => e.day === day && e.month === currentMonth)
  }

  return (
    <div style={calendarContainerStyle}>
      <div style={calendarHeaderStyle}>
        <button 
          style={calendarNavButtonStyle}
          onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}
        >
          ←
        </button>
        <span style={calendarTitleStyle}>
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button 
          style={calendarNavButtonStyle}
          onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}
        >
          →
        </button>
      </div>
      <div style={calendarGridStyle}>
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, i) => (
          <div key={i} style={calendarDayHeaderStyle}>{day}</div>
        ))}
        {Array(firstDayOfMonth).fill(null).map((_, i) => (
          <div key={`empty-${i}`} style={calendarEmptyDayStyle} />
        ))}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dayEvents = getEventsForDay(day)
          const isToday = day === today.getDate() && currentMonth === today.getMonth()
          
          return (
            <div 
              key={day}
              style={{
                ...calendarDayStyle,
                background: isToday ? 'rgba(34, 211, 238, 0.2)' : 'transparent',
                border: isToday ? '1px solid #22d3ee' : '1px solid transparent',
              }}
            >
              <span style={calendarDayNumberStyle}>{day}</span>
              {dayEvents.length > 0 && (
                <div style={calendarEventDotsStyle}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span 
                      key={i} 
                      style={{
                        ...calendarEventDotStyle,
                        background: e.color || '#22d3ee',
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== سایدبار مدیریت ====================
const AdminSidebar = ({ 
  collapsed = false, 
  onToggle,
  activeItem,
  onItemClick,
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      section: 'اصلی',
      items: [
        { id: 'dashboard', icon: '📊', label: 'داشبورد', path: '/admin/dashboard' },
        { id: 'analytics', icon: '📈', label: 'آمار و تحلیل', path: '/admin/analytics' },
      ]
    },
    {
      section: 'مدیریت',
      items: [
        { id: 'users', icon: '👥', label: 'کاربران', path: '/admin/users', badge: 12 },
        { id: 'roles', icon: '🔐', label: 'نقش‌ها', path: '/admin/roles' },
        { id: 'permissions', icon: '🛡️', label: 'مجوزها', path: '/admin/permissions' },
      ]
    },
    {
      section: 'آموزش',
      items: [
        { id: 'courses', icon: '📚', label: 'دروس', path: '/admin/courses' },
        { id: 'classes', icon: '🎓', label: 'کلاس‌ها', path: '/admin/classes' },
        { id: 'exams', icon: '📝', label: 'امتحانات', path: '/admin/exams' },
        { id: 'grades', icon: '📊', label: 'نمرات', path: '/admin/grades' },
      ]
    },
    {
      section: 'مالی',
      items: [
        { id: 'transactions', icon: '💰', label: 'تراکنش‌ها', path: '/admin/transactions' },
        { id: 'invoices', icon: '🧾', label: 'فاکتورها', path: '/admin/invoices' },
        { id: 'scholarships', icon: '🎁', label: 'بورسیه‌ها', path: '/admin/scholarships' },
      ]
    },
    {
      section: 'سیستم',
      items: [
        { id: 'settings', icon: '⚙️', label: 'تنظیمات', path: '/admin/settings' },
        { id: 'logs', icon: '📝', label: 'لاگ‌ها', path: '/admin/logs' },
        { id: 'backup', icon: '💾', label: 'پشتیبان‌گیری', path: '/admin/backup' },
      ]
    },
  ]

  return (
    <aside style={{
      ...sidebarStyle,
      width: collapsed ? '80px' : '280px',
    }}>
      {/* هدر سایدبار */}
      <div style={sidebarHeaderStyle}>
        <div style={sidebarLogoStyle}>
          <span style={sidebarLogoIconStyle}>🎓</span>
          {!collapsed && <span style={sidebarLogoTextStyle}>مدیریت</span>}
        </div>
        <button style={sidebarToggleStyle} onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* منو */}
      <nav style={sidebarNavStyle}>
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} style={sidebarSectionStyle}>
            {!collapsed && (
              <span style={sidebarSectionTitleStyle}>{section.section}</span>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || activeItem === item.id
              
              return (
                <button
                  key={item.id}
                  style={{
                    ...sidebarItemStyle,
                    background: isActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                    borderRight: isActive ? '3px solid #22d3ee' : '3px solid transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '0.75rem' : '0.75rem 1rem',
                  }}
                  onClick={() => {
                    onItemClick?.(item.id)
                    navigate(item.path)
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={sidebarItemIconStyle}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={sidebarItemLabelStyle}>{item.label}</span>
                      {item.badge && (
                        <span style={sidebarItemBadgeStyle}>{item.badge}</span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* فوتر سایدبار */}
      <div style={sidebarFooterStyle}>
        <button 
          style={sidebarFooterButtonStyle}
          onClick={() => navigate('/')}
          title="بازگشت به سایت"
        >
          <span>🏠</span>
          {!collapsed && <span>بازگشت به سایت</span>}
        </button>
      </div>
    </aside>
  )
}

// ==================== هدر مدیریت ====================
const AdminHeader = ({ 
  title,
  breadcrumbs = [],
  onSearch,
  onNotificationClick,
  notificationCount = 0,
  user,
  onUserMenuClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header style={headerStyle}>
      {/* عنوان و Breadcrumb */}
      <div style={headerLeftStyle}>
        <h1 style={headerTitleStyle}>{title}</h1>
        {breadcrumbs.length > 0 && (
          <nav style={breadcrumbStyle}>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span style={breadcrumbSeparatorStyle}>/</span>}
                <span style={{
                  ...breadcrumbItemStyle,
                  color: index === breadcrumbs.length - 1 ? '#fff' : '#9ca3af',
                }}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* جستجو */}
      <form style={searchFormStyle} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="جستجو..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
        <button type="submit" style={searchButtonStyle}>🔍</button>
      </form>

      {/* آیکون‌های سمت راست */}
      <div style={headerRightStyle}>
        {/* اعلان‌ها */}
        <button 
          style={headerIconButtonStyle}
          onClick={onNotificationClick}
        >
          <span>🔔</span>
          {notificationCount > 0 && (
            <span style={notificationBadgeStyle}>{notificationCount}</span>
          )}
        </button>

        {/* پروفایل کاربر */}
        <button 
          style={userMenuButtonStyle}
          onClick={onUserMenuClick}
        >
          <div style={userMenuAvatarStyle}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={userMenuAvatarImgStyle} />
            ) : (
              <span>{user?.name?.charAt(0) || 'آ'}</span>
            )}
          </div>
          <div style={userMenuInfoStyle}>
            <span style={userMenuNameStyle}>{user?.name || 'مدیر'}</span>
            <span style={userMenuRoleStyle}>{user?.role === 'superadmin' ? 'مدیر ارشد' : 'مدیر'}</span>
          </div>
          <span style={userMenuArrowStyle}>▼</span>
        </button>
      </div>
    </header>
  )
}

// ==================== داشبورد مدیریت ====================
const AdminDashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'کاربر جدید ثبت‌نام کرد', time: '2 دقیقه پیش', read: false, icon: '👤' },
    { id: 2, title: 'پرداخت موفقیت‌آمیز', time: '15 دقیقه پیش', read: false, icon: '💰' },
    { id: 3, title: 'کلاس جدید ایجاد شد', time: '1 ساعت پیش', read: true, icon: '📚' },
    { id: 4, title: 'گزارش خطا در سیستم', time: '2 ساعت پیش', read: true, icon: '⚠️' },
  ])

  // شبیه‌سازی لود داده
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalCourses: 156,
        totalRevenue: 250000000,
      })
      setRecentUsers([
        { id: 1, name: 'علی محمدی', email: 'ali@example.com', role: 'student', avatar: null },
        { id: 2, name: 'سارا احمدی', email: 'sara@example.com', role: 'teacher', avatar: null },
        { id: 3, name: 'محمد رضایی', email: 'mohammad@example.com', role: 'student', avatar: null },
        { id: 4, name: 'مریم کریمی', email: 'maryam@example.com', role: 'admin', avatar: null },
        { id: 5, name: 'احمد حسینی', email: 'ahmad@example.com', role: 'student', avatar: null },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    { icon: '👤', label: 'افزودن کاربر', action: 'addUser' },
    { icon: '📚', label: 'افزودن درس', action: 'addCourse' },
    { icon: '📧', label: 'ارسال پیام', action: 'sendMessage' },
    { icon: '📊', label: 'گزارش‌گیری', action: 'generateReport' },
    { icon: '⚙️', label: 'تنظیمات', action: 'openSettings' },
    { icon: '💾', label: 'پشتیبان‌گیری', action: 'backup' },
  ]

  const handleQuickAction = (action) => {
    switch (action.action) {
      case 'addUser':
        navigate('/admin/users?action=add')
        break
      case 'addCourse':
        navigate('/admin/courses?action=add')
        break
      case 'sendMessage':
        navigate('/admin/messaging')
        break
      case 'generateReport':
        navigate('/admin/reports')
        break
      case 'openSettings':
        navigate('/admin/settings')
        break
      case 'backup':
        navigate('/admin/backup')
        break
      default:
        break
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div style={dashboardContainerStyle}>
      {/* آمار کارت‌ها */}
      <div style={statsGridStyle}>
        <StatCard
          title="کل کاربران"
          value={formatNumber(stats.totalUsers)}
          change="12%"
          changeType="positive"
          icon="👥"
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          title="کاربران فعال"
          value={formatNumber(stats.activeUsers)}
          change="5%"
          changeType="positive"
          icon="✅"
          color="#10b981"
          loading={loading}
        />
        <StatCard
          title="دروس فعال"
          value={formatNumber(stats.totalCourses)}
          change="3%"
          changeType="neutral"
          icon="📚"
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          title="درآمد ماهانه"
          value={formatCurrency(stats.totalRevenue)}
          change="8%"
          changeType="positive"
          icon="💰"
          color="#22d3ee"
          loading={loading}
        />
      </div>

      {/* بخش‌های اصلی */}
      <div style={dashboardGridStyle}>
        {/* کاربران اخیر */}
        <RecentUsers
          users={recentUsers}
          onViewAll={() => navigate('/admin/users')}
          onUserClick={(id) => navigate(`/admin/users/${id}`)}
        />

        {/* اقدامات سریع */}
        <QuickActions
          actions={quickActions}
          onAction={handleQuickAction}
        />

        {/* وضعیت سیستم */}
        <SystemStatus />

        {/* اعلان‌ها */}
        <AdminNotifications
          notifications={notifications}
          onMarkRead={(id) => {
            setNotifications(prev => 
              prev.map(n => n.id === id ? { ...n, read: true } : n)
            )
          }}
          onClear={() => setNotifications([])}
        />
      </div>

      {/* نمودار و تقویم */}
      <div style={bottomGridStyle}>
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>آمار ثبت‌نام</h3>
          <MiniChart 
            data={[12, 19, 15, 25, 22, 30, 28, 35, 40, 38, 45, 50]} 
            color="#22d3ee"
          />
        </div>
        <EventsCalendar events={[
          { day: 5, month: 3, title: 'امتحان', color: '#ef4444' },
          { day: 12, month: 3, title: 'کلاس', color: '#3b82f6' },
          { day: 20, month: 3, title: 'وبینار', color: '#10b981' },
        ]} />
      </div>
    </div>
  )
}

// ==================== لایه اصلی ====================
const AdminLayout = ({ 
  children,
  variant = 'default', // default, minimal, boxed
  sidebarCollapsed = false,
  onSidebarToggle,
  showDashboard = true,
}) => {
  const { user, hasRole } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(!sidebarCollapsed)
  const [activeItem, setActiveItem] = useState('dashboard')

  // بررسی نقش admin
  if (!hasRole(['admin', 'superadmin'])) {
    return <Navigate to="/forbidden" replace />
  }

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    onSidebarToggle?.(newState)
  }

  // استخراج عنوان از مسیر
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/admin/dashboard': 'داشبورد',
      '/admin/users': 'مدیریت کاربران',
      '/admin/roles': 'مدیریت نقش‌ها',
      '/admin/permissions': 'مدیریت مجوزها',
      '/admin/courses': 'مدیریت دروس',
      '/admin/classes': 'مدیریت کلاس‌ها',
      '/admin/exams': 'مدیریت امتحانات',
      '/admin/grades': 'مدیریت نمرات',
      '/admin/transactions': 'تراکنش‌ها',
      '/admin/invoices': 'فاکتورها',
      '/admin/settings': 'تنظیمات سیستم',
      '/admin/logs': 'لاگ‌های سیستم',
      '/admin/backup': 'پشتیبان‌گیری',
    }
    return titles[path] || 'پنل مدیریت'
  }

  const containerVariants = {
    default: containerStyle,
    minimal: minimalContainerStyle,
    boxed: boxedContainerStyle,
  }

  return (
    <div style={containerVariants[variant]}>
      {/* سایدبار */}
      <AdminSidebar
        collapsed={!sidebarOpen}
        onToggle={handleSidebarToggle}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />

      {/* محتوای اصلی */}
      <div style={{
        ...mainContentStyle,
        marginRight: sidebarOpen ? '280px' : '80px',
      }}>
        {/* هدر */}
        <AdminHeader
          title={getPageTitle()}
          breadcrumbs={['مدیریت', getPageTitle()]}
          user={user}
          notificationCount={3}
          onSearch={(query) => console.log('Search:', query)}
          onNotificationClick={() => console.log('Notifications clicked')}
          onUserMenuClick={() => console.log('User menu clicked')}
        />

        {/* محتوای صفحه */}
        <main style={mainStyle}>
          {showDashboard && location.pathname === '/admin' ? (
            <AdminDashboard />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

// ==================== استایل‌ها ====================

// Container Styles
const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0f172a',
}

const minimalContainerStyle = {
  ...containerStyle,
  background: '#1e293b',
}

const boxedContainerStyle = {
  ...containerStyle,
  background: '#0f172a',
}

// Sidebar Styles
const sidebarStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease',
  zIndex: 100,
  overflow: 'hidden',
}

const sidebarHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1.5rem 1rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
}

const sidebarLogoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const sidebarLogoIconStyle = {
  fontSize: '2rem',
}

const sidebarLogoTextStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: '#fff',
}

const sidebarToggleStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
}

const sidebarNavStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem 0',
}

const sidebarSectionStyle = {
  marginBottom: '1.5rem',
}

const sidebarSectionTitleStyle = {
  display: 'block',
  padding: '0.5rem 1rem',
  fontSize: '0.7rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const sidebarItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: '#9ca3af',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'right',
}

const sidebarItemIconStyle = {
  fontSize: '1.25rem',
}

const sidebarItemLabelStyle = {
  flex: 1,
  fontSize: '0.9rem',
}

const sidebarItemBadgeStyle = {
  padding: '0.125rem 0.5rem',
  background: '#ef4444',
  borderRadius: '10px',
  fontSize: '0.7rem',
  color: '#fff',
}

const sidebarFooterStyle = {
  padding: '1rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
}

const sidebarFooterButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'none',
  borderRadius: '8px',
  color: '#9ca3af',
  cursor: 'pointer',
  fontSize: '0.9rem',
}

// Header Styles
const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 2rem',
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 50,
}

const headerLeftStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const headerTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#fff',
  margin: 0,
}

const breadcrumbStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const breadcrumbSeparatorStyle = {
  color: '#6b7280',
  margin: '0 0.25rem',
}

const breadcrumbItemStyle = {
  fontSize: '0.875rem',
}

const searchFormStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  overflow: 'hidden',
}

const searchInputStyle = {
  width: '300px',
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
}

const searchButtonStyle = {
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
}

const headerRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const headerIconButtonStyle = {
  position: 'relative',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '1.25rem',
}

const notificationBadgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  minWidth: '18px',
  height: '18px',
  padding: '0 4px',
  background: '#ef4444',
  borderRadius: '9px',
  fontSize: '0.65rem',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const userMenuButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
}

const userMenuAvatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: '600',
  overflow: 'hidden',
}

const userMenuAvatarImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const userMenuInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}

const userMenuNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#fff',
}

const userMenuRoleStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
}

const userMenuArrowStyle = {
  fontSize: '0.65rem',
  color: '#9ca3af',
}

// Main Content Styles
const mainContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  transition: 'margin 0.3s ease',
}

const mainStyle = {
  flex: 1,
  padding: '1.5rem 2rem',
  overflowY: 'auto',
}

// Dashboard Styles
const dashboardContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.5rem',
}

const dashboardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '1.5rem',
}

const bottomGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.5rem',
}

// Stat Card Styles
const statCardStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'relative',
  overflow: 'hidden',
}

const statHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
}

const statIconWrapperStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const statChangeStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
}

const statContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const statValueStyle = {
  fontSize: '1.75rem',
  fontWeight: '700',
  color: '#fff',
  margin: 0,
}

const statTitleStyle = {
  fontSize: '0.875rem',
  color: '#9ca3af',
  margin: 0,
}

const statIndicatorStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '3px',
}

// Mini Chart Styles
const miniChartContainerStyle = {
  height: '100px',
  display: 'flex',
  alignItems: 'flex-end',
}

const miniChartBarsStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '4px',
  width: '100%',
  height: '100%',
}

const miniChartBarStyle = {
  flex: 1,
  borderRadius: '4px 4px 0 0',
  animation: 'grow 1s ease-out forwards',
  opacity: 0,
}

// Recent Users Styles
const recentUsersContainerStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
}

const recentUsersHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const recentUsersTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
  margin: 0,
}

const viewAllButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#22d3ee',
  cursor: 'pointer',
  fontSize: '0.875rem',
}

const recentUsersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const recentUserItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

const userAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const userAvatarImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const userAvatarTextStyle = {
  color: '#fff',
  fontWeight: '600',
  fontSize: '1rem',
}

const userInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}

const userNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '500',
  color: '#fff',
}

const userEmailStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
}

const roleBadgeStyle = {
  padding: '0.25rem 0.5rem',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: '600',
}

// Notifications Styles
const notificationsContainerStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 255)',
}
// ادامه استایل‌های Notifications
const notificationsHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const notificationsTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const unreadBadgeStyle = {
  minWidth: '20px',
  height: '20px',
  padding: '0 6px',
  background: '#ef4444',
  borderRadius: '10px',
  fontSize: '0.7rem',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const clearButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  fontSize: '0.8rem',
}

const notificationsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const notificationItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

const notificationIconStyle = {
  fontSize: '1.25rem',
}

const notificationContentStyle = {
  flex: 1,
}

const notificationTitleStyle = {
  fontSize: '0.875rem',
  color: '#fff',
  margin: 0,
}

const notificationTimeStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  margin: 0,
}

// Quick Actions Styles
const quickActionsContainerStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
}

const quickActionsTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
  margin: '0 0 1rem 0',
}

const quickActionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.75rem',
}

const quickActionButtonStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '1rem 0.5rem',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const quickActionIconStyle = {
  fontSize: '1.5rem',
}

const quickActionLabelStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  textAlign: 'center',
}

// System Status Styles
const systemStatusContainerStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
}

const systemStatusTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
  margin: '0 0 1rem 0',
}

const systemStatusGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const systemStatusItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const statusDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
}

const systemStatusLabelStyle = {
  flex: 1,
  fontSize: '0.875rem',
  color: '#9ca3af',
}

const systemStatusValueStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
}

// Calendar Styles
const calendarContainerStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
}

const calendarHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const calendarNavButtonStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
}

const calendarTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
}

const calendarGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '4px',
}

const calendarDayHeaderStyle = {
  padding: '0.5rem',
  textAlign: 'center',
  fontSize: '0.75rem',
  color: '#6b7280',
  fontWeight: '600',
}

const calendarEmptyDayStyle = {
  padding: '0.5rem',
}

const calendarDayStyle = {
  padding: '0.5rem',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
}

const calendarDayNumberStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const calendarEventDotsStyle = {
  display: 'flex',
  gap: '2px',
}

const calendarEventDotStyle = {
  width: '4px',
  height: '4px',
  borderRadius: '50%',
}

// Chart Card Styles
const chartCardStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid rgba(255, 255, 255, 0.05)',
}

const chartTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#fff',
  margin: '0 0 1rem 0',
}

// Empty State
const emptyTextStyle = {
  textAlign: 'center',
  color: '#6b7280',
  fontSize: '0.875rem',
  padding: '1rem',
}

// Global Styles
const globalStyles = `
  @keyframes grow {
    from { height: 0; opacity: 0; }
    to { height: var(--height); opacity: 1; }
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

// ==================== هوک برای مدیریت سایدبار ====================
export const useAdminSidebar = (initialState = false) => {
  const [collapsed, setCollapsed] = useState(initialState)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  const collapse = useCallback(() => {
    setCollapsed(true)
  }, [])

  const expand = useCallback(() => {
    setCollapsed(false)
  }, [])

  return {
    collapsed,
    mobileOpen,
    toggle,
    toggleMobile,
    collapse,
    expand,
    setCollapsed,
    setMobileOpen,
  }
}

// ==================== کامپوننت‌های صادراتی ====================
export { 
  AdminLayout,
  AdminSidebar,
  AdminHeader,
  AdminDashboard,
  StatCard,
  MiniChart,
  RecentUsers,
  AdminNotifications,
  QuickActions,
  SystemStatus,
  EventsCalendar,
}

export default AdminLayout