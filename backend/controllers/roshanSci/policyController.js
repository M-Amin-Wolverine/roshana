const asyncHandler = require("../../middlewares/asyncHandler");

exports.getPolicies = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        policies: [
            {
                id: "POL-1",
                name: "Default Security Policy"
            }
        ]
    });
});

exports.createPolicy = asyncHandler(async (req, res) => {
    res.status(201).json({
        success: true,
        created: true,
        policy: req.body
    });
});

exports.evaluatePolicy = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        allowed: true,
        confidence: 0.93
    });
});
