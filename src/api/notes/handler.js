const { sendResponse } = require("../../utils");

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

    async postNoteHandler(request, h) {
        this._validator.validateNotePayload(request.payload);

        const { title = "untitled", body, tags } = request.payload;
        const { id: ownerId } = request.auth.credentials;

        const noteId = await this._service.addNote({
            title,
            body,
            tags,
            owner: ownerId,
        });

        return sendResponse(h, {
            code: 201,
            message: "Catatan berhasil ditambahkan",
            data: { noteId },
        });
    }

    async getNotesHandler(request, h) {
        const { id: ownerId } = request.auth.credentials;
        const notes = await this._service.getNotes(ownerId);

        return sendResponse(h, {
            data: { notes },
        });
    }

    async getNoteByIdHandler(request, h) {
        const { id } = request.params;
        const { id: ownerId } = request.auth.credentials;

        await this._service.verifyNoteOwner(id, ownerId);
        const note = await this._service.getNoteById(id);

        return sendResponse(h, {
            data: { note },
        });
    }

    async putNoteByIdHandler(request, h) {
        this._validator.validateNotePayload(request.payload);

        const { id } = request.params;
        const { id: ownerId } = request.auth.credentials;

        await this._service.verifyNoteOwner(id, ownerId);
        await this._service.editNoteById(id, request.payload);

        return sendResponse(h, {
            message: "Catatan berhasil diperbarui",
        });
    }

    async deleteNoteByIdHandler(request, h) {
        const { id } = request.params;
        const { id: ownerId } = request.auth.credentials;

        await this._service.verifyNoteOwner(id, ownerId);
        await this._service.deleteNoteById(id);

        return sendResponse(h, {
            message: "Catatan berhasil dihapus",
        });
    }
}

module.exports = NotesHandler;
