// ============================================
// 🧠 Unified Notification Templates
// ============================================

const Email = require('./email.templates');
const SMS = require('./sms.templates');
const Push = require('./push.templates');

class NotificationTemplates {

    static authVerification(data) {
        return {
            email: Email.verifyEmail(data),
            sms: SMS.otp(data.code),
            push: Push.info(
                'کد تایید',
                `کد شما: ${data.code}`
            )
        };
    }

    static passwordReset(data) {
        return {
            email: Email.resetPassword(data),
            sms: SMS.resetPassword(data.code),
            push: Push.warning(
                'بازیابی رمز',
                'درخواست بازیابی رمز ثبت شد'
            )
        };
    }

    static welcome(data) {
        return {
            email: Email.welcome(data),
            sms: SMS.welcome(data.name),
            push: Push.success(
                'خوش آمدید',
                `${data.name} عزیز خوش آمدید`
            )
        };
    }

    static securityAlert(data) {
        return {
            email: Email.securityAlert(data),
            sms: SMS.loginAlert(data.device),
            push: Push.security(data.action)
        };
    }

    static custom(data) {
        return {
            email: Email.notification(data),
            sms: data.sms || '',
            push: Push.info(data.title, data.message)
        };
    }
}

module.exports = NotificationTemplates;