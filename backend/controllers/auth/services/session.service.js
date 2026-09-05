

async createSession(userId, sessionData) {
        const sessionId = crypto.randomUUID();
        const session = {
            id: sessionId,
            userId,
            ...sessionData,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // ۷ روز
            isActive: true
        }


async invalidateSession(sessionId) {
        this.activeSessions.delete(sessionId);
        await cache.del(`session:${sessionId}`);
    }


async invalidateAllSessions(userId) {
        const sessions = Array.from(this.activeSessions.values())
            .filter(s => s.userId === userId);
        
        for (const session of sessions) {
            await this.invalidateSession(session.id);
        }


module.exports = {
    createSession,
    invalidateSession,
    invalidateAllSessions
};
