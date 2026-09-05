const asyncHandler = require("../../middlewares/asyncHandler");

exports.getDomains = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        domains: [
            "api.roshana.local",
            "stream.roshana.local"
        ]
    });
});

exports.createDomain = asyncHandler(async (req, res) => {
    res.status(201).json({
        success: true,
        created: true,
        domain: req.body
    });
});

exports.deleteDomain = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        deleted: req.params.id
    });
});
