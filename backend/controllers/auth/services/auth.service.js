

async logoutUltra(req, res) {
        try {
            const userId = req.user.id;
            const tokenId = req.tokenId;
            const logoutAll = req.query.all === 'true';

            if (logoutAll) {
                // 🔥 خروج از همه دستگاه‌ها
                await this.invalidateAllSessions(userId);
                await logSecurity('LOGOUT_ALL', { userId, timestamp: new Date() });
            }


async loginUltra(req, res) {
        try {
            const { identifier, password, otp, method = 'password' } = req.body;
            const ip = req.ip;
            const userAgent = req.headers['user-agent'];

            // 🔒 بررسی Rate Limit برای IP
            if (await this.isIpBlocked(ip)) {
                return rateLimitError(res, 'IP_BLOCKED', 'دسترسی موقتاً مسدود شده است');
            }


async registerUltra(req, res) {
        try {
            const { 
                phone, 
                email, 
                password, 
                firstName, 
                lastName,
                referralCode,
                marketingConsent 
            }


module.exports = {
    logoutUltra,
    loginUltra,
    registerUltra
};
