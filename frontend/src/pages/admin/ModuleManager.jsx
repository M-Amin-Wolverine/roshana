import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FaToggleOn, FaToggleOff, FaKey, FaSync, FaInfoCircle,
  FaCalendarAlt, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';

const MODULES = [
  { id: 'courseware', name: 'CourseWare', icon: '📚', required: true, active: true },
  { id: 'roshena-sci', name: 'Roshena Sci', icon: '🔬', active: false, expiryDate: null },
  { id: 'live-classes', name: 'Live Classes', icon: '📡', active: true, expiryDate: '2025-06-15' },
  { id: 'meeting', name: 'Meeting Hub', icon: '💼', active: false },
  { id: 'connect', name: 'Connect', icon: '🔗', active: true },
  { id: 'messenger', name: 'Messenger', icon: '💬', active: true },
  { id: 'automation', name: 'Automation', icon: '🤖', active: false },
  { id: 'media', name: 'Media Gallery', icon: '🖼️', active: false },
  { id: 'poll', name: 'Poll & Survey', icon: '📊', active: true },
  { id: 'security', name: 'Security Suite', icon: '🛡️', active: false },
  { id: 'storage', name: 'Data Center', icon: '💾', active: false },
  { id: 'api', name: 'API Gateway', icon: '🔌', active: false }
];

const ModuleManager = () => {
  const [modules, setModules] = useState(MODULES);
  const [licenseInfo, setLicenseInfo] = useState({
    key: 'FRTK-2024-XXXX-XXXX',
    type: 'Enterprise',
    expiryDate: '2025-12-31',
    daysRemaining: 245,
    maxUsers: 1000,
    activeUsers: 847,
    status: 'active'
  });

  const toggleModule = async (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (module.required) {
      toast.error('این ماژول الزامی است و نمی‌توان غیرفعال کرد');
      return;
    }

    if (!module.active && !module.expiryDate) {
      toast('این ماژول نیاز به خرید لایسنس جداگانه دارد', { icon: '🔑' });
      return;
    }

    if (!module.active && module.expiryDate && new Date(module.expiryDate) < new Date()) {
      toast.error('لایسنس این ماژول منقضی شده است');
      return;
    }

    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, active: !m.active } : m
    ));

    toast.success(`${module.active ? 'غیرفعال' : 'فعال'}‌سازی "${module.name}" با موفقیت انجام شد`);
  };

  return (
    <div className="module-manager">
      <motion.div 
        className="license-status-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`status-badge ${licenseInfo.status}`}>
          {licenseInfo.status === 'active' ? '✅ فعال' : 
           licenseInfo.status === 'expiring' ? '⚠️ در حال انقضا' : '❌ منقضی'}
        </div>
        <div className="license-info-row">
          <span>کلید لایسنس:</span>
          <code>{licenseInfo.key}</code>
          <button onClick={() => { navigator.clipboard.writeText(licenseInfo.key); toast.success('کپی شد'); }}>
            📋
          </button>
        </div>
        <div className="license-stats">
          <div className="stat">
            <FaCalendarAlt />
            <span>{licenseInfo.daysRemaining} روز باقی‌مانده</span>
          </div>
          <div className="stat">
            <FaKey />
            <span>نوع: {licenseInfo.type}</span>
          </div>
          <div className="stat">
            <FaUsers />
            <span>{licenseInfo.activeUsers}/{licenseInfo.maxUsers} کاربر</span>
          </div>
        </div>
        <button className="renew-btn">
          <FaSync /> تمدید لایسنس
        </button>
      </motion.div>

      <div className="modules-grid">
        {modules.map(module => (
          <motion.div
            key={module.id}
            className={`module-card ${module.active ? 'active' : 'inactive'} ${module.required ? 'required' : ''}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="module-header">
              <span className="module-icon">{module.icon}</span>
              <button
                className={`toggle-btn ${module.active ? 'on' : 'off'}`}
                onClick={() => toggleModule(module.id)}
              >
                {module.active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
              </button>
            </div>
            <h4>{module.name}</h4>
            
            {module.required && <span className="badge required">الزامی</span>}
            {module.active && !module.required && <span className="badge active">فعال</span>}
            {!module.active && module.expiryDate && new Date(module.expiryDate) > new Date() && (
              <span className="badge available">قابل فعال‌سازی</span>
            )}
            {!module.active && (!module.expiryDate || new Date(module.expiryDate) < new Date()) && (
              <span className="badge locked">
                <FaKey size={10} /> نیاز به خرید
              </span>
            )}
            
            {module.expiryDate && (
              <span className="expiry-date">
                <FaCalendarAlt size={10} />
                {new Date(module.expiryDate).toLocaleDateString('fa-IR')}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ModuleManager;