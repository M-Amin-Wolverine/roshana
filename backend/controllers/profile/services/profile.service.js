

async getPublicProfile(req, res) {
        try {
            const { username } = req.params;

            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }


async cancelDelete(req, res) {
        try {
            const userId = req.user.id;

            await User.update(userId, {
                scheduled_deletion_at: null,
                updated_at: new Date()
            }


async getAchievements(req, res) {
        try {
            const userId = req.user.id;

            // شبیه‌سازی دستاوردها
            const achievements = [
                { id: 1, name: 'اولین پست', description: 'اولین پست خود را منتشر کردید', earned_at: null, earned: false },
                { id: 2, name: 'ده دنبال‌کننده', description: 'ده نفر شما را دنبال می‌کنند', earned_at: null, earned: false },
                { id: 3, name: 'تأیید هویت', description: 'حساب کاربری خود را تأیید کردید', earned_at: null, earned: false }
            ];

            return res.status(status.OK).json(
                successResponse('دستاوردها', achievements)
            );
        }


async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            const { password, confirmText, reason } = req.body;

            if (confirmText !== 'DELETE_ACCOUNT') {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('متن تأیید صحیح نیست')
                );
            }


async getAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query;

            let days;
            switch (period) {
                case '7d': days = 7; break;
                case '30d': days = 30; break;
                case '90d': days = 90; break;
                case '1y': days = 365; break;
                default: days = 30;
            }


async getProfileStats(req, res) {
        try {
            const userId = req.user.id;

            // آمار از دیتابیس
            const [user] = await User.db.query('SELECT * FROM users WHERE id = ?', [userId]);

            const stats = {
                posts_count: user[0].posts_count || 0,
                followers_count: user[0].followers_count || 0,
                following_count: user[0].following_count || 0,
                likes_received: user[0].likes_received || 0,
                views_received: user[0].views_received || 0,
                account_age_days: Math.floor((new Date() - new Date(user[0].created_at)) / (1000 * 60 * 60 * 24)),
                last_login_days_ago: user[0].last_login ? 
                    Math.floor((new Date() - new Date(user[0].last_login)) / (1000 * 60 * 60 * 24)) : null
            }


async changeUsername(req, res) {
        try {
            const userId = req.user.id;
            const { username } = req.body;

            if (!username) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نام کاربری الزامی است')
                );
            }


async getDeleteStatus(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId);

            if (!user.scheduled_deletion_at) {
                return res.status(status.OK).json(
                    successResponse('وضعیت حذف', { scheduled: false })
                );
            }


async reactivateAccount(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;

            // تایید توکن
            const user = await User.findById(userId);
            if (user.deactivation_token !== token) {
                return res(status.BAD_REQUEST).json(
                    errorResponse('توکن معتبر نیست')
                );
            }


async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { 
                first_name, 
                last_name, 
                phone, 
                bio,
                gender,
                birth_date,
                location,
                website,
                language,
                timezone,
                occupation,
                company,
                education,
                skills,
                interests
            }


async deactivateAccount(req, res) {
        try {
            const userId = req.user.id;
            const { password, reason } = req.body;

            // تایید رمز عبور
            const user = await User.findById(userId);
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(status.UNAUTHORIZED).json(
                    errorResponse(messages.INVALID_CURRENT_PASSWORD)
                );
            }


async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const { fields = 'basic' } = req.query;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }


module.exports = {
    getPublicProfile,
    cancelDelete,
    getAchievements,
    deleteAccount,
    getAnalytics,
    getProfileStats,
    changeUsername,
    getDeleteStatus,
    reactivateAccount,
    updateProfile,
    deactivateAccount,
    getProfile
};
