const asyncHandler = require("../../middlewares/asyncHandler");

exports.proxyRequest = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        proxied: true,
        target: req.body.target
    });
});

exports.getProxyHealth = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        latency: "21ms",
        uptime: process.uptime()
    });
});

exports.rotateProxyNodes = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        rotated: true
    });
});
