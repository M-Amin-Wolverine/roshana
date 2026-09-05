// components/SocialCards.jsx
import { useState } from 'react'
import { 
  FaInstagram, 
  FaTelegram, 
  FaYoutube, 
  FaTwitter, 
  FaLinkedinIn, 
  FaGithub,
  FaDiscord,
  FaTiktok
} from 'react-icons/fa'

const socialLinks = [
  { 
    icon: FaInstagram, 
    label: 'اینستاگرام', 
    color: '#E1306C',
    bgGradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    url: 'https://instagram.com/yourhandle'
  },
  { 
    icon: FaTelegram, 
    label: 'تلگرام', 
    color: '#0088CC',
    bgGradient: 'linear-gradient(45deg, #229ED9, #0088cc)',
    url: 'https://t.me/yourhandle'
  },
  { 
    icon: FaYoutube, 
    label: 'یوتیوب', 
    color: '#FF0000',
    bgGradient: 'linear-gradient(45deg, #FF0000, #c4302b)',
    url: 'https://youtube.com/@yourchannel'
  },
  { 
    icon: FaTwitter, 
    label: 'توییتر / X', 
    color: '#1DA1F2',
    bgGradient: 'linear-gradient(45deg, #1DA1F2, #0d8ecf)',
    url: 'https://twitter.com/yourhandle'
  },
  { 
    icon: FaLinkedinIn, 
    label: 'لینکدین', 
    color: '#0A66C2',
    bgGradient: 'linear-gradient(45deg, #0A66C2, #0077b5)',
    url: 'https://linkedin.com/in/yourhandle'
  },
  { 
    icon: FaGithub, 
    label: 'گیتهاب', 
    color: '#ffffff',
    bgGradient: 'linear-gradient(45deg, #333, #24292e)',
    url: 'https://github.com/yourhandle'
  },
  { 
    icon: FaDiscord, 
    label: 'دیسکورد', 
    color: '#5865F2',
    bgGradient: 'linear-gradient(45deg, #5865F2, #4752c4)',
    url: 'https://discord.gg/yourserver'
  },
  { 
    icon: FaTiktok, 
    label: 'تیک‌تاک', 
    color: '#ff0050',
    bgGradient: 'linear-gradient(45deg, #00f2ea, #ff0050)',
    url: 'https://tiktok.com/@yourhandle'
  },
]

