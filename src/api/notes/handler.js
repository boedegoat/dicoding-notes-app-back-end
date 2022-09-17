const { tryCatchWrapper, sendResponse } = require("../../utils");

class NotesHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        // karena instance dari notes handler ini nantinya akan dijalankan
        // pada scope object routes, this yang akan dipake ama js
        // bukan this dari class NotesHandler ini
        // makanya this-nya harus dibind / diiket dulu
        this.postNoteHandler = this.postNoteHandler.bind(this);
        this.getNotesHandler = this.getNotesHandler.bind(this);
        this.getNoteByIdHandler = this.getNoteByIdHandler.bind(this);
        this.putNoteByIdHandler = this.putNoteByIdHandler.bind(this);
        this.deleteNoteByIdHandler = this.deleteNoteByIdHandler.bind(this);
    }

    postNoteHandler(request, h) {
        return tryCatchWrapper(h, async () => {
            this._validator.validateNotePayload(request.payload);

            const { title = "untitled", body, tags } = request.payload;
            const id = await this._service.addNote({ title, body, tags });

            return sendResponse(h, {
                code: 201,
                message: "Catatan berhasil ditambahkan",
                data: { noteId: id },
            });
        });
    }

    getNotesHandler(request, h) {
        return tryCatchWrapper(h, async () => {
            const notes = await this._service.getNotes();

            return sendResponse(h, {
                data: { notes },
            });
        });
    }

    getNoteByIdHandler(request, h) {
        return tryCatchWrapper(h, async () => {
            const { id } = request.params;
            const note = await this._service.getNoteById(id);

            return sendResponse(h, {
                data: { note },
            });
        });
    }

    putNoteByIdHandler(request, h) {
        return tryCatchWrapper(h, async () => {
            this._validator.validateNotePayload(request.payload);

            const { id } = request.params;
            await this._service.editNoteById(id, request.payload);

            return sendResponse(h, {
                message: "Catatan berhasil diperbarui",
            });
        });
    }

    async deleteNoteByIdHandler(request, h) {
        return tryCatchWrapper(h, async () => {
            const { id } = request.params;
            await this._service.deleteNoteById(id);

            return sendResponse(h, {
                message: "Catatan berhasil dihapus",
            });
        });
    }
}

module.exports = NotesHandler;
