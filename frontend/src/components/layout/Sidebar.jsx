// components/Sidebar.jsx
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FaHome, FaChalkboardTeacher, FaVideo, FaComments, 
  FaGamepad, FaCogs, FaUtensils, FaBus, FaHome as FaDorm,
  FaWallet, FaUserShield, FaSignOutAlt, FaChevronLeft,
  FaChevronRight, FaBell, FaSearch, FaUser, FaCog,
  FaBook, FaCalendarAlt, FaCertificate, FaClipboardList,
  FaMoneyBillWave, FaBuilding, FaLaptop, FaMoon, FaSun
} from 'react-icons/fa'

// دسته‌بندی منوها
const menuCategories = [
  {
    title: 'آموزش',
    items: [
      { path: '/dashboard', label: 'داشبورد', icon: FaHome, badge: null },
      { path: '/classroom', label: 'کلاس آنلاین', icon: FaChalkboardTeacher, badge: '3' },
      { path: '/live', label: 'پخش زنده', icon: FaVideo, badge: 'LIVE' },
      { path: '/library', label: 'کتابخانه', icon: FaBook, badge: null },
      { path: '/calendar', label: 'تقویم', icon: FaCalendarAlt, badge: null },
    ]
  },
  {
    title: 'ارتباطات',
    items: [
      { path: '/messaging', label: 'پیام‌رسان', icon: FaComments, badge: '5' },
      { path: '/forum', label: 'فروم', icon: FaGamepad, badge: null },
    ]
  },
  {
    title: 'خدمات',
    items: [
      { path: '/automation', label: 'اتوماسیون', icon: FaCogs, badge: null },
      { path: '/food', label: 'تغذیه', icon: FaUtensils, badge: null },
      { path: '/transport', label: 'حمل‌ونقل', icon: FaBus, badge: null },
      { path: '/dormitory', label: 'خوابگاه', icon: FaDorm, badge: null },
    ]
  },
  {
    title: 'مالی',
    items: [
      { path: '/wallet', label: 'کیف‌پول', icon: FaWallet, badge: null },
      { path: '/financial', label: 'امور مالی', icon: FaMoneyBillWave, badge: null },
    ]
  },
  {
    title: 'مدیریت',
    items: [
      { path: '/admin', label: 'پنل مدیریت', icon: FaUserShield, badge: null },
      { path: '/reports', label: 'گزارشات', icon: FaClipboardList, badge: null },
    ]
  }
]

