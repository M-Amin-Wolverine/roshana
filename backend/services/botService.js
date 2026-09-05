/**
 * ═══════════════════════════════════════════════════════════════════
 * 🤖 Bale Bot Service - Ultra Advanced Version
 * ═══════════════════════════════════════════════════════════════════
 * رایگان، بدون نیاز به سرویس‌های پولی
 * قابلیت‌ها:
 *   - دریافت خودکار پیام‌ها از طریق polling (Long Polling)
 *   - ارسال پیام متنی، OTP، لاگ، اطلاع‌رسانی
 *   - مدیریت /start با deep‑link token برای اتصال کاربر
 *   - صف پیام با کنترل همروندی و محدودیت نرخ
 *   - بازگشت خودکار از خطا و اتصال مجدد
 *   - آمار لحظه‌ای
 * ═══════════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../middlewares/logger');  // ✅ درست
const config = require('../config');        // دسترسی به config پروژه (اختیاری)

// ──────────────────────────────────────────────
// ثابت‌ها و پیکربندی پیش‌فرض
// ──────────────────────────────────────────────
const BOT_TOKEN = process.env.BALE_BOT_TOKEN;
const BASE_URL = `https://tapi.bale.ai/bot${BOT_TOKEN}`;

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const POLLING_TIMEOUT = parseInt(process.env.BOT_POLLING_TIMEOUT || 30, 10); // ثانیه
const POLLING_DELAY = parseInt(process.env.BOT_POLLING_DELAY || 200, 10);   // میلی‌ثانیه بین درخواست‌ها
const RATE_LIMIT_DELAY = parseInt(process.env.BOT_RATE_LIMIT_DELAY || 35, 10); // میلی‌ثانیه بین هر پیام ارسالی (حدود ۳۰ پیام در ثانیه)
const MAX_RETRY_ATTEMPTS = 3;

// ──────────────────────────────────────────────
// کلاس اصلی سرویس ربات
// ──────────────────────────────────────────────
class BotService {
  constructor() {
    this.token = BOT_TOKEN;
    this.baseUrl = BASE_URL;
    this.adminChatId = ADMIN_CHAT_ID;

    // وضعیت polling
    this.offset = 0;
    this.isPolling = false;
    this.pollErrorCount = 0;
    this.lastSuccessfulPoll = null;

    // صف پیام‌های خروجی (برای کنترل نرخ ارسال)
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.queueConcurrency = 5;     // حداکثر پیام همزمان
    this.rateLimitDelay = RATE_LIMIT_DELAY;

    // آمار
    this.stats = {
      messagesSent: 0,
      messagesFailed: 0,
      updatesReceived: 0,
      otpSent: 0,
      logsSent: 0,
      errors: 0,
    };

    // callback برای پردازش توکن deep‑link (در server.js تنظیم می‌شود)
    this.onDeepLinkToken = null; // async (token, chatId) => { ... }

    // اتصال به logger داخلی
    this.logger = logger;
  }

  // ────────────────────────────────────────────
  // راه‌اندازی Polling
  // ────────────────────────────────────────────
  startPolling() {
    if (this.isPolling) {
      this.logger.warn('BotService: Polling already running');
      return;
    }
    if (!this.token) {
      this.logger.error('BotService: BALE_BOT_TOKEN is missing');
      return;
    }
    this.isPolling = true;
    this.logger.info('BotService: Polling started');
    this._pollLoop().catch((err) => {
      this.logger.error('BotService: Critical polling error', { error: err.message });
      this.isPolling = false;
    });
  }

  stopPolling() {
    this.isPolling = false;
    this.logger.info('BotService: Polling stopped');
  }

  // حلقه اصلی polling با مدیریت خطا
  async _pollLoop() {
    while (this.isPolling) {
      try {
        const updates = await this._fetchUpdates();
        if (updates && updates.length > 0) {
          this.pollErrorCount = 0;
          this.lastSuccessfulPoll = new Date();
          for (const update of updates) {
            await this._handleUpdate(update);
          }
        } else {
          // بدون آپدیت جدید، کاهش خطاهای متوالی
          this.pollErrorCount = Math.max(0, this.pollErrorCount - 1);
        }
      } catch (error) {
        this.pollErrorCount++;
        this.logger.error(`BotService: Polling error (${this.pollErrorCount})`, { error: error.message });
        // exponential backoff برای خطاهای مکرر
        const backoff = Math.min(1000 * Math.pow(2, this.pollErrorCount), 30000);
        await this._delay(backoff);
        // اگر خطا از حد گذشت، ممکن است توکن نامعتبر باشد
        if (this.pollErrorCount > 10) {
          this.logger.error('BotService: Too many polling errors, stopping');
          this.stopPolling();
          break;
        }
      }
      // تأخیر بین درخواست‌ها
      await this._delay(POLLING_DELAY);
    }
  }

  async _fetchUpdates() {
    const response = await axios.get(`${this.baseUrl}/getUpdates`, {
      params: {
        offset: this.offset,
        timeout: POLLING_TIMEOUT,
        limit: 100,
      },
      timeout: (POLLING_TIMEOUT + 5) * 1000, // کمی بیشتر از timeout سرور
    });
    if (response.data && response.data.ok) {
      this.stats.updatesReceived += response.data.result.length;
      return response.data.result;
    } else {
      throw new Error(response.data.description || 'Unknown error');
    }
  }

  // ────────────────────────────────────────────
  // پردازش یک آپدیت دریافتی
  // ────────────────────────────────────────────
  async _handleUpdate(update) {
    // به‌روزرسانی offset (مهم: حتی اگر پردازش خطا دهد، offset باید جلو برود)
    if (update.update_id) {
      this.offset = update.update_id + 1;
    }

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      // فقط پیام‌های /start را اینجا بررسی می‌کنیم
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const token = parts.length > 1 ? parts[1] : null;
        if (token) {
          await this._handleDeepLinkStart(chatId, token, msg);
        } else {
          // پیام خوش‌آمدگویی ساده
          await this.sendMessage(chatId, '👋 سلام! برای فعال‌سازی اعلان‌ها و دریافت کد تأیید، از طریق سایت روی دکمه "اتصال به ربات" کلیک کنید.');
        }
      }
      // در اینجا می‌توانید فرمان‌های دیگر مانند /help را اضافه کنید
    }
  }

async _handleDeepLinkStart(chatId, token, msg) {
  // یک شناسه یکتا برای ردیابی این درخواست (اختیاری)
  const requestId = require('crypto').randomUUID().substring(0, 8);
  const logPrefix = `[DeepLink:${requestId}]`;

  try {
    this.logger.info(`${logPrefix} Processing token ${token.substring(0,8)}... for chat ${chatId}`);

    // ۱. بررسی وجود callback
    if (typeof this.onDeepLinkToken !== 'function') {
      this.logger.error(`${logPrefix} onDeepLinkToken callback not set`);
      await this.sendMessage(chatId, '⚠️ خطای پیکربندی ربات. لطفاً با پشتیبانی تماس بگیرید.');
      await this.sendLog('ERROR', 'onDeepLinkToken handler is missing', { chatId });
      return;
    }

    // ۲. فراخوانی callback (که کار دیتابیس را انجام می‌دهد)
    const result = await this.onDeepLinkToken(token, chatId);

    // ۳. تحلیل نتیجه
    if (!result || !result.success) {
      // تعیین پیام مناسب بر اساس خطا
      let errorMessage = '❌ لینک نامعتبر یا منقضی شده است.';
      if (result && result.reason === 'already_used') {
        errorMessage = '⚠️ این لینک قبلاً استفاده شده است.';
      } else if (result && result.reason === 'expired') {
        errorMessage = '⏳ این لینک منقضی شده است. لطفاً لینک جدیدی دریافت کنید.';
      } else if (result && result.reason === 'not_found') {
        errorMessage = '🔍 لینک پیدا نشد. ممکن است قبلاً حذف شده باشد.';
      }
      
      await this.sendMessage(chatId, errorMessage);
      await this.sendLog('WARN', `Deep link failed: ${result?.reason || 'unknown'}`, { token, chatId });
      return;
    }

    // ۴. موفقیت – ارسال پیام متناسب با وضعیت
    let successMessage = '✅ ارتباط شما با موفقیت برقرار شد.';
    if (result.alreadyLinked) {
      successMessage = 'ℹ️ شما قبلاً به ربات متصل بوده‌اید. همه چیز مرتب است.';
    } else if (result.isNewLink) {
      successMessage = '🎉 حساب شما با موفقیت به ربات متصل شد.\nاز این پس کدهای تأیید و اعلان‌ها از این طریق ارسال می‌شود.';
    }

    await this.sendMessage(chatId, successMessage);

    // لاگ موفقیت
    await this.sendLog('INFO', `Deep link successful for chat ${chatId}`, {
      token: token.substring(0,8),
      userId: result.userId || 'unknown',
      alreadyLinked: result.alreadyLinked || false
    });

    // ۵. (اختیاری) ارسال یک پیام خوش‌آمدگویی اضافی با دکمهٔ رفتن به سایت
    // می‌توانید این بخش را شخصی‌سازی کنید
    await this.sendMessageWithInlineKeyboard(chatId, 'برای ادامه به حساب کاربری خود بروید:', [
      [{ text: '🚀 رفتن به سایت', url: 'https://bale.ai' }]
    ]);

  } catch (err) {
    // خطای غیرمنتظره (مثلاً قطعی دیتابیس)
    this.logger.error(`${logPrefix} Unexpected error:`, err);
    await this.sendMessage(chatId, '⚠️ خطای سیستمی رخ داد. لطفاً چند دقیقه دیگر تلاش کنید.');
    await this.sendLog('ERROR', 'Deep link handler crashed', { error: err.message, chatId });
  }
}
  // ────────────────────────────────────────────
  // متدهای ارسال پیام
  // ────────────────────────────────────────────

  /**
   * ارسال یک پیام متنی ساده (با صف و کنترل نرخ)
   * @param {number|string} chatId - شناسه چت مقصد
   * @param {string} text - متن پیام
   * @param {object} options - { parse_mode, disable_notification, ... }
   * @returns {Promise<boolean>} موفقیت‌آمیز بودن
   */
  async sendMessage(chatId, text, options = {}) {
    if (!chatId || !text) {
      this.logger.warn('BotService: sendMessage missing parameters');
      return false;
    }
    return this._enqueueMessage({ chatId, text, ...options });
  }

  // اضافه کردن متدی برای ارسال کیبورد سفارشی
