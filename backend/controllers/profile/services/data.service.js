

async getExportStatus(req, res) {
        try {
            const userId = req.user.id;

            // بررسی آیا خروجی در حال آماده شدن است
            const [exportJob] = await User.db.query(
                'SELECT * FROM data_exports WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
                [userId, 'pending']
            );

            if (exportJob.length > 0) {
                return res.status(status.OK).json(
                    successResponse('وضعیت خروجی', {
                        status: exportJob[0].status,
                        progress: exportJob[0].progress || 0,
                        ready: false
                    }


async exportData(req, res) {
        try {
            const userId = req.user.id;
            const { format = 'json' } = req.query;

            const user = await User.findById(userId);

            const exportData = {
                profile: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    bio: user.bio,
                    location: user.location,
                    website: user.website,
                    role: user.role,
                    created_at: user.created_at
                }


async importData(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_FILE_UPLOADED)
                );
            }


module.exports = {
    getExportStatus,
    exportData,
    importData
};
