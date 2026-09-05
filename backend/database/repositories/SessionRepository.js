const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class SessionRepository extends BaseRepository {

    constructor() {

        super('sessions', DB.knex);
    }

    async getUserSessions(userId) {

        return this.db(this.table)
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
    }

    async invalidateSession(sessionId) {

        return this.db(this.table)
            .where({ id: sessionId })
            .update({
                active: false
            });
    }

    async invalidateAll(userId) {

        return this.db(this.table)
            .where({ user_id: userId })
            .update({
                active: false
            });
    }
}

module.exports = new SessionRepository();
