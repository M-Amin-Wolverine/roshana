

async getActivity(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, type } = req.query;
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM user_activities WHERE user_id = ?';
            const params = [userId];

            if (type && type !== 'all') {
                query += ' AND type = ?';
                params.push(type);
            }


async getLoginHistory(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [history] = await User.db.query(`
                SELECT id, ip_address, location, device_type, browser, created_at, success
                FROM login_history 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), offset]);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM login_history WHERE user_id = ?',
                [userId]
            );

            return res.status(status.OK).json(
                paginatedResponse('تاریخچه ورود', history, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total
                }


module.exports = {
    getActivity,
    getLoginHistory
};
