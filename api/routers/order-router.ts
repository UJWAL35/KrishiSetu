import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, users, crops, notifications } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { planDeliveryLegs } from "./delivery-router";
import { deliveries, warehouses } from "@db/schema";

export const orderRouter = createRouter({
    list: publicQuery
        .input(
            z
                .object({
                    status: z.string().optional(),
                    userId: z.number().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            const db = getDb();
            const customers = alias(users, "customer");
            const farmers = alias(users, "farmer");

            let conditions = [];
            if (input?.status) {
                conditions.push(eq(orders.status, input.status as any));
            }
            if (input?.userId) {
                conditions.push(eq(orders.userId, input.userId));
            }

            const result = await db
                .select({
                    id: orders.id,
                    orderNumber: orders.orderNumber,
                    customer: customers.name,
                    customerAvatar: customers.avatar,
                    crop: crops.name,
                    farmerName: farmers.name,
                    quantity: orders.quantity,
                    amount: orders.totalAmount,
                    status: orders.status,
                    deliveryType: orders.deliveryType,
                    date: orders.createdAt,
                    address: orders.deliveryAddress,
                    cropId: crops.id,
                    cropImage: crops.image,
                    isOrganic: crops.isOrganic,
                    unit: crops.unit,
                    price: crops.price,
                })
                .from(orders)
                .leftJoin(customers, eq(orders.userId, customers.id))
                .leftJoin(farmers, eq(orders.farmerId, farmers.id))
                .leftJoin(crops, eq(orders.cropId, crops.id))
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(desc(orders.createdAt));

            return result.map(r => ({
                ...r,
                customer: r.customer || "Unknown",
                customerAvatar: r.customerAvatar || "/farmer-1.jpg",
                crop: r.crop || "Unknown",
                farmerName: r.farmerName || "Unknown",
                quantity: `${r.quantity} kg`, // Formatting as string for frontend compatibility if needed
                amount: parseFloat(r.amount as unknown as string),
                date: r.date.toISOString().split("T")[0],
                address: r.address || "",
                cropId: r.cropId,
                cropImage: r.cropImage,
                isOrganic: r.isOrganic,
                unit: r.unit,
                price: parseFloat(r.price as unknown as string),
            }));
        }),

    create: authedQuery
        .input(z.object({
            userId: z.number(),
            farmerId: z.number(),
            cropId: z.number(),
            quantity: z.number(),
            unitPrice: z.number(),
            deliveryFee: z.number(),
            totalAmount: z.number(),
            deliveryType: z.enum(["pickup", "standard", "express"]),
            address: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            const db = getDb();
            const orderNum = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            // Insert order
            const [orderInsert] = await db.insert(orders).values({
                orderNumber: orderNum,
                userId: input.userId,
                farmerId: input.farmerId,
                cropId: input.cropId,
                quantity: input.quantity.toString(),
                unitPrice: input.unitPrice.toString(),
                deliveryFee: input.deliveryFee.toString(),
                totalAmount: input.totalAmount.toString() as any,
                deliveryType: input.deliveryType,
                deliveryAddress: input.address,
                status: "pending",
            }).returning({ id: orders.id });
            const newOrderId = orderInsert.id;

            // Generate delivery legs if it's not pickup
            if (input.deliveryType !== "pickup") {
                const [farmer] = await db.select({ lat: users.lat, lng: users.lng, location: users.location, name: users.name }).from(users).where(eq(users.id, input.farmerId)).limit(1);
                const [customer] = await db.select({ lat: users.lat, lng: users.lng }).from(users).where(eq(users.id, input.userId)).limit(1);
                
                if (farmer && customer) {
                    const allWh = await db.select().from(warehouses).where(eq(warehouses.isActive, true));
                    const legs = planDeliveryLegs(
                        farmer.lat || 18.5204,
                        farmer.lng || 73.8567,
                        farmer.location || `${farmer.name}'s Farm`,
                        customer.lat || 19.0760,
                        customer.lng || 72.8777,
                        input.address,
                        allWh
                    );

                    for (const leg of legs) {
                        await db.insert(deliveries).values({
                            orderId: newOrderId,
                            legIndex: leg.legIndex,
                            totalLegs: legs.length,
                            pickupLat: leg.pickupLat,
                            pickupLng: leg.pickupLng,
                            pickupAddress: leg.pickupAddress,
                            deliveryLat: leg.deliveryLat,
                            deliveryLng: leg.deliveryLng,
                            deliveryAddress: leg.deliveryAddress,
                            fromWarehouseId: leg.fromWarehouseId,
                            toWarehouseId: leg.toWarehouseId,
                            status: "pending",
                            partnerEarning: "0",
                        });
                    }
                }
            }
            const [crop] = await db.select({ name: crops.name, unit: crops.unit }).from(crops).where(eq(crops.id, input.cropId)).limit(1);
            const cropName = crop?.name || "Crop";
            const unit = crop?.unit || "kg";
            
            await db.insert(notifications).values({
                userId: input.farmerId,
                title: "New Order Received",
                message: `${input.quantity}kg of crop has been ordered from you so keep it ready`,
                type: "order",
                isRead: false,
            });

            return { success: true, orderNumber: orderNum };
        }),

    // Fetch orders for the currently authenticated user (consumer/farmer)
    myOrders: authedQuery
        .query(async ({ ctx }) => {
            if (!ctx.user) throw new Error("Unauthorized");
            const db = getDb();
            const farmers = alias(users, "farmer");

            const result = await db
                .select({
                    id: orders.id,
                    orderNumber: orders.orderNumber,
                    cropId: orders.cropId,
                    cropName: crops.name,
                    cropImage: crops.image,
                    farmerId: orders.farmerId,
                    farmerName: farmers.name,
                    farmName: crops.variety, // using variety as a placeholder
                    unit: crops.unit,
                    quantity: orders.quantity,
                    unitPrice: orders.unitPrice,
                    deliveryFee: orders.deliveryFee,
                    totalAmount: orders.totalAmount,
                    deliveryType: orders.deliveryType,
                    status: orders.status,
                    deliveryAddress: orders.deliveryAddress,
                    createdAt: orders.createdAt,
                })
                .from(orders)
                .leftJoin(farmers, eq(orders.farmerId, farmers.id))
                .leftJoin(crops, eq(orders.cropId, crops.id))
                .where(eq(orders.userId, ctx.user.id))
                .orderBy(desc(orders.createdAt));

            return result.map(r => ({
                ...r,
                cropName: r.cropName || "Crop",
                farmerName: r.farmerName || "Farmer",
                quantity: r.quantity?.toString() || "0",
                unitPrice: r.unitPrice?.toString() || "0",
                deliveryFee: r.deliveryFee?.toString() || "0",
                totalAmount: r.totalAmount?.toString() || "0",
            }));
        }),

    getById: publicQuery
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();
            const customers = alias(users, "customer");
            const farmers = alias(users, "farmer");

            const result = await db
                .select({
                    id: orders.id,
                    orderNumber: orders.orderNumber,
                    customer: customers.name,
                    customerAvatar: customers.avatar,
                    crop: crops.name,
                    farmerName: farmers.name,
                    quantity: orders.quantity,
                    amount: orders.totalAmount,
                    status: orders.status,
                    deliveryType: orders.deliveryType,
                    date: orders.createdAt,
                    address: orders.deliveryAddress,
                })
                .from(orders)
                .leftJoin(customers, eq(orders.userId, customers.id))
                .leftJoin(farmers, eq(orders.farmerId, farmers.id))
                .leftJoin(crops, eq(orders.cropId, crops.id))
                .where(eq(orders.id, input.id))
                .limit(1);

            if (result.length === 0) return null;

            const r = result[0];
            return {
                ...r,
                customer: r.customer || "Unknown",
                customerAvatar: r.customerAvatar || "/farmer-1.jpg",
                crop: r.crop || "Unknown",
                farmerName: r.farmerName || "Unknown",
                quantity: `${r.quantity} kg`,
                amount: parseFloat(r.amount as unknown as string),
                date: r.date.toISOString().split("T")[0],
                address: r.address || "",
            };
        }),

    createSimple: publicQuery
        .input(
            z.object({
                userId: z.number(),
                farmerId: z.number(),
                cropId: z.number(),
                quantity: z.number(),
                unitPrice: z.number(),
                deliveryFee: z.number().default(0),
                totalAmount: z.number(),
                deliveryType: z.enum(["express", "standard", "pickup"]),
                address: z.string(),
                otp: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            const orderNumber = `KS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
            const otp = input.otp || Math.floor(100000 + Math.random() * 900000).toString();
            
            const [result] = await db.insert(orders).values({
                orderNumber,
                userId: input.userId,
                farmerId: input.farmerId,
                cropId: input.cropId,
                quantity: input.quantity.toString(),
                unitPrice: input.unitPrice.toString(),
                deliveryFee: input.deliveryFee.toString(),
                totalAmount: input.totalAmount.toString(),
                deliveryType: input.deliveryType,
                status: "pending",
                otp,
                deliveryAddress: input.address,
            }).returning({ id: orders.id });
            const newOrderId = result.id;

            // Generate delivery legs if it's not pickup
            if (input.deliveryType !== "pickup") {
                const [farmer] = await db.select({ lat: users.lat, lng: users.lng, location: users.location, name: users.name }).from(users).where(eq(users.id, input.farmerId)).limit(1);
                const [customer] = await db.select({ lat: users.lat, lng: users.lng }).from(users).where(eq(users.id, input.userId)).limit(1);
                
                if (farmer && customer) {
                    const allWh = await db.select().from(warehouses).where(eq(warehouses.isActive, true));
                    const legs = planDeliveryLegs(
                        farmer.lat || 18.5204,
                        farmer.lng || 73.8567,
                        farmer.location || `${farmer.name}'s Farm`,
                        customer.lat || 19.0760,
                        customer.lng || 72.8777,
                        input.address,
                        allWh
                    );

                    for (const leg of legs) {
                        await db.insert(deliveries).values({
                            orderId: newOrderId,
                            legIndex: leg.legIndex,
                            totalLegs: legs.length,
                            pickupLat: leg.pickupLat,
                            pickupLng: leg.pickupLng,
                            pickupAddress: leg.pickupAddress,
                            deliveryLat: leg.deliveryLat,
                            deliveryLng: leg.deliveryLng,
                            deliveryAddress: leg.deliveryAddress,
                            fromWarehouseId: leg.fromWarehouseId,
                            toWarehouseId: leg.toWarehouseId,
                            status: "pending",
                            partnerEarning: "0",
                        });
                    }
                }
            }

            // Deduct stock from crop
            const cropData = await db.select().from(crops).where(eq(crops.id, input.cropId)).limit(1);
            if (cropData.length > 0 && cropData[0].stock !== null) {
                const newStock = Math.max(0, cropData[0].stock - input.quantity);
                await db.update(crops).set({ stock: newStock }).where(eq(crops.id, input.cropId));
            }

            // Create notification for farmer
            await db.insert(notifications).values({
                userId: input.farmerId,
                title: "New Order Received",
                message: `${input.quantity}kg of crop has been ordered from you so keep it ready`,
                type: "order",
                isRead: false,
            });

            // Create notification for customer with OTP
            await db.insert(notifications).values({
                userId: input.userId,
                title: "Order Placed Successfully! 🎉",
                message: `Your order ${orderNumber} has been placed. Your Delivery OTP is ${otp}. Please share this with the delivery partner upon arrival.`,
                type: "order",
                isRead: false,
            });

            return { id: result.id, orderNumber, otp, success: true };
        }),

    updateStatus: publicQuery
        .input(
            z.object({
                id: z.number(),
                status: z.enum([
                    "pending",
                    "confirmed",
                    "processing",
                    "out_for_delivery",
                    "delivered",
                    "cancelled",
                ]),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
            return { success: true };
        }),
        
    delete: publicQuery
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = getDb();
            await db.delete(orders).where(eq(orders.id, input.id));
            return { success: true };
        }),
});
