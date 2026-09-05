

async updateProfileUltra(req, res) {
        try {
            const userId = req.user.id;
            const updates = req.body;

            // 🔒 اعتبارسنجی آپدیت‌ها
            const validation = this.validateProfileUpdates(updates);
            if (!validation.valid) {
                return validationError(res, validation.errors);
            }


async getProfileUltra(req, res) {
        try {
            const userId = req.user.id;
            
            // 🎯 دریافت اطلاعات کامل کاربر
            const user = await User.getUltraProfile(userId);
            
            if (!user) {
                return notFound(res, 'USER_NOT_FOUND', 'کاربر یافت نشد');
            }


module.exports = {
    updateProfileUltra,
    getProfileUltra
};
