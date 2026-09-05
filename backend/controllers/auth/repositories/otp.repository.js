

async markOTPAsUsed(otpId) {
        await db.query(`
            UPDATE otp_logs 
            SET verified_at = NOW(), used = true 
            WHERE id = ?
        `, [otpId]);
    }


async getOTPRecord(phone, otp, type) {
        const key = `otp:${phone}:${type}`;
        const otpData = await cache.get(key);
        
        if (!otpData || otpData.otp !== otp) {
            return null;
        }


async saveOTP(phone, otp, type, expiresAt, channel) {
        const otpData = {
            phone,
            otp,
            type,
            expiresAt,
            channel,
            attempts: 0,
            createdAt: new Date(),
            verified: false
        }


module.exports = {
    markOTPAsUsed,
    getOTPRecord,
    saveOTP
};
