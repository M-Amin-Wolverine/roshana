/* // middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'دسترسی غیرمجاز' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'توکن نامعتبر است' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'دسترسی فقط برای ادمین' });
  }
  next();
};

module.exports = { verifyToken, isAdmin }; */

// ============================================================
// 🚀 routes/support.js - نسخه ULTIMATE PRO
// پشتیبانی کامل با PostgreSQL | کش | Rate Limit | Validation
// ============================================================

const express = require('express');
const router = express.Router();
const logger = require('../middlewares/logger');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// کش برای کاهش بار دیتابیس
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 دقیقه کش

// Rate Limiting برای جلوگیری از هرزنامه
const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 5, // هر کاربر حداکثر 5 تیکت
  message: { success: false, error: 'شما بیش از حد مجاز تیکت ثبت کرده‌اید. لطفاً ۱۵ دقیقه دیگر تلاش کنید.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعت
  max: 30, // حداکثر ۳۰ سوال
  message: { success: false, error: 'محدودیت سوال از هوش مصنوعی. لطفاً بعداً تلاش کنید.' }
});

// ============================================================
// 🔐 Middleware بررسی احراز هویت
// ============================================================
const checkAuth = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'لطفاً وارد سیستم شوید' });
  }
  next();
};

// ============================================================
// 📋 1. GET /api/admin/support/faqs
// گرفتن سوالات متداول با قابلیت کش
// ============================================================
router.get('/faqs', [
  query('category').optional().isString().trim(),
  query('search').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category, search, limit = 50 } = req.query;
    
    // ساخت کلید کش
    const cacheKey = `faqs_${category || 'all'}_${search || 'none'}_${limit}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }
    
    let query = `
      SELECT 
        id, 
        question, 
        answer, 
        category, 
        tags, 
        helpful_count,
        created_at,
        updated_at
      FROM support_faqs 
      WHERE is_active = true
    `;
    const params = [];
    let paramIndex = 1;
    
    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (question ILIKE $${paramIndex} OR answer ILIKE $${paramIndex} OR tags::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY helpful_count DESC, id DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await global.db.raw(query, params);
    
    // ذخیره در کش
    cache.set(cacheKey, result.rows);
    
    // لاگ برای آنالیز
    logger.logDb('SELECT', 'support_faqs', 0, {
      category,
      search: search || 'none',
      resultCount: result.rows.length
    });
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, error: 'خطا در دریافت سوالات متداول' });
  }
});

// ============================================================
// 📊 2. GET /api/admin/support/faqs/categories
// گرفتن دسته‌بندی با آمار
// ============================================================
router.get('/faqs/categories', async (req, res) => {
  try {
    const result = await global.db.raw(`
      SELECT 
        category,
        COUNT(*) as total,
        SUM(helpful_count) as total_helpful,
        AVG(helpful_count) as avg_helpful
      FROM support_faqs 
      WHERE is_active = true
      GROUP BY category
      ORDER BY total DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 👍 3. POST /api/admin/support/faqs/:id/helpful
// ثبت مفید بودن جواب (با اعتبارسنجی کامل)
// ============================================================
router.post('/faqs/:id/helpful', [
  checkAuth,
  param('id').isInt().withMessage('شناسه سوال نامعتبر است'),
  body('helpful').isBoolean().withMessage('مقدار helpful باید true یا false باشد')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    const { helpful } = req.body;
    const userId = req.user.id;
    
    // بررسی وجود FAQ
    const faqExists = await global.db.raw(
      `SELECT id FROM support_faqs WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    if (faqExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'سوال مورد نظر یافت نشد' });
    }
    
    // جلوگیری از رای تکراری
    const existing = await global.db.raw(
      `SELECT id, is_helpful FROM faq_feedback WHERE user_id = $1 AND faq_id = $2`,
      [userId, id]
    );
    
    if (existing.rows.length > 0) {
      // اگه رای قبلی متفاوت بود، آپدیت کن
      if (existing.rows[0].is_helpful !== helpful) {
        const oldValue = existing.rows[0].is_helpful ? 1 : -1;
        const newValue = helpful ? 1 : -1;
        const diff = newValue - oldValue;
        
        await global.db.raw(
          `UPDATE support_faqs SET helpful_count = helpful_count + $1 WHERE id = $2`,
          [diff, id]
        );
        
        await global.db.raw(
          `UPDATE faq_feedback SET is_helpful = $1, updated_at = NOW() WHERE user_id = $2 AND faq_id = $3`,
          [helpful, userId, id]
        );
        
        // پاک کردن کش
        cache.del(cache.keys().filter(k => k.startsWith('faqs_')));
        
        return res.json({
          success: true,
          message: 'بازخورد شما با موفقیت به‌روزرسانی شد'
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: 'شما قبلاً به این سوال رای داده‌اید',
        yourVote: existing.rows[0].is_helpful ? 'مفید' : 'غیرمفید'
      });
    }
    
    const increment = helpful ? 1 : -1;
    
    // بروزرسانی helpful_count
    await global.db.raw(
      `UPDATE support_faqs SET helpful_count = helpful_count + $1, updated_at = NOW() WHERE id = $2`,
      [increment, id]
    );
    
    // ثبت رای
    await global.db.raw(
      `INSERT INTO faq_feedback (user_id, faq_id, is_helpful, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [userId, id, helpful]
    );
    
    // پاک کردن کش
    cache.del(cache.keys().filter(k => k.startsWith('faqs_')));
    
    res.json({
      success: true,
      message: helpful ? '🙏 ممنون از بازخورد شما' : '📝 متاسفیم که مفید نبود، نظر شما ثبت شد'
    });
    
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ success: false, error: 'خطا در ثبت بازخورد' });
  }
});

