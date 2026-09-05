const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class OTPRepository extends BaseRepository {

    constructor() {

        super('otps', DB.knex);
    }

    async saveOTP(data, trx = null) {

        return this.create(data, trx);
    }

    async getValidOTP(userId, code) {

        return this.db(this.table)
            .where({
                user_id: userId,
                code,
                used: false
            })
            .first();
    }

    async markAsUsed(id) {

        return this.db(this.table)
            .where({ id })
            .update({
                used: true
            });
    }
}

module.exports = new OTPRepository();
