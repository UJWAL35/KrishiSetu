require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function test() {
  try {
    const res = await sql`SELECT * FROM users LIMIT 1`;
    console.log('Users Query Success:', res);
  } catch (err) {
    console.error('Query Error:', err.message);
  } finally {
    await sql.end();
  }
}
test();
