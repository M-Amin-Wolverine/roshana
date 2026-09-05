

async getSecurityStatus(userId) {
        const user = await User.findById(userId);
        
        return {
            twoFactorEnabled: user.hasTwoFactor || false,
            biometricEnabled: user.hasBiometric || false,
            lastPasswordChange: user.lastPasswordChange,
            suspiciousActivities: await this.getSuspiciousActivities(userId),
            devices: await this.getUserDevices(userId),
            loginAlerts: user.loginAlerts || true
        }


async getRecentActivities(userId, limit = 10) {
        const activities = await db.query(`
            SELECT type, description, ip_address, user_agent, created_at 
            FROM user_activities 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [userId, limit]);
        
        return activities.map(activity => ({
            ...activity,
            timeAgo: this.getTimeAgo(activity.created_at),
            location: this.getLocationFromIp(activity.ip_address)
        }


async getUserStats(userId) {
        const [logins, otps, devices] = await Promise.all([
            db.query(`SELECT COUNT(*) as count FROM login_logs WHERE user_id = ?`, [userId]),
            db.query(`SELECT COUNT(*) as count FROM otp_logs WHERE phone = (SELECT phone FROM users WHERE id = ?)`, [userId]),
            db.query(`SELECT COUNT(DISTINCT device_fingerprint) as count FROM sessions WHERE user_id = ?`, [userId])
        ]);
        
        return {
            totalLogins: logins[0]?.count || 0,
            totalOTPs: otps[0]?.count || 0,
            activeDevices: devices[0]?.count || 0,
            accountAge: await this.getAccountAge(userId),
            securityScore: await this.calculateUserSecurityScore(userId)
        }


module.exports = {
    getSecurityStatus,
    getRecentActivities,
    getUserStats
};
