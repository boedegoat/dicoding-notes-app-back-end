const { sendResponse } = require("../../utils");

class CollaborationsHandler {
    constructor(collaborationsService, notesService, validator) {
        this._collaborationsService = collaborationsService;
        this._notesService = notesService;
        this._validator = validator;

        this.postCollaborationHandler =
            this.postCollaborationHandler.bind(this);
        this.deleteCollaborationHandler =
            this.deleteCollaborationHandler.bind(this);
    }

    async postCollaborationHandler(request, h) {
        this._validator.validateCollaborationPayload(request.payload);

        const { id: credentialId } = request.auth.credentials;
        const { noteId, userId: newCollabUserId } = request.payload;

        await this._notesService.verifyNoteAccess({
            role: "owner",
            noteId,
            userId: credentialId,
        });

        const collaborationId =
            await this._collaborationsService.addCollaboration(
                noteId,
                newCollabUserId
            );

        return sendResponse(h, {
            code: 201,
            message: "Kolaborasi berhasil ditambahkan",
            data: {
                collaborationId,
            },
        });
    }

    async deleteCollaborationHandler(request, h) {
        this._validator.validateCollaborationPayload(request.payload);

        const { id: credentialId } = request.auth.credentials;
        const { noteId, userId: newCollabUserId } = request.payload;

        await this._notesService.verifyNoteAccess({
            role: "owner",
            noteId,
            userId: credentialId,
        });

        await this._collaborationsService.deleteCollaboration(
            noteId,
            newCollabUserId
        );

        return sendResponse(h, {
            message: "Kolaborasi berhasil dihapus",
        });
    }
}

module.exports = CollaborationsHandler;
