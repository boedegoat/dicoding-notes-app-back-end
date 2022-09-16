const Hapi = require("@hapi/hapi");
const notes = require("./api/notes");
const NotesService = require("./services/imMemory/NotesService");

const init = async () => {
    const server = Hapi.server({
        port: 5000,
        host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
        routes: {
            cors: {
                origin: ["*"],
            },
        },
    });

    await server.register({
        plugin: notes,
        options: {
            service: new NotesService(),
        },
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
