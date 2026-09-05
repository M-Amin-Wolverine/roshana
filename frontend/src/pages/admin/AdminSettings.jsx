// ============================================================
// AdminSettings.jsx - پنل تنظیمات پیشرفته با طراحی مدرن
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaCog, FaSave, FaGlobe, FaPalette, FaBell, FaShieldAlt,
  FaDatabase, FaEnvelope, FaKey, FaUserCog, FaCloudUploadAlt,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaUndo, FaPhone,
  FaImage, FaSignInAlt, FaRocket, FaLayerGroup
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './AdminSettings.css';

// ============================================================
// انیمیشن‌های سفارشی
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

// ============================================================
// کامپوننت‌های بخش تنظیمات
// ============================================================

const GeneralSettings = ({ settings, setSettings, handleSave, isSaving }) => {
  return (
    <motion.div 
      className="settings-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-header">
        <div className="section-icon gradient-blue">
          <FaGlobe />
        </div>
        <div>
          <h3>تنظیمات عمومی</h3>
          <p>مدیریت اطلاعات پایه‌ای سایت</p>
        </div>
      </div>

      <div className="settings-form">
        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">
            <FaLayerGroup className="label-icon" />
            عنوان سایت
          </label>
          <input 
            type="text"
            className="modern-input"
            value={settings.site_title || ''}
            onChange={(e) => setSettings({...settings, site_title: e.target.value})}
            placeholder="نام سایت خود را وارد کنید"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">
            <FaRocket className="label-icon" />
            توضیحات سایت
          </label>
          <textarea 
            className="modern-textarea"
            value={settings.site_description || ''}
            onChange={(e) => setSettings({...settings, site_description: e.target.value})}
            rows={3}
            placeholder="توضیح کوتاهی درباره سایت بنویسید"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">
            <FaImage className="label-icon" />
            لوگوی سایت
          </label>
          <div className="file-upload-wrapper">
            <input 
              type="text"
              className="modern-input"
              value={settings.site_logo || ''}
              onChange={(e) => setSettings({...settings, site_logo: e.target.value})}
              placeholder="آدرس لوگو را وارد کنید"
            />
            <button className="upload-btn">
              <FaCloudUploadAlt /> آپلود
            </button>
          </div>
          {settings.site_logo && (
            <motion.div 
              className="logo-preview"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <img src={settings.site_logo} alt="پیش‌نمایش لوگو" />
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className="form-actions"
          variants={itemVariants}
        >
          <motion.button 
            className="btn-save"
            onClick={() => handleSave('general')}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <FaSpinner className="spinning" />
            ) : (
              <FaSave />
            )}
            {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </motion.button>
          <motion.button 
            className="btn-reset"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaUndo /> بازنشانی
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ContactSettings = ({ settings, setSettings, handleSave, isSaving }) => {
  return (
    <motion.div 
      className="settings-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-header">
        <div className="section-icon gradient-green">
          <FaPhone />
        </div>
        <div>
          <h3>اطلاعات تماس</h3>
          <p>راه‌های ارتباطی با کاربران</p>
        </div>
      </div>

      <div className="settings-form">
        <motion.div className="form-row-2" variants={itemVariants}>
          <div className="form-group">
            <label className="form-label">تلفن پشتیبانی</label>
            <input 
              type="tel"
              className="modern-input"
              value={settings.support_phone || ''}
              onChange={(e) => setSettings({...settings, support_phone: e.target.value})}
              placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
            />
          </div>
          <div className="form-group">
            <label className="form-label">ایمیل پشتیبانی</label>
            <input 
              type="email"
              className="modern-input"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({...settings, support_email: e.target.value})}
              placeholder="support@example.com"
            />
          </div>
        </motion.div>

        <motion.div 
          className="form-actions"
          variants={itemVariants}
        >
          <motion.button 
            className="btn-save"
            onClick={() => handleSave('contact')}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            ذخیره اطلاعات تماس
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const AppearanceSettings = ({ settings, setSettings, handleSave, isSaving }) => {
  const [theme, setTheme] = useState('light');

  return (
    <motion.div 
      className="settings-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-header">
        <div className="section-icon gradient-purple">
          <FaPalette />
        </div>
        <div>
          <h3>تنظیمات ظاهری</h3>
          <p>شخصی‌سازی رنگ و قالب سایت</p>
        </div>
      </div>

      <div className="settings-form">
        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">تم سایت</label>
          <div className="theme-selector">
            {['light', 'dark', 'auto'].map((t) => (
              <motion.button
                key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => setTheme(t)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t === 'light' && '☀️ روشن'}
                {t === 'dark' && '🌙 تاریک'}
                {t === 'auto' && '🔄 خودکار'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="form-actions"
          variants={itemVariants}
        >
          <motion.button 
            className="btn-save"
            onClick={() => handleSave('appearance')}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaSave /> ذخیره تنظیمات ظاهری
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const LoginPageSettings = ({ settings, setSettings, handleSave, isSaving }) => {
  return (
    <motion.div 
      className="settings-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-header">
        <div className="section-icon gradient-orange">
          <FaSignInAlt />
        </div>
        <div>
          <h3>صفحه ورود</h3>
          <p>شخصی‌سازی صفحه لاگین</p>
        </div>
      </div>

      <div className="settings-form">
        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">تصویر پس‌زمینه صفحه ورود</label>
          <div className="file-upload-wrapper">
            <input 
              type="text"
              className="modern-input"
              value={settings.login_main_image || ''}
              onChange={(e) => setSettings({...settings, login_main_image: e.target.value})}
              placeholder="آدرس تصویر را وارد کنید"
            />
            <button className="upload-btn">
              <FaCloudUploadAlt /> آپلود
            </button>
          </div>
          {settings.login_main_image && (
            <motion.div 
              className="image-preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img src={settings.login_main_image} alt="پیش‌نمایش" />
            </motion.div>
          )}
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label className="form-label">متن خوش‌آمدگویی</label>
          <textarea 
            className="modern-textarea"
            value={settings.login_welcome_text || ''}
            onChange={(e) => setSettings({...settings, login_welcome_text: e.target.value})}
            rows={2}
            placeholder="متن خوش‌آمدگویی صفحه ورود"
          />
        </motion.div>

        <motion.div 
          className="form-actions"
          variants={itemVariants}
        >
          <motion.button 
            className="btn-save"
            onClick={() => handleSave('login')}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            ذخیره تنظیمات صفحه ورود
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================
// کامپوننت اصلی
// ============================================================

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'عمومی', icon: FaGlobe, gradient: 'gradient-blue' },
    { id: 'contact', label: 'تماس', icon: FaPhone, gradient: 'gradient-green' },
    { id: 'appearance', label: 'ظاهری', icon: FaPalette, gradient: 'gradient-purple' },
    { id: 'login', label: 'صفحه ورود', icon: FaSignInAlt, gradient: 'gradient-orange' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cms/settings`);
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        toast.error('خطا در دریافت تنظیمات');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    setIsSaving(true);
    const updates = {};
    
    switch(section) {
      case 'general':
        updates.site_title = settings.site_title;
        updates.site_description = settings.site_description;
        updates.site_logo = settings.site_logo;
        break;
      case 'contact':
        updates.support_phone = settings.support_phone;
        updates.support_email = settings.support_email;
        break;
      case 'login':
        updates.login_main_image = settings.login_main_image;
        updates.login_welcome_text = settings.login_welcome_text;
        break;
      default:
        break;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cms/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('تنظیمات با موفقیت ذخیره شد 🎉');
      } else {
        toast.error('خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <FaCog />
        </motion.div>
        <p>در حال بارگذاری تنظیمات...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings-wrapper">
      <Toaster position="top-left" />
      
      {/* هدر صفحه */}
      <motion.div 
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <motion.div 
            className="header-icon"
            animate={pulseAnimation}
          >
            <FaCog />
          </motion.div>
          <div>
            <h1>تنظیمات سیستم</h1>
            <p>مدیریت و پیکربندی تنظیمات سایت</p>
          </div>
        </div>
      </motion.div>

      {/* ناوبری تب‌ها */}
      <div className="settings-tabs">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <tab.icon />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                className="active-indicator"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* محتوای تنظیمات */}
      <div className="settings-content">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <GeneralSettings 
              key="general"
              settings={settings}
              setSettings={setSettings}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'contact' && (
            <ContactSettings 
              key="contact"
              settings={settings}
              setSettings={setSettings}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'appearance' && (
            <AppearanceSettings 
              key="appearance"
              settings={settings}
              setSettings={setSettings}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'login' && (
            <LoginPageSettings 
              key="login"
              settings={settings}
              setSettings={setSettings}
              handleSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminSettings;