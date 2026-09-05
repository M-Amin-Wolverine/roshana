

async submitIdentityVerification(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_FILE_UPLOADED)
                );
            }


async changeEmail(req, res) {
        try {
            const userId = req.user.id;
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('ایمیل و رمز عبور الزامی هستند')
                );
            }


async getVerificationStatus(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('وضعیت تایید', {
                    email_verified: !!user.email_verified_at,
                    phone_verified: !!user.phone_verified_at,
                    identity: {
                        status: user.identity_verification_status || 'not_submitted',
                        submitted_at: user.identity_submitted_at,
                        verified_at: user.identity_verified_at
                    }


async sendEmailVerification(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (user.is_verified) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('ایمیل قبلاً تایید شده است')
                );
            }


async confirmEmailVerification(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;

            const user = await User.findById(userId);

            if (user.email_verification_token !== token) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('توکن معتبر نیست')
                );
            }


async sendPhoneVerification(req, res) {
        try {
            const userId = req.user.id;
            const { phone } = req.body;

            // تولید کد
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            await User.update(userId, {
                phone,
                phone_verification_code: code,
                phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000) // 10 دقیقه
            }


async changePhone(req, res) {
        try {
            const userId = req.user.id;
            const { phone, password } = req.body;

            if (!phone || !password) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('شماره موبایل و رمز عبور الزامی هستند')
                );
            }


async confirmPhoneVerification(req, res) {
        try {
            const userId = req.user.id;
            const { code } = req.body;

            const user = await User.findById(userId);

            if (user.phone_verification_code !== code) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('کد تایید معتبر نیست')
                );
            }


module.exports = {
    submitIdentityVerification,
    changeEmail,
    getVerificationStatus,
    sendEmailVerification,
    confirmEmailVerification,
    sendPhoneVerification,
    changePhone,
    confirmPhoneVerification
};
