const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const { mapToDBModel } = require("../../utils");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class NotesService {
    constructor(cacheService) {
        // init postgresql connection pool
        this._pool = new Pool();

        this._cacheService = cacheService;
    }

    async addNote({ title, body, tags, owner }) {
        const id = nanoid(16);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const query = {
            text: "INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            values: [id, title, body, tags, createdAt, updatedAt, owner],
        };

        const note = (await this._pool.query(query)).rows[0];

        if (!note) {
            throw new InvariantError("Catatan gagal ditambahkan");
        }

        // delete previous stored notes in cache
        await this._cacheService.delete(`notes:${owner}`);

        return note.id;
    }

    async getNotes(userId) {
        try {
            // get notes from cache
            const result = await this._cacheService.get(`notes:${userId}`);
            return JSON.parse(result);
        } catch (error) {
            // if not exist, get notes from database
            const query = {
                text: `
                    SELECT notes.* FROM notes
                    LEFT JOIN collaborations
                    ON collaborations.note_id = notes.id
                    WHERE notes.owner = $1 OR collaborations.user_id = $1
                    GROUP BY notes.id
                `,
                values: [userId],
            };

            const notes = (await this._pool.query(query)).rows;
            const mappedNotes = notes.map(mapToDBModel);

            // store notes to cache
            await this._cacheService.set(
                `notes:${userId}`,
                JSON.stringify(mappedNotes)
            );

            return mappedNotes;
        }
    }

    async getNoteById(id) {
        const query = {
            text: `
                SELECT notes.*, users.username 
                FROM notes
                JOIN users
                ON users.id = notes.owner
                WHERE notes.id = $1
            `,
            values: [id],
        };

        const note = (await this._pool.query(query)).rows[0];

        if (!note) {
            throw new NotFoundError("Catatan tidak ditemukan");
        }

        return mapToDBModel(note);
    }

    async editNoteById(id, { title, body, tags }) {
        const updatedAt = new Date().toISOString();
        const query = {
            text: "UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner",
            values: [title, body, tags, updatedAt, id],
        };

        const result = (await this._pool.query(query)).rows[0];

        if (!result) {
            throw new NotFoundError(
                "Gagal memperbarui catatan. Id tidak ditemukan"
            );
        }

        const { owner } = result;

        // delete previous stored notes in cache
        await this._cacheService.delete(`notes:${owner}`);
    }

    async deleteNoteById(id) {
        const query = {
            text: "DELETE FROM notes WHERE id = $1 RETURNING owner",
            values: [id],
        };

        const result = (await this._pool.query(query)).rows[0];

        if (!result) {
            throw new NotFoundError(
                "Catatan gagal dihapus. Id tidak ditemukan"
            );
        }

        const { owner } = result;

        // delete previous stored notes in cache
        await this._cacheService.delete(`notes:${owner}`);
    }

    async verifyNoteAccess({ role = "", noteId, userId }) {
        const getNoteByIdQuery = {
            text: "SELECT * FROM notes WHERE id = $1",
            values: [noteId],
        };

        const getUserInCollabQuery = {
            text: `SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2`,
            values: [noteId, userId],
        };

        const [note, collab] = await Promise.all([
            (await this._pool.query(getNoteByIdQuery)).rows[0],
            (await this._pool.query(getUserInCollabQuery)).rows[0],
        ]);

        if (!note) {
            throw new NotFoundError("Catatan tidak ditemukan");
        }

        if (note.owner !== userId) {
            if (role === "owner") {
                throw new AuthorizationError(
                    "Anda tidak berhak mengakses resource ini"
                );
            }

            if (!collab) {
                throw new InvariantError("Kolaborasi gagal diverifikasi");
            }
        }
    }
}

module.exports = NotesService;