// ============================================================
// 📚 4. GET /api/admin/support/guides
// گرفتن راهنماها با فیلترهای پیشرفته
// ============================================================
router.get('/guides', [
  query('level').optional().isIn(['مبتدی', 'متوسط', 'پیشرفته']),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('featured').optional().isBoolean()
], async (req, res) => {
  try {
    const { level, limit = 20, featured } = req.query;
    
    let query = `
      SELECT * FROM support_guides 
      WHERE is_active = true
    `;
    const params = [];
    let paramIndex = 1;
    
    if (level) {
      query += ` AND level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }
    
    if (featured === 'true') {
      query += ` AND (is_popular = true OR is_new = true)`;
    }
    
    query += ` ORDER BY is_popular DESC, is_new DESC, id LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await global.db.raw(query, params);
    
    // تبدیل level برای CSS
    const guides = result.rows.map(guide => ({
      ...guide,
      levelEn: guide.level === 'مبتدی' ? 'beginner' : 
               guide.level === 'متوسط' ? 'intermediate' : 'advanced'
    }));
    
    res.json({
      success: true,
      data: guides,
      total: guides.length
    });
    
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🎫 5. GET /api/admin/support/tickets
// گرفتن تیکت‌ها با فیلترهای پیشرفته + آمار
// ============================================================
router.get('/tickets', checkAuth, [
  query('status').optional().isIn(['open', 'pending', 'closed']),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt()
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        t.id,
        t.subject,
        t.category,
        t.priority,
        t.message,
        t.status,
        t.created_at,
        t.updated_at,
        (SELECT COUNT(*) FROM support_replies WHERE ticket_id = t.id) as reply_count
      FROM support_tickets t
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    // مرتب‌سازی: اول فوری، بعد بالا، سپس جدیدترین
    query += ` ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        WHEN 'low' THEN 4 
      END,
      t.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await global.db.raw(query, params);
    
    // آمار تیکت‌ها
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high
      FROM support_tickets
      WHERE user_id = $1
    `;
    const statsResult = await global.db.raw(statsQuery, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(statsResult.rows[0].total),
        totalPages: Math.ceil(statsResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🔍 6. GET /api/admin/support/tickets/:id
// دریافت جزییات یک تیکت + تمام پاسخ‌ها
// ============================================================
router.get('/tickets/:id', [
  checkAuth,
  param('id').isInt().withMessage('شناسه تیکت نامعتبر است')
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || false;
    
    // دریافت تیکت
    const ticketResult = await global.db.raw(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'تیکت یافت نشد' });
    }
    
    const ticket = ticketResult.rows[0];
    
    // بررسی دسترسی
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'شما به این تیکت دسترسی ندارید' });
    }
    
    // دریافت پاسخ‌ها
    const repliesResult = await global.db.raw(`
      SELECT 
        r.*, 
        u.name as author_name,
        u.is_admin as is_admin
      FROM support_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.ticket_id = $1
      ORDER BY r.created_at ASC
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...ticket,
        replies: repliesResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✉️ 7. POST /api/admin/support/tickets
// ثبت تیکت جدید (با اعتبارسنجی کامل و rate limit)
// ============================================================
router.post('/tickets', [
  checkAuth,
  ticketLimiter,
  body('subject').notEmpty().withMessage('عنوان تیکت الزامی است').isLength({ min: 5, max: 200 }),
  body('message').notEmpty().withMessage('پیام تیکت الزامی است').isLength({ min: 10 }),
  body('category').optional().isIn(['technical', 'account', 'billing', 'feature', 'bug', 'general']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { subject, category, priority, message } = req.body;
    
    // شمارش تیکت‌های باز کاربر
    const openTickets = await global.db.raw(`
      SELECT COUNT(*) as count FROM support_tickets 
      WHERE user_id = $1 AND status IN ('open', 'pending')
    `, [userId]);
    
    if (openTickets.rows[0].count >= 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'شما ۵ تیکت باز دارید. لطفاً قبل از ثبت تیکت جدید، تیکت‌های قبلی را ببندید.' 
      });
    }
    
    const result = await global.db.raw(`
      INSERT INTO support_tickets (user_id, subject, category, priority, message, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'open', NOW())
      RETURNING *
    `, [userId, subject, category || 'general', priority || 'normal', message]);
    
    // ارسال نوتیفیکیشن به ادمین (اختیاری)
    // await sendAdminNotification(result.rows[0]);
    
    logger.logDb('INSERT', 'support_tickets', 0, {
      ticketId: result.rows[0].id,
      userId,
      priority: priority || 'normal'
    });
    
    res.status(201).json({
      success: true,
      message: '✅ تیکت شما با موفقیت ثبت شد. کد پیگیری: ' + result.rows[0].id,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: 'خطا در ثبت تیکت' });
  }
});

// ============================================================
// 💬 8. POST /api/admin/support/tickets/:id/reply
// پاسخ به تیکت
// ============================================================
router.post('/tickets/:id/reply', [
  checkAuth,
  param('id').isInt(),
  body('message').notEmpty().withMessage('پیام نمی‌تواند خالی باشد').isLength({ min: 5 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || false;
    
    // بررسی وجود تیکت و دسترسی
    const ticketResult = await global.db.raw(`
      SELECT * FROM support_tickets WHERE id = $1
    `, [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'تیکت یافت نشد' });
    }
    
    const ticket = ticketResult.rows[0];
    
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'شما به این تیکت دسترسی ندارید' });
    }
    
    // ثبت پاسخ
    await global.db.raw(`
      INSERT INTO support_replies (ticket_id, user_id, message, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [id, userId, message]);
    
    // بروزرسانی وضعیت تیکت
    const newStatus = isAdmin ? 'pending' : 'open';
    await global.db.raw(`
      UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2
    `, [newStatus, id]);
    
    // ارسال نوتیفیکیشن
    // await sendNotification(ticket.user_id, 'پاسخ جدید به تیکت شما');
    
    res.json({
      success: true,
      message: 'پاسخ شما با موفقیت ثبت شد'
    });
    
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🤖 9. POST /api/admin/support/ai/ask
// هوش مصنوعی با قابلیت یادگیری
// ============================================================
router.post('/ai/ask', [
  checkAuth,
  aiLimiter,
  body('question').notEmpty().withMessage('سوال خود را بنویسید').isLength({ min: 3, max: 500 })
], async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;
    
    // 1. جستجو در FAQ
    const faqResult = await global.db.raw(`
      SELECT answer, question, category, helpful_count 
      FROM support_faqs 
      WHERE is_active = true 
      AND (question ILIKE $1 OR answer ILIKE $1 OR tags::text ILIKE $1)
      ORDER BY helpful_count DESC, similarity(question, $1) DESC
      LIMIT 1
    `, [`%${question}%`]);
    
    let answer;
    let source = 'faq';
    
    if (faqResult.rows.length > 0) {
      const faq = faqResult.rows[0];
      answer = `${faq.answer}\n\n---\n📌 *منبع:* سوالات متداول (${faq.category})\n\nآیا این پاسخ مفید بود؟`;
      source = 'faq';
    }
    
    // 2. اگر در FAQ نبود، توی تیکت‌های حل شده جستجو کن
    else {
      const ticketResult = await global.db.raw(`
        SELECT t.subject, t.message, r.message as reply
        FROM support_tickets t
        LEFT JOIN support_replies r ON r.ticket_id = t.id AND r.user_id != t.user_id
        WHERE t.status = 'closed'
        AND (t.subject ILIKE $1 OR t.message ILIKE $1 OR r.message ILIKE $1)
        ORDER BY t.updated_at DESC
        LIMIT 1
      `, [`%${question}%`]);
      
      if (ticketResult.rows.length > 0) {
        const ticket = ticketResult.rows[0];
        answer = `بر اساس تیکت پشتیبانی قبلی با موضوع "${ticket.subject}":\n\n${ticket.reply || ticket.message}\n\n---\n📌 *منبع:* تیکت پشتیبانی حل شده\n\nاگر این پاسخ مشکل شما را حل نکرد، لطفاً یک تیکت جدید ثبت کنید.`;
        source = 'ticket';
      }
      
      // 3. هیچکدام
      else {
        answer = `🔍 متاسفانه پاسخی برای سوال "${question}" در دیتابیس ما پیدا نشد.

پیشنهادات من:
1. 📖 سوال خود را با عبارت دیگری جستجو کنید
2. 🎫 یک تیکت پشتیبانی برای ما ارسال کنید
3. 📚 مستندات راهنما را مطالعه کنید

کارشناسان ما در اسرع وقت به شما پاسخ خواهند داد.`;
        source = 'none';
      }
    }
    
    // ذخیره مکالمه برای بهبود سیستم
    await global.db.raw(`
      INSERT INTO ai_conversations (user_id, question, answer, source, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, question, answer, source]);
    
    res.json({
      success: true,
      data: { answer, source }
    });
    
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ success: false, error: 'خطا در ارتباط با هوش مصنوعی' });
  }
});

// ============================================================
// 📊 10. GET /api/admin/support/stats
// آمار کلی پشتیبانی برای داشبورد
// ============================================================
router.get('/stats', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || false;
    
    if (!isAdmin) {
      // آمار فقط برای کاربر خودش
      const userStats = await global.db.raw(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
          AVG(CASE WHEN status = 'closed' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_response_hours
        FROM support_tickets
        WHERE user_id = $1
      `, [userId]);
      
      return res.json({ success: true, data: userStats.rows[0] });
    }
    
    // آمار کلی برای ادمین
    const globalStats = await global.db.raw(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_tickets,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(CASE WHEN status = 'closed' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_resolution_hours,
        (SELECT COUNT(*) FROM ai_conversations WHERE created_at > NOW() - INTERVAL '7 days') as ai_queries_week
      FROM support_tickets
    `);
    
    // آمار روزانه
    const dailyStats = await global.db.raw(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tickets_count
      FROM support_tickets
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      data: {
        ...globalStats.rows[0],
        daily: dailyStats.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 🗑️ 11. DELETE /api/admin/support/tickets/:id
// حذف تیکت (فقط ادمین یا صاحب تیکت)
// ============================================================
router.delete('/tickets/:id', [
  checkAuth,
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || false;
    
    const ticketResult = await global.db.raw(`
      SELECT user_id, status FROM support_tickets WHERE id = $1
    `, [id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'تیکت یافت نشد' });
    }
    
    const ticket = ticketResult.rows[0];
    
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'شما به این تیکت دسترسی ندارید' });
    }
    
    if (!isAdmin && ticket.status === 'closed') {
      return res.status(400).json({ success: false, error: 'تیکت بسته شده قابل حذف نیست' });
    }
    
    await global.db.raw(`DELETE FROM support_replies WHERE ticket_id = $1`, [id]);
    await global.db.raw(`DELETE FROM support_tickets WHERE id = $1`, [id]);
    
    res.json({
      success: true,
      message: 'تیکت با موفقیت حذف شد'
    });
    
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;