import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, orders, sensorReadings, crops } from "@db/schema";
import { count, eq, desc } from "drizzle-orm";

export const adminRouter = createRouter({
    getStats: publicQuery.query(async () => {
        const db = getDb();
        
        // Count total farmers
        const [farmersResult] = await db
            .select({ value: count() })
            .from(users)
            .where(eq(users.role, "farmer"));
            
        // Count active users (all users for now)
        const [usersResult] = await db
            .select({ value: count() })
            .from(users);
            
        // Count total orders
        const [ordersResult] = await db
            .select({ value: count() })
            .from(orders);
            
        // Count sensor alerts (critical/warning)
        // Since we don't have a direct "alerts" table, we'll count critical readings
        const [alertsResult] = await db
            .select({ value: count() })
            .from(sensorReadings)
            .where(eq(sensorReadings.status, "critical"));

        return {
            totalFarmers: farmersResult.value,
            activeUsers: usersResult.value,
            totalOrders: ordersResult.value,
            sensorAlerts: alertsResult.value,
        };
    }),

    getRecentOrders: publicQuery.query(async () => {
        const db = getDb();
        
        // Fetch latest 8 orders with user and crop details
        const recentOrders = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                amount: orders.totalAmount,
                date: orders.createdAt,
                customerName: users.name,
                customerAvatar: users.avatar,
                cropName: crops.name,
            })
            .from(orders)
            .leftJoin(users, eq(orders.userId, users.id))
            .leftJoin(crops, eq(orders.cropId, crops.id))
            .orderBy(desc(orders.createdAt))
            .limit(8);

        return recentOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.customerName || "Unknown",
            customerAvatar: o.customerAvatar || "/farmer-1.jpg",
            crop: o.cropName || "Unknown",
            amount: parseFloat(o.amount as unknown as string),
            status: o.status,
            date: o.date.toISOString().split("T")[0],
        }));
    }),
});
