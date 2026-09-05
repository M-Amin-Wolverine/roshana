const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class SecurityRepository extends BaseRepository {

    constructor() {

        super('security_logs', DB.knex);
    }

    async logEvent(data) {

        return this.create(data);
    }

    async getUserSecurityLogs(userId) {

        return this.db(this.table)
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
    }

    async getFailedAttempts(ip) {

        return this.db(this.table)
            .where({
                ip_address: ip,
                status: 'FAILED'
            });
    }
}

module.exports = new SecurityRepository();
