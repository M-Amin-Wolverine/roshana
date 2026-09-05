// components/WeatherDisplay.jsx
import { useState, useEffect } from 'react'
import { 
  FaCloud, FaSun, FaCloudRain, FaSnowflake, FaBolt, 
  FaWind, FaTint, FaThermometerHalf, FaMapMarkerAlt, 
  FaClock, FaCalendarAlt, FaCompress, FaExpand
} from 'react-icons/fa'

// داده‌های نمونه آب و هوا
const weatherData = {
  current: {
    city: 'تهران',
    temperature: 22,
    feelsLike: 24,
    humidity: 45,
    windSpeed: 12,
    pressure: 1013,
    visibility: 10,
    uvIndex: 5,
    condition: 'sunny', // sunny, cloudy, rainy, snowy, stormy
    conditionText: 'آفتابی',
    icon: '☀️',
    hourly: [
      { time: '۶ صبح', temp: 18, icon: '🌅' },
      { time: '۹ صبح', temp: 20, icon: '⛅' },
      { time: '۱۲ ظهر', temp: 24, icon: '☀️' },
      { time: '۳ بعدازظهر', temp: 26, icon: '☀️' },
      { time: '۶ عصر', temp: 22, icon: '🌇' },
      { time: '۹ شب', temp: 19, icon: '🌙' },
    ]
  },
  forecast: [
    { day: 'شنبه', high: 24, low: 16, condition: 'sunny', icon: '☀️' },
    { day: 'یکشنبه', high: 22, low: 14, condition: 'cloudy', icon: '⛅' },
    { day: 'دوشنبه', high: 19, low: 12, condition: 'rainy', icon: '🌧️' },
    { day: 'سه‌شنبه', high: 17, low: 10, condition: 'stormy', icon: '⛈️' },
    { day: 'چهارشنبه', high: 20, low: 13, condition: 'sunny', icon: '☀️' },
  ]
}

