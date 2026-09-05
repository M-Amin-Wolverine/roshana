// ============================================================
// AdminSupport.jsx - نسخه Ultra Pro 🚀
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FaHeadset, FaQuestionCircle, FaBook, FaVideo,
  FaEnvelope, FaPhone, FaTelegram, FaInstagram,
  FaChevronDown, FaChevronUp, FaExternalLinkAlt,
  FaSearch, FaLifeRing, FaTicketAlt, FaClock,
  FaStar, FaThumbsUp, FaThumbsDown, FaCopy,
  FaCheck, FaSpinner, FaPaperPlane, FaHistory,
  FaComment, FaUser, FaCalendarAlt, FaTag,
  FaChartLine, FaBell, FaWhatsapp, FaTwitter,
  FaLinkedin, FaGithub, FaYoutube, FaDiscord,
  FaRobot, FaMagic, FaLightbulb, FaFire,
  FaExclamationCircle, FaCheckCircle, FaTimesCircle,
  FaArrowRight, FaArrowLeft, FaDownload,FaShieldAlt,FaCode,FaGoogle,FaApple
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './AdminSupport.css';

// ============================================================
// کامپوننت‌های کمکی خفن
// ============================================================

// FAQ Item با انیمیشن بهتر
const FAQItem = ({ question, answer, category, tags, helpfulCount, onHelpful }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  return (
    <motion.div 
      className={`faq-item ${isOpen ? 'open' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <div className="question-content">
          <span className="question-icon">
            <FaQuestionCircle />
          </span>
          <span className="question-text">{question}</span>
          {category && (
            <span className="question-category">
              <FaTag size={10} /> {category}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown />
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="answer-content">
              <p>{answer}</p>
              
              {tags && (
                <div className="answer-tags">
                  {tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="answer-feedback">
                <span>آیا این پاسخ مفید بود؟</span>
                <button 
                  className={`feedback-btn ${feedback === 'up' ? 'active' : ''}`}
                  onClick={() => {
                    setFeedback('up');
                    onHelpful?.(true);
                    toast.success('🙏 ممنون از بازخورد شما!');
                  }}
                >
                  <FaThumbsUp /> بله
                </button>
                <button 
                  className={`feedback-btn ${feedback === 'down' ? 'active' : ''}`}
                  onClick={() => {
                    setFeedback('down');
                    onHelpful?.(false);
                    toast('📝 نظر شما ثبت شد', { icon: '📝' });
                  }}
                >
                  <FaThumbsDown /> خیر
                </button>
                {helpfulCount > 0 && (
                  <span className="helpful-count">
                    <FaThumbsUp size={10} /> {helpfulCount} نفر
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Guide Card خفن
const GuideCard = ({ title, description, icon: Icon, link, duration, level, isNew, isPopular }) => (
  <motion.a 
    href={link}
    className="guide-card-advanced"
    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
    whileTap={{ scale: 0.98 }}
    target="_blank"
    rel="noopener noreferrer"
  >
    {isNew && <span className="guide-badge new">جدید</span>}
    {isPopular && <span className="guide-badge popular">محبوب</span>}
    
    <div className="guide-icon-wrapper">
      <div className="guide-icon">
        <Icon />
      </div>
    </div>
    
    <div className="guide-content">
      <h4>{title}</h4>
      <p>{description}</p>
      
      <div className="guide-meta">
        {duration && (
          <span><FaClock size={10} /> {duration}</span>
        )}
        {level && (
          <span className={`level-badge ${level}`}>{level}</span>
        )}
      </div>
      
      <span className="guide-link">
        شروع آموزش <FaArrowLeft />
      </span>
    </div>
  </motion.a>
);

// Ticket Form Mini
const QuickTicketForm = ({ onClose }) => {
  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast.error('عنوان و پیام الزامی است');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/admin/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      toast.success('✅ تیکت با موفقیت ثبت شد');
      onClose?.();
    } catch {
      toast.error('❌ خطا در ثبت تیکت');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form 
      className="quick-ticket-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
    >
      <div className="form-row">
        <div className="form-group">
          <label>عنوان تیکت *</label>
          <input 
            value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})}
            placeholder="موضوع تیکت..."
          />
        </div>
        <div className="form-group">
          <label>دسته‌بندی</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="">انتخاب کنید</option>
            <option value="technical">فنی</option>
            <option value="account">حساب کاربری</option>
            <option value="billing">مالی</option>
            <option value="feature">درخواست ویژگی</option>
            <option value="bug">گزارش باگ</option>
          </select>
        </div>
        <div className="form-group">
          <label>اولویت</label>
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="low">کم</option>
            <option value="normal">معمولی</option>
            <option value="high">بالا</option>
            <option value="urgent">فوری</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>پیام *</label>
        <textarea 
          value={form.message}
          onChange={e => setForm({...form, message: e.target.value})}
          placeholder="توضیحات خود را بنویسید..."
          rows={4}
        />
      </div>
      
      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          انصراف
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
          {isSubmitting ? 'در حال ارسال...' : 'ارسال تیکت'}
        </button>
      </div>
    </motion.form>
  );
};

// Recent Tickets
const RecentTickets = ({ tickets }) => (
  <div className="recent-tickets">
    {tickets.length === 0 ? (
      <div className="empty-mini">
        <FaTicketAlt size={32} />
        <p>تیکتی ثبت نشده</p>
      </div>
    ) : (
      tickets.map((ticket, i) => (
        <motion.div 
          key={ticket.id || i}
          className="ticket-item-mini"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="ticket-status">
            <span className={`status-dot ${ticket.status}`} />
          </div>
          <div className="ticket-info">
            <span className="ticket-subject">{ticket.subject}</span>
            <span className="ticket-meta">
              <FaClock size={10} /> {ticket.date}
            </span>
          </div>
          <span className={`ticket-status-badge ${ticket.status}`}>
            {ticket.status === 'open' ? 'باز' : 
             ticket.status === 'pending' ? 'در انتظار' : 'بسته'}
          </span>
        </motion.div>
      ))
    )}
  </div>
);

// AI Support Assistant (شبیه‌سازی)
const AIAssistant = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleAsk = () => {
    if (!query.trim()) return;
    
    setIsThinking(true);
    setResponse('');
    
    setTimeout(() => {
      const answers = [
        'برای این کار به بخش مدیریت کاربران بروید و روی دکمه "کاربر جدید" کلیک کنید.',
        'این ویژگی در حال حاضر در نسخه Enterprise در دسترس است.',
        'مستندات کامل این بخش در راهنمای شروع کار موجود است.',
        'تیم پشتیبانی در اسرع وقت به سوال شما پاسخ خواهد داد.'
      ];
      setResponse(answers[Math.floor(Math.random() * answers.length)]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <FaRobot size={24} />
        <div>
          <h4>دستیار هوشمند</h4>
          <p>سوال خود را بپرسید</p>
        </div>
      </div>
      
      <div className="ai-input">
        <input 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="مثال: چطور کاربر جدید اضافه کنم؟"
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
        />
        <button onClick={handleAsk} disabled={isThinking}>
          {isThinking ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
        </button>
      </div>
      
      <AnimatePresence>
        {response && (
          <motion.div 
            className="ai-response"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaLightbulb />
            <p>{response}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// کامپوننت اصلی Ultra
// ============================================================

const AdminSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [recentTickets] = useState([
    { id: 1, subject: 'مشکل در آپلود فایل', status: 'open', date: '۲ ساعت پیش' },
    { id: 2, subject: 'درخواست تغییر رمز', status: 'pending', date: 'دیروز' },
    { id: 3, subject: 'سوال در مورد گزارشات', status: 'closed', date: '۳ روز پیش' }
  ]);

  const faqs = [
    {
      question: 'چگونه کاربر جدید اضافه کنم؟',
      answer: 'از منوی مدیریت کاربران، روی دکمه "کاربر جدید" کلیک کنید. فرم مربوطه را تکمیل و ذخیره نمایید. کاربر می‌تواند با اطلاعات وارد شده وارد سیستم شود. برای اطلاعات بیشتر می‌توانید از راهنمای تصویری در بخش آموزش‌ها استفاده کنید.',
      category: 'کاربران',
      tags: ['کاربر', 'ثبت‌نام', 'مدیریت'],
      helpfulCount: 45
    },
    {
      question: 'چطور دوره جدید ایجاد کنم؟',
      answer: 'به بخش مدیریت دوره‌ها بروید. روی "دوره جدید" کلیک کنید. عنوان، توضیحات، قیمت و سایر اطلاعات را وارد کرده و دوره را منتشر کنید. پس از انتشار، دانشجویان می‌توانند در دوره ثبت‌نام کنند.',
      category: 'دوره‌ها',
      tags: ['دوره', 'آموزش', 'محتوا'],
      helpfulCount: 32
    },
    {
      question: 'گزارشات درآمد را از کجا ببینم؟',
      answer: 'به بخش گزارشات بروید. نمودارها و آمار درآمد به تفکیک ماه نمایش داده می‌شوند. می‌توانید بازه زمانی را تغییر دهید و خروجی Excel یا PDF بگیرید. همچنین امکان فیلتر بر اساس دوره‌های خاص وجود دارد.',
      category: 'مالی',
      tags: ['گزارش', 'درآمد', 'آمار'],
      helpfulCount: 28
    },
    {
      question: 'چطور به تیکت‌های پشتیبانی پاسخ دهم؟',
      answer: 'در بخش درخواست‌ها، روی هر تیکت کلیک کنید تا جزئیات آن باز شود. می‌توانید پاسخ خود را بنویسید و وضعیت تیکت را تغییر دهید. همچنین می‌توانید تیکت را به همکاران خود ارجاع دهید.',
      category: 'پشتیبانی',
      tags: ['تیکت', 'پشتیبانی', 'پاسخ'],
      helpfulCount: 19
    },
    {
      question: 'آیا امکان پشتیبان‌گیری خودکار وجود دارد؟',
      answer: 'بله، در بخش تنظیمات > پشتیبان‌گیری می‌توانید زمان‌بندی پشتیبان‌گیری خودکار را تنظیم کنید. پشتیبان‌گیری می‌تواند روزانه، هفتگی یا ماهانه انجام شود. فایل‌های پشتیبان در cloud storage ذخیره می‌شوند.',
      category: 'تنظیمات',
      tags: ['پشتیبان‌گیری', 'تنظیمات', 'خودکار'],
      helpfulCount: 15
    },
    {
      question: 'چطور لایسنس را تمدید کنم؟',
      answer: 'به بخش لایسنس مراجعه کنید. اطلاعات لایسنس فعلی نمایش داده می‌شود. روی دکمه "تمدید لایسنس" کلیک کرده و مدت تمدید را انتخاب کنید. پس از پرداخت، لایسنس به صورت خودکار تمدید می‌شود.',
      category: 'لایسنس',
      tags: ['لایسنس', 'تمدید', 'پرداخت'],
      helpfulCount: 22
    }
  ];

  const guides = [
    {
      title: 'راهنمای کامل شروع کار',
      description: 'آموزش گام به گام راه‌اندازی و پیکربندی اولیه',
      icon: FaBook,
      link: '#',
      duration: '۴۵ دقیقه',
      level: 'مبتدی',
      isPopular: true
    },
    {
      title: 'مدیریت کاربران و نقش‌ها',
      description: 'آموزش کامل سیستم احراز هویت و دسترسی‌ها',
      icon: FaUser,
      link: '#',
      duration: '۳۰ دقیقه',
      level: 'متوسط'
    },
    {
      title: 'گزارش‌گیری پیشرفته',
      description: 'نحوه ایجاد گزارش‌های سفارشی و تحلیلی',
      icon: FaChartLine,
      link: '#',
      duration: '۲۵ دقیقه',
      level: 'پیشرفته',
      isNew: true
    },
    {
      title: 'اتوماسیون و گردش کار',
      description: 'خودکارسازی فرآیندها با Workflow Engine',
      icon: FaMagic,
      link: '#',
      duration: '۵۰ دقیقه',
      level: 'پیشرفته'
    },
    {
      title: 'تنظیمات امنیتی',
      description: 'پیکربندی تنظیمات امنیتی و حریم خصوصی',
      icon: FaShieldAlt,
      link: '#',
      duration: '۲۰ دقیقه',
      level: 'متوسط'
    },
    {
      title: 'API و یکپارچه‌سازی',
      description: 'اتصال به سیستم‌های خارجی با API',
      icon: FaCode,
      link: '#',
      duration: '۳۵ دقیقه',
      level: 'پیشرفته'
    }
  ];

  const categories = [
    { id: 'all', label: 'همه' },
    { id: 'کاربران', label: 'کاربران' },
    { id: 'دوره‌ها', label: 'دوره‌ها' },
    { id: 'مالی', label: 'مالی' },
    { id: 'پشتیبانی', label: 'پشتیبانی' },
    { id: 'تنظیمات', label: 'تنظیمات' },
    { id: 'لایسنس', label: 'لایسنس' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchCategory = activeCategory === 'all' || faq.category === activeCategory;
    
    return matchSearch && matchCategory;
  });

  const socialLinks = [
    { icon: FaTelegram, label: 'تلگرام', link: 'https://t.me/fartak_support', color: '#0088cc' },
    { icon: FaWhatsapp, label: 'واتساپ', link: 'https://wa.me/98912345678', color: '#25D366' },
    { icon: FaInstagram, label: 'اینستاگرام', link: 'https://instagram.com/fartak', color: '#E4405F' },
    { icon: FaTwitter, label: 'توییتر', link: 'https://twitter.com/fartak', color: '#1DA1F2' },
    { icon: FaYoutube, label: 'یوتیوب', link: 'https://youtube.com/@fartak', color: '#FF0000' },
    { icon: FaLinkedin, label: 'لینکدین', link: 'https://linkedin.com/company/fartak', color: '#0A66C2' },
    { icon: FaGithub, label: 'گیت‌هاب', link: 'https://github.com/fartak', color: '#333' },
    { icon: FaDiscord, label: 'دیسکورد', link: 'https://discord.gg/fartak', color: '#5865F2' }
  ];

  return (
    <div className="admin-page admin-support-ultra">
      {/* ============ Header ============ */}
      <div className="page-header">
        <div>
          <h1><FaHeadset /> پشتیبانی و راهنما</h1>
          <p>راهنما، آموزش و ارتباط با تیم پشتیبانی فرتاک</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowTicketForm(!showTicketForm)}
          >
            <FaTicketAlt /> {showTicketForm ? 'بستن فرم' : 'تیکت جدید'}
          </button>
          <button className="btn-secondary" onClick={() => window.open('/docs', '_blank')}>
            <FaBook /> مستندات کامل
          </button>
        </div>
      </div>

      <div className="support-layout">
        {/* ============ Main Content ============ */}
        <div className="support-main">
          {/* Quick Ticket Form */}
          <AnimatePresence>
            {showTicketForm && (
              <QuickTicketForm onClose={() => setShowTicketForm(false)} />
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="support-search-advanced">
            <FaSearch />
            <input 
              type="text" 
              placeholder="سوال خود را جستجو کنید..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <FaTimes />
              </button>
            )}
            <span className="search-hint">
              <FaHistory size={10} /> جستجو در {faqs.length} سوال
            </span>
          </div>

          {/* Category Filters */}
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="faq-section-advanced">
            <h3>
              <FaQuestionCircle /> سوالات متداول
              <span className="faq-count">{filteredFaqs.length}</span>
            </h3>
            
            <div className="faq-list">
              {filteredFaqs.map((faq, index) => (
                <FAQItem 
                  key={index} 
                  {...faq} 
                  onHelpful={(isHelpful) => {
                    console.log(`FAQ feedback: ${isHelpful}`);
                  }}
                />
              ))}
              
              {filteredFaqs.length === 0 && (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FaSearch size={48} />
                  <h4>سوالی یافت نشد</h4>
                  <p>لطفاً عبارت دیگری جستجو کنید یا تیکت جدید ثبت کنید.</p>
                  <button className="btn-primary" onClick={() => setShowTicketForm(true)}>
                    <FaTicketAlt /> ثبت تیکت
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick Guides */}
          <div className="quick-guides">
            <h3><FaBook /> راهنماهای آموزشی</h3>
            <div className="guides-grid-advanced">
              {guides.map((guide, index) => (
                <GuideCard key={index} {...guide} />
              ))}
            </div>
          </div>
        </div>

        {/* ============ Sidebar ============ */}
        <div className="support-sidebar">
          {/* AI Assistant */}
          <AIAssistant />

          {/* Recent Tickets */}
          <div className="sidebar-section">
            <h4><FaHistory /> تیکت‌های اخیر</h4>
            <RecentTickets tickets={recentTickets} />
            <button 
              className="btn-link"
              onClick={() => window.location.href = '/admin/requests'}
            >
              مشاهده همه تیکت‌ها <FaArrowLeft />
            </button>
          </div>

          {/* Contact Info */}
          <div className="sidebar-section">
            <h4><FaPhone /> اطلاعات تماس</h4>
            <div className="contact-mini-list">
              <div className="contact-mini-item">
                <FaEnvelope />
                <div>
                  <strong>ایمیل</strong>
                  <span>support@fartak.ir</span>
                </div>
              </div>
              <div className="contact-mini-item">
                <FaPhone />
                <div>
                  <strong>تلفن</strong>
                  <span>۰۲۱-۱۲۳۴۵۶۷۸</span>
                </div>
              </div>
              <div className="contact-mini-item">
                <FaClock />
                <div>
                  <strong>ساعت کاری</strong>
                  <span>شنبه تا چهارشنبه ۹-۱۸</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="sidebar-section">
            <h4>شبکه‌های اجتماعی</h4>
            <div className="social-grid">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.link}
                  target="_blank"
                  className="social-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: social.color }}
                  title={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Download App */}
          <div className="sidebar-section download-app">
            <h4>📱 اپلیکیشن فرتاک</h4>
            <p>پنل مدیریت در موبایل شما</p>
            <div className="app-buttons">
              <button className="app-btn">
                <FaGoogle /> Google Play
              </button>
              <button className="app-btn">
                <FaApple /> App Store
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;