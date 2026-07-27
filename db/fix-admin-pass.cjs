const crypto = require('crypto');
const mysql = require('mysql2/promise');

function hashPassword(password) {
    const salt = 'smartfarm_salt_2024';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function run() {
    const conn = await mysql.createConnection('mysql://root:ujwalsql%402005@localhost:3306/smartfarm');
    const hash = hashPassword('Admin@123');
    await conn.query('UPDATE users SET password=? WHERE phone=?', [hash, '9999999999']);
    console.log("Updated DB hash for Admin@123");
    await conn.end();
}

run().catch(console.error);