const WeatherDisplay = ({ 
  variant = 'card', // 'card', 'compact', 'minimal', 'horizontal'
  city = 'تهران',
  showForecast = true,
  showDetails = true
}) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // شبیه‌سازی دریافت آب و هوا
    const fetchWeather = () => {
      setLoading(true)
      setError(null)
      
      setTimeout(() => {
        setWeather(weatherData)
        setLastUpdate(new Date())
        setLoading(false)
      }, 1500)
    }

    fetchWeather()
    
    // بروزرسانی هر 30 دقیقه
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [city])

  // دریافت آیکون وضعیت هوا
  const getWeatherIcon = (condition, size = '1.5rem') => {
    const icons = {
      sunny: <FaSun style={{ color: '#fbbf24', fontSize: size }} />,
      cloudy: <FaCloud style={{ color: '#9ca3af', fontSize: size }} />,
      rainy: <FaCloudRain style={{ color: '#3b82f6', fontSize: size }} />,
      snowy: <FaSnowflake style={{ color: '#67e8f9', fontSize: size }} />,
      stormy: <FaBolt style={{ color: '#a855f7', fontSize: size }} />,
    }
    return icons[condition] || icons.sunny
  }

  // رنگ دما بر اساس گرم/سرد
  const getTempColor = (temp) => {
    if (temp >= 30) return '#ef4444' // قرمز گرم
    if (temp >= 20) return '#22d3ee' // cyan معتدل
    if (temp >= 10) return '#22c55e' // سبز خنک
    return '#3b82f6' // آبی سرد
  }

  // حالت لودینگ
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle} />
        <span style={loadingTextStyle}>در حال دریافت اطلاعات...</span>
      </div>
    )
  }

  // حالت خطا
  if (error) {
    return (
      <div style={errorContainerStyle}>
        <FaCloud style={{ fontSize: '2rem', color: '#6b7280' }} />
        <span style={errorTextStyle}>خطا در دریافت اطلاعات</span>
        <button 
          onClick={() => setLoading(true)}
          style={retryButtonStyle}
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  // حالت فشرده (compact)
  if (variant === 'compact') {
    return (
      <div style={compactContainerStyle}>
        <FaMapMarkerAlt style={{ color: '#22d3ee', fontSize: '0.75rem' }} />
        <span style={compactCityStyle}>{weather.current.city}</span>
        <span style={compactTempStyle}>{weather.current.temperature}°</span>
        <span style={compactIconStyle}>{weather.current.icon}</span>
      </div>
    )
  }

  // حالت مینیمال
  if (variant === 'minimal') {
    return (
      <div style={minimalContainerStyle}>
        <span style={minimalIconStyle}>{weather.current.icon}</span>
        <span style={minimalTempStyle}>{weather.current.temperature}°</span>
      </div>
    )
  }

  // حالت افقی
  if (variant === 'horizontal') {
    return (
      <div style={horizontalContainerStyle}>
        <div style={horizontalMainStyle}>
          <div style={horizontalTempStyle}>
            <span style={horizontalTempNumberStyle}>{weather.current.temperature}</span>
            <span style={horizontalTempUnitStyle}>°C</span>
          </div>
          <div style={horizontalInfoStyle}>
            <span style={horizontalCityStyle}>{weather.current.city}</span>
            <span style={horizontalConditionStyle}>{weather.current.conditionText}</span>
          </div>
        </div>
        <div style={horizontalIconStyle}>{weather.current.icon}</div>
      </div>
    )
  }

  // حالت کامل (card) - پیش‌فرض
  return (
    <div style={cardContainerStyle}>
      {/* هدر */}
      <div style={cardHeaderStyle}>
        <div style={locationContainerStyle}>
          <FaMapMarkerAlt style={{ color: '#22d3ee' }} />
          <span style={cityStyle}>{weather.current.city}</span>
        </div>
        <span style={updateTimeStyle}>
          <FaClock style={{ marginLeft: '4px', fontSize: '0.7rem' }} />
          بروزرسانی: {lastUpdate?.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* دمای اصلی */}
      <div style={mainWeatherStyle}>
        <div style={mainIconStyle}>{weather.current.icon}</div>
        <div style={mainTempContainerStyle}>
          <span style={mainTempStyle}>{weather.current.temperature}</span>
          <span style={mainTempUnitStyle}>°C</span>
        </div>
        <div style={conditionContainerStyle}>
          <span style={conditionTextStyle}>{weather.current.conditionText}</span>
          <span style={feelsLikeStyle}>
            حس: {weather.current.feelsLike}°
          </span>
        </div>
      </div>

      {/* جزئیات آب و هوا */}
      {showDetails && (
        <div style={detailsGridStyle}>
          <div style={detailItemStyle}>
            <FaTint style={{ color: '#3b82f6' }} />
            <span style={detailValueStyle}>{weather.current.humidity}%</span>
            <span style={detailLabelStyle}>رطوبت</span>
          </div>
          <div style={detailItemStyle}>
            <FaWind style={{ color: '#9ca3af' }} />
            <span style={detailValueStyle}>{weather.current.windSpeed}</span>
            <span style={detailLabelStyle}>km/h باد</span>
          </div>
          <div style={detailItemStyle}>
            <FaThermometerHalf style={{ color: '#f97316' }} />
            <span style={detailValueStyle}>{weather.current.pressure}</span>
            <span style={detailLabelStyle}>فشار</span>
          </div>
          <div style={detailItemStyle}>
            <FaSun style={{ color: '#fbbf24' }} />
            <span style={detailValueStyle}>{weather.current.uvIndex}</span>
            <span style={detailLabelStyle}>UV</span>
          </div>
        </div>
      )}

      {/* پیش‌بینی ساعتی */}
      <div style={hourlySectionStyle}>
        <h4 style={sectionTitleStyle}>
          <FaClock style={{ marginLeft: '6px' }} />
          وضعیت امروز
        </h4>
        <div style={hourlyContainerStyle}>
          {weather.current.hourly.map((hour, index) => (
            <div key={index} style={hourlyItemStyle}>
              <span style={hourlyTimeStyle}>{hour.time}</span>
              <span style={hourlyIconStyle}>{hour.icon}</span>
              <span style={hourlyTempStyle}>{hour.temp}°</span>
            </div>
          ))}
        </div>
      </div>

      {/* پیش‌بینی ۵ روزه */}
      {showForecast && (
        <div style={forecastSectionStyle}>
          <h4 style={sectionTitleStyle}>
            <FaCalendarAlt style={{ marginLeft: '6px' }} />
            پیش‌بینی ۵ روزه
          </h4>
          <div style={forecastContainerStyle}>
            {weather.forecast.map((day, index) => (
              <div key={index} style={forecastItemStyle}>
                <span style={forecastDayStyle}>{day.day}</span>
                <span style={forecastIconStyle}>{day.icon}</span>
                <div style={forecastTempContainerStyle}>
                  <span style={forecastHighStyle}>{day.high}°</span>
                  <span style={forecastLowStyle}>{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* استایل‌های CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .weather-icon {
          animation: pulse 3s infinite;
        }
      `}</style>
    </div>
  )
}

// استایل‌های لودینگ
const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.15)',
}

const loadingSpinnerStyle = {
  width: '32px',
  height: '32px',
  border: '3px solid rgba(34, 211, 238, 0.2)',
  borderTopColor: '#22d3ee',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const loadingTextStyle = {
  fontSize: '0.85rem',
  color: '#9ca3af',
}

// استایل‌های خطا
const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '16px',
  border: '1px solid rgba(239, 68, 68, 0.2)',
}

const errorTextStyle = {
  fontSize: '0.85rem',
  color: '#ef4444',
}

const retryButtonStyle = {
  padding: '0.5rem 1rem',
  background: 'rgba(34, 211, 238, 0.2)',
  border: '1px solid #22d3ee',
  borderRadius: '8px',
  color: '#22d3ee',
  cursor: 'pointer',
  fontSize: '0.8rem',
}

// استایل‌های compact
const compactContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
  color: '#9ca3af',
}

const compactCityStyle = {
  color: '#e5e7eb',
}

const compactTempStyle = {
  fontWeight: '600',
  color: '#22d3ee',
}

const compactIconStyle = {
  fontSize: '1rem',
}

// استایل‌های minimal
const minimalContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
}

const minimalIconStyle = {
  fontSize: '1.25rem',
}

const minimalTempStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: '#22d3ee',
}

// استایل‌های horizontal
const horizontalContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '16px',
  border: '1px solid rgba(34, 211, 238, 0.15)',
}

const horizontalMainStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const horizontalTempStyle = {
  display: 'flex',
  alignItems: 'flex-start',
}

const horizontalTempNumberStyle = {
  fontSize: '2.5rem',
  fontWeight: '700',
  color: 'white',
  lineHeight: 1,
}

const horizontalTempUnitStyle = {
  fontSize: '1rem',
  color: '#9ca3af',
  marginTop: '4px',
}

const horizontalInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const horizontalCityStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white',
}

const horizontalConditionStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const horizontalIconStyle = {
  fontSize: '3rem',
}

// استایل‌های card
const cardContainerStyle = {
  padding: '1.25rem',
  background: 'rgba(15, 23, 42, 0.8)',
  borderRadius: '20px',
  border: '1px solid rgba(34, 211, 238, 0.2)',
  backdropFilter: 'blur(12px)',
}

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const locationContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
}

const cityStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white',
}

const updateTimeStyle = {
  fontSize: '0.7rem',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
}

const mainWeatherStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1.5rem',
}

const mainIconStyle = {
  fontSize: '4rem',
}

const mainTempContainerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
}

const mainTempStyle = {
  fontSize: '4rem',
  fontWeight: '700',
  color: 'white',
  lineHeight: 1,
}

const mainTempUnitStyle = {
  fontSize: '1.5rem',
  color: '#9ca3af',
  marginTop: '8px',
}

const conditionContainerStyle = {
  textAlign: 'left',
}

const conditionTextStyle = {
  display: 'block',
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#22d3ee',
}

const feelsLikeStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
}

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '0.75rem',
  marginBottom: '1.5rem',
  padding: '1rem',
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '12px',
}

const detailItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
}

const detailValueStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white',
}

const detailLabelStyle = {
  fontSize: '0.65rem',
  color: '#6b7280',
}

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#e5e7eb',
  marginBottom: '0.75rem',
}

const hourlySectionStyle = {
  marginBottom: '1.5rem',
}

const hourlyContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.5rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
}

const hourlyItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.75rem 0.5rem',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  minWidth: '60px',
}

const hourlyTimeStyle = {
  fontSize: '0.65rem',
  color: '#9ca3af',
}

const hourlyIconStyle = {
  fontSize: '1.25rem',
}

const hourlyTempStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'white',
}

const forecastSectionStyle = {
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '1rem',
}

const forecastContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const forecastItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '10px',
}

const forecastDayStyle = {
  fontSize: '0.85rem',
  color: '#e5e7eb',
  fontWeight: '500',
  minWidth: '60px',
}

const forecastIconStyle = {
  fontSize: '1.25rem',
}

const forecastTempContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const forecastHighStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'white',
}

const forecastLowStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
}

export default WeatherDisplay