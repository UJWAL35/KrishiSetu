import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { schemes, users, notifications } from "@db/schema";
import { eq } from "drizzle-orm";
import { runScraper } from "../queries/schemes-scraper";

export const schemeRouter = createRouter({
    list: publicQuery
        .input(
            z
                .object({
                    category: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            const db = getDb();
            
            let query = db.select().from(schemes);
            
            const results = await query;
            
            let filtered = results;
            if (input?.category && input.category !== "all") {
                filtered = results.filter((s) => s.category === input.category);
            }
            
            return filtered.map(s => ({
                id: s.id,
                title: s.title,
                description: s.description || "",
                category: s.category,
                benefit: s.benefit || "",
                eligibility: s.eligibility || "",
                deadline: s.deadline ? s.deadline.toISOString().split("T")[0] : "",
                documents: s.documentRequired ? s.documentRequired.split(",").map(d => d.trim()) : [],
                applicationLink: s.applicationLink || "",
                image: s.image || "/scheme-pmkisan.jpg",
                isNew: s.isNew || false,
                color: s.color || "#000000",
                isActive: s.isActive
            }));
        }),

    getById: publicQuery
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();
            const result = await db.select().from(schemes).where(eq(schemes.id, input.id)).limit(1);
            
            if (result.length === 0) return null;
            const s = result[0];
            
            return {
                id: s.id,
                title: s.title,
                description: s.description || "",
                category: s.category,
                benefit: s.benefit || "",
                eligibility: s.eligibility || "",
                deadline: s.deadline ? s.deadline.toISOString().split("T")[0] : "",
                documents: s.documentRequired ? s.documentRequired.split(",").map(d => d.trim()) : [],
                applicationLink: s.applicationLink || "",
                image: s.image || "/scheme-pmkisan.jpg",
                isNew: s.isNew || false,
                color: s.color || "#000000",
                isActive: s.isActive
            };
        }),

    create: publicQuery
        .input(
            z.object({
                title: z.string(),
                description: z.string().optional(),
                category: z.enum(["financial", "equipment", "insurance", "training", "subsidy"]),
                benefit: z.string().optional(),
                eligibility: z.string().optional(),
                deadline: z.string().optional(),
                documents: z.array(z.string()).optional(),
                applicationLink: z.string().optional(),
                image: z.string().optional(),
                isNew: z.boolean().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const [result] = await db.insert(schemes).values({
                title: input.title,
                description: input.description,
                category: input.category,
                benefit: input.benefit,
                eligibility: input.eligibility,
                deadline: input.deadline ? new Date(input.deadline) : null,
                documentRequired: input.documents ? input.documents.join(",") : "",
                applicationLink: input.applicationLink,
                image: input.image,
                isNew: input.isNew,
                color: input.color,
                isActive: true,
            });
            // Fetch all farmers
            const allFarmers = await db.select({ id: users.id }).from(users).where(eq(users.role, "farmer"));
            
            if (allFarmers.length > 0) {
                const notificationsToInsert = allFarmers.map(farmer => ({
                    userId: farmer.id,
                    title: "New Scheme Available",
                    message: `A new scheme "${input.title}" has been launched. Check it out!`,
                    type: "scheme" as const,
                    isRead: false,
                }));
                await db.insert(notifications).values(notificationsToInsert);
            }

            return { id: result.insertId, success: true };
        }),

    update: publicQuery
        .input(
            z.object({
                id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                category: z.enum(["financial", "equipment", "insurance", "training", "subsidy"]).optional(),
                benefit: z.string().optional(),
                eligibility: z.string().optional(),
                deadline: z.string().optional(),
                documents: z.array(z.string()).optional(),
                applicationLink: z.string().optional(),
                image: z.string().optional(),
                isNew: z.boolean().optional(),
                color: z.string().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const { id, documents, deadline, ...rest } = input;
            
            const updateData: any = { ...rest };
            if (documents !== undefined) {
                updateData.documentRequired = documents.join(",");
            }
            if (deadline !== undefined) {
                updateData.deadline = deadline ? new Date(deadline) : null;
            }
            
            await db.update(schemes).set(updateData).where(eq(schemes.id, id));
            return { success: true };
        }),

    delete: publicQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = getDb();
            await db.delete(schemes).where(eq(schemes.id, input.id));
            return { success: true };
        }),

    triggerScraper: publicQuery
        .mutation(async () => {
            const result = await runScraper();
            return result;
        }),
});
