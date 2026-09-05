/**
 * ═══════════════════════════════════════════════════════════════════
 * 📧 Email Service - نسخه پیشرفته و حرفه‌ای
 * Multi-Provider Email Gateway with Templates & Queue
 * ═══════════════════════════════════════════════════════════════════
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
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
    BG_BLUE: '\x1b[44m'
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
    // Provider Settings
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    
    // SMTP Settings
    smtp: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || '"Roshana" <noreply@roshana.com>',
        fromName: process.env.EMAIL_FROM_NAME || 'Roshana'
    },
    
    // SendGrid Settings
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@roshana.com'
    },
    
    // Mailgun Settings
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        from: process.env.EMAIL_FROM || 'noreply@roshana.com'
    },
    
    // AWS SES Settings
    ses: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        from: process.env.EMAIL_FROM || 'noreply@roshana.com'
    },
    
    // Rate Limiting
    rateLimit: {
        maxPerMinute: parseInt(process.env.EMAIL_MAX_PER_MINUTE) || 10,
        maxPerHour: parseInt(process.env.EMAIL_MAX_PER_HOUR) || 100,
        maxPerDay: parseInt(process.env.EMAIL_MAX_PER_DAY) || 1000
    },
    
    // Queue Settings
    queue: {
        enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
        concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY) || 5,
        retryAttempts: 3,
        retryDelay: 5000
    },
    
    // Template Settings
    templates: {
        path: process.env.EMAIL_TEMPLATES_PATH || path.join(__dirname, '../views/emails'),
        engine: process.env.EMAIL_TEMPLATE_ENGINE || 'handlebars',
        cacheEnabled: process.env.EMAIL_TEMPLATE_CACHE !== 'false'
    },
    
    // Tracking
    tracking: {
        enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
        baseUrl: process.env.EMAIL_TRACKING_URL || 'https://api.roshana.com/track'
    },
    
    // Logging
    logging: {
        enabled: process.env.EMAIL_LOGGING_ENABLED !== 'false',
        logFile: process.env.EMAIL_LOG_FILE || './logs/emails.log'
    },
    
    // Mock Mode
    mockMode: process.env.NODE_ENV === 'development' || process.env.EMAIL_MOCK_MODE === 'true'
};

// ═══════════════════════════════════════════════════════════════════
// 📋 Email Templates
// ═══════════════════════════════════════════════════════════════════

const TEMPLATES = {
    // Welcome Email
    welcome: {
        subject: 'خوش آمدید به روشنا!',
        title: 'خوش آمدید',
        preheader: 'به خانواده روشنا خوش آمدید',
        sections: {
            hero: {
                title: 'به روشنا خوش آمدید!',
                description: 'ما بسیار خوشحالیم که به جمع ما پیوستید.'
            },
            features: [
                { icon: '🚀', title: 'سریع', description: 'سریع‌ترین سرویس' },
                { icon: '🔒', title: 'امن', description: 'امنیت بالا' },
                { icon: '💎', description: 'کیفیت برتر' }
            ],
            cta: {
                text: 'شروع کنید',
                url: '{{appUrl}}/dashboard'
            }
        }
    },
    
    // Verification Email
    verification: {
        subject: 'تأیید ایمیل - روشنا',
        title: 'تأیید ایمیل',
        preheader: 'ایمیل خود را تأیید کنید',
        sections: {
            hero: {
                title: 'ایمیل خود را تأیید کنید',
                description: 'برای فعال‌سازی حساب خود روی دکمه زیر کلیک کنید.'
            },
            code: '{{verificationCode}}',
            cta: {
                text: 'تأیید ایمیل',
                url: '{{verificationUrl}}'
            },
            expiry: 'این لینک ۲۴ ساعت اعتبار دارد'
        }
    },
    
    // Password Reset
    passwordReset: {
        subject: 'بازیابی رمز عبور - روشنا',
        title: 'بازیابی رمز عبور',
        preheader: 'درخواست بازیابی رمز عبور',
        sections: {
            hero: {
                title: 'رمز عبور خود را فراموش کردید؟',
                description: 'نگران نباشید، ما کمکتان می‌کنیم.'
            },
            warning: 'اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.',
            cta: {
                text: 'بازیابی رمز عبور',
                url: '{{resetUrl}}'
            },
            expiry: 'این لینک ۱ ساعت اعتبار دارد'
        }
    },
    
    // OTP Email
    otp: {
        subject: 'کد تأیید - روشنا',
        title: 'کد تأیید',
        preheader: 'کد تأیید یکبار مصرف',
        sections: {
            hero: {
                title: 'کد تأیید شما',
                description: 'کد زیر را وارد کنید:'
            },
            code: '{{otpCode}}',
            expiry: 'این کد ۵ دقیقه اعتبار دارد',
            warning: 'این کد را با کسی به اشتراک نگذارید'
        }
    },
    
    // Order Confirmation
    orderConfirmation: {
        subject: 'تأیید سفارش - روشنا',
        title: 'سفارش تأیید شد',
        preheader: 'سفارش شما ثبت شد',
        sections: {
            hero: {
                title: 'سفارش شما ثبت شد!',
                description: 'از خرید شما متشکریم.'
            },
            orderDetails: {
                orderId: '{{orderId}}',
                total: '{{totalAmount}}'
            },
            cta: {
                text: 'مشاهده سفارش',
                url: '{{orderUrl}}'
            }
        }
    },
    
    // Newsletter
    newsletter: {
        subject: 'خبرنامه روشنا',
        title: 'آخرین اخبار',
        preheader: 'آخرین اخبار و به‌روزرسانی‌ها',
        sections: {
            articles: '{{articles}}'
        },
        unsubscribe: '{{unsubscribeUrl}}'
    }
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 Email Service Class
// ═══════════════════════════════════════════════════════════════════

class EmailService {
    constructor() {
        this.config = CONFIG;
        this.templates = TEMPLATES;
        this.transporter = null;
        this.templateCache = new Map();
        
        // Rate limiting
        this.rateLimitStore = new Map();
        
        // Statistics
        this.stats = {
            totalSent: 0,
            totalFailed: 0,
            totalQueued: 0,
            byTemplate: {},
            byProvider: {}
        };
        
        // Initialize
        this.initialize();
    }

    // ═══════════════════════════════════════════════════════════════
    // 🚀 Initialize
    // ═══════════════════════════════════════════════════════════════

    initialize() {
        if (CONFIG.mockMode) {
            log.info('Email service running in MOCK mode');
            return;
        }
        
        this.transporter = this.createTransporter();
        log.info(`Email service initialized with provider: ${CONFIG.provider}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔧 Create Transporter
    // ═══════════════════════════════════════════════════════════════

    createTransporter() {
        switch (CONFIG.provider) {
            case 'smtp':
                return this.createSMTPTransporter();
                
            case 'sendgrid':
                return this.createSendGridTransporter();
                
            case 'mailgun':
                return this.createMailgunTransporter();
                
            case 'ses':
                return this.createSESTransporter();
                
            default:
                return this.createSMTPTransporter();
        }
    }

    createSMTPTransporter() {
        return nodemailer.createTransport({
            host: CONFIG.smtp.host,
            port: CONFIG.smtp.port,
            secure: CONFIG.smtp.secure,
            auth: {
                user: CONFIG.smtp.user,
                pass: CONFIG.smtp.pass
            },
            tls: {
                rejectUnauthorized: false
            },
            pool: true,
            maxConnections: 5,
            rateLimit: 5
        });
    }

    createSendGridTransporter() {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(CONFIG.sendgrid.apiKey);
        
        return {
            sendMail: async (options) => {
                const msg = {
                    to: options.to,
                    from: CONFIG.sendgrid.from,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                    attachments: options.attachments
                };
                
                await sgMail.send(msg);
                return { messageId: `sg-${Date.now()}`, accepted: [options.to] };
            }
        };
    }

    createMailgunTransporter() {
        const mailgun = require('mailgun.js');
        const mg = mailgun({ apiKey: CONFIG.mailgun.apiKey, domain: CONFIG.mailgun.domain });
        
        return {
            sendMail: async (options) => {
                const data = {
                    from: CONFIG.mailgun.from,
                    to: options.to,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                    attachment: options.attachments
                };
                
                const result = await mg.messages.send(data);
                return { messageId: result.id, accepted: [options.to] };
            }
        };
    }

    createSESTransporter() {
        const AWS = require('aws-sdk');
        
        AWS.config.update({
            accessKeyId: CONFIG.ses.accessKeyId,
            secretAccessKey: CONFIG.ses.secretAccessKey,
            region: CONFIG.ses.region
        });
        
        const ses = new AWS.SES({ apiVersion: '2010-12-01' });
        
        return {
            sendMail: async (options) => {
                const params = {
                    Destination: { ToAddresses: [options.to] },
                    Message: {
                        Body: {
                            Html: { Data: options.html },
                            Text: { Data: options.text }
                        },
                        Subject: { Data: options.subject }
                    },
                    Source: CONFIG.ses.from
                };
                
                const result = await ses.sendEmail(params).promise();
                return { messageId: result.MessageId, accepted: [options.to] };
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📤 Send Email
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send email
     * @param {Object} options - Email options
     * @returns {Promise<Object>} Send result
     */
    async send(options) {
        const { 
            to, 
            subject, 
            text, 
            html, 
            template, 
            templateData, 
            from, 
            replyTo,
            cc, 
            bcc, 
            attachments,
            priority,
            headers
        } = options;

        // Validate email
        if (!this.validateEmail(to)) {
            throw new Error(`Invalid email address: ${to}`);
        }

        // Check rate limit
        await this.checkRateLimit(to);

        // Get email content
        let htmlContent = html;
        let textContent = text;

        if (template) {
            const rendered = await this.renderTemplate(template, templateData || {});
            htmlContent = rendered.html;
            textContent = rendered.text;
            subject = subject || rendered.subject;
        }

        if (!htmlContent && !textContent) {
            throw new Error('Email content is required');
        }

        // Generate text from HTML if not provided
        if (!textContent && htmlContent) {
            textContent = this.htmlToText(htmlContent);
        }

        // Mock mode
        if (CONFIG.mockMode) {
            return this.mockSend({ to, subject, html: htmlContent, text: textContent });
        }

        // Prepare mail options
        const mailOptions = {
            from: from || CONFIG.smtp.from,
            to,
            subject,
            text: textContent,
            html: htmlContent,
            cc,
            bcc,
            replyTo: replyTo || 'support@roshana.com',
            attachments: this.prepareAttachments(attachments),
            priority: priority || 'normal',
            headers: {
                'X-Priority': priority === 'high' ? '1' : '3',
                'X-Mailer': 'Roshana Email Service',
                ...headers
            }
        };

        // Add tracking
        if (CONFIG.tracking.enabled) {
            mailOptions.headers['X-Track-Id'] = crypto.randomUUID();
        }

        try {
            const info = await this.transporter.sendMail(mailOptions);
            
            // Update stats
            this.updateStats('sent', template || 'direct');
            
            log.success(`Email sent to ${to}: ${info.messageId}`);
            
            return {
                success: true,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                template: template || null,
                sentAt: new Date()
            };
            
        } catch (error) {
            this.updateStats('failed', template || 'direct');
            log.error(`Email send failed: ${error.message}`);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎭 Mock Send
    // ═══════════════════════════════════════════════════════════════

    async mockSend(options) {
        log.info(`[MOCK] Email to ${options.to}: ${options.subject}`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const mockId = `mock-${crypto.randomUUID()}`;
        
        return {
            success: true,
            messageId: mockId,
            accepted: [options.to],
            mock: true,
            sentAt: new Date()
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 Send Bulk Emails
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send bulk emails
     * @param {Array} emails - Array of email options
     * @returns {Promise<Array>} Results
     */
    async sendBulk(emails) {
        log.info(`Sending bulk emails to ${emails.length} recipients`);
        
        const results = [];
        const batchSize = CONFIG.rateLimit.maxPerMinute;
        
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            
            const batchResults = await Promise.allSettled(
                batch.map(email => this.send(email))
            );
            
            results.push(...batchResults.map((result, index) => ({
                to: batch[index].to,
                ...(result.status === 'fulfilled' ? result.value : { 
                    success: false, 
                    error: result.reason.message 
                })
            })));
            
            // Rate limiting delay
            if (i + batchSize < emails.length) {
                await this.delay(60000);
            }
        }
        
        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📅 Send with Delay
    // ═══════════════════════════════════════════════════════════════

    /**
     * Schedule email for later
     * @param {Object} options - Email options
     * @param {Date} scheduledAt - Scheduled time
     * @returns {Promise<Object>} Schedule result
     */
    async schedule(options, scheduledAt) {
        const delay = scheduledAt.getTime() - Date.now();
        
        if (delay < 0) {
            throw new Error('Scheduled time must be in the future');
        }
        
        const scheduleId = crypto.randomUUID();
        
        setTimeout(async () => {
            try {
                await this.send(options);
                log.success(`Scheduled email ${scheduleId} sent`);
            } catch (error) {
                log.error(`Scheduled email ${scheduleId} failed: ${error.message}`);
            }
        }, delay);
        
        log.info(`Email scheduled for ${scheduledAt.toISOString()}, ID: ${scheduleId}`);
        
        return {
            success: true,
            scheduleId,
            scheduledAt,
            status: 'scheduled'
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📋 Send with Template
    // ═══════════════════════════════════════════════════════════════

    /**
     * Send templated email
     * @param {string} to - Recipient email
     * @param {string} templateName - Template name
     * @param {Object} data - Template data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Send result
     */
    async sendTemplate(to, templateName, data = {}, options = {}) {
        return this.send({
            to,
            template: templateName,
            templateData: data,
            ...options
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎨 Render Template
    // ═══════════════════════════════════════════════════════════════

    /**
     * Render email template
     * @param {string} templateName - Template name
     * @param {Object} data - Template data
     * @returns {Promise<Object>} Rendered template
     */
    async renderTemplate(templateName, data = {}) {
        // Check cache
        if (CONFIG.templates.cacheEnabled && this.templateCache.has(templateName)) {
            return this.applyTemplateData(this.templateCache.get(templateName), data);
        }

        // Try to load from file system
        const template = this.loadTemplateFromFile(templateName);
        
        if (!template) {
            // Use built-in template
            const builtInTemplate = TEMPLATES[templateName];
            if (!builtInTemplate) {
                throw new Error(`Template not found: ${templateName}`);
            }
            return this.renderBuiltInTemplate(builtInTemplate, data);
        }

        // Cache template
        if (CONFIG.templates.cacheEnabled) {
            this.templateCache.set(templateName, template);
        }

        return this.applyTemplateData(template, data);
    }

    loadTemplateFromFile(templateName) {
        const templatePath = path.join(
            CONFIG.templates.path,
            `${templateName}.html`
        );

        try {
            if (fs.existsSync(templatePath)) {
                return fs.readFileSync(templatePath, 'utf-8');
            }
        } catch (error) {
            log.warn(`Template file not found: ${templateName}`);
        }

        return null;
    }

    renderBuiltInTemplate(template, data) {
        const html = this.generateHTMLFromTemplate(template);
        const text = this.htmlToText(html);
        
        return {
            html,
            text,
            subject: template.subject,
            preheader: template.preheader
        };
    }

    generateHTMLFromTemplate(template) {
        // Generate beautiful HTML from template object
        const colors = {
            primary: '#4F46E5',
            secondary: '#6B7280',
            success: '#10B981',
            danger: '#EF4444',
            warning: '#F59E0B',
            light: '#F9FAFB',
            dark: '#1F2937'
        };

        return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Tahoma', 'Segoe UI', sans-serif; line-height: 1.6; color: ${colors.dark}; background: ${colors.light}; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${colors.primary}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .hero { text-align: center; padding: 20px 0; }
        .hero h2 { color: ${colors.primary}; margin-bottom: 10px; }
        .code-box { background: ${colors.light}; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .code-box code { font-size: 32px; font-weight: bold; color: ${colors.primary}; letter-spacing: 5px; }
        .button { display: inline-block; background: ${colors.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .features { display: flex; gap: 15px; margin: 20px 0; }
        .feature { flex: 1; text-align: center; padding: 15px; background: ${colors.light}; border-radius: 8px; }
        .feature-icon { font-size: 32px; margin-bottom: 10px; }
        .warning { background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${colors.warning}; }
        .footer { text-align: center; padding: 20px; color: ${colors.secondary}; font-size: 12px; }
        .footer a { color: ${colors.primary}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 روشنا</h1>
        </div>
        <div class="content">
            ${template.sections?.hero ? `
                <div class="hero">
                    <h2>${template.sections.hero.title}</h2>
                    <p>${template.sections.hero.description}</p>
                </div>
            ` : ''}
            
            ${template.sections?.code ? `
                <div class="code-box">
                    <code>${template.sections.code}</code>
                </div>
            ` : ''}
            
            ${template.sections?.cta ? `
                <div style="text-align: center;">
                    <a href="${template.sections.cta.url}" class="button">${template.sections.cta.text}</a>
                </div>
            ` : ''}
            
            ${template.sections?.warning ? `
                <div class="warning">
                    ⚠️ ${template.sections.warning}
                </div>
            ` : ''}
            
            ${template.sections?.expiry ? `
                <p style="text-align: center; color: ${colors.secondary}; font-size: 14px;">
                    ⏰ ${template.sections.expiry}
                </p>
            ` : ''}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} روشنا - تمامی حقوق محفوظ است</p>
            <p>
                <a href="{{unsubscribeUrl}}">لغو اشتراک</a> | 
                <a href="{{appUrl}}">وب‌سایت</a>
            </p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    applyTemplateData(template, data) {
        let html = template;
        let text = this.htmlToText(template);

        // Replace placeholders
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            text = text.replace(regex, value);
        }

        // Extract subject from template if not in data
        const subjectMatch = template.match(/<title>(.*?)<\/title>/);
        const subject = data.subject || (subjectMatch ? subjectMatch[1] : 'Roshana Email');

        return {
            html,
            text,
            subject
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📎 Attachments
    // ═══════════════════════════════════════════════════════════════

    prepareAttachments(attachments) {
        if (!attachments) return undefined;

        const prepared = [];

        if (Array.isArray(attachments)) {
            for (const attachment of attachments) {
                if (typeof attachment === 'string') {
                    // File path
                    if (fs.existsSync(attachment)) {
                        prepared.push({
                            filename: path.basename(attachment),
                            path: attachment
                        });
                    }
                } else if (attachment.path && fs.existsSync(attachment.path)) {
                    prepared.push({
                        filename: attachment.filename || path.basename(attachment.path),
                        path: attachment.path,
                        contentType: attachment.contentType
                    });
                } else if (attachment.content) {
                    prepared.push({
                        filename: attachment.filename,
                        content: attachment.content,
                        contentType: attachment.contentType
                    });
                }
            }
        }

        return prepared.length > 0 ? prepared : undefined;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 Email Validation
    // ═══════════════════════════════════════════════════════════════

    /**
     * Validate email address
     * @param {string} email - Email address
     * @returns {boolean} Is valid
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate multiple emails
     * @param {Array<string>} emails - Email addresses
     * @returns {Object} Valid and invalid emails
     */
    validateEmails(emails) {
        const valid = [];
        const invalid = [];

        for (const email of emails) {
            if (this.validateEmail(email)) {
                valid.push(email);
            } else {
                invalid.push(email);
            }
        }

        return { valid, invalid };
    }

    // ═══════════════════════════════════════════════════════════════
    // ⏱️ Rate Limiting
    // ═══════════════════════════════════════════════════════════════

    async checkRateLimit(email) {
        const now = Date.now();
        const key = `email_${email}`;

        let data = this.rateLimitStore.get(key) || {
            minute: { count: 0, resetAt: now + 60000 },
            hour: { count: 0, resetAt: now + 3600000 },
            day: { count: 0, resetAt: now + 86400000 }
        };

        // Reset if expired
        if (now > data.minute.resetAt) {
            data.minute = { count: 0, resetAt: now + 60000 };
        }
        if (now > data.hour.resetAt) {
            data.hour = { count: 0, resetAt: now + 3600000 };
        }
        if (now > data.day.resetAt) {
            data.day = { count: 0, resetAt: now + 86400000 };
        }

        // Check limits
        if (data.minute.count >= CONFIG.rateLimit.maxPerMinute) {
            throw new Error('Rate limit exceeded: max per minute');
        }
        if (data.hour.count >= CONFIG.rateLimit.maxPerHour) {
            throw new Error('Rate limit exceeded: max per hour');
        }
        if (data.day.count >= CONFIG.rateLimit.maxPerDay) {
            throw new Error('Rate limit exceeded: max per day');
        }

        // Increment
        data.minute.count++;
        data.hour.count++;
        data.day.count++;

        this.rateLimitStore.set(key, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 Statistics
    // ═══════════════════════════════════════════════════════════════

    updateStats(type, template = 'direct') {
        if (type === 'sent') {
            this.stats.totalSent++;
        } else {
            this.stats.totalFailed++;
        }

        if (!this.stats.byTemplate[template]) {
            this.stats.byTemplate[template] = { sent: 0, failed: 0 };
        }
        this.stats.byTemplate[template][type === 'sent' ? 'sent' : 'failed']++;

        if (!this.stats.byProvider[CONFIG.provider]) {
            this.stats.byProvider[CONFIG.provider] = { sent: 0, failed: 0 };
        }
        this.stats.byProvider[CONFIG.provider][type === 'sent' ? 'sent' : 'failed']++;
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalSent / 
                (this.stats.totalSent + this.stats.totalFailed) * 100 || 0
        };
    }

    resetStats() {
        this.stats = {
            totalSent: 0,
            totalFailed: 0,
            totalQueued: 0,
            byTemplate: {},
            byProvider: {}
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔌 Verify Connection
    // ═══════════════════════════════════════════════════════════════

    async verifyConnection() {
        if (CONFIG.mockMode) {
            log.success('Email service running in mock mode');
            return true;
        }

        try {
            if (CONFIG.provider === 'smtp' && this.transporter) {
                await this.transporter.verify();
            }
            
            log.success('Email service is ready');
            return true;
        } catch (error) {
            log.error(`Email service verification failed: ${error.message}`);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 Utility Methods
    // ═══════════════════════════════════════════════════════════════

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
        log.info('Template cache cleared');
    }
}

// ═══════════════════════════════════════════════════════════════════
// 📤 Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════

const emailService = new EmailService();

module.exports = {
    // Main service
    email: emailService,
    
    // Convenience methods
    send: (options) => emailService.send(options),
    sendBulk: (emails) => emailService.sendBulk(emails),
    sendTemplate: (to, template, data, options) => emailService.sendTemplate(to, template, data, options),
    schedule: (options, date) => emailService.schedule(options, date),
    renderTemplate: (name, data) => emailService.renderTemplate(name, data),
    validateEmail: (email) => emailService.validateEmail(email),
    validateEmails: (emails) => emailService.validateEmails(emails),
    getStats: () => emailService.getStats(),
    verifyConnection: () => emailService.verifyConnection(),
    clearCache: () => emailService.clearCache(),
    
    // Templates
    templates: TEMPLATES,
    
    // Configuration
    config: CONFIG,
    
    // Export class
    EmailService
};