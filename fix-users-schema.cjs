const postgres = require('postgres');
require('dotenv').config();

async function fixSchema() {
    const url = process.env.DATABASE_URL;
    console.log("Using DB URL:", url.substring(0, 50) + "...");
    const sql = postgres(url, { max: 1 });

    try {
        console.log("Running migrations to add missing columns to users table...");

        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location varchar(255)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lat double precision`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lng double precision`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT false`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isProfileComplete" boolean DEFAULT false`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS rating double precision DEFAULT 0`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "reviewCount" integer DEFAULT 0`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastSignInAt" timestamp DEFAULT now() NOT NULL`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password varchar(255)`;

        console.log("Migration successful! Users table updated.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}

fixSchema();
