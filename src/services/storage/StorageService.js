const fs = require("fs");
const path = require("path");

class StorageService {
    constructor(folder) {
        this._folder = folder;

        // create folder if not exist yet
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    }

    writeFile(file, meta) {
        // create filename with current milliseconds
        const filename = Date.now() + meta.filename;

        // create filePath from folder path + filename
        const filePath = path.join(this._folder, filename);

        // create fileStream from filePath
        const fileStream = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            // if error occured while creating fileStream, throw that error
            fileStream.on("error", (error) => reject(error));

            // write file contents chunks-by-chunks to fileStream
            file.pipe(fileStream);

            // when done, return the filename
            file.on("end", () => resolve(filename));
        });
    }
}

module.exports = StorageService;
