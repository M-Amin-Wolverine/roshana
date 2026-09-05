// ============================================================
//  ╔═══════════════════════════════════════════════════════╗
//  ║   سامانه جامع فرتاک (Fartak) - نسخه نهایی پایدار     ║
//  ║   Ultimate HomePage - Stable Version                 ║
//  ╚═══════════════════════════════════════════════════════╝
// ============================================================

import React, { useRef, useState, useEffect, useCallback, useTransition } from 'react';
import '../../styles/global.css';
import { useTranslation,changeLanguage } from '../../i18n';   // یا مسیر نسبی صحیح (بسته به جای فایل)
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { useInView } from 'react-intersection-observer';
import { toast, Toaster } from 'react-hot-toast';

// Icons
import { 
  FaSearch, FaRocket, FaPlay, FaBrain, FaMoon, FaSun, FaUserCircle, 
  FaSignInAlt, FaUserPlus, FaSignOutAlt, FaTelegram, FaInstagram, 
  FaLinkedin, FaGithub, FaGooglePlay, FaApple, FaDesktop, FaBookOpen, 
  FaMicroscope, FaVideo, FaUsers, FaChalkboardTeacher, FaComments, 
  FaRobot, FaImages, FaChartLine, FaCheckCircle, FaArrowLeft, FaArrowRight,
  FaStar, FaFire, FaGift, FaShieldAlt, FaCloudUploadAlt, 
  FaHeadset, FaTachometerAlt, FaWallet, FaGraduationCap, FaCertificate,
  FaMobileAlt, FaDatabase, FaCodeBranch, FaClock, FaBell,
  FaThumbsUp, FaShareAlt, FaBookmark, FaEye, FaHeart, FaShoppingCart,
  FaCreditCard, FaUniversity, FaBuilding, FaUserTie, FaSchool, FaGlobe,
  FaTwitter, FaYoutube, FaTrophy, FaMedal, FaChartBar, FaChartPie, FaChartArea,
  FaInfinity, FaBolt, FaGem, FaLeaf, FaTree, FaRecycle, FaCrown
} from 'react-icons/fa';

// ============================================================
//  📦 CONSTANTS & DATA
// ============================================================

const EXCHANGE_RATE = 150000;
const formatToman = (usdPrice) => (usdPrice * EXCHANGE_RATE).toLocaleString();

const COURSES_DATA = [
  { id: 1, title: 'Mastering AI in Media', teacher: 'Dr. Sarah Johnson', priceUSD: 299, imageEmoji: '🤖', isFree: false, students: 1247, rating: 4.8, isHot: true },
  { id: 2, title: 'Digital Filmmaking Pro', teacher: 'Prof. Michael Chen', priceUSD: 399, imageEmoji: '🎬', isFree: false, students: 892, rating: 4.9, isHot: true },
  { id: 3, title: 'Data Science Bootcamp', teacher: 'Dr. Emily Rodriguez', priceUSD: 499, imageEmoji: '📊', isFree: false, students: 2156, rating: 4.7, isHot: false },
  { id: 4, title: 'UI/UX Design Mastery', teacher: 'James Wilson', priceUSD: 249, imageEmoji: '🎨', isFree: false, students: 1567, rating: 4.9, isHot: true },
  { id: 5, title: 'Cybersecurity Fundamentals', teacher: 'Prof. Lisa Park', priceUSD: 199, imageEmoji: '🔒', isFree: false, students: 943, rating: 4.6, isHot: false },
  { id: 6, title: 'Cloud Computing with AWS', teacher: 'David Kim', priceUSD: 449, imageEmoji: '☁️', isFree: false, students: 678, rating: 4.8, isHot: true },
];

