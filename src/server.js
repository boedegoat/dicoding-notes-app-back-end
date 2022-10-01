require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const Innert = require("@hapi/inert");
// const path = require("path");

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

// collaborations
const collaborations = require("./api/collaborations");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const CollaborationsValidator = require("./validator/collaborations");

// Exports
const _exports = require("./api/exports");
const ProducerService = require("./services/rabbitmq/ProducerService");
const ExportsValidator = require("./validator/exports");

// uploads
const uploads = require("./api/uploads");
const StorageService = require("./services/s3/StorageService");
const UploadsValidator = require("./validator/uploads");

// cache
const CacheService = require("./services/redis/CacheService");

const init = async () => {
    const cacheService = new CacheService();
    const notesService = new NotesService(cacheService);
    const collaborationsService = new CollaborationsService(cacheService);
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();
    const storageService = new StorageService();

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
    await server.register([{ plugin: Jwt }, { plugin: Innert }]);

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
                service: notesService,
                validator: NotesValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                notesService,
                validator: CollaborationsValidator,
            },
        },
        {
            plugin: _exports,
            options: {
                service: ProducerService,
                validator: ExportsValidator,
            },
        },
        {
            plugin: uploads,
            options: {
                service: storageService,
                validator: UploadsValidator,
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

        return h.continue;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
