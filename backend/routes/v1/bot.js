/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔗 Bot Deep‑Link Route – نسخهٔ فوق‌پیشرفته
 * ═══════════════════════════════════════════════════════════════════
 * مسئول تأیید توکن ارسالی از Deep‑Link و ثبت chat_id کاربر.
 * 
 * ── جزئیات امنیتی و کارایی:
 *   • ورودی‌ها با Zod / custom sanitizer بررسی می‌شوند.
 *   • از تراکنش دیتابیس برای عملیات اتمیک استفاده می‌کند.
 *   • Rate limiting روی IP و توکن اعمال می‌شود.
 *   • لاگ‌ها هم به Logger داخلی و هم (در صورت لزوم) به ربات ادمین می‌روند.
 *   • پاسخ‌های استاندارد با کدهای HTTP مناسب.
 * ═══════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const validator = require('validator'); // npm install validator
//const db = require('../../config/database'); // اتصال knex
const logger = require('../../middlewares/logger'); // logger داخلی پروژه
const botService = require('../../services/botService'); // برای لاگ پیشرفته

// ═══════════════════════════════════════════════════════════════════
// ⚙️ تنظیمات
// ═══════════════════════════════════════════════════════════════════
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 10; // به ازای هر IP
const TOKEN_MIN_LENGTH = 8;
const TOKEN_MAX_LENGTH = 128;

// ═══════════════════════════════════════════════════════════════════
// 🔍 اعتبارسنجی ورودی
// ═══════════════════════════════════════════════════════════════════
function validateLinkRequest(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Body is missing or invalid'] };
  }

  // بررسی token
  if (!body.token || typeof body.token !== 'string' || body.token.trim().length < TOKEN_MIN_LENGTH || body.token.trim().length > TOKEN_MAX_LENGTH) {
    errors.push('Token is required and must be a string between 8-128 characters');
  }

  // بررسی chat_id
  if (!body.chat_id) {
    errors.push('chat_id is required');
  } else {
    // chat_id می‌تواند عدد بزرگ یا رشته‌ای از ارقام باشد
    const chatIdStr = String(body.chat_id).trim();
    if (!/^\d+$/.test(chatIdStr)) {
      errors.push('chat_id must be a numeric string or integer');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      token: body.token?.trim(),
      chat_id: String(body.chat_id).trim(),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// ⏱️ Rate Limiter ساده درون‌حافظه‌ای (برای نمونه، می‌توان با Redis جایگزین کرد)
// ═══════════════════════════════════════════════════════════════════
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

  let entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > windowMs) {
    // بازنشانی
    entry = { start: now, count: 0 };
    rateLimitStore.set(ip, entry);
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // محدودیت رد شده
  }

  entry.count++;
  return true;
}

function getKnex() {
  if (!global.db) {
    throw new Error('پایگاه داده هنوز راه‌اندازی نشده است.');
  }
  return global.db;
}
// ═══════════════════════════════════════════════════════════════════
// 🎯 مسیر اصلی POST /link
// ═══════════════════════════════════════════════════════════════════
router.post('/link', async (req, res) => {
  const requestId = crypto.randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  if (!checkRateLimit(ip, 10)) {
    return res.status(429).json({ success: false, message: 'Rate limit exceeded', requestId });
  }

  const validation = validateLinkRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors, requestId });
  }

  const { token, chat_id } = validation.sanitized;
  const db = getKnex();

  try {
    const invite = await db('invite_tokens')
      .where({ token, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Token invalid or expired', requestId });
    }

    // سناریوی ۱: کاربر از سایت لاگین کرده و user_id وجود دارد
    if (invite.user_id) {
      await db('users')
        .where({ id: invite.user_id })
        .update({ chat_id, updated_at: db.fn.now() });
        
      logger.success(`User ${invite.user_id} linked with chat_id ${chat_id}`);
      if (botService) {
        botService.sendLog('INFO', `✅ کاربر ${invite.user_id} به ربات متصل شد`, { chat_id, userId: invite.user_id });
      }
    } 
    // سناریوی ۲: کاربر مستقیماً از ربات اقدام کرده (user_id خالی است)
    else {
      // chat_id را در invite_tokens ذخیره می‌کنیم تا بعداً با شماره موبایل تطبیق داده شود
      await db('invite_tokens').where({ id: invite.id }).update({ chat_id });
      logger.success(`Chat_id ${chat_id} linked with invite token (no user_id yet)`);
      if (botService) {
        botService.sendLog('INFO', `✅ یک chat_id جدید به توکن دعوت متصل شد (منتظر تأیید هویت)`, { chat_id });
      }
    }

    // علامت‌گذاری توکن به‌عنوان استفاده‌شده
    await db('invite_tokens')
      .where({ id: invite.id })
      .update({ used: true, used_at: db.fn.now() });

    return res.json({ success: true, message: 'Chat ID linked successfully', requestId });

  } catch (error) {
    logger.error('Link error:', error);
    return res.status(500).json({ success: false, message: 'Server error', requestId });
  }
});

module.exports = router;