const PRICING_PLANS = [
  { id: 1, name: 'Starter', priceUSD: 49, period: 'month', features: ['5 core modules', '50 active users', '50GB storage', '9-5 support', 'Course certificates'], isPopular: false, color: '#3b82f6', icon: FaLeaf },
  { id: 2, name: 'Professional', priceUSD: 99, period: 'month', features: ['9 modules', '500 active users', '200GB storage', '24/7 support', 'Custom API', 'Advanced analytics', 'Intl certificate'], isPopular: true, color: '#f97316', icon: FaBolt },
  { id: 3, name: 'Enterprise', priceUSD: 299, period: 'month', features: ['All Pro features', 'Unlimited users', '1TB storage', 'Dedicated server', 'Staff training', '99.9% SLA', 'Monthly consultation'], isPopular: false, color: '#8b5cf6', icon: FaBuilding },
  { id: 4, name: 'Lifetime', priceUSD: 999, period: 'one-time', features: ['All Enterprise', 'Lifetime access', 'Free updates', 'VIP support', 'Revenue share', '50% team discount'], isPopular: false, color: '#10b981', icon: FaGem },
];

const STATS_DATA = [
  { id: 'users', targetValue: 2580, suffix: '+', label: 'Active Users', icon: FaUsers, color: '#f97316' },
  { id: 'courses', targetValue: 187, suffix: '+', label: 'Live Courses', icon: FaBookOpen, color: '#3b82f6' },
  { id: 'universities', targetValue: 64, suffix: '+', label: 'Universities', icon: FaUniversity, color: '#10b981' },
  { id: 'satisfaction', targetValue: 98, suffix: '%', label: 'Satisfaction', icon: FaThumbsUp, color: '#8b5cf6' },
];

const MODULES_DATA = [
  { id: 1, icon: FaBookOpen, title: 'CourseWare', desc: 'Complete course management system', color: 'accent', path: '/darsafzar', isNew: false, isPopular: true },
  { id: 2, icon: FaMicroscope, title: 'Roshena Sci', desc: 'Scientific research platform', color: 'purple', path: '/roshena-sci', isNew: true, isPopular: false },
  { id: 3, icon: FaVideo, title: 'Live Classes', desc: 'HD streaming with recording', color: 'accent', path: '/live', isNew: false, isPopular: true },
  { id: 4, icon: FaUsers, title: 'Meeting Hub', desc: 'Video conferencing solution', color: 'green', path: '/meeting', isNew: false, isPopular: false },
  { id: 5, icon: FaChalkboardTeacher, title: 'Connect', desc: 'Teacher-student portal', color: 'accent', path: '/connect', isNew: false, isPopular: true },
  { id: 6, icon: FaComments, title: 'Messenger', desc: 'Secure instant messaging', color: 'blue', path: '/messenger', isNew: false, isPopular: false },
  { id: 7, icon: FaRobot, title: 'Automation', desc: 'AI-powered workflows', color: 'purple', path: '/automation', isNew: true, isPopular: true },
  { id: 8, icon: FaImages, title: 'Media Gallery', desc: 'Digital asset management', color: 'cyan', path: '/gallery', isNew: false, isPopular: false },
  { id: 9, icon: FaChartLine, title: 'Poll & Survey', desc: 'Real-time analytics', color: 'green', path: '/poll', isNew: false, isPopular: false },
  { id: 10, icon: FaShieldAlt, title: 'Security Suite', desc: 'Advanced protection', color: 'red', path: '/security', isNew: true, isPopular: false },
  { id: 11, icon: FaDatabase, title: 'Data Center', desc: 'Cloud storage solution', color: 'blue', path: '/storage', isNew: false, isPopular: false },
  { id: 12, icon: FaCodeBranch, title: 'API Gateway', desc: 'RESTful & GraphQL APIs', color: 'purple', path: '/api', isNew: true, isPopular: true },
];

