const AWS = require("aws-sdk");

AWS.config.update({ region: "ap-southeast-3" });

class StorageService {
    constructor() {
        this._S3 = new AWS.S3();
    }

    writeFile(file, meta) {
        const timestamp = Date.now();
        const filename = meta.filename.replace(/\s/g, "-");
        const Key = `${timestamp}-${filename}`;

        const parameter = {
            Bucket: process.env.AWS_BUCKET_NAME, // Nama S3 Bucket yang digunakan
            Key, // Nama berkas yang akan disimpan
            Body: file._data, // Berkas (dalam bentuk Buffer) yang akan disimpan
            ContentType: meta.headers["content-type"], // MIME Type berkas yang akan disimpan
        };

        return new Promise((resolve, reject) => {
            this._S3.upload(parameter, (error, data) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(data.Location); // data url location
            });
        });
    }
}

module.exports = StorageService;
