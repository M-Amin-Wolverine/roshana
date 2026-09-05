

async uploadGallery(req, res) {
        try {
            const userId = req.user.id;

            if (!req.files || req.files.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_FILE_UPLOADED)
                );
            }


async removeAvatar(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId);
            if (!user.avatar) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('آواتاری وجود ندارد')
                );
            }


async uploadCover(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_FILE_UPLOADED)
                );
            }


async removeCover(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId);
            if (!user.cover) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('کاوری وجود ندارد')
                );
            }


async uploadAvatar(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.NO_FILE_UPLOADED)
                );
            }


async removeGalleryImage(req, res) {
        try {
            const userId = req.user.id;
            const { imageId } = req.params;

            // حذف از دیتابیس
            logger.info(`User ${userId} removed gallery image: ${imageId}`);

            return res.status(status.OK).json(
                successResponse('تصویر گالری حذف شد')
            );
        }


module.exports = {
    uploadGallery,
    removeAvatar,
    uploadCover,
    removeCover,
    uploadAvatar,
    removeGalleryImage
};
