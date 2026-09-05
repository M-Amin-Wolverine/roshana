// components/DateTimeDisplay.jsx
import { useState, useEffect } from 'react'
import { FaCalendarAlt, FaClock, FaCalendarWeek, FaMoon, FaSun } from 'react-icons/fa'

const DateTimeDisplay = ({ 
  variant = 'full', // 'full', 'compact', 'minimal', 'digital'
  showIcon = true,
  format = 'persian' // 'persian', 'gregorian'
}) => {
  const [dateTime, setDateTime] = useState({
    date: '',
    time: '',
    dayName: '',
    season: ''
  })

  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      
      // تقویم فارسی
      const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(now)

      // زمان
      const time = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // روز هفته
      const dayName = now.toLocaleDateTimeFormat('fa-IR', { weekday: 'long' })

      // فصل
      const month = now.getMonth()
      let season = ''
      if (month >= 0 && month <= 2) season = 'بهار'
      else if (month >= 3 && month <= 5) season = 'تابستان'
      else if (month >= 6 && month <= 8) season = 'پاییز'
      else season = 'زمستان'

      // ساعت روز
      const hour = now.getHours()
      const isDay = hour >= 6 && hour < 18

      setDateTime({
        date: persianDate,
        time: time,
        dayName: dayName,
        season: season,
        isDay: isDay,
        hour: hour
      })
      
      if (!isLoaded) setIsLoaded(true)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isLoaded])

  //_variant‌های مختلف
  if (variant === 'compact') {
    return (
      <div style={compactContainerStyle}>
        {showIcon && (
          <span style={iconStyle}>
            <FaCalendarAlt />
          </span>
        )}
        <span style={compactTextStyle}>{dateTime.date}</span>
        <span style={separatorStyle}>|</span>
        <span style={compactTimeStyle}>{dateTime.time}</span>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div style={minimalContainerStyle}>
        <span style={minimalTimeStyle}>{dateTime.time.split(' ')[0]}</span>
        <span style={minimalAmPmStyle}>
          {dateTime.isDay ? '🌞' : '🌙'}
        </span>
      </div>
    )
  }

  if (variant === 'digital') {
    return (
      <div style={digitalContainerStyle}>
        <div style={digitalTimeStyle}>
          {dateTime.time.split(' ')[0]}
        </div>
        <div style={digitalDateStyle}>
          {dateTime.dayName} • {dateTime.season}
        </div>
        <div style={digitalIndicatorStyle}>
          <span style={{
            ...dotStyle,
            background: dateTime.isDay ? '#fbbf24' : '#a855f7',
            boxShadow: `0 0 10px ${dateTime.isDay ? '#fbbf24' : '#a855f7'}`
          }} />
          {dateTime.isDay ? 'روز' : 'شب'}
        </div>
      </div>
    )
  }

  // حالت پیش‌فرض (full)
  return (
    <div style={{
      ...containerStyle,
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
    }}>
      {/* تاریخ */}
      <div style={dateContainerStyle}>
        {showIcon && <FaCalendarAlt style={dateIconStyle} />}
        <div style={dateTextStyle}>
          <span style={dayNameStyle}>{dateTime.dayName}</span>
          <span style={fullDateStyle}>{dateTime.date}</span>
        </div>
      </div>

      {/* زمان */}
      <div style={timeContainerStyle}>
        <div style={timeWrapperStyle}>
          <FaClock style={clockIconStyle} />
          <span style={timeStyle}>{dateTime.time}</span>
        </div>
        
        {/* فصل و شب/روز */}
        <div style={metaContainerStyle}>
          <span style={seasonBadgeStyle}>
            {dateTime.season === 'بهار' ? '🌸' : 
             dateTime.season === 'تابستان' ? '☀️' :
             dateTime.season === 'پاییز' ? '🍂' : '❄️'}
            {dateTime.season}
          </span>
          <span style={dayNightStyle}>
            {dateTime.isDay ? <FaSun style={{ color: '#fbbf24' }} /> : <FaMoon style={{ color: '#a855f7' }} />}
          </span>
        </div>
      </div>

      {/* انیمیشن نقطه‌های ساعت */}
      <div style={clockDotsStyle}>
        {[...Array(12)].map((_, i) => (
          <span 
            key={i} 
            style={{
              ...clockDotStyle,
              opacity: (dateTime.hour % 12) === i ? 1 : 0.2,
              transform: `rotate(${i * 30}deg) translateY(-12px)`,
            }} 
          />
        ))}
      </div>

      {/* استایل‌های CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .clock-dot {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  )
}

// استایل‌های حالت full
const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '1rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.15)',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.3s ease',
}

const dateContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const dateIconStyle = {
  color: '#22d3ee',
  fontSize: '1.25rem',
}

const dateTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
}

const dayNameStyle = {
  fontSize: '0.8rem',
  color: '#22d3ee',
  fontWeight: '600',
}

const fullDateStyle = {
  fontSize: '0.9rem',
  color: '#e5e7eb',
  fontWeight: '500',
}

const timeContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '0.75rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}

const timeWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const clockIconStyle = {
  color: '#9ca3af',
  fontSize: '0.9rem',
}

const timeStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'white',
  fontFamily: 'monospace',
  letterSpacing: '2px',
}

const metaContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const seasonBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.25rem 0.75rem',
  background: 'rgba(34, 211, 238, 0.15)',
  borderRadius: '20px',
  fontSize: '0.75rem',
  color: '#22d3ee',
  fontWeight: '500',
}

const dayNightStyle = {
  fontSize: '1rem',
}

const clockDotsStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '30px',
  height: '30px',
}

const clockDotStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  background: '#22d3ee',
  transition: 'all 0.3s ease',
}

// استایل‌های compact
const compactContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
  color: '#9ca3af',
}

const iconStyle = {
  color: '#22d3ee',
}

const compactTextStyle = {
  color: '#e5e7eb',
}

const separatorStyle = {
  color: '#4b5563',
}

const compactTimeStyle = {
  fontFamily: 'monospace',
  color: '#22d3ee',
  fontWeight: '600',
}

// استایل‌های minimal
const minimalContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
}

const minimalTimeStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'white',
  fontFamily: 'monospace',
}

const minimalAmPmStyle = {
  fontSize: '0.875rem',
}

// استایل‌های digital
const digitalContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '1.5rem',
  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
}

const digitalTimeStyle = {
  fontSize: '2.5rem',
  fontWeight: '700',
  color: '#22d3ee',
  fontFamily: 'monospace',
  textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
  letterSpacing: '4px',
}

const digitalDateStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const digitalIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.75rem',
  color: '#6b7280',
}

const dotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
}

export default DateTimeDisplay