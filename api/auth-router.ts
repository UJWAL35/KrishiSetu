import { z } from "zod";
import * as cookie from "cookie";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { signSessionToken } from "./kimi/session";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createHash } from "crypto";
import { sendWhatsAppWelcomeMessage } from "./lib/twilio";

// Simple password hashing using SHA-256 + salt
function hashPassword(password: string): string {
    const salt = "smartfarm_salt_2024";
    return createHash("sha256").update(password + salt).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

export const authRouter = createRouter({
    // ── Farmer / Consumer Register ──────────────────────────────
    register: publicQuery
        .input(
            z.object({
                name: z.string().min(1),
                phone: z.string().min(10),
                role: z.enum(["consumer", "farmer", "delivery_partner"]),
                avatar: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = getDb();

            // Check if phone is used
            const phoneUsers = await db
                .select()
                .from(users)
                .where(eq(users.phone, input.phone))
                .limit(1);

            if (phoneUsers.length > 0) {
                if (phoneUsers[0].role !== input.role) {
                    throw new Error(
                        `This phone number is registered as a ${phoneUsers[0].role}. Please select the correct role.`
                    );
                } else {
                    throw new Error(
                        `An account with this phone number already exists. Please log in instead.`
                    );
                }
            }

            // Create new user
            const unionId = `${input.role}_${input.phone}_${Date.now()}`;
            const [result] = await db.insert(users).values({
                unionId,
                name: input.name,
                phone: input.phone,
                role: input.role,
                avatar: input.avatar,
                isVerified: true,
                isProfileComplete: input.role === "consumer",
                lastSignInAt: new Date(),
            });

            const createdUsers = await db
                .select()
                .from(users)
                .where(eq(users.id, result.insertId))
                .limit(1);
            const user = createdUsers[0];

            // Send welcome WhatsApp message
            await sendWhatsAppWelcomeMessage(input.phone, input.name, input.role);

            const token = await signSessionToken({
                unionId: user.unionId,
                clientId: "smartfarm-app",
            });

            const opts = getSessionCookieOptions(ctx.req.headers);
            ctx.resHeaders.append(
                "set-cookie",
                cookie.serialize(Session.cookieName, token, {
                    httpOnly: opts.httpOnly,
                    path: opts.path,
                    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
                    secure: opts.secure,
                    maxAge: Session.maxAgeMs / 1000,
                }),
            );

            return { success: true, user };
        }),

    // ── Farmer / Consumer Login ──────────────────────────────
    login: publicQuery
        .input(
            z.object({
                phone: z.string().min(10),
                role: z.enum(["consumer", "farmer", "delivery_partner"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = getDb();

            const existingUsers = await db
                .select()
                .from(users)
                .where(and(eq(users.phone, input.phone), eq(users.role, input.role)))
                .limit(1);

            const user = existingUsers[0];

            if (!user) {
                throw new Error("No account found with this phone number and role.");
            }

            if (!user.isVerified) {
                throw new Error("Your account is not verified yet. Please contact support.");
            }

            // Update lastSignInAt
            await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));

            const token = await signSessionToken({
                unionId: user.unionId,
                clientId: "smartfarm-app",
            });

            const opts = getSessionCookieOptions(ctx.req.headers);
            ctx.resHeaders.append(
                "set-cookie",
                cookie.serialize(Session.cookieName, token, {
                    httpOnly: opts.httpOnly,
                    path: opts.path,
                    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
                    secure: opts.secure,
                    maxAge: Session.maxAgeMs / 1000,
                }),
            );

            return { success: true, user };
        }),

    // ── Admin Login (phone + password) ─────────────────────────
    adminLogin: publicQuery
        .input(
            z.object({
                phone: z.string().min(10),
                password: z.string().min(1),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = getDb();

            const adminUsers = await db
                .select()
                .from(users)
                .where(and(eq(users.phone, input.phone), eq(users.role, "admin")))
                .limit(1);

            const adminUser = adminUsers[0];

            if (!adminUser) {
                throw new Error("Invalid credentials. Admin account not found.");
            }

            if (!adminUser.password) {
                throw new Error("Admin account has no password set. Please contact support.");
            }

            if (!verifyPassword(input.password, adminUser.password)) {
                throw new Error("Incorrect password. Please try again.");
            }

            await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, adminUser.id));

            const token = await signSessionToken({
                unionId: adminUser.unionId,
                clientId: "smartfarm-app",
            });

            const opts = getSessionCookieOptions(ctx.req.headers);
            ctx.resHeaders.append(
                "set-cookie",
                cookie.serialize(Session.cookieName, token, {
                    httpOnly: opts.httpOnly,
                    path: opts.path,
                    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
                    secure: opts.secure,
                    maxAge: Session.maxAgeMs / 1000,
                }),
            );

            return { success: true, user: adminUser };
        }),

    me: authedQuery.query(({ ctx }) => {
        return ctx.user;
    }),

    logout: authedQuery.mutation(({ ctx }) => {
        const opts = getSessionCookieOptions(ctx.req.headers);
        ctx.resHeaders.append(
            "set-cookie",
            cookie.serialize(Session.cookieName, "", {
                httpOnly: opts.httpOnly,
                path: opts.path,
                sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
                secure: opts.secure,
                maxAge: 0,
            }),
        );
        return { success: true };
    }),
});
