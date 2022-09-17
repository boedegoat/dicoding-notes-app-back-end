const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const { mapToDBModel } = require("../../utils");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class NotesService {
    constructor() {
        // init postgresql connection pool
        this._pool = new Pool();
    }

    async addNote({ title, body, tags }) {
        const id = nanoid(16);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const query = {
            text: "INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
            values: [id, title, body, tags, createdAt, updatedAt],
        };

        const result = await this._pool.query(query);

        if (result.rowCount === 0) {
            throw new InvariantError("Catatan gagal ditambahkan");
        }

        return result.rows[0].id;
    }

    async getNotes() {
        const query = {
            text: "SELECT * FROM notes",
        };

        const result = await this._pool.query(query);
        return result.rows.map(mapToDBModel);
    }

    async getNoteById(id) {
        const query = {
            text: "SELECT * FROM notes WHERE id = $1",
            values: [id],
        };

        const result = await this._pool.query(query);

        if (result.rowCount === 0) {
            throw new NotFoundError("Catatan tidak ditemukan");
        }

        return mapToDBModel(result.rows[0]);
    }

    async editNoteById(id, { title, body, tags }) {
        const updatedAt = new Date().toISOString();
        const query = {
            text: "UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id",
            values: [title, body, tags, updatedAt, id],
        };

        const result = await this._pool.query(query);

        if (result.rowCount === 0) {
            throw NotFoundError(
                "Gagal memperbarui catatan. Id tidak ditemukan"
            );
        }
    }

    async deleteNoteById(id) {
        const query = {
            text: "DELETE FROM notes WHERE id = $1",
            values: [id],
        };

        const result = await this._pool.query(query);

        if (result.rowCount === 0) {
            throw new NotFoundError(
                "Catatan gagal dihapus. Id tidak ditemukan"
            );
        }
    }
}

module.exports = NotesService;
