// components/NewsSection.jsx
import { useState, useEffect } from 'react'
import { FaBell, FaCalendarAlt, FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa'

// داده‌های نمونه
const initialNewsItems = [
  { 
    id: 1,
    date: '۱۴۰۴/۱۲/۰۹', 
    text: 'شهادت رهبر مجاهد و شروع جنگ رمضان',
    category: 'سیاسی',
    important: true,
    read: false
  },
  { 
    id: 2,
    date: '۱۴۰۵/۰۱/۱۵', 
    text: 'ترم بهار آغاز شد - جوانان انقلابی روایت را به دست می‌گیرند',
    category: 'دانشگاه',
    important: false,
    read: false
  },
  { 
    id: 3,
    date: '۱۴۰۵/۰۱/۱۲', 
    text: 'امتحانات پایان ترم از ۲۰ تیر',
    category: 'آموزشی',
    important: true,
    read: true
  },
  { 
    id: 4,
    date: '۱۴۰۵/۰۱/۱۰', 
    text: 'وبینار تخصصی رسانه و فضای مجازی',
    category: 'فرهنگی',
    important: false,
    read: true
  },
  { 
    id: 5,
    date: '۱۴۰۵/۰۱/۰۸', 
    text: 'ثبت‌نام کنگره شهدای دانشجو آغاز شد',
    category: 'دانشگاه',
    important: false,
    read: false
  },
]

const categories = ['همه', 'سیاسی', 'دانشگاه', 'آموزشی', 'فرهنگی', 'ورزشی']

const NewsSection = () => {
  const [newsItems, setNewsItems] = useState(initialNewsItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('همه')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const itemsPerPage = 4

  // فیلتر کردن اخبار
  const filteredNews = newsItems.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'همه' || item.category === activeCategory
    const matchesRead = !showUnreadOnly || !item.read
    return matchesSearch && matchesCategory && matchesRead
  })

  // صفحه‌بندی
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage)
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // علامت‌گذاری به عنوان خوانده شده
  const markAsRead = (id) => {
    setNewsItems(prev => prev.map(item => 
      item.id === id ? { ...item, read: true } : item
    ))
  }

  // دریافت آیکون دسته‌بندی
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'سیاسی': return <FaExclamationCircle className="text-red-400" />
      case 'دانشگاه': return <FaCheckCircle className="text-cyan-400" />
      case 'آموزشی': return <FaInfoCircle className="text-yellow-400" />
      default: return <FaBell className="text-gray-400" />
    }
  }

  // رنگ دسته‌بندی
  const getCategoryColor = (category) => {
    const colors = {
      'سیاسی': 'bg-red-500/20 text-red-400 border-red-500/30',
      'دانشگاه': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'آموزشی': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'فرهنگی': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'ورزشی': 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const unreadCount = newsItems.filter(item => !item.read).length

  return (
    <div style={newsSectionStyle}>
      {/* هدر */}
      <div style={headerStyle}>
        <div style={titleContainerStyle}>
          <FaBell style={{ color: '#22d3ee' }} />
          <h3 style={newsTitleStyle}>📢 آخرین اخبار و اطلاعیه‌ها</h3>
          {unreadCount > 0 && (
            <span style={badgeStyle}>{unreadCount} جدید</span>
          )}
        </div>
      </div>

      {/* جستجو و فیلتر */}
      <div style={filterContainerStyle}>
        <div style={searchContainerStyle}>
          <FaSearch style={{ color: '#6b7280', fontSize: '0.875rem' }} />
          <input
            type="text"
            placeholder="جستجو در اخبار..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            style={searchInputStyle}
          />
        </div>
        
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          style={{
            ...filterButtonStyle,
            background: showUnreadOnly ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.05)',
            color: showUnreadOnly ? '#22d3ee' : '#9ca3af',
            border: showUnreadOnly ? '1px solid #22d3ee' : '1px solid transparent'
          }}
        >
          <FaFilter style={{ fontSize: '0.75rem' }} />
          خوانده نشده
        </button>
      </div>

      {/* دسته‌بندی‌ها */}
      <div style={categoriesContainerStyle}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat)
              setCurrentPage(1)
            }}
            style={{
              ...categoryButtonStyle,
              background: activeCategory === cat 
                ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' 
                : 'rgba(255,255,255,0.05)',
              color: activeCategory === cat ? 'white' : '#9ca3af',
              transform: activeCategory === cat ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* لیست اخبار */}
      <div style={newsListStyle}>
        {paginatedNews.length === 0 ? (
          <div style={emptyStateStyle}>
            <FaBell style={{ fontSize: '2rem', color: '#4b5563', marginBottom: '0.5rem' }} />
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>خبری یافت نشد</p>
          </div>
        ) : (
          paginatedNews.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => {
                setExpandedId(expandedId === item.id ? null : item.id)
                if (!item.read) markAsRead(item.id)
              }}
              style={{
                ...newsItemStyle,
                background: item.important 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
                  : expandedId === item.id 
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255, 255, 255, 0.05)',
                borderRight: item.important ? '3px solid #ef4444' : '3px solid transparent',
                animationDelay: `${index * 0.1}s`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              className="news-item"
            >
              {/* نشانگر خوانده نشده */}
              {!item.read && <div style={unreadDotStyle} />}
              
              <div style={newsContentStyle}>
                <div style={newsHeaderStyle}>
                  <span style={newsDateStyle}>
                    <FaCalendarAlt style={{ marginLeft: '4px', fontSize: '0.7rem' }} />
                    {item.date}
                  </span>
                  <span style={{
                    ...categoryBadgeStyle,
                    background: getCategoryColor(item.category).split(' ')[0],
                    color: getCategoryColor(item.category).split(' ')[1],
                    border: getCategoryColor(item.category).split(' ')[2],
                  }}>
                    {getCategoryIcon(item.category)}
                    <span style={{ marginRight: '4px' }}>{item.category}</span>
                  </span>
                </div>
                
                <p style={{
                  ...newsTextStyle,
                  color: item.read ? '#9ca3af' : 'white',
                  fontWeight: item.important ? '600' : '400',
                }}>
                  {item.text}
                </p>
                
                {expandedId === item.id && (
                  <div style={expandedContentStyle}>
                    <p style={expandedTextStyle}>
                      برای مشاهده جزئیات کامل این خبر، روی عنوان کلیک کنید یا به صفحه اصلی اخبار مراجعه نمایید.
                    </p>
                    <button style={readMoreButtonStyle}>
                      ادامه مطلب
                      <FaChevronLeft style={{ marginRight: '4px', fontSize: '0.7rem' }} />
                    </button>
                  </div>
                )}
              </div>
              
              {item.important && (
                <span style={importantBadgeStyle}>مهم</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              ...pageButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <FaChevronRight />
          </button>
          
          <div style={pageNumbersStyle}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  ...pageNumberStyle,
                  background: currentPage === page 
                    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' 
                    : 'transparent',
                  color: currentPage === page ? 'white' : '#9ca3af',
                }}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...pageButtonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <FaChevronLeft />
          </button>
        </div>
      )}

      {/* استایل‌های CSS اضافی */}
      <style>{`
        .news-item:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.08) !important;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .news-item {
          animation: slideIn 0.3s ease forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

// استایل‌ها
const newsSectionStyle = {
  marginTop: '3px',
  padding: '1.25rem',
  background: 'rgba(15, 23, 42, 0.8)',
  borderRadius: '16px',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const titleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const newsTitleStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: 'white',
  margin: 0,
}

const badgeStyle = {
  background: 'linear-gradient(135deg, #ef4444, #f97316)',
  color: 'white',
  fontSize: '0.7rem',
  padding: '2px 8px',
  borderRadius: '12px',
  fontWeight: '600',
}

const filterContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '0.75rem',
}

const searchContainerStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '8px',
  padding: '0.5rem 0.75rem',
  border: '1px solid rgba(255,255,255,0.1)',
}

const searchInputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'white',
  fontSize: '0.8rem',
  width: '100%',
  direction: 'rtl',
}

const filterButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const categoriesContainerStyle = {
  display: 'flex',
  gap: '0.375rem',
  marginBottom: '1rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
}

const categoryButtonStyle = {
  padding: '0.375rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.7rem',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
}

const newsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  maxHeight: '400px',
  overflowY: 'auto',
}

const newsItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.875rem',
  borderRadius: '12px',
  position: 'relative',
}

const unreadDotStyle = {
  position: 'absolute',
  top: '50%',
  right: '4px',
  transform: 'translateY(-50%)',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#22d3ee',
  boxShadow: '0 0 8px #22d3ee',
}

const newsContentStyle = {
  flex: 1,
  minWidth: 0,
}

const newsHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.375rem',
}

const newsDateStyle = {
  fontSize: '0.7rem',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
}

const categoryBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.65rem',
  padding: '2px 8px',
  borderRadius: '12px',
  border: '1px solid',
}

const newsTextStyle = {
  fontSize: '0.8rem',
  margin: 0,
  lineHeight: '1.5',
}

const expandedContentStyle = {
  marginTop: '0.75rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

const expandedTextStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  margin: '0 0 0.5rem 0',
  lineHeight: '1.6',
}

const readMoreButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(34, 211, 238, 0.2)',
  color: '#22d3ee',
  border: 'none',
  padding: '0.375rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.7rem',
  cursor: 'pointer',
}

const importantBadgeStyle = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  background: 'linear-gradient(135deg, #ef4444, #f97316)',
  color: 'white',
  fontSize: '0.6rem',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: '600',
}

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
}

const paginationStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

const pageButtonStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  color: '#9ca3af',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.7rem',
}

const pageNumbersStyle = {
  display: 'flex',
  gap: '0.25rem',
}

const pageNumberStyle = {
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
}

export default NewsSection