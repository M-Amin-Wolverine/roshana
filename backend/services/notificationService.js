/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔔 Notification Service - نسخه پیشرفته و جامع
 * Multi-Channel Notification Manager (Email, SMS, Push, In-App)
 * ═══════════════════════════════════════════════════════════════════
 */

const emailService = require('./emailService');
const smsService = require('./smsService');
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
    GRAY: '\x1b[90m',
    BOLD: '\x1b[1m',
    BG_GREEN: '\x1b[42m',
    BG_BLUE: '\x1b[44m',
    BG_RED: '\x1b[41m'
};

const log = {
    info: (msg) => console.log(`${Colors.CYAN}ℹ${Colors.RESET} ${msg}`),
    success: (msg) => console.log(`${Colors.GREEN}✓${Colors.RESET} ${msg}`),
    error: (msg) => console.log(`${Colors.RED}✗${Colors.RESET} ${msg}`),
    warn: (msg) => console.log(`${Colors.YELLOW}⚠${Colors.RESET} ${msg}`),
    debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`${Colors.GRAY}⚙${Colors.RESET} ${msg}`),
    step: (msg) => console.log(`${Colors.MAGENTA}→${Colors.RESET} ${msg}`)
};

// ═══════════════════════════════════════════════════════════════════
// ⚙️ Configuration
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    // Channels
    channels: {
        email: {
            enabled: process.env.NOTIFICATION_EMAIL_ENABLED !== 'false',
            default: true
        },
        sms: {
            enabled: process.env.NOTIFICATION_SMS_ENABLED !== 'false',
            default: false
        },
        push: {
            enabled: process.env.NOTIFICATION_PUSH_ENABLED === 'true',
            default: false
        },
        inApp: {
            enabled: process.env.NOTIFICATION_INAPP_ENABLED !== 'false',
            default: true
        }
    },
    
    // Queue Settings
    queue: {
        enabled: process.env.NOTIFICATION_QUEUE_ENABLED === 'true',
        concurrency: parseInt(process.env.NOTIFICATION_QUEUE_CONCURRENCY) || 5,
        retryAttempts: 3,
        retryDelay: 5000
    },
    
    // Rate Limiting
    rateLimit: {
        maxPerMinute: parseInt(process.env.NOTIFICATION_MAX_PER_MINUTE) || 10,
        maxPerHour: parseInt(process.env.NOTIFICATION_MAX_PER_HOUR) || 100
    },
    
    // Logging
    logging: {
        enabled: process.env.NOTIFICATION_LOGGING_ENABLED !== 'false',
        logToDatabase: process.env.NOTIFICATION_LOG_TO_DB === 'true'
    },
    
    // Default Settings
    defaults: {
        frontendUrl: process.env.FRONTEND_URL || 'https://roshana.com',
        appName: process.env.APP_NAME || 'Roshana',
        appLogo: process.env.APP_LOGO || 'https://roshana.com/logo.png'
    },
    
    // Mock Mode
    mockMode: process.env.NODE_ENV === 'development' || process.env.NOTIFICATION_MOCK_MODE === 'true'
};

// ═══════════════════════════════════════════════════════════════════
// 📋 Notification Types & Templates
// ═══════════════════════════════════════════════════════════════════

