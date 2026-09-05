// ============================================================
// src/pages/admin/LicenseManager.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaKey, FaCalendarAlt, FaUsers, FaServer, FaSync, FaCopy,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaClock, FaSpinner, FaToggleOn, FaToggleOff, FaLock,
  FaUnlock, FaShieldAlt, FaCrown, FaGem
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const LicenseManager = () => {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [showActivation, setShowActivation] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    fetchLicenseInfo();
    fetchModules();
  }, []);

  const fetchLicenseInfo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license/info`);
      const data = await res.json();
      if (data.success) setLicense(data.data);
    } catch (error) {
      console.error('Error fetching license:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license/modules`);
      const data = await res.json();
      if (data.success) setModules(data.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleActivate = async () => {
    if (!activationKey) {
      toast.error('کلید لایسنس را وارد کنید');
      return;
    }
    
    setIsActivating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: activationKey })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('✅ لایسنس با موفقیت فعال شد!');
        fetchLicenseInfo();
        fetchModules();
        setShowActivation(false);
        setActivationKey('');
      } else {
        toast.error(data.message || 'خطا در فعال‌سازی');
      }
    } catch (error) {
      toast.error('❌ خطا در ارتباط با سرور');
    } finally {
      setIsActivating(false);
    }
  };

  const handleRenew = async () => {
    const months = prompt('مدت تمدید (ماه):', '12');
    if (!months) return;
    
    setIsRenewing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMonths: parseInt(months) })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchLicenseInfo();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('خطا در تمدید');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleToggleModule = async (moduleId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license/modules/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, active: !currentStatus })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchModules();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('خطا در تغییر وضعیت ماژول');
    }
  };

  const handleCopyKey = () => {
    if (license?.key) {
      navigator.clipboard.writeText(license.key);
      toast.success('📋 کلید لایسنس کپی شد');
    }
  };

  if (loading) {
    return (
      <div className="license-loading">
        <FaSpinner className="spinning" size={32} />
        <p>در حال دریافت اطلاعات لایسنس...</p>
      </div>
    );
  }

  // حالت بدون لایسنس
  if (!license || license.status === 'no_license') {
    return (
      <div className="license-manager">
        <motion.div 
          className="no-license-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaKey size={64} color="#f59e0b" />
          <h2>لایسنس فعال یافت نشد</h2>
          <p>برای استفاده از سامانه فرتاک، لطفاً لایسنس خود را فعال کنید.</p>
          
          {!showActivation ? (
            <button className="btn-primary" onClick={() => setShowActivation(true)}>
              <FaKey /> فعال‌سازی لایسنس
            </button>
          ) : (
            <motion.div 
              className="activation-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              <label>کلید لایسنس:</label>
              <input
                type="text"
                value={activationKey}
                onChange={e => setActivationKey(e.target.value)}
                placeholder="FRTK-2024-XXXX-XXXX"
                className="license-key-input"
              />
              <div className="activation-actions">
                <button 
                  className="btn-primary" 
                  onClick={handleActivate}
                  disabled={isActivating}
                >
                  {isActivating ? <FaSpinner className="spinning" /> : <FaUnlock />}
                  {isActivating ? 'در حال فعال‌سازی...' : 'فعال‌سازی'}
                </button>
                <button className="btn-cancel" onClick={() => setShowActivation(false)}>
                  انصراف
                </button>
              </div>
            </motion.div>
          )}
          
          <div className="purchase-info">
            <p>برای خرید لایسنس جدید به <a href="/signup">صفحه ثبت‌نام</a> مراجعه کنید.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // حالت با لایسنس فعال
  return (
    <div className="license-manager">
      {/* License Status Card */}
      <motion.div 
        className="license-status-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`status-badge ${license.status}`}>
          {license.status === 'active' ? (
            <><FaCheckCircle /> فعال</>
          ) : (
            <><FaTimesCircle /> منقضی</>
          )}
        </div>

        <div className="license-header">
          <FaCrown size={32} color="#f59e0b" />
          <div>
            <h2>{license.organizationName}</h2>
            <span className="license-type">{license.type === 'enterprise' ? 'سازمانی' : 'پایه'}</span>
          </div>
        </div>

        <div className="license-info-grid">
          <div className="info-item">
            <FaKey />
            <div>
              <span className="info-label">کلید لایسنس</span>
              <code>{license.key}</code>
              <button onClick={handleCopyKey} title="کپی">
                <FaCopy size={12} />
              </button>
            </div>
          </div>

          <div className="info-item">
            <FaCalendarAlt />
            <div>
              <span className="info-label">تاریخ شروع</span>
              <span>{new Date(license.startDate).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>

          <div className="info-item">
            <FaCalendarAlt />
            <div>
              <span className="info-label">تاریخ انقضا</span>
              <span>{new Date(license.expiryDate).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>

          <div className="info-item">
            <FaClock />
            <div>
              <span className="info-label">روزهای باقی‌مانده</span>
              <span className={`days-remaining ${license.daysRemaining <= 30 ? 'warning' : ''} ${license.daysRemaining <= 7 ? 'critical' : ''}`}>
                {license.daysRemaining} روز
              </span>
            </div>
          </div>

          <div className="info-item">
            <FaUsers />
            <div>
              <span className="info-label">کاربران</span>
              <span>{license.currentUsers} / {license.maxUsers}</span>
              <div className="user-progress">
                <div 
                  className="user-progress-fill" 
                  style={{ width: `${(license.currentUsers / license.maxUsers) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="license-actions">
          <button className="btn-primary" onClick={handleRenew} disabled={isRenewing}>
            {isRenewing ? <FaSpinner className="spinning" /> : <FaSync />}
            {isRenewing ? 'در حال تمدید...' : 'تمدید لایسنس'}
          </button>
        </div>

        {license.daysRemaining <= 30 && (
          <div className="expiry-warning">
            <FaExclamationTriangle />
            <span>
              {license.daysRemaining <= 7 
                ? '⚠️ لایسنس شما کمتر از یک هفته دیگر منقضی می‌شود!'
                : '⚠️ لایسنس شما به زودی منقضی می‌شود.'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Modules Grid */}
      <motion.div 
        className="modules-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3><FaServer /> ماژول‌های فعال</h3>
        
        <div className="modules-grid">
          {modules.map(module => (
            <motion.div
              key={module.id}
              className={`module-card ${module.is_active ? 'active' : 'inactive'} ${module.is_required ? 'required' : ''}`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="module-header">
                <span className="module-icon">
                  {module.id === 'courseware' ? '📚' :
                   module.id === 'roshena-sci' ? '🔬' :
                   module.id === 'live-classes' ? '📡' :
                   module.id === 'meeting' ? '💼' :
                   module.id === 'connect' ? '🔗' :
                   module.id === 'messenger' ? '💬' :
                   module.id === 'automation' ? '🤖' :
                   module.id === 'media' ? '🖼️' :
                   module.id === 'poll' ? '📊' :
                   module.id === 'security' ? '🛡️' :
                   module.id === 'storage' ? '💾' : '🔌'}
                </span>
                
                <button
                  className={`toggle-btn ${module.is_active ? 'on' : 'off'}`}
                  onClick={() => handleToggleModule(module.id, module.is_active)}
                  disabled={module.is_required}
                  title={module.is_required ? 'ماژول الزامی' : 'تغییر وضعیت'}
                >
                  {module.is_active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                </button>
              </div>
              
              <h4>{module.name}</h4>
              
              {module.is_required && (
                <span className="badge required">
                  <FaLock size={10} /> الزامی
                </span>
              )}
              
              {module.is_active && !module.is_required && (
                <span className="badge active">
                  <FaCheckCircle size={10} /> فعال
                </span>
              )}
              
              {!module.is_active && (
                <span className="badge inactive">
                  <FaTimesCircle size={10} /> غیرفعال
                </span>
              )}
              
              {module.expiry_date && (
                <span className="expiry-date">
                  <FaCalendarAlt size={10} />
                  {new Date(module.expiry_date).toLocaleDateString('fa-IR')}
                </span>
              )}
              
              {module.price > 0 && (
                <span className="module-price">
                  <FaGem size={10} />
                  {module.price.toLocaleString()} تومان
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LicenseManager;