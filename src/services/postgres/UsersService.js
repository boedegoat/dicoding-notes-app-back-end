const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class UsersService {
    constructor() {
        this._pool = new Pool();
    }

    async verifyNewUsername(username) {
        const query = {
            text: "SELECT * FROM users WHERE username = $1",
            values: [username],
        };

        const user = (await this._pool.query(query)).rows[0];

        if (user) {
            throw new InvariantError(
                "Gagal menambahkan user. Username sudah digunakan"
            );
        }
    }

    async addUser({ username, password, fullname }) {
        await this.verifyNewUsername(username);

        const id = `user-${nanoid(16)}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = {
            text: "INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id",
            values: [id, username, hashedPassword, fullname],
        };

        const newUser = (await this._pool.query(query)).rows[0];

        if (!newUser) {
            throw new InvariantError("User gagal ditambahkan");
        }

        return newUser.id;
    }

    async getUserById(userId) {
        const query = {
            text: "SELECT id, username, fullname FROM users WHERE id = $1",
            values: [userId],
        };

        const user = (await this._pool.query(query)).rows[0];

        if (!user) {
            throw new NotFoundError("User tidak ditemukan");
        }

        return user;
    }
}

module.exports = UsersService;
