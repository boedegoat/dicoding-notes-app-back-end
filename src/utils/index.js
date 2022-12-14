const ClientError = require("../exceptions/ClientError");

const mapToDBModel = (data) =>
    Object.entries(data).reduce((result, [key, value]) => {
        if (key.includes("_")) {
            // eslint-disable-next-line no-param-reassign
            key = key.replace(/_\w/g, (w) => w.toUpperCase().slice(1));
        }
        // eslint-disable-next-line no-param-reassign
        result[key] = value;
        return result;
    }, {});

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

const tryCatchWrapper = async (h, callback) => {
    try {
        return await callback();
    } catch (error) {
        if (error instanceof ClientError) {
            return sendResponse(h, {
                code: error.statusCode,
                status: "fail",
                message: error.message,
            });
        }

        // Server Error
        console.error(error);
        return sendResponse(h, {
            code: 500,
            status: "error",
            message: "Maaf, terjadi kegagalan pada server kami.",
        });
    }
};

module.exports = { mapToDBModel, sendResponse, tryCatchWrapper };
