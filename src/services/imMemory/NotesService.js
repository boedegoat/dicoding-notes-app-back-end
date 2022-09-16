const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class NotesService {
    constructor() {
        this._notes = [];
    }

    addNote({ title, body, tags }) {
        const id = nanoid(16);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const newNote = {
            title,
            tags,
            body,
            id,
            createdAt,
            updatedAt,
        };

        this._notes.push(newNote);

        const isSuccess = this._notes.find((note) => note.id === id);

        if (!isSuccess) {
            throw new InvariantError("Catatan gagal ditambahkan");
        }

        return id;
    }

    getNotes() {
        return this._notes;
    }

    getNoteById(id) {
        const note = this._notes.find((n) => n.id === id);

        if (!note) {
            throw new NotFoundError("Catatan tidak ditemukan");
        }

        return note;
    }

    editNoteById(id, { title, body, tags }) {
        const noteIndex = this._notes.findIndex((n) => n.id === id);

        if (noteIndex === -1) {
            throw new NotFoundError(
                "Gagal memperbarui catatan. Id tidak ditemukan"
            );
        }

        const updatedAt = new Date().toISOString();

        const editedNote = {
            ...this._notes[noteIndex],
            updatedAt,
            title,
            body,
            tags,
        };

        this._notes[noteIndex] = editedNote;
    }

    deleteNoteById(id) {
        const noteIndex = this._notes.findIndex((n) => n.id === id);

        if (noteIndex === -1) {
            throw new NotFoundError(
                "Catatan gagal dihapus. Id tidak ditemukan"
            );
        }

        this._notes.splice(noteIndex, 1);
    }
}

module.exports = NotesService;
