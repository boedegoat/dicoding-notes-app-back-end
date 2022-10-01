const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");

class CollaborationsService {
    constructor(cacheService) {
        this._pool = new Pool();
        this._cacheService = cacheService;
    }

    async addCollaboration(noteId, userId) {
        const id = `collab-${nanoid(16)}`;

        const query = {
            text: `INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id`,
            values: [id, noteId, userId],
        };

        const newCollab = (await this._pool.query(query)).rows[0];

        if (!newCollab) {
            throw new InvariantError("Kolaborasi gagal ditambahkan");
        }

        await this._cacheService.delete(`notes:${userId}`);

        return newCollab.id;
    }

    async deleteCollaboration(noteId, userId) {
        const query = {
            text: `
                DELETE FROM collaborations WHERE note_id = $1 AND user_id = $2
                RETURNING id
            `,
            values: [noteId, userId],
        };

        const deletedCollab = (await this._pool.query(query)).rows[0];

        if (!deletedCollab) {
            throw new InvariantError("Kolaborasi gagal dihapus");
        }

        await this._cacheService.delete(`notes:${userId}`);
    }
}

module.exports = CollaborationsService;
