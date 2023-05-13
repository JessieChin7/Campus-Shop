// models/user.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const saltRounds = 10; // set hash complexcity
const util = require('util');
pool.query = util.promisify(pool.query);
module.exports = {
    async getUserByEmail(email) {
        const rows = await pool.query(`SELECT * FROM CampusShop.User WHERE email = ?`, [email]);
        return rows;
    },
    async createUser(name, email, password, provider, picture, role) {
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }
        const insertUser = await pool.query(`INSERT INTO CampusShop.User(name, email, password, provider, picture, role) VALUES(?, ?, ?, ?, ?, ?)`, [name, email, hashedPassword, provider, picture, role]);
        return insertUser;
    },
    async signIn(email, password) {
        const users = await this.getUserByEmail(email);
        if (!users || users.length === 0) {
            throw { status: 403, message: 'User does not exist' };
        }
        const user = users[0];
        if (user.provider == "facebook") {
            throw { status: 403, message: 'User has registered with Facebook' };
        }
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched) {
            throw { status: 403, message: 'Wrong password' };
        }
        return user;
    }
}
