const sendResponse = (
    h,
    { status = "success", message = undefined, data = undefined, code = 200 }
) => {
    const response = h.response({
        status,
        message,
        data,
    });
    response.code(code);
    return response;
};

class NotesHandler {
    constructor(service) {
        this._service = service;

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
        try {
            const { title = "untitled", body, tags } = request.payload;
            const id = this._service.addNote({ title, body, tags });
            return sendResponse(h, {
                code: 201,
                message: "Catatan berhasil ditambahkan",
                data: { noteId: id },
            });
        } catch (error) {
            return sendResponse(h, {
                code: 404,
                status: "fail",
                message: error.message,
            });
        }
    }

    getNotesHandler(request, h) {
        const notes = this._service.getNotes();
        return sendResponse(h, {
            data: { notes },
        });
    }

    getNoteByIdHandler(request, h) {
        try {
            const { id } = request.params;
            const note = this._service.getNoteById(id);
            return sendResponse(h, {
                data: { note },
            });
        } catch (error) {
            return sendResponse(h, {
                code: 404,
                status: "fail",
                message: error.message,
            });
        }
    }

    putNoteByIdHandler(request, h) {
        try {
            const { id } = request.params;
            this._service.editNoteById(id, request.payload);
            return sendResponse(h, {
                message: "Catatan berhasil diperbarui",
            });
        } catch (error) {
            return sendResponse(h, {
                code: 404,
                status: "fail",
                message: error.message,
            });
        }
    }

    deleteNoteByIdHandler(request, h) {
        try {
            const { id } = request.params;
            this._service.deleteNoteById(id);
            return sendResponse(h, {
                message: "Catatan berhasil dihapus",
            });
        } catch (error) {
            return sendResponse(h, {
                code: 404,
                status: "fail",
                message: error.message,
            });
        }
    }
}

module.exports = NotesHandler;
