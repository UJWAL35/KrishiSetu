import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { crops, users, farms } from "@db/schema";
import { eq, and, like, or } from "drizzle-orm";
import { haversineKm } from "./delivery-router";

export const cropRouter = createRouter({
    list: publicQuery
        .input(
            z
                .object({
                    category: z.string().optional(),
                    search: z.string().optional(),
                    lat: z.number().optional(),
                    lng: z.number().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            const db = getDb();
            
            let conditions = [];
            
            if (input?.category && input.category !== "all") {
                conditions.push(eq(crops.category, input.category as any));
            }
            
            if (input?.search) {
                const q = `%${input.search}%`;
                conditions.push(
                    or(
                        like(crops.name, q),
                        like(users.name, q),
                        like(crops.category, q)
                    )
                );
            }
            
            const result = await db
                .select({
                    id: crops.id,
                    name: crops.name,
                    category: crops.category,
                    variety: crops.variety,
                    price: crops.price,
                    unit: crops.unit,
                    stock: crops.stock,
                    image: crops.image,
                    isOrganic: crops.isOrganic,
                    isAvailable: crops.isAvailable,
                    harvestDate: crops.harvestDate,
                    farmerId: crops.farmerId,
                    farmId: crops.farmId,
                    description: crops.description,
                    farmerName: users.name,
                    farmerAvatar: users.avatar,
                    rating: users.rating,
                    farmName: farms.name,
                    farmerLat: users.lat,
                    farmerLng: users.lng,
                })
                .from(crops)
                .leftJoin(users, eq(crops.farmerId, users.id))
                .leftJoin(farms, eq(crops.farmId, farms.id))
                .where(conditions.length > 0 ? and(...conditions) : undefined);
                
            return result.map((r) => {
                let dist = 2.5;
                if (input?.lat && input?.lng && r.farmerLat && r.farmerLng) {
                    dist = haversineKm(input.lat, input.lng, r.farmerLat, r.farmerLng);
                }
                return {
                    ...r,
                    price: parseFloat(r.price as unknown as string),
                    distance: dist,
                    harvestDate: r.harvestDate ? new Date(r.harvestDate).toISOString().split("T")[0] : "",
                };
            });
        }),

    getById: publicQuery
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();
            const result = await db
                .select({
                    id: crops.id,
                    name: crops.name,
                    category: crops.category,
                    variety: crops.variety,
                    price: crops.price,
                    unit: crops.unit,
                    stock: crops.stock,
                    image: crops.image,
                    isOrganic: crops.isOrganic,
                    isAvailable: crops.isAvailable,
                    harvestDate: crops.harvestDate,
                    farmerId: crops.farmerId,
                    farmId: crops.farmId,
                    description: crops.description,
                    farmerName: users.name,
                    farmerAvatar: users.avatar,
                    rating: users.rating,
                    farmName: farms.name,
                })
                .from(crops)
                .leftJoin(users, eq(crops.farmerId, users.id))
                .leftJoin(farms, eq(crops.farmId, farms.id))
                .where(eq(crops.id, input.id))
                .limit(1);
                
            if (result.length === 0) return null;
            
            const r = result[0];
            return {
                ...r,
                price: parseFloat(r.price as unknown as string),
                distance: 2.5,
                harvestDate: r.harvestDate ? new Date(r.harvestDate).toISOString().split("T")[0] : "",
            };
        }),

    myCrops: authedQuery
        .query(async ({ ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();
            const result = await db
                .select()
                .from(crops)
                .where(eq(crops.farmerId, ctx.user.id));
            
            return result.map(r => ({
                ...r,
                price: parseFloat(r.price as unknown as string),
            }));
        }),

    create: authedQuery
        .input(
            z.object({
                name: z.string(),
                category: z.enum(["grains", "vegetables", "fruits", "pulses", "others"]),
                variety: z.string().optional(),
                price: z.number(),
                unit: z.string(),
                stock: z.number(),
                image: z.string().optional(),
                isOrganic: z.boolean().optional(),
                isAvailable: z.boolean().optional(),
                harvestDate: z.string().optional(),
                description: z.string().optional(),
                farmerId: z.number().optional(),
                farmId: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();
            
            // Get or auto-create farm for this farmer
            let userFarms = await db.select().from(farms).where(eq(farms.farmerId, ctx.user.id)).limit(1);
            if (userFarms.length === 0) {
                // Auto-create a default farm so farmers can add crops without full profile setup
                const [farmResult] = await db.insert(farms).values({
                    farmerId: ctx.user.id,
                    name: `${ctx.user.name || "My"}'s Farm`,
                    location: ctx.user.location || "India",
                    status: "active",
                });
                userFarms = await db.select().from(farms).where(eq(farms.id, farmResult.insertId)).limit(1);
            }
            
            const [result] = await db.insert(crops).values({
                name: input.name,
                category: input.category,
                variety: input.variety || null,
                price: input.price.toString(),
                unit: input.unit || "kg",
                stock: input.stock ?? 0,
                image: input.image || null,
                isOrganic: input.isOrganic ?? false,
                isAvailable: input.isAvailable ?? true,
                harvestDate: input.harvestDate ? new Date(input.harvestDate) : null,
                description: input.description || null,
                farmerId: ctx.user.id,
                farmId: userFarms[0].id,
            });
            
            return { id: result.insertId, ...input };
        }),

    update: authedQuery
        .input(
            z.object({
                id: z.number(),
                name: z.string().optional(),
                category: z.enum(["grains", "vegetables", "fruits", "pulses", "others"]).optional(),
                variety: z.string().optional(),
                price: z.number().optional(),
                unit: z.string().optional(),
                stock: z.number().optional(),
                image: z.string().optional(),
                isOrganic: z.boolean().optional(),
                isAvailable: z.boolean().optional(),
                harvestDate: z.string().optional(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();
            const { id, ...updateData } = input;

            // Verify ownership
            const existing = await db.select().from(crops).where(eq(crops.id, id)).limit(1);
            if (existing.length === 0) throw new Error("Crop not found");
            if (existing[0].farmerId !== ctx.user.id) throw new Error("You can only edit your own crops");
            
            let dataToUpdate: any = { ...updateData, updatedAt: new Date() };
            if (dataToUpdate.price !== undefined) {
                dataToUpdate.price = dataToUpdate.price.toString();
            }
            if (dataToUpdate.harvestDate !== undefined) {
                dataToUpdate.harvestDate = dataToUpdate.harvestDate ? new Date(dataToUpdate.harvestDate) : null;
            }
            
            await db.update(crops).set(dataToUpdate).where(eq(crops.id, id));
            return { success: true };
        }),

    delete: authedQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();

            // Verify ownership
            const existing = await db.select().from(crops).where(eq(crops.id, input.id)).limit(1);
            if (existing.length === 0) throw new Error("Crop not found");
            if (existing[0].farmerId !== ctx.user.id) throw new Error("You can only delete your own crops");

            await db.delete(crops).where(eq(crops.id, input.id));
            return { success: true };
        }),
});

