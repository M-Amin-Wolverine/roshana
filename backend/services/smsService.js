/**
 * ═══════════════════════════════════════════════════════════════════
 * 📱 SMS Service - نسخه پیشرفته و حرفه‌ای (Bale Bot Edition)
 * کاملاً رایگان، بدون نیاز به هیچ پنل پیامکی
 * ═══════════════════════════════════════════════════════════════════
 */
const botService = require('./services/botService'); // سرویس ربات
const db = require('../config/database');   // اتصال به knex
const logger = require('../middlewares/logger'); // logger داخلی
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// 🎨 Console Colors
// ═══════════════════════════════════════════════════════════════════
const Colors = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    GRAY: '\x1b[90m'
};

const log = {
    info: (msg) => console.log(`${Colors.CYAN}ℹ${Colors.RESET} ${msg}`),
    success: (msg) => console.log(`${Colors.GREEN}✓${Colors.RESET} ${msg}`),
    error: (msg) => console.log(`${Colors.RED}✗${Colors.RESET} ${msg}`),
    warn: (msg) => console.log(`${Colors.YELLOW}⚠${Colors.RESET} ${msg}`),
    debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`${Colors.GRAY}⚙${Colors.RESET} ${msg}`)
};

// ═══════════════════════════════════════════════════════════════════
// ⚙️ Configuration
// ═══════════════════════════════════════════════════════════════════
const CONFIG = {
    provider: 'bale', // ثابت روی bale

    // Rate Limiting (داخلی)
    rateLimit: {
        maxPerMinute: parseInt(process.env.SMS_MAX_PER_MINUTE) || 20,
        maxPerHour: parseInt(process.env.SMS_MAX_PER_HOUR) || 200,
        maxPerDay: parseInt(process.env.SMS_MAX_PER_DAY) || 1000
    },

    // Queue Settings
    queue: {
        enabled: true,
        concurrency: 5, // هم‌زمان چند پیام می‌تواند به botService برود
        retryAttempts: 2,
        retryDelay: 3000
    },

    // Message Settings
    message: {
        maxLength: 4096, // حداکثر طول پیام در بله (متن)
        unicodeEnabled: true
    }
};

