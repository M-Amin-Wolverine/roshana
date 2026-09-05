const DB = require('./connection');

async function transaction(callback) {

    const trx = await DB.knex.transaction();

    try {

        const result = await callback(trx);

        await trx.commit();

        return result;

    } catch (error) {

        await trx.rollback();

        throw error;
    }
}

module.exports = transaction;
