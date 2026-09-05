

async terminateSession(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;

            // بررسی مالکیت جلسه
            const [sessions] = await User.db.query(
                'SELECT * FROM user_sessions WHERE id = ? AND user_id = ?',
                [sessionId, userId]
            );

            if (sessions.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('جلسه یافت نشد')
                );
            }


async getSessions(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // دریافت جلسات از دیتابیس
            const [sessions] = await User.db.query(`
                SELECT id, device_type, browser, ip_address, location, created_at, last_active_at, is_current
                FROM user_sessions 
                WHERE user_id = ? AND is_active = 1
                ORDER BY last_active_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), offset]);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM user_sessions WHERE user_id = ? AND is_active = 1',
                [userId]
            );

            return res.status(status.OK).json(
                paginatedResponse('جلسات فعال', sessions, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }


async logoutAllDevices(req, res) {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            // تایید رمز عبور
            const user = await User.findById(userId);
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(status.UNAUTHORIZED).json(
                    errorResponse(messages.INVALID_CURRENT_PASSWORD)
                );
            }


module.exports = {
    terminateSession,
    getSessions,
    logoutAllDevices
};