async sendMessageWithKeyboard(chatId, text, keyboardButtons) {
    const replyMarkup = {
        keyboard: keyboardButtons,
        resize_keyboard: true,
        one_time_keyboard: false   // اگر false باشد، کیبورد دائمی می‌ماند
    };
    return this.sendMessage(chatId, text, {
        reply_markup: JSON.stringify(replyMarkup)
    });
}

// 2. در _handleUpdate، پیام‌های فشرده‌شده از دکمه را بگیریم
async _handleUpdate(update) {
    if (update.update_id) {
        this.offset = update.update_id + 1;
    }

    if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text?.trim() || '';

        // اگر کاربر دکمه «اتصال حساب کاربری» را زده باشد
        if (text === '🔗 اتصال حساب کاربری') {
            await this._handleConnectRequest(chatId);
            return;
        }

        // اگر /start باشد
        if (text.startsWith('/start')) {
            const parts = text.split(' ');
            const token = parts.length > 1 ? parts[1] : null;
            if (token) {
                await this._handleDeepLinkStart(chatId, token, msg);
            } else {
                // نمایش کیبورد دائمی با دکمه اتصال
                await this.showWelcomeWithKeyboard(chatId);
            }
        }
    }
}

// تابع نمایش خوش‌آمد با کیبورد
async showWelcomeWithKeyboard(chatId) {
    const welcomeText = `👋 سلام! به ربات ما خوش آمدید.\nبرای دریافت کدهای تأیید و اعلان‌ها، لطفاً حساب خود را متصل کنید.`;

    await this.sendMessageWithKeyboard(chatId, welcomeText, [
        [{ text: '🔗 اتصال حساب کاربری' }]
    ]);
}

