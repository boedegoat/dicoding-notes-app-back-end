const { sendResponse } = require("../../utils");

class ExportsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        this.postExportNotesHandler = this.postExportNotesHandler.bind(this);
    }

    async postExportNotesHandler(request, h) {
        this._validator.validateExportNotesPayload(request.payload);

        const message = {
            userId: request.auth.credentials.id,
            targetEmail: request.payload.targetEmail,
        };

        await this._service.sendMessage(
            "export:notes",
            JSON.stringify(message)
        );

        return sendResponse(h, {
            code: 201,
            message: "Permintaan Anda dalam antrean",
        });
    }
}

module.exports = ExportsHandler;
