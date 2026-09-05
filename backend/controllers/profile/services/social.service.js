

async updateSocialLinks(req, res) {
        try {
            const userId = req.user.id;
            const { twitter, instagram, linkedin, github, telegram, youtube } = req.body;

            const updateData = {};
            if (twitter !== undefined) updateData.twitter = twitter;
            if (instagram !== undefined) updateData.instagram = instagram;
            if (linkedin !== undefined) updateData.linkedin = linkedin;
            if (github !== undefined) updateData.github = github;
            if (telegram !== undefined) updateData.telegram = telegram;
            if (youtube !== undefined) updateData.youtube = youtube;

            if (Object.keys(updateData).length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_DATA_TO_UPDATE)
                );
            }


async blockUser(req, res) {
        try {
            const userId = req.user.id;
            const { userId: targetUserId } = req.params;

            if (userId === parseInt(targetUserId)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نمی‌توانید خود را مسدود کنید')
                );
            }


async followUser(req, res) {
        try {
            const userId = req.user.id;
            const { userId: targetUserId } = req.params;

            if (userId === parseInt(targetUserId)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نمی‌توانید خود را دنبال کنید')
                );
            }


async getSocialLinks(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            return res.status(status.OK).json(
                successResponse('لینک‌های اجتماعی', {
                    twitter: user.twitter || null,
                    instagram: user.instagram || null,
                    linkedin: user.linkedin || null,
                    github: user.github || null,
                    telegram: user.telegram || null,
                    youtube: user.youtube || null
                }


async getFollowers(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [followers] = await User.db.query(`
                SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, u.bio, u.is_verified,
                       f.created_at as followed_at
                FROM followers f
                JOIN users u ON f.follower_id = u.id
                WHERE f.following_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), offset]);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM followers WHERE following_id = ?',
                [userId]
            );

            return res.status(status.OK).json(
                paginatedResponse('دنبال‌کنندگان', followers, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }


async connectSocialAccount(req, res) {
        try {
            const userId = req.user.id;
            const { provider } = req.params;

            // در واقعیت، این بخش با OAuth کار می‌کند
            // اینجا شبیه‌سازی می‌کنیم

            logger.info(`User ${userId} connected social account: ${provider}`);

            return res.status(status.OK).json(
                successResponse(`حساب ${provider} متصل شد`, { provider })
            );
        }


async disconnectSocialAccount(req, res) {
        try {
            const userId = req.user.id;
            const { provider } = req.params;
            const { password } = req.body;

            // تایید رمز عبور
            const user = await User.findById(userId);
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(status.UNAUTHORIZED).json(
                    errorResponse(messages.INVALID_CURRENT_PASSWORD)
                );
            }


async getBlockedUsers(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [blocked] = await User.db.query(`
                SELECT u.id, u.username, u.first_name, u.last_name, u.avatar,
                       b.created_at as blocked_at
                FROM blocked_users b
                JOIN users u ON b.blocked_id = u.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), offset]);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM blocked_users WHERE user_id = ?',
                [userId]
            );

            return res.status(status.OK).json(
                paginatedResponse('کاربران مسدود شده', blocked, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }


async unfollowUser(req, res) {
        try {
            const userId = req.user.id;
            const { userId: targetUserId } = req.params;

            // حذف از دنبال‌کنندگان
            await User.db.query(
                'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
                [userId, targetUserId]
            );

            // بروزرسانی شمارنده‌ها
            await User.db.query('UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?', [userId]);
            await User.db.query('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?', [targetUserId]);

            logger.info(`User ${userId} unfollowed user ${targetUserId}`);

            return res.status(status.OK).json(
                successResponse('کاربر از دنبال‌کنندگان حذف شد')
            );
        }


async unblockUser(req, res) {
        try {
            const userId = req.user.id;
            const { userId: targetUserId } = req.params;

            await User.db.query(
                'DELETE FROM blocked_users WHERE user_id = ? AND blocked_id = ?',
                [userId, targetUserId]
            );

            logger.info(`User ${userId} unblocked user ${targetUserId}`);

            return res.status(status.OK).json(
                successResponse('کاربر از حالت مسدود خارج شد')
            );
        }


async getFollowing(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [following] = await User.db.query(`
                SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, u.bio, u.is_verified,
                       f.created_at as followed_at
                FROM followers f
                JOIN users u ON f.following_id = u.id
                WHERE f.follower_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), offset]);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM followers WHERE follower_id = ?',
                [userId]
            );

            return res.status(status.OK).json(
                paginatedResponse('دنبال‌شوندگان', following, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }


module.exports = {
    updateSocialLinks,
    blockUser,
    followUser,
    getSocialLinks,
    getFollowers,
    connectSocialAccount,
    disconnectSocialAccount,
    getBlockedUsers,
    unfollowUser,
    unblockUser,
    getFollowing
};
