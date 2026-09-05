

async enable2FA(req, res) {
        try {
            const userId = req.user.id;
            const { method } = req.body;

            if (!['email', 'sms', 'authenticator'].includes(method)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('روش معتبر نیست')
                );
            }


async verify2FA(req, res) {
        try {
            const userId = req.user.id;
            const { code } = req.body;

            const user = await User.findById(userId);

            // بررسی کد (بسته به روش)
            let isValid = false;
            
            if (user.two_factor_method === 'authenticator') {
                // تایید با authenticator (باید با library مثل speakeasy تایید شود)
                isValid = code === '123456'; // شبیه‌سازی
            }


async disable2FA(req, res) {
        try {
            const userId = req.user.id;
            const { password, code } = req.body;

            // تایید رمز عبور
            const user = await User.findById(userId);
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(status.UNAUTHORIZED).json(
                    errorResponse(messages.INVALID_CURRENT_PASSWORD)
                );
            }


async generateBackupCodes(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId);
            if (!user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('2FA فعال نیست')
                );
            }


async getSecuritySettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            const security = {
                two_factor_enabled: user.two_factor_enabled,
                two_factor_method: user.two_factor_method,
                last_password_change: user.last_password_change,
                login_count: user.login_count,
                has_backup_codes: user.backup_codes ? true : false
            }


async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password, confirm_password } = req.body;

            // اعتبارسنجی اولیه
            if (!current_password || !new_password || !confirm_password) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.PASSWORD_REQUIRED)
                );
            }


module.exports = {
    enable2FA,
    verify2FA,
    disable2FA,
    generateBackupCodes,
    getSecuritySettings,
    changePassword
};
