const postgres = require('postgres');
require('dotenv').config();

async function testQuery() {
    const url = process.env.DATABASE_URL;
    const sql = postgres(url, { max: 1 });

    try {
        await sql`
            select "id", "unionId", "name", "email", "avatar", "role", "phone", "location", "lat", "lng", "isVerified", "isProfileComplete", "rating", "reviewCount", "createdAt", "updatedAt", "lastSignInAt", "password" 
            from "users" 
            where ("users"."phone" = '9324815718' and "users"."role" = 'farmer') 
            limit 1
        `;
        console.log("Query succeeded!");
    } catch (e) {
        console.error("Query failed:", e.message);
    } finally {
        await sql.end();
    }
}
testQuery();
