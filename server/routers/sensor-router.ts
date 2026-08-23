import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { sensorReadings, sprayActivities, sensorIssues, farms } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

function getSensorStatus(type: string, value: number): "optimal" | "warning" | "critical" {
    switch (type) {
        case "temperature":
            if (value > 40 || value < 15) return "critical";
            if (value > 35 || value < 18) return "warning";
            return "optimal";
        case "soil_moisture":
            if (value < 15 || value > 95) return "critical";
            if (value < 30 || value > 85) return "warning";
            return "optimal";
        case "ph":
            if (value < 5.0 || value > 8.5) return "critical";
            if (value < 5.5 || value > 8.0) return "warning";
            return "optimal";
        case "humidity":
            if (value < 20 || value > 90) return "critical";
            if (value < 30 || value > 80) return "warning";
            return "optimal";
        default:
            return "optimal";
    }
}

export const sensorRouter = createRouter({
    getAll: publicQuery.query(async () => {
        const db = getDb();
        
        // Fetch all recent readings ordered by newest first
        const allReadings = await db
            .select()
            .from(sensorReadings)
            .orderBy(desc(sensorReadings.timestamp))
            .limit(1000); // Reasonable limit for history
            
        // Construct the expected format: Record<string, Record<string, SensorValue>>
        const result: Record<string, Record<string, any>> = {};
        
        // Default fields to ensure frontend doesn't break if db is empty
        const defaultFields = ["Field A", "Field B", "Field C", "Field D"];
        const defaultTypes = ["temperature", "soil_moisture", "ph", "humidity"];
        
        for (const field of defaultFields) {
            result[field] = {};
            for (const type of defaultTypes) {
                // Find all readings for this field and type
                const readings = allReadings.filter(r => r.field === field && r.type === type);
                
                if (readings.length > 0) {
                    const latest = readings[0];
                    // Keep last 25 points for history
                    const history = readings.slice(0, 25).reverse().map(r => ({
                        time: r.timestamp.toISOString(),
                        value: r.value
                    }));
                    
                    result[field][type] = {
                        value: latest.value,
                        unit: latest.unit,
                        status: latest.status,
                        history
                    };
                } else {
                    // Fallback to dummy data for empty db
                    result[field][type] = {
                        value: type === "ph" ? 7 : 40,
                        unit: type === "temperature" ? "°C" : type === "ph" ? "" : "%",
                        status: "optimal",
                        history: []
                    };
                }
            }
        }
        
        return result;
    }),

    getByField: publicQuery
        .input(z.object({ field: z.string() }))
        .query(async ({ input }) => {
            const db = getDb();
            const allReadings = await db
                .select()
                .from(sensorReadings)
                .where(eq(sensorReadings.field, input.field))
                .orderBy(desc(sensorReadings.timestamp))
                .limit(100);
                
            const result: Record<string, any> = {};
            const types = ["temperature", "soil_moisture", "ph", "humidity"];
            
            for (const type of types) {
                const readings = allReadings.filter(r => r.type === type);
                if (readings.length > 0) {
                    const latest = readings[0];
                    const history = readings.slice(0, 25).reverse().map(r => ({
                        time: r.timestamp.toISOString(),
                        value: r.value
                    }));
                    
                    result[type] = {
                        value: latest.value,
                        unit: latest.unit,
                        status: latest.status,
                        history
                    };
                } else {
                    result[type] = {
                        value: type === "ph" ? 7 : 40,
                        unit: type === "temperature" ? "°C" : type === "ph" ? "" : "%",
                        status: "optimal",
                        history: []
                    };
                }
            }
            return result;
        }),

    update: publicQuery
        .input(
            z.object({
                field: z.string(),
                type: z.enum(["temperature", "soil_moisture", "ph", "humidity"]),
                value: z.number(),
                farmId: z.number().default(1),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const status = getSensorStatus(input.type, input.value);
            const unit = input.type === "temperature" ? "°C" : input.type === "ph" ? "" : "%";
            
            await db.insert(sensorReadings).values({
                farmId: input.farmId,
                field: input.field,
                type: input.type,
                value: input.value,
                unit: unit,
                status: status,
            });
            
            return { success: true };
        }),

    simulateSpray: publicQuery
        .input(
            z.object({
                field: z.string(),
                type: z.enum(["water", "pesticide", "fertilizer"]),
                farmId: z.number().default(1),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            
            // Record the spray activity
            await db.insert(sprayActivities).values({
                farmId: input.farmId,
                field: input.field,
                type: input.type,
                duration: 30, // Default 30 mins
                status: "completed",
                startedAt: new Date(Date.now() - 30 * 60000),
                completedAt: new Date(),
            });

            // Adjust sensor readings appropriately
            if (input.type === "water") {
                const latest = await db.select().from(sensorReadings)
                    .where(and(eq(sensorReadings.field, input.field), eq(sensorReadings.type, "soil_moisture")))
                    .orderBy(desc(sensorReadings.timestamp)).limit(1);
                    
                const currentVal = latest.length > 0 ? latest[0].value : 50;
                const newVal = Math.min(100, currentVal + 15);
                
                await db.insert(sensorReadings).values({
                    farmId: input.farmId,
                    field: input.field,
                    type: "soil_moisture",
                    value: newVal,
                    unit: "%",
                    status: getSensorStatus("soil_moisture", newVal),
                });
            }
            
            if (input.type === "fertilizer") {
                const latest = await db.select().from(sensorReadings)
                    .where(and(eq(sensorReadings.field, input.field), eq(sensorReadings.type, "ph")))
                    .orderBy(desc(sensorReadings.timestamp)).limit(1);
                    
                const currentVal = latest.length > 0 ? latest[0].value : 6.0;
                const target = currentVal < 6.5 ? 6.7 : currentVal > 7.0 ? 6.8 : currentVal;
                const newVal = parseFloat((currentVal + (target - currentVal) * 0.3).toFixed(1));
                
                await db.insert(sensorReadings).values({
                    farmId: input.farmId,
                    field: input.field,
                    type: "ph",
                    value: newVal,
                    unit: "",
                    status: getSensorStatus("ph", newVal),
                });
            }
            
            
            return { success: true };
        }),

    getIssues: publicQuery
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ input }) => {
            const db = getDb();
            let conditions = [];
            if (input?.status && input.status !== "all") {
                conditions.push(eq(sensorIssues.status, input.status as any));
            }
            
            const result = await db
                .select()
                .from(sensorIssues)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(desc(sensorIssues.createdAt));
                
            return result.map(r => ({
                id: r.id.toString(),
                field: r.field,
                sensorType: r.sensorType,
                issueType: r.issueType,
                urgency: r.urgency,
                description: r.description || "",
                status: r.status,
                createdAt: r.createdAt.toISOString(),
            }));
        }),

    reportIssue: authedQuery
        .input(
            z.object({
                field: z.string(),
                sensorType: z.string(),
                issueType: z.string(),
                urgency: z.string(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "farmer") throw new Error("Unauthorized");
            const db = getDb();

            // Get farm ID
            const userFarms = await db.select().from(farms).where(eq(farms.farmerId, ctx.user.id)).limit(1);
            if (userFarms.length === 0) throw new Error("Farm not found");

            await db.insert(sensorIssues).values({
                farmerId: ctx.user.id,
                farmId: userFarms[0].id,
                field: input.field,
                sensorType: input.sensorType,
                issueType: input.issueType,
                urgency: input.urgency,
                description: input.description,
            });

            return { success: true };
        }),

    resolveIssue: authedQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user || ctx.user.role !== "admin") throw new Error("Unauthorized");
            const db = getDb();
            await db.update(sensorIssues).set({ status: "resolved" }).where(eq(sensorIssues.id, input.id));
            return { success: true };
        }),
});