const TESTIMONIALS = [
  { id: 1, name: 'Dr. Mohammad Rezaei', role: 'University President', text: 'فرتاک تحول عظیمی در مدیریت دانشگاه ما ایجاد کرد.工作效率 ۷۰٪ افزایش یافت.', rating: 5, avatar: '👨‍🏫', date: '2024-01-15' },
  { id: 2, name: 'Prof. Sarah Johnson', role: 'MIT Visiting Scholar', text: 'The most comprehensive educational platform I\'ve ever used.', rating: 5, avatar: '👩‍🔬', date: '2024-01-20' },
  { id: 3, name: 'Ali Hosseini', role: 'IT Manager', text: 'پشتیبانی ۲۴/۷ و امکانات بین‌ظیر. واقعاً حرفه‌ای کار می‌کنند.', rating: 5, avatar: '👨‍💻', date: '2024-01-25' },
  { id: 4, name: 'Dr. Emily Chen', role: 'Researcher', text: 'The analytics dashboard is incredible! Saved us countless hours.', rating: 5, avatar: '👩‍🔬', date: '2024-01-28' },
  { id: 5, name: 'Prof. Ahmed Khan', role: 'Dean of Faculty', text: 'Best investment we made for our university digital transformation.', rating: 5, avatar: '👨‍🏫', date: '2024-01-30' },
  { id: 6, name: 'Maria Garcia', role: 'E-Learning Director', text: 'Students love the interactive features and mobile app.', rating: 5, avatar: '👩‍💻', date: '2024-02-01' },
];

const PARTNERS = [
  { id: 1, name: 'Tehran University', logo: '🎓', size: 60 },
  { id: 2, name: 'MIT', logo: '🏫', size: 60 },
  { id: 3, name: 'Stanford', logo: '🌲', size: 60 },
  { id: 4, name: 'Cambridge', logo: '📚', size: 60 },
  { id: 5, name: 'Oxford', logo: '🦉', size: 60 },
  { id: 6, name: 'Harvard', logo: '🏛️', size: 60 },
  { id: 7, name: 'Tokyo Univ', logo: '🗼', size: 60 },
  { id: 8, name: 'ETH Zurich', logo: '🏔️', size: 60 },
];

// ============================================================
//  🎨 ANIMATION VARIANTS
// ============================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const floatAnimation = {
  animate: { y: [0, -10, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
};

// ============================================================
//  🔧 CUSTOM HOOKS
// ============================================================

const useIntersectionObserver = (options = { threshold: 0.1 }) => {
  const [ref, inView] = useInView(options);
  return { ref, inView };
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  };

  return [storedValue, setValue];
};

const useProductPurchase = (productId) => {
  const [isPending, startTransition] = useTransition();
  
  const startPurchase = useCallback(() => {
    startTransition(() => {
      const productData = { id: productId, timestamp: Date.now() };
      localStorage.setItem('pending_product', JSON.stringify(productData));
      sessionStorage.setItem('pending_product_backup', JSON.stringify(productData));
      toast.success('محصول به سبد خرید اضافه شد! 🛒', { duration: 2000 });
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 500);
    });
  }, [productId]);

  return { startPurchase, isPending };
};

// ============================================================
//  🎯 SIMPLE ANIMATED COUNTER (بدون CountUp)
// ============================================================

