import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaKey, 
  FaCheck, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaShieldAlt, 
  FaRocket, 
  FaGem, 
  FaStar, 
  FaArrowLeft,
  FaCopy,
  FaRegCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCrown,
  FaInfinity
} from 'react-icons/fa';
import { MdVerified, MdSecurity } from 'react-icons/md';
import { HiOutlineSparkles } from 'react-icons/hi';

const ActivationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { licenseKey, adminEmail, productName, planType } = location.state || {};
  
  const [activationCode, setActivationCode] = useState(licenseKey || '');
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState('idle');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [showParticles, setShowParticles] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  
  // Auto focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Format license key input (XXXX-XXXX-XXXX-XXXX)
  const handleLicenseInput = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = [];
    for (let i = 0; i < value.length && i < 16; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    let formatted = parts.join('-');
    if (formatted.length > 19) formatted = formatted.slice(0, 19);
    setActivationCode(formatted);
    setActivationStatus('idle');
  };
  
  const copyToClipboard = () => {
    if (activationCode) {
      navigator.clipboard.writeText(activationCode);
      setCopied(true);
      toast.success('کد کپی شد!');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleActivate = async () => {
    if (!activationCode || activationCode.length < 19) {
      toast.error('لطفاً کد فعال‌سازی معتبر وارد کنید (XXXX-XXXX-XXXX-XXXX)', {
        icon: '⚠️',
        duration: 4000,
        style: { background: '#1e1e2e', color: '#fff', fontFamily: 'Vazirmatn' }
      });
      inputRef.current?.focus();
      return;
    }
    
    if (remainingAttempts <= 0) {
      toast.error('تعداد تلاش‌های شما به پایان رسیده. لطفاً با پشتیبانی تماس بگیرید.', {
        icon: '🔒',
        duration: 5000
      });
      return;
    }
    
    setIsActivating(true);
    setActivationStatus('verifying');
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch('/api/v1/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          licenseKey: activationCode, 
          adminEmail,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActivationStatus('success');
        setShowParticles(true);
        
        toast.custom((t) => (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <FaRegCheckCircle size={24} />
              <div>
                <div className="font-bold">✅ فعال‌سازی موفق!</div>
                <div className="text-sm opacity-90">محصول {productName || 'فرتاک سای‌لند'} با موفقیت فعال شد</div>
              </div>
            </div>
          </div>
        ), { duration: 4000 });
        
        // Save activation info
        localStorage.setItem('fartak_license', activationCode);
        localStorage.setItem('fartak_activated_at', new Date().toISOString());
        localStorage.setItem('fartak_plan', planType || 'enterprise');
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2500);
      } else {
        setRemainingAttempts(prev => prev - 1);
        setActivationStatus('failed');
        
        toast.error(data.message || 'کد فعال‌سازی نامعتبر است', {
          icon: '❌',
          duration: 4000
        });
        
        // Shake animation on input
        inputRef.current?.classList.add('shake');
        setTimeout(() => inputRef.current?.classList.remove('shake'), 500);
      }
    } catch (error) {
      setActivationStatus('failed');
      toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.', {
        icon: '🌐',
        duration: 5000
      });
    } finally {
      setIsActivating(false);
    }
  };
  
  // Plan benefits
  const planBenefits = {
    enterprise: ['پشتیبانی ۲۴/۷', 'نامحدود کاربر', 'API دسترسی کامل', 'فضای ابری ۱ ترابایت'],
    professional: ['پشتیبانی ۱۲ ساعته', 'تا ۵۰۰ کاربر', 'API محدود', 'فضای ابری ۵۰۰ گیگ'],
    basic: ['پشتیبانی ۸ ساعته', 'تا ۱۰۰ کاربر', 'بدون API', 'فضای ابری ۱۰۰ گیگ']
  };
  
  const currentBenefits = planBenefits[planType] || planBenefits.enterprise;
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0520] via-[#12083a] to-[#0a0118]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', top: -200, left: -200 }}
          animate={{ x: [0, 100, 0], y: [0, 80, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute rounded-full blur-[100px]"
          style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', bottom: -150, right: -100 }}
          animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
        <motion.div
          className="absolute rounded-full blur-[80px]"
          style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', top: '30%', left: '60%' }}
          animate={{ x: [0, 60, -40, 0], y: [0, -50, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>
      
      {/* Particles on success */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ 
                x: '50%', 
                y: '50%', 
                opacity: 1,
                scale: 1
              }}
              animate={{ 
                x: `${Math.random() * 200 - 100}%`,
                y: `${Math.random() * 200 - 100}%`,
                opacity: 0,
                scale: 0
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
      
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Main Card */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Gradient Border Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-indigo-500/30 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500/30 rounded-tr-2xl" />
          
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-5 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-10 text-sm"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft size={14} />
            بازگشت
          </motion.button>
          
          <div className="p-8 pt-12">
            {/* Icon Section */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-2xl opacity-50" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  {activationStatus === 'success' ? (
                    <FaCheck size={32} className="text-white" />
                  ) : activationStatus === 'failed' ? (
                    <FaTimesCircle size={32} className="text-white" />
                  ) : (
                    <FaKey size={32} className="text-white" />
                  )}
                </div>
                {activationStatus === 'verifying' && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <FaHourglassHalf size={12} className="text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* Title Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                فعال‌سازی محصول
              </h2>
              <p className="text-gray-400 text-sm">
                لطفاً کد لایسنس خود را وارد کنید تا از تمامی امکانات ویژه بهره‌مند شوید
              </p>
            </div>
            
            {/* Product Badge */}
            {productName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full px-4 py-2 border border-indigo-500/30">
                  <FaCrown size={14} className="text-yellow-500" />
                  <span className="text-xs font-semibold text-white">{productName}</span>
                  <span className="text-xs text-indigo-300">
                    {planType === 'enterprise' ? 'نسخه سازمانی' : planType === 'professional' ? 'نسخه حرفه‌ای' : 'نسخه پایه'}
                  </span>
                </div>
              </motion.div>
            )}
            
            {/* License Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                کد لایسنس
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={activationCode}
                  onChange={handleLicenseInput}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className={`w-full px-4 py-3 pl-12 bg-white/5 border rounded-xl text-white text-center tracking-wider font-mono text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    activationStatus === 'failed' ? 'border-red-500 ring-1 ring-red-500' : 'border-white/10'
                  }`}
                  maxLength={19}
                  disabled={isActivating}
                />
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                {activationCode && (
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors"
                  >
                    <FaCopy size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                فرمت کد: XXXX-XXXX-XXXX-XXXX
              </p>
            </div>
            
            {/* Attempts Warning */}
            {remainingAttempts <= 2 && remainingAttempts > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2"
              >
                <FaExclamationTriangle size={14} className="text-yellow-500" />
                <span className="text-xs text-yellow-400">
                  {remainingAttempts} تلاش باقی مانده. پس از {remainingAttempts} بار تلاش ناموفق، حساب شما قفل خواهد شد.
                </span>
              </motion.div>
            )}
            
            {/* Activate Button */}
            <motion.button
              onClick={handleActivate}
              disabled={isActivating || remainingAttempts === 0}
              className={`w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 ${
                activationStatus === 'success' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : activationStatus === 'failed'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={!isActivating && remainingAttempts !== 0 ? { scale: 1.02 } : {}}
              whileTap={!isActivating && remainingAttempts !== 0 ? { scale: 0.98 } : {}}
            >
              {!isActivating && activationStatus !== 'success' && activationStatus !== 'failed' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              
              {isActivating ? (
                <>
                  <FaSpinner className="animate-spin" size={18} />
                  در حال بررسی و فعال‌سازی...
                </>
              ) : activationStatus === 'success' ? (
                <>
                  <FaCheck size={18} />
                  فعال‌سازی موفق! در حال انتقال به داشبورد...
                </>
              ) : activationStatus === 'failed' ? (
                <>
                  <FaTimesCircle size={18} />
                  فعال‌سازی ناموفق
                </>
              ) : (
                <>
                  <FaRocket size={18} />
                  فعال‌سازی محصول
                </>
              )}
            </motion.button>
            
            {/* Benefits Section */}
            {currentBenefits && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineSparkles size={16} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-white">
                    امکانات نسخه {planType === 'enterprise' ? 'سازمانی' : planType === 'professional' ? 'حرفه‌ای' : 'پایه'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <FaRegCheckCircle size={10} className="text-green-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Support Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                مشکل در فعال‌سازی؟{' '}
                <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  تماس با پشتیبانی
                </button>
              </p>
            </div>
          </div>
          
          {/* Bottom Decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        
        {/* Security Badge */}
        <div className="flex justify-center mt-4">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <MdSecurity size={14} />
            ارتباط امن و رمزنگاری شده
            <MdVerified size={14} className="text-indigo-400" />
          </div>
        </div>
      </motion.div>
      
      <style>{`
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        input::placeholder {
          color: #4a4a6a;
          text-align: center;
        }
        
        input:focus::placeholder {
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default ActivationPage;