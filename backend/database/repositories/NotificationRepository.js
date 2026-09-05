const BaseRepository = require('./BaseRepository');
const DB = require('../connection');

class NotificationRepository extends BaseRepository {

    constructor() {

        super('notifications', DB.knex);
    }

    async createNotification(data) {

        return this.create(data);
    }

    async getUserNotifications(userId) {

        return this.db(this.table)
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
    }

    async markAsRead(id) {

        return this.db(this.table)
            .where({ id })
            .update({
                read: true
            });
    }
}

module.exports = new NotificationRepository();