// تابع پردازش درخواست اتصال
async _handleConnectRequest(chatId) {
    try {
        // 1. فراخوانی API داخلی برای تولید توکن (با استفاده از chatId)
        const apiUrl = `http://localhost:${process.env.PORT || 3000}/api/v1/bot/generate-link`;
        const response = await axios.post(apiUrl, { chat_id: chatId }); // احراز هویت روی خود chatId است (می‌توان بعداً کاربر را پیدا کرد)
        
        if (response.data.success) {
            const { link } = response.data;
            // 2. ارسال لینک به کاربر با InlineKeyboardButton که URL را باز کند
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        {
                            text: 'برای فعال‌سازی کلیک کنید',
                            url: link
                        }
                    ]
                ]
            };
            await this.sendMessage(chatId, '✅ لینک اتصال شما آماده است. روی دکمه زیر کلیک کنید تا حساب شما متصل شود.', {
                reply_markup: JSON.stringify(inlineKeyboard)
            });
        } else {
            await this.sendMessage(chatId, '❌ خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.');
        }
    } catch (error) {
        this.logger.error('Connect request error:', error.message);
        await this.sendMessage(chatId, '⚠️ خطای سرور. لطفاً بعداً امتحان کنید.');
    }
}

  /**
   * ارسال رمز یکبار مصرف (OTP)
   * @param {number|string} chatId
   * @param {string} code - کد OTP
   * @param {number} [expireMinutes=5] - زمان انقضا (برای نمایش)
   * @returns {Promise<boolean>}
   */
  async sendOTP(chatId, code, expireMinutes = 5) {
    const text = `🔐 *کد تأیید شما:* \`${code}\`\n⏳ این کد تا ${expireMinutes} دقیقه معتبر است.`;
    const sent = await this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    if (sent) {
      this.stats.otpSent++;
      await this.sendLog('INFO', `OTP sent to chat_id=${chatId} (code: ${code})`, { chatId });
    }
    return sent;
  }

  /**
   * ارسال لاگ به چت ادمین
   * @param {string} level - سطح (INFO, WARN, ERROR)
   * @param {string} message - پیام
   * @param {object} [meta={}] - اطلاعات اضافی
   * @returns {Promise<boolean>}
   */
  async sendLog(level, message, meta = {}) {
    if (!this.adminChatId) {
      this.logger.warn('BotService: ADMIN_CHAT_ID not set, cannot send log');
      return false;
    }
    const timestamp = new Date().toISOString();
    const emoji = { INFO: 'ℹ️', WARN: '⚠️', ERROR: '❌' }[level] || '📋';
    let text = `${emoji} *${level}* \`${timestamp}\`\n${message}`;
    if (meta && Object.keys(meta).length > 0) {
      text += `\n📎 ${JSON.stringify(meta, null, 2)}`;
    }
    // محدودیت طول پیام بله (4096 کاراکتر)
    if (text.length > 4000) {
      text = text.substring(0, 4000) + '...';
    }
    const sent = await this.sendMessage(this.adminChatId, text, { parse_mode: 'Markdown' });
    if (sent) {
      this.stats.logsSent++;
    }
    return sent;
  }

  /**
   * ارسال پیام به گروهی از کاربران (با صف)
   * @param {Array<{chatId, text}>} recipients - لیست گیرندگان
   * @returns {Promise<Array>} نتایج
   */
  async sendBulk(recipients) {
    const results = [];
    // پردازش به صورت موازی با رعایت concurrency
    const chunks = this._chunkArray(recipients, this.queueConcurrency);
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map((r) => this.sendMessage(r.chatId, r.text))
      );
      results.push(...chunkResults.map((r, i) => ({
        chatId: chunk[i].chatId,
        success: r.status === 'fulfilled' ? r.value : false,
        error: r.status === 'rejected' ? r.reason.message : null,
      })));
      // delay بین هر chunk برای رعایت rate limit سراسری
      await this._delay(this.rateLimitDelay * chunk.length);
    }
    return results;
  }

  // ────────────────────────────────────────────
  // مدیریت صف پیام‌های خروجی (Rate Limiting)
  // ────────────────────────────────────────────
  async _enqueueMessage(msgData) {
    return new Promise((resolve) => {
      this.messageQueue.push({ data: msgData, resolve });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    while (this.messageQueue.length > 0) {
      const batch = this.messageQueue.splice(0, this.queueConcurrency);
      const tasks = batch.map((item) => {
        return this._sendSingleMessage(item.data).then((result) => {
          item.resolve(result);
        }).catch((err) => {
          this.logger.error('BotService: send failed (queued)', { error: err.message });
          item.resolve(false);
        });
      });
      await Promise.all(tasks);
      // تأخیر بین دسته‌ها
      await this._delay(this.rateLimitDelay);
    }
    this.isProcessingQueue = false;
  }

  async _sendSingleMessage({ chatId, text, ...options }) {
    let attempts = 0;
    while (attempts < MAX_RETRY_ATTEMPTS) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/sendMessage`,
          {
            chat_id: chatId,
            text: text,
            ...options,
          },
          { timeout: 10000 }
        );
        if (response.data && response.data.ok) {
          this.stats.messagesSent++;
          return true;
        } else {
          // خطای منطقی (مثلاً چت وجود ندارد)
          if (response.data.error_code === 403) {
            // ربات توسط کاربر بلاک شده
            this.logger.warn(`BotService: forbidden to send to ${chatId}`);
            return false;
          }
          // سایر خطاها ممکن است موقتی باشند
          attempts++;
          await this._delay(1000 * attempts);
        }
      } catch (error) {
        this.stats.messagesFailed++;
        if (error.response && error.response.status === 429) {
          // rate limit از سمت سرور
          const retryAfter = parseInt(error.response.headers['retry-after'] || 5, 10);
          this.logger.warn(`BotService: rate limited, waiting ${retryAfter}s`);
          await this._delay(retryAfter * 1000);
          attempts++; // این تلاش حساب نمی‌شود
          continue;
        }
        attempts++;
        await this._delay(1000 * attempts);
      }
    }
    this.logger.error(`BotService: failed to send message to ${chatId} after ${MAX_RETRY_ATTEMPTS} attempts`);
    return false;
  }

  // ────────────────────────────────────────────
  // ابزارهای جانبی
  // ────────────────────────────────────────────
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  // ────────────────────────────────────────────
  // بررسی صحت اتصال
  // ────────────────────────────────────────────
  async verifyConnection() {
    try {
      const res = await axios.get(`${this.baseUrl}/getMe`);
      if (res.data.ok) {
        this.logger.info(`BotService: Connected as @${res.data.result.username}`);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error('BotService: Connection verification failed', { error: err.message });
      return false;
    }
  }

  // ────────────────────────────────────────────
  // آمار و گزارش
  // ────────────────────────────────────────────
  getStats() {
    return {
      ...this.stats,
      queueLength: this.messageQueue.length,
      isPolling: this.isPolling,
      lastSuccessfulPoll: this.lastSuccessfulPoll,
    };
  }

  /**
   * تنظیم callback برای پردازش توکن deep‑link
   * @param {function} callback - async (token, chatId) => boolean
   */
  setDeepLinkHandler(callback) {
    this.onDeepLinkToken = callback;
  }
}

// ──────────────────────────────────────────────
// Singleton Export
// ──────────────────────────────────────────────
const botService = new BotService();
module.exports = botService;