const NOTIFICATION_TYPES = {
    // Authentication
    AUTH_WELCOME: { 
        code: 'AUTH_WELCOME', 
        channels: ['email', 'inApp'],
        template: 'welcome',
        priority: 'high'
    },
    AUTH_VERIFICATION: { 
        code: 'AUTH_VERIFICATION', 
        channels: ['email', 'sms'],
        template: 'verification',
        priority: 'high'
    },
    AUTH_LOGIN: { 
        code: 'AUTH_LOGIN', 
        channels: ['email', 'inApp'],
        template: 'login-alert',
        priority: 'medium'
    },
    AUTH_LOGIN_OTP: { 
        code: 'AUTH_LOGIN_OTP', 
        channels: ['sms', 'email'],
        template: 'otp',
        priority: 'high'
    },
    AUTH_PASSWORD_RESET: { 
        code: 'AUTH_PASSWORD_RESET', 
        channels: ['email'],
        template: 'password-reset',
        priority: 'high'
    },
    AUTH_PASSWORD_CHANGED: { 
        code: 'AUTH_PASSWORD_CHANGED', 
        channels: ['email', 'inApp'],
        template: 'password-changed',
        priority: 'high'
    },
    
    // Orders
    ORDER_CREATED: { 
        code: 'ORDER_CREATED', 
        channels: ['email', 'sms', 'inApp'],
        template: 'order-created',
        priority: 'medium'
    },
    ORDER_CONFIRMED: { 
        code: 'ORDER_CONFIRMED', 
        channels: ['email', 'sms', 'inApp'],
        template: 'order-confirmed',
        priority: 'medium'
    },
    ORDER_SHIPPED: { 
        code: 'ORDER_SHIPPED', 
        channels: ['email', 'sms', 'inApp'],
        template: 'order-shipped',
        priority: 'medium'
    },
    ORDER_DELIVERED: { 
        code: 'ORDER_DELIVERED', 
        channels: ['email', 'inApp'],
        template: 'order-delivered',
        priority: 'low'
    },
    ORDER_CANCELLED: { 
        code: 'ORDER_CANCELLED', 
        channels: ['email', 'sms', 'inApp'],
        template: 'order-cancelled',
        priority: 'high'
    },
    
    // Payments
    PAYMENT_SUCCESS: { 
        code: 'PAYMENT_SUCCESS', 
        channels: ['email', 'inApp'],
        template: 'payment-success',
        priority: 'high'
    },
    PAYMENT_FAILED: { 
        code: 'PAYMENT_FAILED', 
        channels: ['email', 'inApp'],
        template: 'payment-failed',
        priority: 'high'
    },
    PAYMENT_REFUND: { 
        code: 'PAYMENT_REFUND', 
        channels: ['email', 'sms', 'inApp'],
        template: 'payment-refund',
        priority: 'medium'
    },
    
    // Account
    ACCOUNT_ACTIVATED: { 
        code: 'ACCOUNT_ACTIVATED', 
        channels: ['email', 'inApp'],
        template: 'account-activated',
        priority: 'medium'
    },
    ACCOUNT_DEACTIVATED: { 
        code: 'ACCOUNT_DEACTIVATED', 
        channels: ['email'],
        template: 'account-deactivated',
        priority: 'high'
    },
    ACCOUNT_SUSPENDED: { 
        code: 'ACCOUNT_SUSPENDED', 
        channels: ['email'],
        template: 'account-suspended',
        priority: 'high'
    },
    
    // General
    GENERAL_NEWS: { 
        code: 'GENERAL_NEWS', 
        channels: ['email', 'inApp'],
        template: 'newsletter',
        priority: 'low'
    },
    GENERAL_ANNOUNCEMENT: { 
        code: 'GENERAL_ANNOUNCEMENT', 
        channels: ['email', 'push', 'inApp'],
        template: 'announcement',
        priority: 'medium'
    },
    GENERAL_REMINDER: { 
        code: 'GENERAL_REMINDER', 
        channels: ['email', 'push', 'inApp'],
        template: 'reminder',
        priority: 'low'
    },
    
    // Social
    SOCIAL_NEW_FOLLOWER: { 
        code: 'SOCIAL_NEW_FOLLOWER', 
        channels: ['inApp', 'push'],
        template: 'new-follower',
        priority: 'low'
    },
    SOCIAL_NEW_MESSAGE: { 
        code: 'SOCIAL_NEW_MESSAGE', 
        channels: ['push', 'inApp'],
        template: 'new-message',
        priority: 'high'
    },
    SOCIAL_LIKE: { 
        code: 'SOCIAL_LIKE', 
        channels: ['inApp'],
        template: 'new-like',
        priority: 'low'
    },
    SOCIAL_COMMENT: { 
        code: 'SOCIAL_COMMENT', 
        channels: ['inApp', 'push'],
        template: 'new-comment',
        priority: 'low'
    },
    SOCIAL_MENTION: { 
        code: 'SOCIAL_MENTION', 
        channels: ['inApp', 'push'],
        template: 'new-mention',
        priority: 'medium'
    }
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 Notification Service Class
// ═══════════════════════════════════════════════════════════════════

class NotificationService {
    constructor() {
        this.config = CONFIG;
        this.types = NOTIFICATION_TYPES;
        
        // Rate limiting
        this.rateLimitStore = new Map();
        
        // Statistics
        this.stats = {
            total: 0,
            sent: 0,
            failed: 0,
            byChannel: {
                email: { sent: 0, failed: 0 },
                sms: { sent: 0, failed: 0 },
                push: { sent: 0, failed: 0 },
                inApp: { sent: 0, failed: 0 }
            },
            byType: {}
        };
        
        // Notification queue
        this.queue = [];
        this.processing = false;
        
        log.info('Notification Service initialized');
    }

    // ═══════════════════════════════════════════════════════════════
    // 📤 Send Notification (Main Method)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send notification via multiple channels
     * @param {Object} notification - Notification data
     * @returns {Promise<Object>} Send results
     */
    async send(notification) {
        const { 
            userId, 
            user, 
            type, 
            channels, 
            data, 
            priority,
            scheduledAt,
            metadata
        } = notification;

        // Validate
        if (!userId && !user) {
            throw new Error('User ID or User object is required');
        }

        // Get user data if not provided
        const userData = user || await this.getUserData(userId);
        if (!userData) {
            throw new Error('User not found');
        }

        // Get notification type config
        const typeConfig = this.types[type] || {
            channels: channels || ['inApp'],
            priority: priority || 'medium'
        };

        // Determine channels
        const activeChannels = channels || typeConfig.channels;
        
        // Check rate limit
        await this.checkRateLimit(userData.id || userId);

        // Prepare results
        const results = {
            id: crypto.randomUUID(),
            userId: userData.id || userId,
            type,
            channels: {},
            sentAt: new Date(),
            success: true
        };

        // Send to each channel
        for (const channel of activeChannels) {
            if (!this.config.channels[channel]?.enabled) {
                log.debug(`Channel ${channel} is disabled, skipping`);
                continue;
            }

            try {
                const channelResult = await this.sendToChannel(
                    channel,
                    userData,
                    data,
                    typeConfig
                );
                
                results.channels[channel] = channelResult;
                this.updateStats('sent', channel, type);
                
            } catch (error) {
                log.error(`Failed to send ${channel} notification: ${error.message}`);
                results.channels[channel] = { 
                    success: false, 
                    error: error.message 
                };
                results.success = false;
                this.updateStats('failed', channel, type);
            }
        }

        // Log to database if enabled
        if (CONFIG.logging.logToDatabase) {
            await this.logNotification(results, metadata);
        }

        // Update total stats
        this.stats.total++;
        if (results.success) {
            this.stats.sent++;
        } else {
            this.stats.failed++;
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📤 Send to Specific Channel
    // ═══════════════════════════════════════════════════════════════

    async sendToChannel(channel, user, data, typeConfig) {
        const channelData = { ...data, user };
        
        switch (channel) {
            case 'email':
                return await this.sendEmail(user, channelData, typeConfig);
                
            case 'sms':
                return await this.sendSMS(user, channelData, typeConfig);
                
            case 'push':
                return await this.sendPush(user, channelData, typeConfig);
                
            case 'inApp':
                return await this.sendInApp(user, channelData, typeConfig);
                
            default:
                throw new Error(`Unknown channel: ${channel}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📧 Email
    // ═══════════════════════════════════════════════════════════════

    async sendEmail(user, data, typeConfig) {
        if (!user.email) {
            throw new Error('User email not available');
        }

        const templateData = {
            ...data,
            name: user.first_name || user.username || 'کاربر',
            appName: CONFIG.defaults.appName,
            appUrl: CONFIG.defaults.frontendUrl,
            appLogo: CONFIG.defaults.appLogo,
            year: new Date().getFullYear()
        };

        // Mock mode
        if (CONFIG.mockMode) {
            log.debug(`[MOCK] Email to ${user.email}: ${data.subject || typeConfig.template}`);
            return { success: true, mock: true, channel: 'email' };
        }

        const result = await emailService.send({
            to: user.email,
            subject: data.subject || this.getDefaultSubject(typeConfig.template),
            template: data.template || typeConfig.template,
            templateData
        });

        return {
            success: true,
            channel: 'email',
            messageId: result.messageId
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 SMS
    // ═══════════════════════════════════════════════════════════════

    async sendSMS(user, data, typeConfig) {
        if (!user.phone) {
            throw new Error('User phone not available');
        }

        const message = data.message || this.getDefaultMessage(typeConfig.template, data);
        
        // Mock mode
        if (CONFIG.mockMode) {
            log.debug(`[MOCK] SMS to ${user.phone}: ${message}`);
            return { success: true, mock: true, channel: 'sms' };
        }

        const result = await smsService.send({
            to: user.phone,
            message
        });

        return {
            success: true,
            channel: 'sms',
            messageId: result.messageId
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔔 Push Notification
    // ═══════════════════════════════════════════════════════════════

    async sendPush(user, data, typeConfig) {
        if (!user.pushToken) {
            throw new Error('User push token not available');
        }

        const pushData = {
            token: user.pushToken,
            title: data.title || this.getDefaultTitle(typeConfig.template),
            body: data.message || data.body || '',
            data: data.payload || {},
            icon: CONFIG.defaults.appLogo,
            badge: 1,
            sound: 'default'
        };

        // Mock mode
        if (CONFIG.mockMode) {
            log.debug(`[MOCK] Push to user ${user.id}: ${pushData.title}`);
            return { success: true, mock: true, channel: 'push' };
        }

        // Implement with FCM or other push service
        // const result = await fcm.send(pushData);
        
        return {
            success: true,
            channel: 'push',
            messageId: `push-${Date.now()}`
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 In-App Notification
    // ═══════════════════════════════════════════════════════════════

    async sendInApp(user, data, typeConfig) {
        const notification = {
            user_id: user.id,
            type: typeConfig.code || typeConfig.template,
            title: data.title || this.getDefaultTitle(typeConfig.template),
            message: data.message || '',
            data: data.payload || data,
            link: data.link || null,
            image: data.image || null,
            priority: typeConfig.priority || 'normal',
            created_at: new Date()
        };

        // Mock mode
        if (CONFIG.mockMode) {
            log.debug(`[MOCK] In-App to user ${user.id}: ${notification.title}`);
            return { success: true, mock: true, channel: 'inApp', notification };
        }

        // Save to database
        // await db.query('INSERT INTO notifications SET ?', notification);

        return {
            success: true,
            channel: 'inApp',
            notificationId: notification.id || `inapp-${Date.now()}`
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎯 Convenience Methods
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send welcome notification
     */
    async sendWelcome(user) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_WELCOME',
            data: {
                name: user.first_name || user.username,
                email: user.email
            }
        });
    }

    /**
     * Send verification notification
     */
    async sendVerification(user, token) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_VERIFICATION',
            data: {
                name: user.first_name,
                verificationUrl: `${CONFIG.defaults.frontendUrl}/verify-email?token=${token}`,
                verificationCode: token.substring(0, 6)
            }
        });
    }

    /**
     * Send login OTP
     */
    async sendLoginOTP(user, otpCode) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_LOGIN_OTP',
            channels: user.phone ? ['sms', 'inApp'] : ['email', 'inApp'],
            data: {
                code: otpCode,
                name: user.first_name
            }
        });
    }

    /**
     * Send password reset notification
     */
    async sendPasswordReset(user, resetToken) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_PASSWORD_RESET',
            data: {
                name: user.first_name,
                resetUrl: `${CONFIG.defaults.frontendUrl}/reset-password?token=${resetToken}`,
                expiry: '1 ساعت'
            }
        });
    }

    /**
     * Send password changed notification
     */
    async sendPasswordChanged(user) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_PASSWORD_CHANGED',
            data: {
                name: user.first_name,
                timestamp: new Date().toLocaleString('fa-IR'),
                ip: 'آیپی'
            }
        });
    }

    /**
     * Send login alert
     */
    async sendLoginAlert(user, loginData = {}) {
        return this.send({
            userId: user.id,
            user,
            type: 'AUTH_LOGIN',
            data: {
                name: user.first_name,
                device: loginData.device || 'دستگاه ناشناس',
                location: loginData.location || 'نامشخص',
                ip: loginData.ip || 'نامشخص',
                time: new Date().toLocaleString('fa-IR')
            }
        });
    }

    /**
     * Send order notification
     */
    async sendOrderNotification(user, order, type = 'ORDER_CREATED') {
        return this.send({
            userId: user.id,
            user,
            type,
            data: {
                orderId: order.id,
                orderNumber: order.order_number || order.id,
                totalAmount: order.total?.toLocaleString('fa-IR') || '0',
                items: order.items?.length || 0,
                status: order.status
            }
        });
    }

    /**
     * Send payment notification
     */
    async sendPaymentNotification(user, payment, type = 'PAYMENT_SUCCESS') {
        return this.send({
            userId: user.id,
            user,
            type,
            data: {
                amount: payment.amount?.toLocaleString('fa-IR') || '0',
                transactionId: payment.id,
                description: payment.description || '',
                timestamp: new Date().toLocaleString('fa-IR')
            }
        });
    }

    /**
     * Send custom notification
     */
    async sendCustom(user, options) {
        return this.send({
            userId: user.id,
            user,
            type: options.type || 'GENERAL_ANNOUNCEMENT',
            channels: options.channels,
            data: options.data || {},
            priority: options.priority
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 Bulk Notifications
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send bulk notifications
     */
    async sendBulk(notifications) {
        log.info(`Sending bulk notifications to ${notifications.length} users`);
        
        const results = [];
        const batchSize = CONFIG.queue.concurrency;

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            
            const batchResults = await Promise.allSettled(
                batch.map(notification => this.send(notification))
            );

            results.push(...batchResults.map((result, index) => ({
                userId: batch[index].userId,
                ...(result.status === 'fulfilled' ? result.value : { 
                    success: false, 
                    error: result.reason.message 
                })
            })));

            // Rate limiting delay
            if (i + batchSize < notifications.length) {
                await this.delay(1000);
            }
        }

        return results;
    }

    /**
     * Send to all users (admin)
     */
    async sendToAll(type, data, options = {}) {
        // Get all active users from database
        // const users = await db.query('SELECT * FROM users WHERE is_active = true');
        
        log.info(`Sending notification to all users: ${type}`);
        
        // This should be implemented with pagination for large user bases
        // For now, return a placeholder
        return {
            success: true,
            queued: true,
            type,
            estimatedRecipients: 0
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📅 Schedule Notification
    // ═══════════════════════════════════════════════════════════════

    /**
     * Schedule notification
     */
    async schedule(notification, scheduledAt) {
        const delay = scheduledAt.getTime() - Date.now();
        
        if (delay < 0) {
            throw new Error('Scheduled time must be in the future');
        }

        const scheduleId = crypto.randomUUID();
        
        setTimeout(async () => {
            try {
                await this.send(notification);
                log.success(`Scheduled notification ${scheduleId} sent`);
            } catch (error) {
                log.error(`Scheduled notification ${scheduleId} failed: ${error.message}`);
            }
        }, delay);

        log.info(`Notification scheduled for ${scheduledAt.toISOString()}, ID: ${scheduleId}`);

        return {
            success: true,
            scheduleId,
            scheduledAt,
            status: 'scheduled'
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔔 In-App Notifications
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, options = {}) {
        const { page = 1, limit = 20, unreadOnly = false } = options;
        const offset = (page - 1) * limit;

        // Mock data for now
        const notifications = [];
        
        return {
            notifications,
            pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0
            }
        };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        // await db.query(
        //     'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = ? AND user_id = ?',
        //     [notificationId, userId]
        // );
        
        return { success: true, notificationId };
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        // await db.query(
        //     'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false',
        //     [userId]
        // );
        
        return { success: true, userId };
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        // const [result] = await db.query(
        //     'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
        //     [userId]
        // );
        
        return { count: 0 };
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ User Preferences
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get user notification preferences
     */
    async getPreferences(userId) {
        // const [preferences] = await db.query(
        //     'SELECT * FROM notification_preferences WHERE user_id = ?',
        //     [userId]
        // );
        
        return {
            email: true,
            sms: false,
            push: true,
            inApp: true,
            types: {
                order_updates: true,
                marketing: false,
                security: true,
                social: true
            }
        };
    }

    /**
     * Update user notification preferences
     */
    async updatePreferences(userId, preferences) {
        // await db.query(
        //     'INSERT INTO notification_preferences (user_id, ...) VALUES (?, ...) ON DUPLICATE KEY UPDATE ...',
        //     [userId, ...]
        // );
        
        return { success: true, userId, preferences };
    }

    // ═══════════════════════════════════════════════════════════════
    // ⏱️ Rate Limiting
    // ═══════════════════════════════════════════════════════════════

    async checkRateLimit(userId) {
        const now = Date.now();
        const key = `notif_${userId}`;

        let data = this.rateLimitStore.get(key) || {
            minute: { count: 0, resetAt: now + 60000 },
            hour: { count: 0, resetAt: now + 3600000 }
        };

        // Reset if expired
        if (now > data.minute.resetAt) {
            data.minute = { count: 0, resetAt: now + 60000 };
        }
        if (now > data.hour.resetAt) {
            data.hour = { count: 0, resetAt: now + 3600000 };
        }

        // Check limits
        if (data.minute.count >= CONFIG.rateLimit.maxPerMinute) {
            throw new Error('Rate limit exceeded: max notifications per minute');
        }
        if (data.hour.count >= CONFIG.rateLimit.maxPerHour) {
            throw new Error('Rate limit exceeded: max notifications per hour');
        }

        // Increment
        data.minute.count++;
        data.hour.count++;

        this.rateLimitStore.set(key, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 Statistics
    // ═══════════════════════════════════════════════════════════════

    updateStats(type, channel, notificationType) {
        if (channel) {
            this.stats.byChannel[channel][type]++;
        }
        
        if (notificationType) {
            if (!this.stats.byType[notificationType]) {
                this.stats.byType[notificationType] = { sent: 0, failed: 0 };
            }
            this.stats.byType[notificationType][type]++;
        }
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.total > 0 
                ? (this.stats.sent / this.stats.total * 100).toFixed(2) 
                : 0
        };
    }

    resetStats() {
        this.stats = {
            total: 0,
            sent: 0,
            failed: 0,
            byChannel: {
                email: { sent: 0, failed: 0 },
                sms: { sent: 0, failed: 0 },
                push: { sent: 0, failed: 0 },
                inApp: { sent: 0, failed: 0 }
            },
            byType: {}
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 Helper Methods
    // ═══════════════════════════════════════════════════════════════

    async getUserData(userId) {
        // This should fetch from database
        // const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        // return user;
        
        return null;
    }

    getDefaultSubject(template) {
        const subjects = {
            'welcome': 'خوش آمدید به روشنا!',
            'verification': 'تأیید ایمیل',
            'otp': 'کد تأیید',
            'password-reset': 'بازیابی رمز عبور',
            'password-changed': 'تغییر رمز عبور',
            'login-alert': 'ورود جدید به حساب',
            'order-created': 'سفارش جدید',
            'order-confirmed': 'تأیید سفارش',
            'order-shipped': 'ارسال سفارش',
            'order-delivered': 'تحویل سفارش',
            'order-cancelled': 'لغو سفارش',
            'payment-success': 'پرداخت موفق',
            'payment-failed': 'پرداخت ناموفق',
            'payment-refund': 'بازگشت وجه',
            'account-activated': 'فعال‌سازی حساب',
            'account-deactivated': 'غیرفعال‌سازی حساب',
            'account-suspended': 'تعلیق حساب',
            'newsletter': 'خبرنامه روشنا',
            'announcement': 'اطلاعیه مهم',
            'reminder': 'یادآوری',
            'new-follower': 'دنبال‌کننده جدید',
            'new-message': 'پیام جدید',
            'new-like': 'لایک جدید',
            'new-comment': 'کامنت جدید',
            'new-mention': 'تگ شدن'
        };
        
        return subjects[template] || 'پیام از روشنا';
    }

    getDefaultTitle(template) {
        const titles = {
            'new-message': 'پیام جدید',
            'new-like': 'کسی پست شما را لایک کرد',
            'new-comment': 'کامنت جدید',
            'new-follower': 'دنبال‌کننده جدید',
            'new-mention': 'کسی شما را تگ کرد',
            'reminder': 'یادآوری',
            'announcement': 'اطلاعیه'
        };
        
        return titles[template] || 'پیام جدید';
    }

    getDefaultMessage(template, data) {
        const messages = {
            'otp': `کد تأیید شما: ${data.code || 'XXXXXX'}`,
            'order-created': `سفارش شما با کد ${data.orderId} ثبت شد`,
            'order-shipped': `سفارش ${data.orderNumber} ارسال شد`,
            'payment-success': `پرداخت ${data.amount} تومان موفق بود`
        };
        
        return messages[template] || data.message || 'پیام از روشنا';
    }

    async logNotification(notification, metadata) {
        // Save to database
        // await db.query('INSERT INTO notification_logs SET ?', {
        //     ...notification,
        //     metadata: JSON.stringify(metadata),
        //     created_at: new Date()
        // });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔌 Verify Connection
    // ═══════════════════════════════════════════════════════════════

    async verifyConnection() {
        const results = {};
        
        if (CONFIG.channels.email.enabled) {
            results.email = await emailService.verifyConnection();
        }
        
        if (CONFIG.channels.sms.enabled) {
            results.sms = await smsService.verifyConnection();
        }
        
        const allReady = Object.values(results).every(r => r);
        
        if (allReady) {
            log.success('All notification channels are ready');
        } else {
            log.warn('Some notification channels are not ready', results);
        }
        
        return allReady;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📤 Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════

const notificationService = new NotificationService();

module.exports = {
    // Main service
    notification: notificationService,
    
    // Convenience methods
    send: (options) => notificationService.send(options),
    sendBulk: (notifications) => notificationService.sendBulk(notifications),
    sendToAll: (type, data, options) => notificationService.sendToAll(type, data, options),
    schedule: (notification, date) => notificationService.schedule(notification, date),
    
    // Auth notifications
    sendWelcome: (user) => notificationService.sendWelcome(user),
    sendVerification: (user, token) => notificationService.sendVerification(user, token),
    sendLoginOTP: (user, code) => notificationService.sendLoginOTP(user, code),
    sendPasswordReset: (user, token) => notificationService.sendPasswordReset(user, token),
    sendPasswordChanged: (user) => notificationService.sendPasswordChanged(user),
    sendLoginAlert: (user, data) => notificationService.sendLoginAlert(user, data),
    
    // Order notifications
    sendOrderNotification: (user, order, type) => notificationService.sendOrderNotification(user, order, type),
    
    // Payment notifications
    sendPaymentNotification: (user, payment, type) => notificationService.sendPaymentNotification(user, payment, type),
    
    // In-app
    getUserNotifications: (userId, options) => notificationService.getUserNotifications(userId, options),
    markAsRead: (id, userId) => notificationService.markAsRead(id, userId),
    markAllAsRead: (userId) => notificationService.markAllAsRead(userId),
    getUnreadCount: (userId) => notificationService.getUnreadCount(userId),
    
    // Preferences
    getPreferences: (userId) => notificationService.getPreferences(userId),
    updatePreferences: (userId, prefs) => notificationService.updatePreferences(userId, prefs),
    
    // Stats
    getStats: () => notificationService.getStats(),
    resetStats: () => notificationService.resetStats(),
    
    // Verify
    verifyConnection: () => notificationService.verifyConnection(),
    
    // Types
    types: NOTIFICATION_TYPES,
    
    // Config
    config: CONFIG,
    
    // Export class
    NotificationService
};