const SocialCards = ({ columns = 4, showLabels = true }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🌐 ما را دنبال کنید</h3>
        <span style={subtitleStyle}>در شبکه‌های اجتماعی</span>
      </div>
      
      <div style={{
        ...socialCardsStyle,
        gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)`
      }}>
        {socialLinks.map((social, index) => {
          const Icon = social.icon
          const isHovered = hoveredIndex === index
          const isFocused = focusedIndex === index
          
          return (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              aria-label={social.label}
              style={{
                ...socialCardStyle,
                background: isHovered || isFocused 
                  ? social.bgGradient
                  : 'rgba(255, 255, 255, 0.08)',
                transform: isHovered || isFocused 
                  ? 'translateY(-4px) scale(1.02)' 
                  : 'translateY(0) scale(1)',
                boxShadow: isHovered || isFocused 
                  ? `0 8px 30px ${social.color}40`
                  : '0 4px 15px rgba(0, 0, 0, 0.2)',
                borderColor: isHovered || isFocused 
                  ? social.color 
                  : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* پس‌زمینه گرادینت در حالت هاور */}
              {isHovered && (
                <div style={gradientOverlayStyle} />
              )}
              
              {/* آیکون اصلی */}
              <div style={iconContainerStyle}>
                <Icon 
                  style={{
                    fontSize: '1.5rem',
                    color: isHovered || isFocused ? 'white' : social.color,
                    transition: 'all 0.3s ease',
                    filter: isHovered || isFocused 
                      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
                      : 'none',
                  }} 
                />
              </div>
              
              {/* لیبل (در حالت هاور یا همیشه) */}
              {showLabels && (
                <span style={{
                  ...labelStyle,
                  color: isHovered || isFocused ? 'white' : '#9ca3af',
                  transform: isHovered || isFocused 
                    ? 'translateY(0) opacity(1)' 
                    : 'translateY(5px) opacity(0.7)',
                }}>
                  {social.label}
                </span>
              )}
              
              {/* افکت درخشش */}
              {isHovered && <div style={shineEffectStyle} />}
            </a>
          )
        })}
      </div>
      
      {/* آمار (اختیاری) */}
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <span style={statNumberStyle}>۱۲K+</span>
          <span style={statLabelStyle}>دنبال‌کننده</span>
        </div>
        <div style={statDividerStyle} />
        <div style={statItemStyle}>
          <span style={statNumberStyle}>۵۰۰+</span>
          <span style={statLabelStyle}>پست</span>
        </div>
        <div style={statDividerStyle} />
        <div style={statItemStyle}>
          <span style={statNumberStyle}>۲۴/۷</span>
          <span style={statLabelStyle}>آنلاین</span>
        </div>
      </div>

      {/* استایل‌های CSS اضافی */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px currentColor; }
          50% { box-shadow: 0 0 40px currentColor; }
        }
        .social-card:focus {
          outline: 2px solid #22d3ee;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

// استایل‌ها
const containerStyle = {
  marginTop: '1.5rem',
  padding: '1.25rem',
  background: 'rgba(15, 23, 42, 0.6)',
  borderRadius: '20px',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(6, 182, 212, 0.15)',
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: '1.25rem',
}

const titleStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: 'white',
  margin: 0,
  background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

const subtitleStyle = {
  fontSize: '0.75rem',
  color: '#6b7280',
  display: 'block',
  marginTop: '0.25rem',
}

const socialCardsStyle = {
  display: 'grid',
  gap: '12px',
}

const socialCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '1',
  minHeight: '80px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  textDecoration: 'none',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
}

const gradientOverlayStyle = {
  position: 'absolute',
  inset: 0,
  opacity: 0.9,
}

const iconContainerStyle = {
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: '500',
  marginTop: '0.5rem',
  transition: 'all 0.3s ease',
  zIndex: 2,
}

const shineEffectStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '50%',
  height: '100%',
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
  transform: 'skewX(-20deg)',
  animation: 'shine 1.5s infinite',
}

const statsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '1rem',
  marginTop: '1.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const statNumberStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#22d3ee',
}

const statLabelStyle = {
  fontSize: '0.65rem',
  color: '#6b7280',
  marginTop: '2px',
}

const statDividerStyle = {
  width: '1px',
  height: '30px',
  background: 'rgba(255,255,255,0.1)',
}

// نسخه کوچک (فقط آیکون)
export const SmallSocialCards = () => (
  <div style={smallContainerStyle}>
    {socialLinks.slice(0, 4).map((social, index) => {
      const Icon = social.icon
      return (
        <a
          key={index}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          style={smallCardStyle}
          className="social-card"
        >
          <Icon style={{ fontSize: '1.1rem', color: social.color }} />
        </a>
      )
    })}
  </div>
)

const smallContainerStyle = {
  display: 'flex',
  gap: '0.75rem',
}

const smallCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
}

// نسخه گرد
export const CircularSocialIcons = () => (
  <div style={circularContainerStyle}>
    {socialLinks.map((social, index) => {
      const Icon = social.icon
      return (
        <a
          key={index}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          style={{
            ...circularIconStyle,
            borderColor: social.color + '40',
          }}
          className="social-card"
        >
          <Icon style={{ fontSize: '1rem', color: social.color }} />
        </a>
      )
    })}
  </div>
)

const circularContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const circularIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '50%',
  border: '1px solid',
  transition: 'all 0.3s ease',
}

export default SocialCards