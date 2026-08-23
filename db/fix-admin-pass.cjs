const crypto = require('crypto');
const postgres = require('postgres');

function hashPassword(password) {
    const salt = 'smartfarm_salt_2024';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function run() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartfarm';
    const sql = postgres(url);
    const hash = hashPassword('Admin@123');
    await sql`UPDATE users SET password=${hash} WHERE phone='9999999999'`;
    console.log("Updated DB hash for Admin@123");
    await sql.end();
}

run().catch(console.error);
