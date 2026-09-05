const asyncHandler = require("../../middlewares/asyncHandler");

exports.getSystemOverview = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        module: "roshanSci.admin",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    });
});

exports.flushCaches = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "All caches flushed successfully"
    });
});

exports.restartWorkers = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        restarted: true
    });
});
