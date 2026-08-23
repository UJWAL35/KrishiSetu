import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./kimi/session";

export type TrpcContext = {
    req: Request;
    resHeaders: Headers;
    user?: User;
};

export async function createContext(
    opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
    const ctx: TrpcContext = { req: opts.req, resHeaders: (opts as any).resHeaders };
    try {
        const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
        const token = cookies[Session.cookieName];
        if (token) {
            const claim = await verifySessionToken(token);
            if (claim) {
                const db = getDb();
                const existingUsers = await db
                    .select()
                    .from(users)
                    .where(eq(users.unionId, claim.unionId))
                    .limit(1);
                
                if (existingUsers.length > 0) {
                    ctx.user = existingUsers[0];
                }
            }
        }
    } catch {
        // Authentication is optional here
    }
    return ctx;
}
