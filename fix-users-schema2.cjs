const postgres = require('postgres');
require('dotenv').config();

async function checkMoreColumns() {
    const url = process.env.DATABASE_URL;
    const sql = postgres(url, { max: 1 });

    try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "unionId" varchar(255)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(255)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(320)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(50) DEFAULT 'consumer' NOT NULL`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL`;

        console.log("Migration successful! Users table updated (2).");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}
checkMoreColumns();
