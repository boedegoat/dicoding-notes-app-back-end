const { sendResponse } = require("../../utils");

class UploadsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
    }

    async postUploadImageHandler(request, h) {
        const { data } = request.payload;
        const meta = data.hapi;

        this._validator.validateImageHeaders(meta.headers);

        const fileLocation = await this._service.writeFile(data, meta);
        return sendResponse(h, {
            code: 201,
            data: {
                fileLocation,
            },
        });
    }
}

module.exports = UploadsHandler;
