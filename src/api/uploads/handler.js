const { sendResponse } = require("../../utils");

class UploadsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
    }

    async postUploadImageHandler(request, h) {
        const { data } = request.payload;
        this._validator.validateImageHeaders(data.hapi.headers);

        const filename = await this._service.writeFile(data, data.hapi);
        return sendResponse(h, {
            code: 201,
            data: {
                fileLocation: `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
            },
        });
    }
}

module.exports = UploadsHandler;
