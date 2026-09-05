// ============================================================
// routes/admin/license.js - License Management API
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════
// 🔑 تولید کلید لایسنس
// ═══════════════════════════════════════════════════════════
function generateLicenseKey(orgName, type) {
  const prefix = 'FRTK';
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const checksum = crypto.createHash('md5').update(orgName + type + year).digest('hex').substring(0, 4).toUpperCase();
  
  return `${prefix}-${year}-${random}-${checksum}`;
}

// ═══════════════════════════════════════════════════════════
// 📋 دریافت اطلاعات لایسنس فعلی
// ═══════════════════════════════════════════════════════════
router.get('/info', async (req, res) => {
  try {
    const license = await global.db('licenses')
      .where('is_active', true)
      .orderBy('created_at', 'desc')
      .first();
    
    if (!license) {
      return res.json({ 
        success: true, 
        data: { 
          status: 'no_license',
          message: 'لایسنسی یافت نشد'
        } 
      });
    }
    
    // محاسبه روزهای باقی‌مانده
    const today = new Date();
    const expiryDate = new Date(license.expiry_date);
    const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // دریافت ماژول‌های فعال
    const activeModules = await global.db('license_modules')
      .where('license_id', license.id)
      .where('is_active', true);
    
    // دریافت آمار کاربران
    const userCount = await global.db('users').count('* as total').first();
    const activeUserCount = await global.db('users').where('is_active', true).count('* as total').first();
    
    const licenseInfo = {
      id: license.id,
      key: license.license_key,
      organizationName: license.organization_name,
      organizationType: license.organization_type,
      type: license.license_type,
      status: daysRemaining > 0 ? 'active' : 'expired',
      startDate: license.start_date,
      expiryDate: license.expiry_date,
      daysRemaining: Math.max(0, daysRemaining),
      maxUsers: license.max_users,
      currentUsers: parseInt(activeUserCount.total),
      totalUsers: parseInt(userCount.total),
      modules: activeModules.map(m => ({
        id: m.module_id,
        name: m.module_name,
        active: m.is_active,
        expiryDate: m.expiry_date
      })),
      adminEmail: license.admin_email,
      adminName: license.admin_name,
      createdAt: license.created_at
    };
    
    res.json({ success: true, data: licenseInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ✅ فعال‌سازی لایسنس
// ═══════════════════════════════════════════════════════════
router.post('/activate', async (req, res) => {
  try {
    const { licenseKey, adminEmail } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'کلید لایسنس الزامی است' });
    }
    
    // بررسی وجود لایسنس
    const license = await global.db('licenses')
      .where('license_key', licenseKey)
      .first();
    
    if (!license) {
      return res.status(404).json({ success: false, message: 'کلید لایسنس نامعتبر است' });
    }
    
    if (license.is_activated) {
      return res.status(400).json({ success: false, message: 'این لایسنس قبلاً فعال شده است' });
    }
    
    if (new Date(license.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'لایسنس منقضی شده است' });
    }
    
    // فعال‌سازی
    await global.db('licenses')
      .where('id', license.id)
      .update({
        is_activated: true,
        activated_at: new Date(),
        admin_email: adminEmail || license.admin_email,
        updated_at: new Date()
      });
    
    // فعال‌سازی ماژول‌های پایه
    await global.db('license_modules')
      .where('license_id', license.id)
      .update({
        is_active: true,
        activated_at: new Date()
      });
    
    res.json({ 
      success: true, 
      message: '✅ لایسنس با موفقیت فعال شد',
      data: {
        key: license.license_key,
        expiryDate: license.expiry_date,
        modules: license.modules
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ❌ غیرفعال‌سازی لایسنس
// ═══════════════════════════════════════════════════════════
router.post('/deactivate', async (req, res) => {
  try {
    const license = await global.db('licenses')
      .where('is_active', true)
      .first();
    
    if (!license) {
      return res.status(404).json({ success: false, message: 'لایسنس فعالی یافت نشد' });
    }
    
    await global.db('licenses')
      .where('id', license.id)
      .update({ is_active: false, deactivated_at: new Date() });
    
    await global.db('license_modules')
      .where('license_id', license.id)
      .update({ is_active: false });
    
    res.json({ success: true, message: 'لایسنس غیرفعال شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📦 مدیریت ماژول‌ها
// ═══════════════════════════════════════════════════════════
router.get('/modules', async (req, res) => {
  try {
    const license = await global.db('licenses')
      .where('is_active', true)
      .first();
    
    if (!license) {
      return res.json({ success: true, data: [] });
    }
    
    const modules = await global.db('license_modules')
      .where('license_id', license.id);
    
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modules/toggle', async (req, res) => {
  try {
    const { moduleId, active } = req.body;
    
    const license = await global.db('licenses')
      .where('is_active', true)
      .first();
    
    if (!license) {
      return res.status(404).json({ success: false, message: 'لایسنس فعالی یافت نشد' });
    }
    
    const module = await global.db('license_modules')
      .where('license_id', license.id)
      .where('module_id', moduleId)
      .first();
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'ماژول یافت نشد' });
    }
    
    if (module.is_required) {
      return res.status(400).json({ success: false, message: 'این ماژول الزامی است و نمی‌توان غیرفعال کرد' });
    }
    
    if (active && module.expiry_date && new Date(module.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'لایسنس این ماژول منقضی شده است' });
    }
    
    await global.db('license_modules')
      .where('id', module.id)
      .update({ is_active: active, updated_at: new Date() });
    
    res.json({ success: true, message: `ماژول ${active ? 'فعال' : 'غیرفعال'} شد` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📊 بررسی وضعیت لایسنس (برای middleware)
// ═══════════════════════════════════════════════════════════
router.get('/check', async (req, res) => {
  try {
    const license = await global.db('licenses')
      .where('is_active', true)
      .where('is_activated', true)
      .where('expiry_date', '>', new Date())
      .first();
    
    if (!license) {
      return res.status(403).json({ 
        success: false, 
        status: 'invalid',
        message: 'لایسنس معتبر نیست. لطفاً لایسنس را فعال کنید.'
      });
    }
    
    // بررسی تعداد کاربران
    const userCount = await global.db('users').count('* as total').first();
    if (parseInt(userCount.total) > license.max_users) {
      return res.status(403).json({
        success: false,
        status: 'user_limit_exceeded',
        message: `تعداد کاربران (${userCount.total}) بیشتر از حد مجاز (${license.max_users}) است.`
      });
    }
    
    res.json({ 
      success: true, 
      status: 'valid',
      daysRemaining: Math.ceil((new Date(license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🔄 تمدید لایسنس
// ═══════════════════════════════════════════════════════════
router.post('/renew', async (req, res) => {
  try {
    const { durationMonths = 12 } = req.body;
    
    const license = await global.db('licenses')
      .where('is_active', true)
      .first();
    
    if (!license) {
      return res.status(404).json({ success: false, message: 'لایسنس فعالی یافت نشد' });
    }
    
    const currentExpiry = new Date(license.expiry_date);
    const newExpiry = new Date(currentExpiry.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
    
    await global.db('licenses')
      .where('id', license.id)
      .update({
        expiry_date: newExpiry,
        renewed_at: new Date(),
        updated_at: new Date()
      });
    
    res.json({ 
      success: true, 
      message: `✅ لایسنس تا ${newExpiry.toLocaleDateString('fa-IR')} تمدید شد`,
      data: { newExpiryDate: newExpiry }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📝 ثبت‌نام سازمان جدید
// ═══════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const {
      organizationName, organizationType, adminEmail, adminPhone,
      adminFirstName, adminLastName, modules, userCount, contractDuration
    } = req.body;
    
    // تولید کلید لایسنس
    const licenseKey = generateLicenseKey(organizationName, 'enterprise');
    
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + contractDuration * 30 * 24 * 60 * 60 * 1000);
    
    // ایجاد لایسنس
    const [license] = await global.db('licenses')
      .insert({
        license_key: licenseKey,
        organization_name: organizationName,
        organization_type: organizationType,
        license_type: 'enterprise',
        admin_email: adminEmail,
        admin_phone: adminPhone,
        admin_name: `${adminFirstName} ${adminLastName}`,
        max_users: userCount,
        start_date: startDate,
        expiry_date: expiryDate,
        is_active: true,
        is_activated: false,
        created_at: new Date()
      })
      .returning('*');
    
    // ایجاد ماژول‌ها
    const allModules = [
      { id: 'courseware', name: 'CourseWare', required: true, price: 0 },
      { id: 'roshena-sci', name: 'Roshena Sci', required: false, price: 5000000 },
      { id: 'live-classes', name: 'Live Classes', required: false, price: 8000000 },
      { id: 'meeting', name: 'Meeting Hub', required: false, price: 4000000 },
      { id: 'connect', name: 'Connect', required: false, price: 3000000 },
      { id: 'messenger', name: 'Messenger', required: false, price: 2000000 },
      { id: 'automation', name: 'Automation', required: false, price: 6000000 },
      { id: 'media', name: 'Media Gallery', required: false, price: 3000000 },
      { id: 'poll', name: 'Poll & Survey', required: false, price: 2000000 },
      { id: 'security', name: 'Security Suite', required: false, price: 5000000 },
      { id: 'storage', name: 'Data Center', required: false, price: 4000000 },
      { id: 'api', name: 'API Gateway', required: false, price: 3000000 }
    ];
    
    for (const module of allModules) {
      const isSelected = modules?.includes(module.id) || module.required;
      await global.db('license_modules').insert({
        license_id: license.id,
        module_id: module.id,
        module_name: module.name,
        is_required: module.required,
        is_active: module.required, // ماژول‌های اجباری پیش‌فرض فعال
        price: module.price,
        created_at: new Date()
      });
    }
    
    res.json({
      success: true,
      message: '✅ ثبت‌نام با موفقیت انجام شد',
      data: {
        licenseKey: license.license_key,
        expiryDate: license.expiry_date,
        adminEmail: license.admin_email
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;