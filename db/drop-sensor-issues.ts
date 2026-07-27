import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function main() {
    const db = getDb();
    await db.execute(sql`DROP TABLE IF EXISTS sensor_issues;`);
    console.log("Dropped sensor_issues table.");
    process.exit(0);
}

main();
