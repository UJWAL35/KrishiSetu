import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { notifications, users } from "@db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const notificationRouter = createRouter({
    list: publicQuery
        .input(
            z
                .object({
                    userId: z.number().optional(),
                    unreadOnly: z.boolean().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            const db = getDb();
            
            let conditions = [];
            if (input?.userId) {
                conditions.push(eq(notifications.userId, input.userId));
                const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
                if (user?.role === "farmer") {
                    conditions.push(inArray(notifications.type, ["order", "scheme", "general"]));
                }
            }
            if (input?.unreadOnly) {
                conditions.push(eq(notifications.isRead, false));
            }
            
            const result = await db
                .select()
                .from(notifications)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(desc(notifications.createdAt));
                
            return result.map(r => ({
                ...r,
                message: r.message || "",
                createdAt: r.createdAt.toISOString()
            }));
        }),

    markAsRead: publicQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = getDb();
            await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, input.id));
            
            const result = await db.select().from(notifications).where(eq(notifications.id, input.id)).limit(1);
            return result.length > 0 ? {
                ...result[0],
                message: result[0].message || "",
                createdAt: result[0].createdAt.toISOString()
            } : null;
        }),

    markAllRead: publicQuery
        .input(z.object({ userId: z.number().optional() }).optional())
        .mutation(async ({ input }) => {
            const db = getDb();
            
            if (input?.userId) {
                await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, input.userId));
            } else {
                await db.update(notifications).set({ isRead: true });
            }
            return { success: true };
        }),

    create: publicQuery
        .input(
            z.object({
                userId: z.number(),
                title: z.string(),
                message: z.string(),
                type: z.enum(["scheme", "order", "sensor_alert", "general"]),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const [result] = await db.insert(notifications).values({
                userId: input.userId,
                title: input.title,
                message: input.message,
                type: input.type,
                isRead: false,
            }).returning({ id: notifications.id });
            
            const newNotif = await db.select().from(notifications).where(eq(notifications.id, result.id)).limit(1);
            return {
                ...newNotif[0],
                message: newNotif[0].message || "",
                createdAt: newNotif[0].createdAt.toISOString()
            };
        }),

    unreadCount: publicQuery
        .input(z.object({ userId: z.number().optional() }).optional())
        .query(async ({ input }) => {
            const db = getDb();
            
            let conditions = [eq(notifications.isRead, false)];
            if (input?.userId) {
                conditions.push(eq(notifications.userId, input.userId));
                const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
                if (user?.role === "farmer") {
                    conditions.push(inArray(notifications.type, ["order", "scheme", "general"]));
                }
            }
            
            const unread = await db
                .select()
                .from(notifications)
                .where(and(...conditions));
                
            return unread.length;
        }),
});
