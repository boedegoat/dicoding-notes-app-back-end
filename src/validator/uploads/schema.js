const Joi = require("joi");

module.exports.ImageHeadersSchema = Joi.object({
    "content-type": Joi.string()
        // the string MUST be one of these
        .valid(
            "image/apng",
            "image/avif",
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/webp"
        )
        .required(),
})
    // object can have various properties
    // but the object MUST has 'content-type' property
    // thats why we need to add .unknow()
    .unknown();
