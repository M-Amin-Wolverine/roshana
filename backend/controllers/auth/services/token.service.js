

async refreshTokenUltra(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return error(res, 'REFRESH_TOKEN_REQUIRED', 'توکن رفرش الزامی است');
            }


module.exports = {
    refreshTokenUltra
};
