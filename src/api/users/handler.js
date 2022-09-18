const { sendResponse } = require("../../utils");

class UsersHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        this.postUserHandler = this.postUserHandler.bind(this);
        this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
    }

    async postUserHandler(request, h) {
        this._validator.validateUserPayload(request.payload);

        const userId = await this._service.addUser(request.payload);

        return sendResponse(h, {
            code: 201,
            message: "User berhasil ditambahkan",
            data: {
                userId,
            },
        });
    }

    async getUserByIdHandler(request, h) {
        const { id } = request.params;

        const user = await this._service.getUserById(id);

        return sendResponse(h, {
            data: {
                user,
            },
        });
    }
}

module.exports = UsersHandler;
