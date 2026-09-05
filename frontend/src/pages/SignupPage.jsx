import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FaBuilding, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaShieldAlt, FaCheck, FaSpinner, FaArrowLeft, FaArrowRight,
  FaServer, FaUsers, FaKey, FaCheckCircle, FaRocket,
  FaChartLine, FaHeadset, FaSyncAlt, FaGift
} from 'react-icons/fa';
import { MdVerified, MdSecurity } from 'react-icons/md';
import { HiOutlineSparkles } from 'react-icons/hi';

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    registrationNumber: '',
    taxNumber: '',
    website: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPosition: '',
    selectedModules: ['courseware'],
    userCount: 100,
    contractDuration: 12,
    username: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyAccepted: false
  });

  const MODULES = [
    { id: 'courseware', name: 'CourseWare', icon: '📚', description: 'سیستم مدیریت دوره‌های آموزشی', required: true, price: 0 },
    { id: 'roshena-sci', name: 'Roshena Sci', icon: '🔬', description: 'پلتفرم پژوهش علمی', price: 5000000 },
    { id: 'live-classes', name: 'Live Classes', icon: '📡', description: 'کلاس‌های آنلاین HD', price: 8000000 },
    { id: 'meeting', name: 'Meeting Hub', icon: '💼', description: 'ویدئو کنفرانس', price: 4000000 },
    { id: 'connect', name: 'Connect', icon: '🔗', description: 'پورتال استاد-دانشجو', price: 3000000 },
    { id: 'messenger', name: 'Messenger', icon: '💬', description: 'پیام‌رسان امن', price: 2000000 },
    { id: 'automation', name: 'Automation', icon: '🤖', description: 'اتوماسیون اداری', price: 6000000 },
    { id: 'media', name: 'Media Gallery', icon: '🎬', description: 'مدیریت دارایی دیجیتال', price: 3000000 }
  ];

  const calculateTotalPrice = () => {
    const basePrice = 10000000;
    const modulePrices = formData.selectedModules
      .map(m => MODULES.find(mod => mod.id === m)?.price || 0)
      .reduce((a, b) => a + b, 0);
    const userMultiplier = Math.ceil(formData.userCount / 100);
    const durationDiscount = formData.contractDuration >= 24 ? 0.15 : formData.contractDuration >= 12 ? 0.10 : 0;
    const totalBeforeDiscount = (basePrice + modulePrices) * userMultiplier;
    const discount = totalBeforeDiscount * durationDiscount;
    return {
      basePrice, modulePrices, userMultiplier, totalBeforeDiscount,
      discount, finalPrice: totalBeforeDiscount - discount,
      monthlyPrice: (totalBeforeDiscount - discount) / formData.contractDuration
    };
  };

  const pricing = calculateTotalPrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error('لطفاً قوانین و مقررات را بپذیرید');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('✅ ثبت‌نام با موفقیت انجام شد!');
      setTimeout(() => navigate('/activation', { 
        state: { licenseKey: 'FRTK-' + Math.random().toString(36).substring(2, 10).toUpperCase(), adminEmail: formData.adminEmail } 
      }), 2000);
    } catch { toast.error('❌ خطا در ثبت‌نام'); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Animated Background */}
        <div className="signup-bg">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        {/* Header */}
        <motion.div className="signup-header" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="header-icon"><HiOutlineSparkles /></div>
          <h1>ثبت‌نام سازمانی <span className="gradient-text">فرتاک</span></h1>
          <p>خرید و فعال‌سازی سامانه جامع مدیریت آموزشی</p>
        </motion.div>

        {/* Steps */}
        <div className="steps-container">
          {[
            { step: 1, label: 'سازمان', icon: '🏢' },
            { step: 2, label: 'مدیر', icon: '👤' },
            { step: 3, label: 'ماژول‌ها', icon: '📦' },
            { step: 4, label: 'حساب کاربری', icon: '🔐' },
            { step: 5, label: 'تأیید', icon: '✅' }
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <div className={`step ${step === s.step ? 'active' : ''} ${step > s.step ? 'completed' : ''}`}>
                <div className="step-number">{step > s.step ? <FaCheckCircle /> : s.icon}</div>
                <span className="step-label">{s.label}</span>
              </div>
              {idx < 4 && <div className="step-line"><div className="step-line-progress" style={{ width: step > idx + 1 ? '100%' : '0%' }} /></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <motion.div className="signup-content" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <h3><FaBuilding /> اطلاعات سازمان</h3>
                  <div className="form-grid">
                    <div className="form-group"><label>نام سازمان <span className="required">*</span></label><input value={formData.organizationName} onChange={e => setFormData(p => ({ ...p, organizationName: e.target.value }))} placeholder="مثال: دانشگاه صدا و سیما" /></div>
                    <div className="form-group"><label>نوع سازمان <span className="required">*</span></label><select value={formData.organizationType} onChange={e => setFormData(p => ({ ...p, organizationType: e.target.value }))}><option value="">انتخاب کنید...</option><option value="university">دانشگاه</option><option value="school">مدرسه</option><option value="institute">موسسه آموزشی</option><option value="company">شرکت</option><option value="government">سازمان دولتی</option></select></div>
                    <div className="form-group"><label>شماره ثبت <span className="required">*</span></label><input value={formData.registrationNumber} onChange={e => setFormData(p => ({ ...p, registrationNumber: e.target.value }))} placeholder="شماره ثبت سازمان" /></div>
                    <div className="form-group"><label>کد اقتصادی</label><input value={formData.taxNumber} onChange={e => setFormData(p => ({ ...p, taxNumber: e.target.value }))} placeholder="کد اقتصادی (اختیاری)" /></div>
                    <div className="form-group full-width"><label>وب‌سایت</label><div className="input-icon"><FaGlobe /><input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://example.ac.ir" /></div></div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <h3><FaUser /> اطلاعات مدیر سیستم</h3>
                  <div className="form-grid">
                    <div className="form-group"><label>نام <span className="required">*</span></label><input value={formData.adminFirstName} onChange={e => setFormData(p => ({ ...p, adminFirstName: e.target.value }))} /></div>
                    <div className="form-group"><label>نام خانوادگی <span className="required">*</span></label><input value={formData.adminLastName} onChange={e => setFormData(p => ({ ...p, adminLastName: e.target.value }))} /></div>
                    <div className="form-group"><label>ایمیل <span className="required">*</span></label><div className="input-icon"><FaEnvelope /><input type="email" value={formData.adminEmail} onChange={e => setFormData(p => ({ ...p, adminEmail: e.target.value }))} /></div></div>
                    <div className="form-group"><label>شماره تماس <span className="required">*</span></label><div className="input-icon"><FaPhone /><input value={formData.adminPhone} onChange={e => setFormData(p => ({ ...p, adminPhone: e.target.value }))} /></div></div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <h3><FaServer /> انتخاب ماژول‌ها</h3>
                  <p className="section-desc">ماژول‌های مورد نیاز خود را انتخاب کنید</p>
                  <div className="modules-grid">
                    {MODULES.map(module => (
                      <div key={module.id} className={`module-card ${formData.selectedModules.includes(module.id) ? 'selected' : ''} ${module.required ? 'required' : ''}`} onClick={() => { if (!module.required) setFormData(p => ({ ...p, selectedModules: p.selectedModules.includes(module.id) ? p.selectedModules.filter(m => m !== module.id) : [...p.selectedModules, module.id] })); }}>
                        <span className="module-icon">{module.icon}</span><h4>{module.name}</h4><p>{module.description}</p><span className="module-price">{module.price === 0 ? 'رایگان' : `${module.price.toLocaleString()} تومان/ماه`}</span>
                        {module.required && <span className="required-badge">الزامی</span>}{formData.selectedModules.includes(module.id) && <span className="selected-badge"><FaCheck /></span>}
                      </div>
                    ))}
                  </div>
                  <div className="slider-section"><label>تعداد کاربران <span className="required">*</span></label><input type="range" min="10" max="10000" step="10" value={formData.userCount} onChange={e => setFormData(p => ({ ...p, userCount: Number(e.target.value) }))} /><span className="slider-value">{formData.userCount.toLocaleString()} کاربر</span></div>
                  <div className="duration-section"><label>مدت قرارداد <span className="required">*</span></label><div className="duration-buttons">{[6, 12, 24, 36].map(m => (<button key={m} type="button" className={`duration-btn ${formData.contractDuration === m ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, contractDuration: m }))}>{m} ماه {m >= 24 && <span className="discount-badge">۱۵٪</span>}{m === 12 && <span className="discount-badge">۱۰٪</span>}</button>))}</div></div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <h3><FaKey /> اطلاعات حساب کاربری</h3>
                  <div className="form-grid">
                    <div className="form-group full-width"><label>نام کاربری <span className="required">*</span></label><input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="نام کاربری برای ورود به پنل" /></div>
                    <div className="form-group"><label>رمز عبور <span className="required">*</span></label><input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} /></div>
                    <div className="form-group"><label>تکرار رمز <span className="required">*</span></label><input type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} /></div>
                  </div>
                  <div className="password-hint">رمز عبور باید حداقل ۸ کاراکتر شامل حروف و اعداد باشد</div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <h3><FaCheckCircle /> تأیید نهایی</h3>
                  <div className="summary-card">
                    <div className="summary-row"><span>قیمت پایه فرتاک</span><span>{pricing.basePrice.toLocaleString()} تومان</span></div>
                    {formData.selectedModules.filter(m => m !== 'courseware').map(m => { const mod = MODULES.find(x => x.id === m); return (<div key={m} className="summary-row"><span>{mod?.icon} {mod?.name}</span><span>{mod?.price.toLocaleString()} تومان</span></div>); })}
                    <div className="summary-divider" />
                    <div className="summary-row"><span>تعداد کاربران</span><span>{formData.userCount} کاربر (×{pricing.userMultiplier})</span></div>
                    <div className="summary-row"><span>مدت قرارداد</span><span>{formData.contractDuration} ماه</span></div>
                    {pricing.discount > 0 && (<div className="summary-row discount"><span>تخفیف</span><span>-{pricing.discount.toLocaleString()} تومان</span></div>)}
                    <div className="summary-divider" />
                    <div className="summary-row total"><span>مبلغ نهایی</span><span className="total-price">{pricing.finalPrice.toLocaleString()} تومان</span></div>
                    <div className="summary-row monthly"><span>پرداخت ماهانه</span><span>{pricing.monthlyPrice.toLocaleString()} تومان</span></div>
                  </div>
                  <div className="terms"><label><input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData(p => ({ ...p, termsAccepted: e.target.checked }))} /><span>قوانین و مقررات را می‌پذیرم</span></label><label><input type="checkbox" checked={formData.privacyAccepted} onChange={e => setFormData(p => ({ ...p, privacyAccepted: e.target.checked }))} /><span>با سیاست حریم خصوصی موافقم</span></label></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-buttons">
              {step > 1 && <button type="button" className="btn-prev" onClick={() => setStep(p => p - 1)}><FaArrowRight /> قبلی</button>}
              {step < 5 && <button type="button" className="btn-next" onClick={() => setStep(p => p + 1)}>بعدی <FaArrowLeft /></button>}
              {step === 5 && <button type="submit" className="btn-submit" disabled={isSubmitting || !formData.termsAccepted || !formData.privacyAccepted}>{isSubmitting ? <><FaSpinner className="spin" /> در حال ثبت...</> : <><FaRocket /> تأیید و پرداخت</>}</button>}
            </div>
          </form>
        </motion.div>

        <div className="signup-footer"><p>قبلاً ثبت‌نام کرده‌اید؟ <a href="/login">ورود به پنل</a></p></div>
      </div>

      <style jsx="true">{`
        .signup-page { min-height: 100vh; background: linear-gradient(135deg, #0a0520 0%, #12083a 50%, #0a0118 100%); padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; position: relative; overflow-x: hidden; }
        .signup-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 2; }
        .signup-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.3; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1,transparent); top: -200px; left: -200px; animation: float 20s infinite; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6,transparent); bottom: -150px; right: -150px; animation: float 18s infinite reverse; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #ec4899,transparent); top: 50%; left: 50%; animation: float 25s infinite; }
        @keyframes float { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-50px)} 66%{transform:translate(-20px,30px)} }
        .signup-header { text-align: center; margin-bottom: 40px; }
        .header-icon { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 30px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; box-shadow: 0 20px 40px rgba(99,102,241,0.3); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05);box-shadow:0 25px 50px rgba(99,102,241,0.5)} }
        .signup-header h1 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 10px; }
        .gradient-text { background: linear-gradient(135deg, #a78bfa, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .signup-header p { color: #9ca3af; font-size: 14px; }
        .steps-container { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 60px; backdrop-filter: blur(10px); }
        .step { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 2; position: relative; }
        .step-number { width: 44px; height: 44px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #9ca3af; transition: all 0.3s; }
        .step.active .step-number { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; color: white; box-shadow: 0 0 20px rgba(99,102,241,0.5); }
        .step.completed .step-number { background: #10b981; border-color: transparent; color: white; }
        .step-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
        .step.active .step-label { color: white; }
        .step-line { flex: 1; height: 2px; background: rgba(255,255,255,0.1); margin: 0 10px; position: relative; }
        .step-line-progress { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; transition: width 0.5s; }
        .signup-content { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); padding: 40px; margin-bottom: 30px; }
        .signup-content h3 { font-size: 20px; font-weight: 700; color: white; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 500; color: #d1d5db; }
        .required { color: #ef4444; }
        .form-group input, .form-group select { padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; font-family: inherit; font-size: 14px; transition: all 0.3s; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .input-icon { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 0 16px; }
        .input-icon svg { color: #6366f1; }
        .input-icon input { background: transparent; border: none; padding: 12px 0; flex: 1; }
        .section-desc { color: #9ca3af; font-size: 13px; margin-bottom: 20px; }
        .modules-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
        .module-card { background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s; position: relative; }
        .module-card:hover { transform: translateY(-5px); border-color: #6366f1; }
        .module-card.selected { border-color: #6366f1; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); }
        .module-card.required { border-color: #f59e0b; }
        .module-icon { font-size: 32px; display: block; margin-bottom: 12px; }
        .module-card h4 { font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px; }
        .module-card p { font-size: 11px; color: #9ca3af; margin-bottom: 12px; }
        .module-price { font-size: 12px; font-weight: 600; color: #10b981; }
        .required-badge { position: absolute; top: 10px; right: 10px; background: #f59e0b; color: white; font-size: 10px; padding: 2px 8px; border-radius: 20px; }
        .selected-badge { position: absolute; top: 10px; left: 10px; background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .slider-section, .duration-section { margin-top: 20px; }
        .slider-section label, .duration-section label { display: block; font-size: 13px; font-weight: 500; color: white; margin-bottom: 12px; }
        input[type="range"] { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; -webkit-appearance: none; }
        input[type="range"]:focus { outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #6366f1; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px #6366f1; }
        .slider-value { display: inline-block; margin-top: 10px; background: rgba(99,102,241,0.2); padding: 4px 12px; border-radius: 20px; font-size: 13px; color: #a78bfa; }
        .duration-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
        .duration-btn { padding: 10px 24px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; cursor: pointer; transition: all 0.3s; position: relative; }
        .duration-btn.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; }
        .discount-badge { position: absolute; top: -8px; right: -8px; background: #10b981; font-size: 10px; padding: 2px 6px; border-radius: 20px; }
        .password-hint { font-size: 11px; color: #9ca3af; margin-top: 8px; }
        .summary-card { background: rgba(0,0,0,0.3); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
        .summary-row { display: flex; justify-content: space-between; padding: 12px 0; color: #d1d5db; font-size: 14px; }
        .summary-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 12px 0; }
        .summary-row.discount { color: #10b981; }
        .summary-row.total { font-size: 18px; font-weight: 700; color: white; }
        .total-price { background: linear-gradient(135deg, #a78bfa, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 22px; }
        .summary-row.monthly { color: #9ca3af; font-size: 13px; }
        .terms { display: flex; flex-direction: column; gap: 12px; }
        .terms label { display: flex; align-items: center; gap: 10px; color: #d1d5db; font-size: 13px; cursor: pointer; }
        .terms input { width: 18px; height: 18px; accent-color: #6366f1; }
        .form-buttons { display: flex; justify-content: space-between; margin-top: 32px; gap: 16px; }
        .btn-prev, .btn-next, .btn-submit { flex: 1; padding: 14px; border: none; border-radius: 16px; font-family: inherit; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-prev { background: rgba(255,255,255,0.1); color: white; }
        .btn-prev:hover { background: rgba(255,255,255,0.2); }
        .btn-next, .btn-submit { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
        .btn-next:hover, .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .signup-footer { text-align: center; color: #6b7280; font-size: 13px; }
        .signup-footer a { color: #a78bfa; text-decoration: none; }
        @media (max-width: 768px) {
          .signup-content { padding: 24px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full-width { grid-column: span 1; }
          .modules-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-container { flex-wrap: wrap; justify-content: center; gap: 20px; background: transparent; }
          .step-line { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;