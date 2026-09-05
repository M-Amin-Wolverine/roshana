const asyncHandler = require("../../middlewares/asyncHandler");

exports.detectAnomalies = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        anomalies: [
            {
                id: "ANOM-1",
                severity: "HIGH",
                type: "ACCESS_SPIKE"
            }
        ]
    });
});

exports.resolveAnomaly = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        resolved: true,
        anomalyId: req.params.id
    });
});

exports.getAnomalyStats = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        total: 12,
        unresolved: 2
    });
});
