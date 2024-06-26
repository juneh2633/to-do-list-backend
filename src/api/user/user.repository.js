const InsertUserDao = require('./dao/insert-user.dao');
const UpdateUserDao = require('./dao/update-user.dao');
const UserNotFoundException = require('./exception/UserNotFoundException');
const User = require('./model/user.model');

module.exports = class UserRepository {
    /**
     * @type {import('pg').Pool}
     */
    pool;

    /**
     * @param {import('pg').Pool} pool
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Select user by idx
     *
     * @param {number} idx
     * @param {import('pg').PoolClient | undefined} conn
     * @return {Promise<User | null>}
     */
    async selectByIdx(idx, conn = this.pool) {
        const queryResult = await conn.query(
            `SELECT 
                idx,
                id,
                pw,
                nickname,
                created_at AS "createdAt",
                deleted_at AS "deletedAt"
            FROM
                user_tb
            FROM
                user_tb
            WHERE
                idx = $1
            AND
                deleted_at IS NULL`,
            [idx]
        );

        return queryResult.rows[0] || null;
    }

    /**
     * Select by user id
     *
     * @param {string} id
     * @param {import('pg').PoolClient | undefined} conn
     * @return {Promise<User | null>}
     */
    async selectById(id, conn = this.pool) {
        const queryResult = await conn.query(
            `SELECT
                idx,
                nickname,
                id,
                pw,
                created_at AS "createdAt",
                deleted_at AS "deletedAt"
            FROM
                user_tb
            WHERE
                id = $1,
            AND
                deleted_at IS NULL`,
            [id]
        );

        return queryResult.rows[0] || null;
    }

    /**
     * Insert user by idx
     *
     * @param {InsertUserDao} insertDao
     * @param {import('pg').PoolClient | undefined} conn
     * @param {Promise<User>}
     */
    async insert(insertDao, conn = this.pool) {
        const queryResult = await conn.query(
            `INSERT INTO user_tb 
                (id, nickname, pw) 
                    VALUES 
                ($1, $2, $3)
            RETURNING
                idx,
                id,
                pw,
                nickname,
                created_at AS "createdAt",
                deleted_at AS "deletedAt"`,
            [insertDao.id, insertDao.nickname, insertDao.pw]
        );

        return queryResult.rows[0];
    }

    /**
     * Update user by idx
     *
     * @param {number} idx
     * @param {UpdateUserDao} updateDao
     * @param {import('pg').PoolClient | undefined} conn
     * @returns {Promise<void>}
     */
    async updateByIdx(idx, updateDao, conn = this.pool) {
        let queryParams = [idx];
        let query = `UPDATE user_tb SET`;

        if (updateDao.nickname) {
            query += ` nickname = $${queryParams.length + 1},`;
            queryParams.push(updateDao.nickname);
        }

        if (updateDao.id) {
            query += ` id = $${queryParams.length + 1},`;
            queryParams.push(updateDao.id);
        }

        if (updateDao.pw) {
            query += ` pw = $${queryParams.length + 1},`;
            queryParams.push(updateDao.pw);
        }

        query = query.replace(/,$/, '');

        query += ` WHERE idx = $1`;

        await conn.query(query, queryParams);
    }

    /**
     * Delete user by idx
     * Soft delete
     *
     * @param {number} idx
     * @param {import('pg').PoolClient | undefined} conn
     * @returns {Promise<void>}
     */
    async deleteByIdx(idx, conn) {
        await conn.query(
            `UPDATE 
                user_tb 
            SET 
                deleted_at = NOW() 
            WHERE idx = $1`,
            [idx]
        );
    }
};
