

async changePasswordUltra(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // 🔒 اعتبارسنجی
            if (newPassword !== confirmPassword) {
                return error(res, 'PASSWORD_MISMATCH', 'رمز عبور جدید و تأیید آن مطابقت ندارند');
            }


module.exports = {
    changePasswordUltra
};
