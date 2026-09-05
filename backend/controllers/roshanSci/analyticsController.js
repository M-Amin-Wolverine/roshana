const asyncHandler = require("../../middlewares/asyncHandler");

exports.getAnalytics = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        analytics: {
            requests: 120394,
            anomalies: 21,
            activePolicies: 91,
            domains: 14
        }
    });
});

exports.getTrafficStats = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        traffic: {
            realtimeUsers: 413,
            bandwidth: "1.2GB",
            requestsPerMinute: 2901
        }
    });
});

exports.getRiskMetrics = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        risk: {
            level: "LOW",
            score: 17
        }
    });
});
