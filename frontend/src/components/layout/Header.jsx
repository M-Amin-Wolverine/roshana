// components/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FaBars, FaSearch, FaBell, FaUser, FaCog, FaSignOutAlt,
  FaMoon, FaSun, FaChevronDown, FaEnvelope, FaQuestionCircle,
  FaGraduationCap, FaHome, FaCalendarAlt, FaClipboardList,
  FaTrashAlt, FaCheck, FaExclamationCircle
} from 'react-icons/fa'

// اعلان‌های نمونه
const notifications = [
  { id: 1, type: 'info', title: 'کلاس جدید اضافه شد', message: 'درس برنامه‌نویسی پیشرفته - شنبه‌ها', time: '۵ دقیقه پیش', read: false },
  { id: 2, type: 'success', title: 'نمره اعلام شد', message: 'نمره امتحان پایان ترم: ۱۸.۵', time: '۱ ساعت پیش', read: false },
  { id: 3, type: 'warning', title: 'یادآوری', message: 'ثبت‌نام ترم بعدی تا ۱۰ روز دیگر', time: '۲ ساعت پیش', read: true },
  { id: 4, type: 'info', title: 'پیام جدید', message: 'پیامی از استاد رضایی دارید', time: 'دیروز', read: true },
]

const Header = ({ 
  onMenuClick, 
  sidebarOpen = true,
  theme = 'dark',
  onThemeToggle = null,
  title = '🏛️ دانشگاه روشنا'
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notificationsList, setNotificationsList] = useState(notifications)
  
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notificationsList.filter(n => !n.read).length

  // بستن منوها با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const markAllAsRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheck style={{ color: '#10b981' }} />
      case 'warning': return <FaExclamationCircle style={{ color: '#f59e0b' }} />
      case 'error': return <FaExclamationCircle style={{ color: '#ef4444' }} />
      default: return <FaEnvelope style={{ color: '#22d3ee' }} />
    }
  }

  // استایل‌های پویا بر اساس تم
  const isDark = theme === 'dark'
  const bgColor = isDark ? 'linear-gradient(90deg, #0f172a, #1e293b)' : 'linear-gradient(90deg, #ffffff, #f8fafc)'
  const borderColor = isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? '#e5e7eb' : '#1f2937'
  const secondaryText = isDark ? '#9ca3af' : '#6b7280'

  return (
    <header style={{
      ...headerStyle,
      background: bgColor,
      borderBottom: `1px solid ${borderColor}`,
    }}>
      {/* سمت چپ - منو و عنوان */}
      <div style={leftSectionStyle}>
        <button 
          onClick={onMenuClick}
          style={{
            ...menuButtonStyle,
            color: isDark ? '#22d3ee' : '#2563eb',
          }}
          aria-label="باز کردن منو"
        >
          <FaBars />
        </button>
        
        <h2 style={{
          ...titleStyle,
          color: isDark ? '#22d3ee' : '#2563eb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {title}
        </h2>
      </div>

      {/* بخش مرکزی - جستجو */}
      <div style={centerSectionStyle}>
        <div style={{
          ...searchContainerStyle,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${borderColor}`,
        }}>
          <FaSearch style={{ color: secondaryText, fontSize: '0.9rem' }} />
          <input
            type="text"
            placeholder="جستجو در سایت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...searchInputStyle,
              color: textColor,
            }}
          />
          <kbd style={keyboardShortcutStyle}>⌘K</kbd>
        </div>
      </div>

      {/* سمت راست - آیکون‌ها و پروفایل */}
      <div style={rightSectionStyle}>
        {/* تغییر تم */}
        {onThemeToggle && (
          <button 
            onClick={onThemeToggle}
            style={iconButtonStyle}
            aria-label="تغییر تم"
          >
            {isDark ? <FaSun style={{ color: '#fbbf24' }} /> : <FaMoon style={{ color: '#a855f7' }} />}
          </button>
        )}

        {/* اعلان‌ها */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              ...iconButtonStyle,
              position: 'relative',
            }}
            aria-label="اعلان‌ها"
          >
            <FaBell style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
            {unreadCount > 0 && (
              <span style={notificationBadgeStyle}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* پنل اعلان‌ها */}
          {showNotifications && (
            <div style={{
              ...dropdownStyle,
              width: '360px',
              maxHeight: '450px',
            }}>
              <div style={dropdownHeaderStyle}>
                <span style={dropdownTitleStyle}>اعلان‌ها</span>
                <button 
                  onClick={markAllAsRead}
                  style={markAllReadStyle}
                >
                  همه را خواندم
                </button>
              </div>
              
              <div style={notificationsListStyle}>
                {notificationsList.length === 0 ? (
                  <div style={emptyStateStyle}>
                    <FaBell style={{ fontSize: '2rem', color: '#4b5563' }} />
                    <p>اعلانی وجود ندارد</p>
                  </div>
                ) : (
                  notificationsList.map(notification => (
                    <div 
                      key={notification.id}
                      style={{
                        ...notificationItemStyle,
                        background: notification.read 
                          ? 'transparent' 
                          : isDark ? 'rgba(34, 211, 238, 0.08)' : 'rgba(37, 99, 235, 0.05)',
                        borderRight: notification.read 
                          ? '3px solid transparent' 
                          : '3px solid #22d3ee',
                      }}
                    >
                      <div style={notificationIconStyle}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={notificationContentStyle}>
                        <span style={notificationTitleStyle}>{notification.title}</span>
                        <span style={notificationMessageStyle}>{notification.message}</span>
                        <span style={notificationTimeStyle}>{notification.time}</span>
                      </div>
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        style={deleteButtonStyle}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div style={dropdownFooterStyle}>
                <button style={viewAllButtonStyle}>
                  مشاهده همه اعلان‌ها
                </button>
              </div>
            </div>
          )}
        </div>

        {/* پروفایل کاربر */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            style={profileButtonStyle}
          >
            <div style={{
              ...profileAvatarStyle,
              background: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(37, 99, 235, 0.1)',
            }}>
              <FaUser style={{ color: '#22d3ee', fontSize: '0.9rem' }} />
            </div>
            <div style={profileInfoStyle}>
              <span style={{
                ...profileNameStyle,
                color: textColor,
              }}>
                {user?.name || 'کاربر'}
              </span>
              <FaChevronDown style={{ 
                fontSize: '0.7rem', 
                color: secondaryText,
                transform: showProfile ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease'
              }} />
            </div>
          </button>

          {/* پنل پروفایل */}
          {showProfile && (
            <div style={profileDropdownStyle}>
              <div style={profileHeaderStyle}>
                <div style={profileLargeAvatarStyle}>
                  <FaUser style={{ fontSize: '2rem', color: '#22d3ee' }} />
                </div>
                <div style={profileDetailsStyle}>
                  <span style={profileFullNameStyle}>{user?.name || 'کاربر'}</span>
                  <span style={profileEmailStyle}>{user?.email || 'user@university.edu'}</span>
                  <span style={profileRoleStyle}>دانشجو • {user?.studentId || '۱۴۰۱۰۲۳۴۵۶'}</span>
                </div>
              </div>

              <div style={profileMenuStyle}>
                <button style={profileMenuItemStyle}>
                  <FaHome style={{ color: '#22d3ee' }} />
                  <span>پروفایل</span>
                </button>
                <button style={profileMenuItemStyle}>
                  <FaGraduationCap style={{ color: '#a855f7' }} />
                  <span>سوابق تحصیلی</span>
                </button>
                <button style={profileMenuItemStyle}>
                  <FaCalendarAlt style={{ color: '#10b981' }} />
                  <span>برنامه هفتگی</span>
                </button>
                <button style={profileMenuItemStyle}>
                  <FaClipboardList style={{ color: '#f59e0b' }} />
                  <span>ترم‌های گذشته</span>
                </button>
                <button style={profileMenuItemStyle}>
                  <FaCog style={{ color: '#6b7280' }} />
                  <span>تنظیمات</span>
                </button>
              </div>

              <div style={profileFooterStyle}>
                <button 
                  onClick={handleLogout}
                  style={logoutButtonStyle}
                >
                  <FaSignOutAlt />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* استایل‌های CSS */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .notification-badge {
          animation: pulse 2s infinite;
        }
      `}</style>
    </header>
  )
}

// استایل‌ها
const headerStyle = {
  height: '70px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1.5rem',
  position: 'sticky',
  top: 0,
  zIndex: 30,
  backdropFilter: 'blur(12px)',
}

const leftSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const menuButtonStyle = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '1.25rem',
  transition: 'all 0.2s ease',
}

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  margin: 0,
}

