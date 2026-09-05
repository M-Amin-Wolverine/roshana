// layouts/MainLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { FaBars, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const MainLayout = ({ 
  initialSidebarOpen = true,
  initialCollapsed = false,
  initialTheme = 'dark'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed)
  const [theme, setTheme] = useState(initialTheme)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // بررسی اندازه صفحه
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
        setSidebarCollapsed(false)
      } else {
        setMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // تغییر تم
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    // ذخیره در localStorage
    localStorage.setItem('appTheme', newTheme)
    // اعمال به body
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // باز/بسته کردن سایدبار
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      if (sidebarCollapsed) {
        setSidebarCollapsed(false)
      } else {
        setSidebarOpen(!sidebarOpen)
      }
    }
  }

  // کوچک کردن سایدبار
  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // محاسبه margin محتوا
  const getContentMargin = () => {
    if (isMobile) return '0'
    if (!sidebarOpen) return sidebarCollapsed ? '80px' : '0'
    return sidebarCollapsed ? '80px' : '280px'
  }

  // استایل‌های پویا
  const bgColor = theme === 'dark' 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  
  const contentBg = theme === 'dark' 
    ? '#0f172a' 
    : '#f1f5f9'

  return (
    <div style={{
      ...containerStyle,
      background: bgColor,
    }}>
      {/* سایدبار - دسکتاپ */}
      {!isMobile && (
        <Sidebar 
          isOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onCollapse={toggleCollapse}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      )}

      {/* سایدبار - موبایل */}
      {isMobile && (
        <>
          {/* overlay */}
          {mobileMenuOpen && (
            <div 
              onClick={() => setMobileMenuOpen(false)}
              style={mobileOverlayStyle}
            />
          )}
          
          {/* پنل موبایل */}
          <div style={{
            ...mobilePanelStyle,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          }}>
            <Sidebar 
              isOpen={true}
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
              theme={theme}
              onThemeToggle={toggleTheme}
            />
          </div>
        </>
      )}

      {/* محتوای اصلی */}
      <div style={{
        ...mainContentStyle,
        marginRight: getContentMargin(),
        background: contentBg,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* هدر */}
        <Header 
          onMenuClick={toggleSidebar}
          sidebarOpen={sidebarOpen}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        {/* دکمه شناور موبایل - باز کردن منو */}
        {isMobile && !mobileMenuOpen && (
          <button 
            onClick={() => setMobileMenuOpen(true)}
            style={mobileMenuButtonStyle}
          >
            <FaBars />
          </button>
        )}

        {/* محتوای صفحه */}
        <main style={{
          ...mainStyle,
          padding: isMobile ? '1rem' : '1.5rem',
        }}>
          <Outlet />
        </main>

        {/* فوتر (اختیاری) */}
        <footer style={{
          ...footerStyle,
          borderTop: theme === 'dark' 
            ? '1px solid rgba(34, 211, 238, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <div style={footerContentStyle}>
            <span style={{
              ...footerTextStyle,
              color: theme === 'dark' ? '#6b7280' : '#9ca3af',
            }}>
              © ۱۴۰۴ - تمامی حقوق برای دانشگاه روشنا محفوظ است
            </span>
            <div style={footerLinksStyle}>
              <a href="#" style={footerLinkStyle}>درباره ما</a>
              <span style={footerDividerStyle}>•</span>
              <a href="#" style={footerLinkStyle}>تماس</a>
              <span style={footerDividerStyle}>•</span>
              <a href="#" style={footerLinkStyle}>قوانین</a>
            </div>
          </div>
        </footer>
      </div>

      {/* استایل‌های CSS */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Vazirmatn', 'Tahoma', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* اسکرول بار سفارشی */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }

        /* انیمیشن‌ها */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-content {
          animation: fadeIn 0.3s ease;
        }

        /* هایپرلینک‌ها */
        a {
          text-decoration: none;
        }

        /* فوکوس روی عناصر */
        button:focus-visible,
        input:focus-visible,
        a:focus-visible {
          outline: 2px solid #22d3ee;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

// استایل‌ها
const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  transition: 'background 0.3s ease',
}

const mainContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
}

const mainStyle = {
  flex: 1,
  overflowY: 'auto',
}

const mobileOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 40,
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

const mobileMenuButtonStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '56px',
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  border: 'none',
  borderRadius: '16px',
  color: 'white',
  fontSize: '1.25rem',
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)',
  zIndex: 35,
  transition: 'all 0.3s ease',
}

const footerStyle = {
  padding: '1.5rem',
  marginTop: 'auto',
}

const footerContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  maxWidth: '1400px',
  margin: '0 auto',
}

const footerTextStyle = {
  fontSize: '0.85rem',
}

const footerLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const footerLinkStyle = {
  fontSize: '0.85rem',
  color: '#22d3ee',
  transition: 'color 0.2s ease',
}

const footerDividerStyle = {
  color: '#4b5563',
}

// نسخه ساده (برای صفحه لاگین و...)
export const SimpleLayout = ({ children }) => {
  const [theme, setTheme] = useState('dark')
  
  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      {children}
    </div>
  )
}

// نسخه با هدر ساده
export const BlankLayout = ({ children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}

export default MainLayout