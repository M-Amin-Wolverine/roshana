// ============================================
// 🔔 Push Notification Templates
// ============================================

const PushTemplates = {

    success(title, body) {
        return {
            title: `✅ ${title}`,
            body,
            priority: 'high',
            sound: 'success'
        };
    },

    error(title, body) {
        return {
            title: `❌ ${title}`,
            body,
            priority: 'high',
            sound: 'error'
        };
    },

    warning(title, body) {
        return {
            title: `⚠️ ${title}`,
            body,
            priority: 'normal',
            sound: 'warning'
        };
    },

    info(title, body) {
        return {
            title: `ℹ️ ${title}`,
            body,
            priority: 'normal',
            sound: 'default'
        };
    },

    chat({
        sender,
        message
    }) {
        return {
            title: `💬 ${sender}`,
            body: message,
            priority: 'high',
            category: 'chat'
        };
    },

    security(action) {
        return {
            title: '🚨 هشدار امنیتی',
            body: action,
            priority: 'max',
            category: 'security'
        };
    }
};

module.exports = PushTemplates;