

async updateSettings(req, res) {
        try {
            const userId = req.user.id;
            const { language, timezone, currency, date_format, time_format } = req.body;

            const updateData = {};
            if (language) updateData.language = language;
            if (timezone) updateData.timezone = timezone;
            if (currency) updateData.currency = currency;
            if (date_format) updateData.date_format = date_format;
            if (time_format) updateData.time_format = time_format;

            if (Object.keys(updateData).length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_DATA_TO_UPDATE)
                );
            }


async getNotificationSettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('تنظیمات اعلان‌ها', {
                    email: {
                        enabled: user.email_notifications || true,
                        new_message: user.email_new_message || true,
                        new_follower: user.email_new_follower || true,
                        product_updates: user.email_product_updates || false,
                        marketing: user.email_marketing || false
                    }


async getPrivacySettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('تنظیمات حریم خصوصی', {
                    profile_visibility: user.profile_visibility || 'public',
                    show_email: user.show_email || false,
                    show_phone: user.show_phone || false,
                    show_online_status: user.show_online_status || true,
                    show_last_seen: user.show_last_seen || true,
                    allow_messaging: user.allow_messaging || 'everyone',
                    show_activity: user.show_activity || true,
                    show_followers: user.show_followers || true,
                    show_following: user.show_following || true
                }


async updateAppearanceSettings(req, res) {
        try {
            const userId = req.user.id;
            const { theme, accent_color, font_size, compact_mode } = req.body;

            const updateData = {};
            if (theme) updateData.theme = theme;
            if (accent_color) updateData.accent_color = accent_color;
            if (font_size) updateData.font_size = font_size;
            if (compact_mode !== undefined) updateData.compact_mode = compact_mode;

            await User.update(userId, updateData);

            logger.info(`User ${userId} updated appearance settings`);

            return res.status(status.OK).json(
                successResponse('تنظیمات ظاهر بروزرسانی شد')
            );
        }


async getSettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            const settings = {
                language: user.language || 'fa',
                timezone: user.timezone || 'UTC+03:30',
                currency: user.currency || 'IRR',
                date_format: user.date_format || 'YYYY-MM-DD',
                time_format: user.time_format || '24h',
                theme: user.theme || 'light',
                accent_color: user.accent_color || '#3b82f6',
                font_size: user.font_size || 'medium',
                compact_mode: user.compact_mode || false,
                privacy: {
                    profile_visibility: user.profile_visibility || 'public',
                    show_email: user.show_email || false,
                    show_phone: user.show_phone || false,
                    show_online_status: user.show_online_status || true,
                    show_last_seen: user.show_last_seen || true,
                    allow_messaging: user.allow_messaging || 'everyone',
                    show_activity: user.show_activity || true,
                    show_followers: user.show_followers || true,
                    show_following: user.show_following || true
                }


async getPreferences(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('ترجیحات', {
                    favorite_categories: user.favorite_categories ? JSON.parse(user.favorite_categories) : [],
                    favorite_tags: user.favorite_tags ? JSON.parse(user.favorite_tags) : [],
                    content_filters: user.content_filters ? JSON.parse(user.content_filters) : {},
                    language_level: user.language_level || 'intermediate'
                }


async updateNotificationSettings(req, res) {
        try {
            const userId = req.user.id;
            const { 
                email, push, sms, quiet_hours,
                email_new_message, email_new_follower, email_product_updates, email_marketing,
                push_new_message, push_new_follower, push_mentions,
                sms_new_message, sms_security_alerts
            }


async updatePrivacySettings(req, res) {
        try {
            const userId = req.user.id;
            const { 
                profile_visibility, show_email, show_phone, show_online_status,
                show_last_seen, allow_messaging, show_activity, show_followers, show_following
            }


async updatePreferences(req, res) {
        try {
            const userId = req.user.id;
            const { favorite_categories, favorite_tags, content_filters, language_level } = req.body;

            const updateData = {};
            if (favorite_categories) updateData.favorite_categories = JSON.stringify(favorite_categories);
            if (favorite_tags) updateData.favorite_tags = JSON.stringify(favorite_tags);
            if (content_filters) updateData.content_filters = JSON.stringify(content_filters);
            if (language_level) updateData.language_level = language_level;

            await User.update(userId, updateData);

            logger.info(`User ${userId} updated preferences`);

            return res.status(status.OK).json(
                successResponse('ترجیحات بروزرسانی شد')
            );
        }


async getAppearanceSettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('تنظیمات ظاهر', {
                    theme: user.theme || 'light',
                    accent_color: user.accent_color || '#3b82f6',
                    font_size: user.font_size || 'medium',
                    compact_mode: user.compact_mode || false
                }


module.exports = {
    updateSettings,
    getNotificationSettings,
    getPrivacySettings,
    updateAppearanceSettings,
    getSettings,
    getPreferences,
    updateNotificationSettings,
    updatePrivacySettings,
    updatePreferences,
    getAppearanceSettings
};
