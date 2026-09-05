const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class AuthRepository extends BaseRepository {

    constructor() {

        super('users', DB.knex);
    }

    async findByEmail(email) {

        return this.db(this.table)
            .where({ email })
            .first();
    }

    async findByUsername(username) {

        return this.db(this.table)
            .where({ username })
            .first();
    }

    async createUser(data, trx = null) {

        return this.create(data, trx);
    }

    async verifyUser(userId, trx = null) {

        const query = trx || this.db;

        return query(this.table)
            .where({ id: userId })
            .update({
                is_verified: true
            });
    }
}

module.exports = new AuthRepository();
