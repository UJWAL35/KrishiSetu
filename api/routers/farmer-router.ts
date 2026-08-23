import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, farms, crops, reviews, notifications } from "@db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { haversineKm } from "./delivery-router";

export const farmerRouter = createRouter({
    list: publicQuery
        .input(
            z
                .object({
                    crop: z.string().optional(),
                    lat: z.number().optional(),
                    lng: z.number().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            const db = getDb();

            // Fetch farmers (users with role 'farmer')
            const allFarmers = await db
                .select()
                .from(users)
                .where(eq(users.role, "farmer"));

            // Fetch their farms
            const allFarms = await db.select().from(farms);

            // Fetch their crops
            const allCrops = await db.select().from(crops);

            let result = allFarmers.map((farmer) => {
                const farmerFarms = allFarms.filter((f) => f.farmerId === farmer.id);
                const primaryFarm = farmerFarms[0]; // Assuming 1 farm per farmer for now
                const farmerCrops = allCrops.filter((c) => c.farmerId === farmer.id);

                const cropNames = [...new Set(farmerCrops.map((c) => c.name))];
                const isOrganic = farmerCrops.some((c) => c.isOrganic);
                
                // Calculate min price for pricePerKg display
                const prices = farmerCrops.map(c => parseFloat(c.price as unknown as string)).filter(p => !isNaN(p));
                const pricePerKg = prices.length > 0 ? Math.min(...prices) : 0;

                return {
                    id: farmer.id,
                    name: farmer.name || "Unknown Farmer",
                    avatar: farmer.avatar || "/farmer-1.jpg",
                    farmName: primaryFarm?.name || "Unnamed Farm",
                    location: farmer.location || "Unknown Location",
                    lat: farmer.lat || 0,
                    lng: farmer.lng || 0,
                    distance: (input?.lat && input?.lng && farmer.lat && farmer.lng) 
                        ? haversineKm(input.lat, input.lng, farmer.lat, farmer.lng) 
                        : 2.5,
                    rating: farmer.rating || 0,
                    reviewCount: farmer.reviewCount || 0,
                    crops: cropNames,
                    isOrganic,
                    isVerified: farmer.isVerified || false,
                    pricePerKg,
                    cropType: cropNames[0] || "Various",
                    image: farmerCrops[0]?.image || "/farm-placeholder.jpg",
                };
            });

            if (input?.crop && input.crop !== "All") {
                const searchCrop = input.crop.toLowerCase();
                result = result.filter((f) =>
                    f.crops.some((c) => c.toLowerCase() === searchCrop)
                );
            }

            if (input?.lat && input?.lng) {
                // Dummy distance sort for now
                result.sort((a, b) => a.distance - b.distance);
            }

            return result;
        }),

    getById: publicQuery
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();

            const farmerResult = await db
                .select()
                .from(users)
                .where(and(eq(users.id, input.id), eq(users.role, "farmer")))
                .limit(1);

            if (farmerResult.length === 0) return null;
            const farmer = farmerResult[0];

            const farmerFarms = await db
                .select()
                .from(farms)
                .where(eq(farms.farmerId, farmer.id));
            const primaryFarm = farmerFarms[0];

            const farmerCrops = await db
                .select()
                .from(crops)
                .where(eq(crops.farmerId, farmer.id));

            const cropNames = [...new Set(farmerCrops.map((c) => c.name))];
            const isOrganic = farmerCrops.some((c) => c.isOrganic);
            const prices = farmerCrops.map(c => parseFloat(c.price as unknown as string)).filter(p => !isNaN(p));
            const pricePerKg = prices.length > 0 ? Math.min(...prices) : 0;

            return {
                id: farmer.id,
                name: farmer.name || "Unknown Farmer",
                avatar: farmer.avatar || "/farmer-1.jpg",
                farmName: primaryFarm?.name || "Unnamed Farm",
                location: farmer.location || "Unknown Location",
                lat: farmer.lat || 0,
                lng: farmer.lng || 0,
                distance: 2.5,
                rating: farmer.rating || 0,
                reviewCount: farmer.reviewCount || 0,
                crops: cropNames,
                isOrganic,
                isVerified: farmer.isVerified || false,
                pricePerKg,
                cropType: cropNames[0] || "Various",
                image: farmerCrops[0]?.image || "/farm-placeholder.jpg",
            };
        }),

    search: publicQuery
        .input(z.object({ query: z.string() }))
        .query(async ({ input }) => {
            const db = getDb();
            const q = `%${input.query}%`;
            
            // Search users by name where role=farmer
            const searchFarmers = await db
                .select()
                .from(users)
                .where(
                    and(
                        eq(users.role, "farmer"),
                        like(users.name, q)
                    )
                );
                
            // Search farms by name
            const searchFarms = await db
                .select()
                .from(farms)
                .where(like(farms.name, q));
                
            // Combine matching user IDs
            const matchingUserIds = new Set<number>();
            searchFarmers.forEach(f => matchingUserIds.add(f.id));
            searchFarms.forEach(f => matchingUserIds.add(f.farmerId));
            
            // Fetch the final matched farmers fully
            if (matchingUserIds.size === 0) return [];
            
            // We'll re-use the list logic for simplicity in this refactor, 
            // but just fetch those specific IDs.
            // For now, let's just fetch all and filter in JS to reuse the same output structure easily.
            const allFarmers = await db
                .select()
                .from(users)
                .where(eq(users.role, "farmer"));

            const allFarms = await db.select().from(farms);
            const allCrops = await db.select().from(crops);

            let result = allFarmers.map((farmer) => {
                const farmerFarms = allFarms.filter((f) => f.farmerId === farmer.id);
                const primaryFarm = farmerFarms[0];
                const farmerCrops = allCrops.filter((c) => c.farmerId === farmer.id);
                const cropNames = [...new Set(farmerCrops.map((c) => c.name))];
                const isOrganic = farmerCrops.some((c) => c.isOrganic);
                const prices = farmerCrops.map(c => parseFloat(c.price as unknown as string)).filter(p => !isNaN(p));
                
                return {
                    id: farmer.id,
                    name: farmer.name || "Unknown Farmer",
                    avatar: farmer.avatar || "/farmer-1.jpg",
                    farmName: primaryFarm?.name || "Unnamed Farm",
                    location: farmer.location || "Unknown Location",
                    lat: farmer.lat || 0,
                    lng: farmer.lng || 0,
                    distance: 2.5,
                    rating: farmer.rating || 0,
                    reviewCount: farmer.reviewCount || 0,
                    crops: cropNames,
                    isOrganic,
                    isVerified: farmer.isVerified || false,
                    pricePerKg: prices.length > 0 ? Math.min(...prices) : 0,
                    cropType: cropNames[0] || "Various",
                    image: farmerCrops[0]?.image || "/farm-placeholder.jpg",
                };
            });

            const queryLower = input.query.toLowerCase();
            return result.filter(
                (f) =>
                    f.name.toLowerCase().includes(queryLower) ||
                    f.farmName.toLowerCase().includes(queryLower) ||
                    f.crops.some((c) => c.toLowerCase().includes(queryLower))
            );
        }),
        
    create: publicQuery
        .input(
            z.object({
                name: z.string(),
                email: z.string().email(),
                phone: z.string().optional(),
                location: z.string().optional(),
                farmName: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            // 1. Create User
            const [userResult] = await db.insert(users).values({
                unionId: `farmer_${Date.now()}`,
                name: input.name,
                email: input.email,
                phone: input.phone,
                location: input.location,
                role: "farmer",
                isVerified: true,
            }).returning({ id: users.id });
            const userId = userResult.id;
            
            // 2. Create Farm
            await db.insert(farms).values({
                farmerId: userId,
                name: input.farmName,
                location: input.location,
            });
            
            return { id: userId, success: true };
        }),
        
    update: publicQuery
        .input(
            z.object({
                id: z.number(),
                name: z.string().optional(),
                location: z.string().optional(),
                isVerified: z.boolean().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const { id, ...updateData } = input;
            
            await db.update(users).set(updateData).where(eq(users.id, id));
            return { success: true };
        }),
        
    delete: publicQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = getDb();
            // Since farms and crops depend on user, we should delete them first or let cascade handle it.
            // Drizzle doesn't do cascade by default unless defined in schema, so manual delete:
            await db.delete(crops).where(eq(crops.farmerId, input.id));
            await db.delete(farms).where(eq(farms.farmerId, input.id));
            await db.delete(users).where(eq(users.id, input.id));
            
            return { success: true };
        }),

    getMyReviews: authedQuery.query(async ({ ctx }) => {
        if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
        const db = getDb();

        const myReviews = await db
            .select({
                id: reviews.id,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                consumerName: users.name,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .where(eq(reviews.farmerId, ctx.user.id))
            .orderBy(reviews.createdAt);
            
        // reverse to get newest first
        return myReviews.reverse();
    }),

    completeProfile: authedQuery
        .input(
            z.object({
                farmName: z.string(),
                farmAddress: z.string(),
                farmSize: z.string(),
                soilType: z.string(),
                isOrganic: z.boolean(),
                lat: z.number(),
                lng: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();

            // Create farm
            await db.insert(farms).values({
                farmerId: ctx.user.id,
                name: input.farmName,
                location: input.farmAddress,
                lat: input.lat,
                lng: input.lng,
                size: input.farmSize,
                soilType: input.soilType,
                isOrganic: input.isOrganic,
            });

            // Update user profile complete status
            await db
                .update(users)
                .set({ isProfileComplete: true, location: input.farmAddress, lat: input.lat, lng: input.lng })
                .where(eq(users.id, ctx.user.id));

            return { success: true };
        }),

    submitReview: authedQuery
        .input(
            z.object({
                farmerId: z.number(),
                rating: z.number().min(1).max(5),
                comment: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user) throw new Error("Unauthorized");
            const db = getDb();

            // Insert the review
            await db.insert(reviews).values({
                userId: ctx.user.id,
                farmerId: input.farmerId,
                rating: input.rating,
                comment: input.comment,
            });

            // Calculate the new average rating
            const allReviews = await db
                .select({ rating: reviews.rating })
                .from(reviews)
                .where(eq(reviews.farmerId, input.farmerId));

            const totalReviews = allReviews.length;
            const sumRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const newAvgRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 0;

            // Update the farmer's rating in users table
            await db
                .update(users)
                .set({ rating: newAvgRating, reviewCount: totalReviews })
                .where(eq(users.id, input.farmerId));

            // Notify farmer about review
            await db.insert(notifications).values({
                userId: input.farmerId,
                title: "New Review",
                message: `A consumer left a ${input.rating}-star review for you.`,
                type: "general",
                isRead: false,
            });

            return { success: true, newAvgRating, totalReviews };
        }),
});

