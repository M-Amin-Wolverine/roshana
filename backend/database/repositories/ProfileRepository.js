const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class ProfileRepository extends BaseRepository {

    constructor() {

        super('profiles', DB.knex);
    }

    async getProfile(userId) {

        return this.db(this.table)
            .where({ user_id: userId })
            .first();
    }

    async updateProfile(userId, data) {

        return this.db(this.table)
            .where({ user_id: userId })
            .update(data)
            .returning('*');
    }

    async updateAvatar(userId, avatar) {

        return this.db(this.table)
            .where({ user_id: userId })
            .update({
                avatar
            });
    }
}

module.exports = new ProfileRepository();