// ═══════════════════════════════════════════════════════════════════
// 📋 Message Templates (بدون تغییر)
// ═══════════════════════════════════════════════════════════════════
const TEMPLATES = {
    VERIFICATION_CODE: {
        fa: 'کد تأیید {code} - روشنا',
        en: 'Your verification code: {code} - Roshana'
    },
    WELCOME: {
        fa: 'سلام {name}! خوش آمدید به روشنا',
        en: 'Hello {name}! Welcome to Roshana'
    },
    PASSWORD_RESET: {
        fa: 'کد بازیابی رمز عبور: {code}',
        en: 'Password reset code: {code}'
    },
    ORDER_CONFIRMATION: {
        fa: 'سفارش شما با کد {orderId} ثبت شد',
        en: 'Your order {orderId} has been confirmed'
    },
    OTP: {
        fa: 'کد یکبار مصرف: {code} (منقضی: {minutes} دقیقه)',
        en: 'One-time code: {code} (expires in {minutes} min)'
    },
    LOGIN_ALERT: {
        fa: 'ورود جدید به حساب کاربری از {device} در {location}',
        en: 'New login to your account from {device} in {location}'
    },
    TRANSACTION: {
        fa: 'تراکنش {amount} تومان - {description}',
        en: 'Transaction of {amount} - {description}'
    },
    APPOINTMENT_REMINDER: {
        fa: 'یادآوری: قرار ملاقات {title} در {time}',
        en: 'Reminder: {title} appointment at {time}'
    }
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 SMS Service Class (بله‌ای)
// ═══════════════════════════════════════════════════════════════════
class SMSService {
    constructor() {
        this.config = CONFIG;
        this.templates = TEMPLATES;
        this.provider = 'bale';
        this.rateLimitStore = new Map();
        this.messageQueue = [];
        this.processing = false;
        this.stats = {
            totalSent: 0,
            totalFailed: 0,
            totalQueued: 0,
            byProvider: { bale: { sent: 0, failed: 0 } },
            byTemplate: {}
        };
        log.info(`📡 SMS Service initialized with Bale Bot (free)`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📤 متد اصلی ارسال (جایگزین شده)
    // ═══════════════════════════════════════════════════════════════
    async send(options) {
        const { to, message, template, templateData } = options;
        if (!to) throw new Error('Phone number (to) is required');

        // ۱. فرمت شماره
        const formattedPhone = this.formatPhoneNumber(to);
        if (!this.validatePhoneNumber(formattedPhone)) {
            throw new Error(`Invalid phone number: ${to}`);
        }

        // ۲. پیام را (با قالب) آماده کن
        let messageContent = message;
        if (template) {
            messageContent = this.renderTemplate(template, templateData);
        }
        if (!messageContent) throw new Error('Message content is required');

        // ۳. یافتن chat_id کاربر از دیتابیس
        const user = await db('users')
            .where({ phone: formattedPhone })
            .first();

        if (!user || !user.chat_id) {
            const errMsg = `کاربر با شماره ${formattedPhone} هنوز ربات را فعال نکرده است.`;
            await botService.sendLog('WARN', errMsg, { phone: formattedPhone });
            throw new Error(errMsg);
        }

        // ۴. Rate limit (اختیاری)
        await this.checkRateLimit(formattedPhone);

        // ۵. ارسال از طریق ربات
        try {
            const sent = await botService.sendMessage(user.chat_id, messageContent);
            if (!sent) throw new Error('Bot sendMessage returned false');

            this.updateStats('sent', template || 'direct');
            log.success(`📨 Bale message sent to ${formattedPhone} (chat_id=${user.chat_id})`);

            return {
                success: true,
                messageId: crypto.randomUUID(), // ربات message_id نمی‌دهد، یک ID مجازی می‌سازیم
                status: 'sent',
                provider: 'bale',
                phone: formattedPhone,
                message: messageContent,
                sentAt: new Date()
            };
        } catch (error) {
            this.updateStats('failed', template || 'direct');
            log.error(`Bale send failed: ${error.message}`);
            await botService.sendLog('ERROR', `ارسال پیام به ${formattedPhone} ناموفق`, { error: error.message });
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // کلیه متدهای provider قبلی (kavenegar, melipayamak, ...)
    // کامنت شده‌اند یا حذف شوند.
    // ================================================================

    // ═══════════════════════════════════════════════════════════════
    // 📊 Bulk Send (با استفاده از صف و botService)
    // ═══════════════════════════════════════════════════════════════
    async sendBulk(recipients, message) {
        const results = [];
        log.info(`Sending bulk message to ${recipients.length} recipients via Bale`);

        for (let i = 0; i < recipients.length; i += this.config.queue.concurrency) {
            const batch = recipients.slice(i, i + this.config.queue.concurrency);
            const batchResults = await Promise.allSettled(
                batch.map(phone => this.send({ to: phone, message }))
            );
            results.push(...batchResults.map((result, index) => ({
                phone: batch[index],
                ...(result.status === 'fulfilled' ? result.value : { error: result.reason.message })
            })));
            await this.delay(200); // کمی تأخیر برای جلوگیری از فشار
        }
        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📅 Schedule SMS (بدون تغییر، فقط send بله‌ای شده)
    // ═══════════════════════════════════════════════════════════════
    async schedule(options, scheduledAt) {
        const delay = scheduledAt.getTime() - Date.now();
        if (delay < 0) throw new Error('Scheduled time must be in the future');

        const scheduleId = crypto.randomUUID();
        setTimeout(async () => {
            try {
                await this.send(options);
                log.success(`Scheduled SMS ${scheduleId} sent`);
            } catch (error) {
                log.error(`Scheduled SMS ${scheduleId} failed: ${error.message}`);
            }
        }, delay);

        return {
            success: true,
            scheduleId,
            scheduledAt,
            status: 'scheduled'
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 Send Verification Code (به‌روزرسانی شده)
    // ═══════════════════════════════════════════════════════════════
    async sendVerificationCode(phone, code, type = 'login') {
        const templates = {
            login: 'OTP',
            register: 'VERIFICATION_CODE',
            reset_password: 'PASSWORD_RESET',
            verify_phone: 'VERIFICATION_CODE'
        };
        const template = templates[type] || 'OTP';
        return this.send({
            to: phone,
            template,
            templateData: { code, minutes: 5 }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 📨 Send Template Message (بدون تغییر)
    // ═══════════════════════════════════════════════════════════════
    async sendTemplate(phone, templateName, data) {
        return this.send({ to: phone, template: templateName, templateData: data });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔢 Generate OTP
    // ═══════════════════════════════════════════════════════════════
    generateOTP(length = 6) {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔢 Generate & Send OTP (به‌روزرسانی شده)
    // ═══════════════════════════════════════════════════════════════
    async generateAndSendOTP(phone, type = 'login', length = 6) {
        const code = this.generateOTP(length);
        const result = await this.sendVerificationCode(phone, code, type);
        return {
            ...result,
            code: process.env.NODE_ENV === 'development' ? code : undefined,
            expiresIn: 300
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 Verify OTP (همانند قبل، نیاز به پیاده‌سازی دیتابیس دارد)
    // ═══════════════════════════════════════════════════════════════
    async verifyOTP(phone, code, type = 'login') {
        // پیاده‌سازی خودت
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 Format Phone Number
    // ═══════════════════════════════════════════════════════════════
    formatPhoneNumber(phone) {
        if (!phone) return null;
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('+98')) cleaned = cleaned.substring(3);
        else if (cleaned.startsWith('98')) cleaned = cleaned.substring(2);
        else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        if (!cleaned.startsWith('9')) cleaned = '9' + cleaned;
        return '98' + cleaned;
    }

    validatePhoneNumber(phone) {
        return /^989[0-9]{9}$/.test(phone);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎨 Render Template
    // ═══════════════════════════════════════════════════════════════
    renderTemplate(templateName, data = {}) {
        const template = TEMPLATES[templateName];
        if (!template) throw new Error(`Template not found: ${templateName}`);
        let message = template.fa || template.en || '';
        for (const [key, value] of Object.entries(data)) {
            message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return message;
    }

    // ═══════════════════════════════════════════════════════════════
    // ⏱️ Rate Limiting (ساده داخلی)
    // ═══════════════════════════════════════════════════════════════
    async checkRateLimit(phone) {
        const now = Date.now();
        const key = `sms_${phone}`;
        let data = this.rateLimitStore.get(key) || {
            minute: { count: 0, resetAt: now + 60000 },
            hour: { count: 0, resetAt: now + 3600000 },
            day: { count: 0, resetAt: now + 86400000 }
        };
        if (now > data.minute.resetAt) data.minute = { count: 0, resetAt: now + 60000 };
        if (now > data.hour.resetAt) data.hour = { count: 0, resetAt: now + 3600000 };
        if (now > data.day.resetAt) data.day = { count: 0, resetAt: now + 86400000 };

        if (data.minute.count >= CONFIG.rateLimit.maxPerMinute) throw new Error('Rate limit: max per minute');
        if (data.hour.count >= CONFIG.rateLimit.maxPerHour) throw new Error('Rate limit: max per hour');
        if (data.day.count >= CONFIG.rateLimit.maxPerDay) throw new Error('Rate limit: max per day');

        data.minute.count++; data.hour.count++; data.day.count++;
        this.rateLimitStore.set(key, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 Statistics
    // ═══════════════════════════════════════════════════════════════
    updateStats(type, template = 'direct') {
        if (type === 'sent') this.stats.totalSent++;
        else this.stats.totalFailed++;
        if (!this.stats.byTemplate[template]) {
            this.stats.byTemplate[template] = { sent: 0, failed: 0 };
        }
        this.stats.byTemplate[template][type === 'sent' ? 'sent' : 'failed']++;
        this.stats.byProvider['bale'][type === 'sent' ? 'sent' : 'failed']++;
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalSent / (this.stats.totalSent + this.stats.totalFailed) * 100 || 0
        };
    }

    resetStats() {
        this.stats = {
            totalSent: 0, totalFailed: 0, totalQueued: 0,
            byProvider: { bale: { sent: 0, failed: 0 } },
            byTemplate: {}
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // ⏱️ Utility
    // ═══════════════════════════════════════════════════════════════
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    getMessageLength(message) {
        const isUnicode = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message);
        return isUnicode ? Math.ceil(message.length / 70) : Math.ceil(message.length / 160);
    }

    splitMessage(message) {
        const isUnicode = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message);
        const segmentLength = isUnicode ? 67 : 153;
        const segments = [];
        for (let i = 0; i < message.length; i += segmentLength) {
            segments.push(message.substring(i, i + segmentLength));
        }
        return segments;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📤 Export
// ═══════════════════════════════════════════════════════════════════
const smsService = new SMSService();
module.exports = {
    sms: smsService,
    send: (options) => smsService.send(options),
    sendBulk: (recipients, message) => smsService.sendBulk(recipients, message),
    sendVerificationCode: (phone, code, type) => smsService.sendVerificationCode(phone, code, type),
    sendTemplate: (phone, template, data) => smsService.sendTemplate(phone, template, data),
    generateAndSendOTP: (phone, type, length) => smsService.generateAndSendOTP(phone, type, length),
    verifyOTP: (phone, code, type) => smsService.verifyOTP(phone, code, type),
    schedule: (options, date) => smsService.schedule(options, date),
    getStats: () => smsService.getStats(),
    formatPhoneNumber: (phone) => smsService.formatPhoneNumber(phone),
    validatePhoneNumber: (phone) => smsService.validatePhoneNumber(phone),
    generateOTP: (length) => smsService.generateOTP(length),
    templates: TEMPLATES,
    config: CONFIG,
    SMSService
};