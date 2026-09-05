class BaseRepository {

    constructor(table, db) {

        this.table = table;

        this.db = db;
    }

    async findById(id, trx = null) {

        const query = trx || this.db;

        return query(this.table)
            .where({ id })
            .first();
    }

    async findAll(filters = {}, trx = null) {

        const query = trx || this.db;

        return query(this.table)
            .where(filters);
    }

    async create(data, trx = null) {

        const query = trx || this.db;

        const [result] = await query(this.table)
            .insert(data)
            .returning('*');

        return result;
    }

    async update(id, data, trx = null) {

        const query = trx || this.db;

        const [result] = await query(this.table)
            .where({ id })
            .update(data)
            .returning('*');

        return result;
    }

    async delete(id, trx = null) {

        const query = trx || this.db;

        return query(this.table)
            .where({ id })
            .del();
    }
}

module.exports = BaseRepository;
