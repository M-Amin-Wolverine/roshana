

async sendOTPUltra(req, res) {
        try {
            const { phone, type = 'LOGIN', channel = 'SMS' } = req.body;
            
            // 🔒 بررسی Rate Limit
            const rateCheck = await this.checkOTPRateLimit(phone, type);
            if (!rateCheck.allowed) {
                return rateLimitError(res, 'OTP_RATE_LIMIT', rateCheck.message);
            }


async verifyOTPUltra(req, res) {
        try {
            const { phone, otp, type } = req.body;
            const ip = req.ip;

            // 🔍 پیدا کردن OTP
            const otpRecord = await this.getOTPRecord(phone, otp, type);
            
            if (!otpRecord) {
                await this.recordFailedOTPAttempt(phone, ip);
                return error(res, 'INVALID_OTP', 'کد تأیید نامعتبر است');
            }


module.exports = {
    sendOTPUltra,
    verifyOTPUltra
};