const centerSectionStyle = {
  flex: 1,
  maxWidth: '500px',
  margin: '0 2rem',
}

const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 1rem',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
}

const searchInputStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '0.9rem',
  direction: 'rtl',
}

const keyboardShortcutStyle = {
  padding: '2px 8px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  fontSize: '0.7rem',
  color: '#6b7280',
}

const rightSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const iconButtonStyle = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const notificationBadgeStyle = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  minWidth: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  borderRadius: '9px',
  fontSize: '0.65rem',
  fontWeight: '600',
  color: 'white',
}

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '0.75rem',
  background: 'rgba(15, 23, 42, 0.98)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  animation: 'slideDown 0.2s ease',
  zIndex: 100,
}

const dropdownHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}

const dropdownTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white',
}

const markAllReadStyle = {
  background: 'transparent',
  border: 'none',
  color: '#22d3ee',
  fontSize: '0.8rem',
  cursor: 'pointer',
}

const notificationsListStyle = {
  maxHeight: '300px',
  overflowY: 'auto',
}

const notificationItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.875rem 1rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s ease',
}

const notificationIconStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  flexShrink: 0,
}

const notificationContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const notificationTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'white',
}

const notificationMessageStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const notificationTimeStyle = {
  fontSize: '0.7rem',
  color: '#6b7280',
}

const deleteButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  padding: '0.25rem',
  opacity: 0,
  transition: 'all 0.2s ease',
}

const dropdownFooterStyle = {
  padding: '0.75rem 1rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  textAlign: 'center',
}

const viewAllButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#22d3ee',
  fontSize: '0.85rem',
  cursor: 'pointer',
}

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  color: '#6b7280',
}

const profileButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.375rem 0.75rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const profileAvatarStyle = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
}

const profileInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const profileNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '500',
}

const profileDropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '0.75rem',
  width: '300px',
  background: 'rgba(15, 23, 42, 0.98)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  animation: 'slideDown 0.2s ease',
  zIndex: 100,
}

const profileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.25rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), transparent)',
}

const profileLargeAvatarStyle = {
  width: '56px',
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(34, 211, 238, 0.2)',
  borderRadius: '14px',
}

const profileDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
}

const profileFullNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white',
}

const profileEmailStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const profileRoleStyle = {
  fontSize: '0.75rem',
  color: '#22d3ee',
}

const profileMenuStyle = {
  padding: '0.5rem',
}

const profileMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '0.75rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '10px',
  color: '#d1d5db',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const profileFooterStyle = {
  padding: '0.75rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}

const logoutButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '10px',
  color: '#ef4444',
  fontSize: '0.9rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

export default Header