const AnimatedCounter = ({ value, suffix, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useIntersectionObserver({ threshold: 0.5 });
  
  useEffect(() => {
    if (!inView) return;
    
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * value);
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [inView, value, duration]);
  
  return (
    <span ref={ref} className="stat-number">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// ============================================================
//  🧩 COMPONENTS
// ============================================================

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Particle {
      constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.originalX = this.x;
        this.originalY = this.y;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = `hsl(${Math.random() * 60 + 20}, 70%, 60%)`;
      }
      
      update(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        if (distance < maxDistance) {
          const angle = Math.atan2(dy, dx);
          const force = (maxDistance - distance) / maxDistance;
          const moveX = Math.cos(angle) * force * 3;
          const moveY = Math.sin(angle) * force * 3;
          this.x -= moveX;
          this.y -= moveY;
        } else {
          this.x += (this.originalX - this.x) * 0.05;
          this.y += (this.originalY - this.y) * 0.05;
        }
        
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    const initParticles = () => {
      const particles = [];
      const particleCount = Math.min(80, Math.floor(window.innerWidth * 0.08));
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      particlesRef.current = particles;
    };
    
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(particle => {
        particle.update(mouseRef.current.x, mouseRef.current.y);
        particle.draw(ctx);
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };
    
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    initParticles();
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  return <canvas ref={canvasRef} style={styles.particleCanvas} />;
};

const ModuleCard = ({ icon: Icon, title, desc, color, path, isNew, isPopular }) => {
  const { t, locale, changeLanguage, isRTL } = useTranslation();
  const isRtl = locale === 'fa';
  
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className={`module-card ${isNew ? 'new-module' : ''} ${isPopular ? 'popular-module' : ''}`}
      onClick={() => window.location.href = path}
      style={{ textAlign: isRtl ? 'right' : 'left', cursor: 'pointer' }}
    >
      {isNew && <span className="badge-new">🔥 NEW</span>}
      {isPopular && <span className="badge-popular">⭐ POPULAR</span>}
      <div className={`module-icon bg-${color}-soft`}>
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
};

const PricingCard = ({ name, priceUSD, period, features, isPopular, color, icon: Icon }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { startPurchase } = useProductPurchase(name);
  const { t, locale } = useTranslation();
  const isRtl = locale === 'fa';
  const priceToman = formatToman(priceUSD);
  
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`pricing-card ${isPopular ? 'featured' : ''}`}
      style={{ '--card-color': color, textAlign: isRtl ? 'right' : 'left' }}
    >
      {isPopular && <div className="popular-badge">⭐ {t('mostPopular')}</div>}
      <Icon size={40} color={color} />
      <h3>{name}</h3>
      <div className="price-wrapper">
        <span className="currency">{t('toman')}</span>
        <span className="price">{priceToman}</span>
        <span className="period">/{period === 'month' ? t('month') : t('oneTime')}</span>
      </div>
      <ul className="pricing-features">
        {features.map((feature, idx) => (
          <motion.li key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
            <FaCheckCircle style={{ color: 'var(--green)' }} />
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`btn ${isPopular ? 'btn-primary' : 'btn-outline'} btn-full`}
        onClick={startPurchase}
      >
        {isHovered && <FaArrowLeft style={{ marginRight: '8px' }} />}
        {name === 'Starter' ? t('getStartedBtn') : name === 'Professional' ? t('choosePlan') : name === 'Enterprise' ? t('contactSales') : t('buyOnce')}
        {isHovered && <FaArrowRight style={{ marginLeft: '8px' }} />}
      </motion.button>
    </motion.div>
  );
};

const CourseCard = ({ title, teacher, priceUSD, imageEmoji, isFree, students, rating, isHot }) => {
  const { startPurchase } = useProductPurchase(title);
  const [isSaved, setIsSaved] = useLocalStorage(`saved_${title}`, false);
  const priceToman = formatToman(priceUSD);
  
  return (
    <motion.div variants={fadeInUp} whileHover={{ scale: 1.05, y: -5 }} className="course-card">
      {isHot && <div className="hot-badge">🔥 HOT</div>}
      <div className="course-image">{imageEmoji}</div>
      <div className="course-info">
        <div className="course-title">{title}</div>
        <div className="course-teacher">{teacher}</div>
        <div className="course-stats">
          <span><FaUsers /> {students.toLocaleString()}</span>
          <span><FaStar /> {rating}</span>
        </div>
        <div className="course-price">{isFree ? 'Free' : `${priceToman} تومان`}</div>
        <div className="course-actions">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-sm btn-primary" onClick={startPurchase}>
            خرید
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-outline'}`} onClick={() => setIsSaved(!isSaved)}>
            <FaBookmark /> {isSaved ? 'Saved' : 'Save'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialCard = ({ name, role, text, rating, avatar, date }) => {
  return (
    <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} className="testimonial-card">
      <div className="testimonial-header">
        <div className="avatar">{avatar}</div>
        <div className="info">
          <h4>{name}</h4>
          <p>{role}</p>
        </div>
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < rating ? '#f97316' : '#ccc'} />
          ))}
        </div>
      </div>
      <p className="testimonial-text">"{text}"</p>
      <div className="testimonial-date">{new Date(date).toLocaleDateString('fa-IR')}</div>
    </motion.div>
  );
};

const Stats = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.3 });
  
  return (
    <motion.div ref={ref} variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="stats-grid">
      {STATS_DATA.map((stat) => (
        <motion.div key={stat.id} variants={fadeInUp} className="stat-item">
          <stat.icon size={40} color={stat.color} />
          <AnimatedCounter value={stat.targetValue} suffix={stat.suffix} />
          <div className="stat-label">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, locale, changeLanguage, isRTL } = useTranslation();
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark');
  };
  
  const toggleLanguage = () => changeLanguage(locale === 'en' ? 'fa' : 'en');
  
  return (
    <motion.div initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }} className={`glass-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <motion.div whileHover={{ scale: 1.05 }} className="logo-area">
          <span className="logo-icon">🌸</span>
          <span className="logo-text">فرتاک</span>
        </motion.div>
        
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </button>
        
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home">خانه</a>
          <a href="#modules">ماژول‌ها</a>
          <a href="#pricing">قیمت‌ها</a>
          <a href="#contact">تماس</a>
        </div>
        
        <div className="header-actions">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="theme-toggle" onClick={toggleDarkMode}>
            {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="theme-toggle" onClick={toggleLanguage}>
            {locale === 'en' ? '🇮🇷' : '🇬🇧'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-outline" onClick={() => window.location.href = '/login'}>
            <FaSignInAlt /> ورود
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={() => window.location.href = '/register'}>
            <FaUserPlus /> ثبت‌نام
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Hero = () => {
  const scrollToContent = () => {
    document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="hero">
      <div className="hero-content">
        <motion.div animate={floatAnimation.animate} className="hero-badge">
          <FaBrain /> AI-Powered Platform
        </motion.div>
        <TypeAnimation 
          sequence={['فرتاک', 2000, 'Fartak', 2000, 'آینده آموزش', 2000]} 
          wrapper="h1" 
          repeat={Infinity} 
          className="hero-title gradient-text" 
        />
        <p className="hero-desc">
          سامانه جامع مدیریت آموزشی فرتاک - تحول در آموزش دیجیتال با هوش مصنوعی
        </p>
        <div className="hero-cta">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary btn-lg" onClick={() => window.location.href = '/register'}>
            <FaRocket /> شروع کنید
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-outline btn-lg" onClick={scrollToContent}>
            <FaPlay /> مشاهده دمو
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

const Modules = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <motion.div ref={ref} id="modules" variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="modules-section">
      <div className="section-header">
        <motion.h2 variants={fadeInUp} className="section-title">✨ ماژول‌های قدرتمند</motion.h2>
        <motion.p variants={fadeInUp} className="section-desc">راهکار کامل برای آموزش دیجیتال</motion.p>
      </div>
      <div className="modules-grid">
        {MODULES_DATA.map((module) => (
          <ModuleCard key={module.id} {...module} />
        ))}
      </div>
    </motion.div>
  );
};

const Courses = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState(COURSES_DATA);
  
  useEffect(() => {
    const results = COURSES_DATA.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(results);
  }, [searchTerm]);
  
  return (
    <motion.div ref={ref} variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="courses-section">
      <div className="section-header">
        <motion.h2 variants={fadeInUp} className="section-title">🔥 دوره‌های محبوب</motion.h2>
        <motion.p variants={fadeInUp} className="section-desc">دوره‌های برتر از اساتید مجرب</motion.p>
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="جستجوی دوره..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input" 
          />
        </div>
      </div>
      <div className="courses-grid">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </motion.div>
  );
};

const Pricing = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <motion.div ref={ref} id="pricing" variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="pricing-section">
      <div className="section-header">
        <motion.h2 variants={fadeInUp} className="section-title">💰 قیمت‌ها</motion.h2>
        <motion.p variants={fadeInUp} className="section-desc">پلن مناسب خود را انتخاب کنید</motion.p>
      </div>
      <div className="pricing-grid">
        {PRICING_PLANS.map((plan) => (
          <PricingCard key={plan.id} {...plan} />
        ))}
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <motion.div ref={ref} variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="testimonials-section">
      <div className="section-header">
        <motion.h2 variants={fadeInUp} className="section-title">💬 نظرات مشتریان</motion.h2>
        <motion.p variants={fadeInUp} className="section-desc">مورد اعتماد دانشگاه‌های برتر</motion.p>
      </div>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.id} {...testimonial} />
        ))}
      </div>
    </motion.div>
  );
};

const Partners = () => {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <motion.div ref={ref} variants={staggerContainer} initial="hidden" animate={inView ? "visible" : "hidden"} className="partners-section">
      <div className="section-header">
        <motion.h2 variants={fadeInUp} className="section-title">🤝 همکاران ما</motion.h2>
        <motion.p variants={fadeInUp} className="section-desc">بیش از ۱۰۰۰ موسسه به ما اعتماد دارند</motion.p>
      </div>
      <div className="partners-grid">
        {PARTNERS.map((partner) => (
          <motion.div key={partner.id} variants={fadeInUp} whileHover={{ scale: 1.1 }} className="partner-logo">
            <span style={{ fontSize: `${partner.size}px` }}>{partner.logo}</span>
            <p>{partner.name}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>🌸 فرتاک</h4>
            <p>پلتفرم جامع مدیریت آموزشی با هوش مصنوعی</p>
            <div className="social-links">
              <a href="#"><FaTelegram /></a>
              <a href="#"><FaInstagram /></a>
              <a href="#"><FaLinkedin /></a>
              <a href="#"><FaGithub /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaYoutube /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>لینک‌های سریع</h4>
            <ul>
              <li><a href="/about">درباره ما</a></li>
              <li><a href="/contact">تماس با ما</a></li>
              <li><a href="/blog">وبلاگ</a></li>
              <li><a href="/support">پشتیبانی</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>خدمات</h4>
            <ul>
              <li><a href="/roshena-sci">Roshena Sci</a></li>
              <li><a href="/connect">Roshena Connect</a></li>
              <li><a href="/automation">اتوماسیون</a></li>
              <li><a href="/gallery">گالری</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>دانلود اپلیکیشن</h4>
            <ul>
              <li><a href="#"><FaGooglePlay /> Google Play</a></li>
              <li><a href="#"><FaApple /> App Store</a></li>
              <li><a href="#"><FaDesktop /> نسخه وب</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 فرتاک. تمام حقوق محفوظ است | ساخته شده با ❤️ توسط تیم فرتاک</p>
        </div>
      </div>
    </footer>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.pageYOffset > 300);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button 
          initial={{ opacity: 0, scale: 0 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0 }} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={scrollToTop} 
          className="scroll-to-top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ============================================================
//  🚀 MAIN HOMEPAGE COMPONENT
// ============================================================

const HomePage = () => {
  useEffect(() => {
    document.body.classList.add('dark');
    toast.success('به سامانه جامع فرتاک خوش آمدید! 🎉', { duration: 5000, icon: '🌸' });
  }, []);
  
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', handleAnchorClick));
    return () => document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.removeEventListener('click', handleAnchorClick));
  }, []);
  
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px' } }} />
      <ParticleBackground />
      <div className="homepage">
        <Header />
        <Hero />
        <div className="container">
          <Stats />
          <Modules />
          <Courses />
          <Pricing />
          <Testimonials />
          <Partners />
        </div>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
};

const styles = {
  particleCanvas: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0
  }
};

export default HomePage;