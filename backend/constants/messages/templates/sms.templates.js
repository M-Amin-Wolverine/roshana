// ============================================
// 📱 SMS Templates
// ============================================

const SmsTemplates = {

    otp(code, expire = '2 دقیقه') {
        return `
🔐 کد تایید روشنا:
${code}

⏳ اعتبار:
${expire}

این پیام محرمانه است.
        `.trim();
    },

    welcome(name) {
        return `
🎉 ${name} عزیز،
به روشنا خوش آمدید.

حساب شما فعال شد.
        `.trim();
    },

    resetPassword(code) {
        return `
🔑 کد بازیابی رمز:
${code}

در صورت عدم درخواست،
این پیام را نادیده بگیرید.
        `.trim();
    },

    loginAlert(device) {
        return `
⚠️ ورود جدید به حساب شما

📱 Device:
${device}

اگر شما نبودید رمز را تغییر دهید.
        `.trim();
    },

    paymentSuccess(amount) {
        return `
💳 پرداخت موفق

مبلغ:
${amount}

با تشکر از شما 🌟
        `.trim();
    }
};

module.exports = SmsTemplates;