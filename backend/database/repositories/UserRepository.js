const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class UserRepository extends BaseRepository {

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
}

module.exports = new UserRepository();
