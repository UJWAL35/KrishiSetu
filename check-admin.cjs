const postgres = require('postgres');
require('dotenv').config();

async function checkAdmin() {
    const url = process.env.DATABASE_URL;
    const sql = postgres(url, { max: 1 });

    try {
        const admins = await sql`SELECT phone, password, role FROM users WHERE role = 'admin'`;
        console.log("Found admins in database:", admins);
    } catch (e) {
        console.error("Query failed:", e.message);
    } finally {
        await sql.end();
    }
}
checkAdmin();
