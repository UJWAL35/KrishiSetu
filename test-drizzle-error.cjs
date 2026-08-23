const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { pgTable, serial, varchar } = require("drizzle-orm/pg-core");
const { eq } = require("drizzle-orm");

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    phone: varchar("phone"),
});

async function test() {
    const client = postgres('postgresql://invalid:invalid@localhost:54322/invalid');
    const db = drizzle(client);
    try {
        await db.select().from(users).where(eq(users.phone, "123"));
    } catch (e) {
        console.log("Caught Error Message:", e.message);
    }
    client.end();
}
test();
