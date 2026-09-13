import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;
let queryClient: ReturnType<typeof postgres>;

export function getDb() {
    if (!instance) {
        // Supabase requires SSL. On Vercel serverless, we use max:1 connection
        // to avoid exhausting the connection pool across function invocations.
        queryClient = postgres(env.databaseUrl, {
            ssl: "require",
            max: 1,
            idle_timeout: 20,
            connect_timeout: 10,
        });
        instance = drizzle(queryClient, {
            schema: fullSchema,
        });
    }
    return instance;
}