// اطلاعات کاربر نمونه
const userInfo = {
  name: 'علی محمدی',
  role: 'دانشجو',
  avatar: null,
  studentId: '۱۴۰۱۰۲۳۴۵۶',
  notifications: 8
}

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  collapsed = false,
  theme = 'dark',
  onThemeToggle = null
}) => {
  const [expandedSections, setExpandedSections] = useState(
    menuCategories.map(() => true) // همه باز
  )
  const [hoveredItem, setHoveredItem] = useState(null)
  const location = useLocation()

  const toggleSection = (index) => {
    setExpandedSections(prev => {
      const newState = [...prev]
      newState[index] = !newState[index]
      return newState
    })
  }

  // بررسی اینکه آیا مسیر فعال زیرمجموعه دارد
  const hasActiveChild = (items) => {
    return items.some(item => location.pathname === item.path)
  }

  const sidebarWidth = collapsed ? '80px' : isOpen ? '280px' : '0px'

  return (
    <aside style={{
      ...sidebarStyle,
      width: sidebarWidth,
      background: theme === 'dark' 
        ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    }}>
      {/* هدر سایدبار */}
      <div style={headerStyle}>
        {!collapsed && (
          <div style={logoContainerStyle}>
            <div style={logoIconStyle}>
              <FaBuilding style={{ fontSize: '1.5rem', color: '#22d3ee' }} />
            </div>
            <div style={logoTextStyle}>
              <span style={logoTitleStyle}>دانشگاه روشنا</span>
              <span style={logoSubtitleStyle}>سامانه هوشمند</span>
            </div>
          </div>
        )}
        
        {/* دکمه collapse */}
        <button 
          onClick={onToggle}
          style={collapseButtonStyle}
          aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* جستجو */}
      {!collapsed && (
        <div style={searchContainerStyle}>
          <FaSearch style={searchIconStyle} />
          <input 
            type="text" 
            placeholder="جستجو..."
            style={searchInputStyle}
          />
        </div>
      )}

      {/* پروفایل کاربر */}
      {!collapsed && (
        <div style={profileContainerStyle}>
          <div style={profileAvatarStyle}>
            <FaUser style={{ fontSize: '1.5rem', color: '#22d3ee' }} />
          </div>
          <div style={profileInfoStyle}>
            <span style={profileNameStyle}>{userInfo.name}</span>
            <span style={profileRoleStyle}>{userInfo.role} • {userInfo.studentId}</span>
          </div>
          <button style={profileActionStyle}>
            <FaCog style={{ fontSize: '0.9rem' }} />
          </button>
        </div>
      )}

      {/* منوها */}
      <nav style={navStyle}>
        {menuCategories.map((category, catIndex) => (
          <div key={catIndex} style={categoryContainerStyle}>
            {/* عنوان دسته‌بندی */}
            {!collapsed && (
              <button 
                onClick={() => toggleSection(catIndex)}
                style={categoryHeaderStyle}
              >
                <span style={categoryTitleStyle}>{category.title}</span>
                <FaChevronLeft style={{
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  transform: expandedSections[catIndex] ? 'rotate(90deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease',
                }} />
              </button>
            )}
            
            {/* آیتم‌های منو */}
            <div style={{
              ...itemsContainerStyle,
              maxHeight: expandedSections[catIndex] || collapsed ? '500px' : '0',
              opacity: expandedSections[catIndex] || collapsed ? 1 : 0,
              padding: expandedSections[catIndex] || collapsed ? '0.5rem' : '0 0.5rem',
            }}>
              {category.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                const isHovered = hoveredItem === item.path
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      ...menuItemStyle,
                      background: isActive 
                        ? 'linear-gradient(90deg, rgba(34, 211, 238, 0.2), transparent)'
                        : isHovered 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                      borderRight: isActive 
                        ? '3px solid #22d3ee' 
                        : '3px solid transparent',
                      padding: collapsed ? '0.875rem' : '0.75rem 1rem',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                  >
                    {/* آیکون */}
                    <div style={{
                      ...iconContainerStyle,
                      background: isActive || isHovered 
                        ? 'rgba(34, 211, 238, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#22d3ee' : '#9ca3af',
                    }}>
                      <Icon style={{ fontSize: '1rem' }} />
                    </div>
                    
                    {/* لیبل (در حالت باز) */}
                    {!collapsed && (
                      <>
                        <span style={{
                          ...menuLabelStyle,
                          color: isActive ? 'white' : '#d1d5db',
                          fontWeight: isActive ? '600' : '400',
                        }}>
                          {item.label}
                        </span>
                        
                        {/* نشان (badge) */}
                        {item.badge && (
                          <span style={{
                            ...badgeStyle,
                            background: item.badge === 'LIVE' 
                              ? '#ef4444' 
                              : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                            color: 'white',
                            fontSize: item.badge === 'LIVE' ? '0.6rem' : '0.7rem',
                            animation: item.badge === 'LIVE' ? 'pulse 2s infinite' : 'none',
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* افکت خط در هاور */}
                    {isHovered && !isActive && (
                      <div style={hoverLineStyle} />
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* بخش پایینی - تم و خروج */}
      <div style={bottomSectionStyle}>
        {/* تغییر تم */}
        {onThemeToggle && !collapsed && (
          <button 
            onClick={onThemeToggle}
            style={themeToggleStyle}
          >
            <div style={{
              ...themeIconStyle,
              background: theme === 'dark' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(251, 191, 36, 0.2)',
            }}>
              {theme === 'dark' 
                ? <FaMoon style={{ color: '#a855f7' }} />
                : <FaSun style={{ color: '#fbbf24' }} />
              }
            </div>
            <span style={themeLabelStyle}>
              {theme === 'dark' ? 'تم تیره' : 'تم روشن'}
            </span>
          </button>
        )}

        {/* دکمه خروج */}
        <button style={logoutButtonStyle}>
          <FaSignOutAlt style={{ fontSize: '1rem' }} />
          {!collapsed && <span style={logoutTextStyle}>خروج از حساب</span>}
        </button>
      </div>

      {/* استایل‌های CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .menu-item {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>
    </aside>
  )
}

// استایل‌ها
const sidebarStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  zIndex: 50,
  borderRight: '1px solid rgba(34, 211, 238, 0.15)',
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const logoIconStyle = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(34, 211, 238, 0.1)',
  borderRadius: '10px',
  border: '1px solid rgba(34, 211, 238, 0.3)',
}

const logoTextStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const logoTitleStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: 'white',
}

const logoSubtitleStyle = {
  fontSize: '0.7rem',
  color: '#6b7280',
}

const collapseButtonStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: '8px',
  color: '#9ca3af',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
}

const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  margin: '1rem',
  padding: '0.5rem 0.75rem',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}

const searchIconStyle = {
  color: '#6b7280',
  fontSize: '0.9rem',
  marginLeft: '0.5rem',
}

const searchInputStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'white',
  fontSize: '0.85rem',
}

const profileContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  margin: '0 1rem 1rem',
  padding: '0.75rem',
  background: 'rgba(34, 211, 238, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
}

const profileAvatarStyle = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(34, 211, 238, 0.2)',
  borderRadius: '10px',
}

const profileInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}

const profileNameStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'white',
}

const profileRoleStyle = {
  fontSize: '0.7rem',
  color: '#6b7280',
}

const profileActionStyle = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  padding: '0.25rem',
}

const navStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '0.5rem',
}

const categoryContainerStyle = {
  marginBottom: '0.5rem',
}

const categoryHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

const categoryTitleStyle = {
  fontSize: '0.7rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const itemsContainerStyle = {
  overflow: 'hidden',
  transition: 'all 0.3s ease',
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.25rem',
  borderRadius: '10px',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
}

const iconContainerStyle = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
  transition: 'all 0.3s ease',
  flexShrink: 0,
}

const menuLabelStyle = {
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
}

const badgeStyle = {
  marginRight: 'auto',
  padding: '2px 8px',
  borderRadius: '10px',
  fontWeight: '600',
}

const hoverLineStyle = {
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '3px',
  height: '60%',
  background: 'linear-gradient(180deg, #22d3ee, #06b6d4)',
  borderRadius: '2px',
}

const bottomSectionStyle = {
  padding: '1rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}

const themeToggleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  cursor: 'pointer',
  marginBottom: '0.75rem',
}

const themeIconStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
}

const themeLabelStyle = {
  fontSize: '0.85rem',
  color: '#d1d5db',
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
  cursor: 'pointer',
  transition: 'all 0.3s ease',
}

const logoutTextStyle = {
  fontSize: '0.9rem',
  fontWeight: '500',
}

// نسخه موبایل
export const MobileSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={mobileOverlayStyle}
        />
      )}
      
      {/* پنل موبایل */}
      <div style={{
        ...mobilePanelStyle,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}>
        <Sidebar isOpen={true} onToggle={onClose} />
      </div>
    </>
  )
}

const mobileOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 40,
  backdropFilter: 'blur(4px)',
}

const mobilePanelStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '280px',
  zIndex: 50,
  transition: 'transform 0.3s ease',
}

export default Sidebar