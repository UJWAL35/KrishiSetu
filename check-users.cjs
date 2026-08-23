require('dotenv').config();
const postgres = require('postgres');
async function check() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartfarm';
    const sql = postgres(url);
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `;
        console.log("Columns in 'users':", columns.map(c => c.column_name));
    } catch (e) {
        console.error(e);
    }
    await sql.end();
}
check();
