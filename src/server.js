require("dotenv").config();
const Hapi = require("@hapi/hapi");
const ClientError = require("./exceptions/ClientError");
const { sendResponse } = require("./utils");

// notes
const notes = require("./api/notes");
const NotesService = require("./services/postgres/NotesService");
const NotesValidator = require("./validator/notes");

// users
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 5000,
        host: process.env.HOST || "localhost",
        routes: {
            cors: {
                origin: ["*"],
            },
        },
    });

    await server.register([
        {
            plugin: notes,
            options: {
                service: new NotesService(),
                validator: NotesValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: new UsersService(),
                validator: UsersValidator,
            },
        },
    ]);

    server.ext("onPreResponse", (request, h) => {
        const { response } = request;

        if (response instanceof Error) {
            // Client Error
            if (response instanceof ClientError) {
                return sendResponse(h, {
                    code: response.statusCode,
                    status: "fail",
                    message: response.message,
                });
            }

            // Server Error
            if (response.isServer) {
                console.error(response);
                return sendResponse(h, {
                    code: 500,
                    status: "error",
                    message: "Maaf, terjadi kegagalan pada server kami.",
                });
            }
        }

        return response;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
