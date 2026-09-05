

async isIpBlocked(ip) {
        const key = `blocked:${ip}`;
        return !!(await cache.get(key));
    }


async resetFailedAttempts(userId) {
        await cache.delPattern(`failed:*:${userId}`);
    }


async incrementFailedLogin(userId) {
        const key = `user:failed_logins:${userId}`;
        const count = (await cache.get(key)) || 0;
        await cache.set(key, count + 1, 24 * 60 * 60); // ۲۴ ساعت
        
        if (count + 1 >= CONFIG.MAX_LOGIN_ATTEMPTS) {
            await User.suspendAccount(userId, CONFIG.LOCKOUT_TIME);
        }


async recordFailedPasswordAttempt(userId, ip) {
        const key = `failed_password:${userId}:${ip}`;
        const attempts = (await cache.get(key)) || 0;
        await cache.set(key, attempts + 1, 15 * 60);
        
        if (attempts + 1 >= 3) {
            await this.blockIp(ip, 60 * 60); // بلاک ۱ ساعته
        }


async recordFailedAttempt(ip, identifier) {
        const key = `failed:${ip}:${identifier}`;
        const attempts = (await cache.get(key)) || 0;
        await cache.set(key, attempts + 1, 15 * 60); // 15 دقیقه
        
        if (attempts + 1 >= 5) {
            await this.blockIp(ip, 30 * 60); // بلاک ۳۰ دقیقه‌ای
        }


async blockIp(ip, duration = 30 * 60) {
        await cache.set(`blocked:${ip}`, true, duration);
        await logSecurity('IP_BLOCKED', { ip, duration, timestamp: new Date() });
    }


module.exports = {
    isIpBlocked,
    resetFailedAttempts,
    incrementFailedLogin,
    recordFailedPasswordAttempt,
    recordFailedAttempt,
    blockIp
};
