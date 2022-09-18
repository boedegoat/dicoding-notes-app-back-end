require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

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

// authentications
const authentications = require("./api/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

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

    // registrasi plugin eksternal
    await server.register([
        {
            plugin: Jwt,
        },
    ]);

    // mendefinisikan strategy autentikasi jwt
    server.auth.strategy("notesapp_jwt", "jwt", {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE,
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
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
        {
            plugin: authentications,
            options: {
                authenticationsService: new AuthenticationsService(),
                usersService: new UsersService(),
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
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
