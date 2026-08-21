import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
    users,
    orders,
    crops,
    notifications,
    deliveries,
    deliveryPartners,
    deliveryRatings,
    warehouses,
} from "@db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// ── Haversine distance in km ─────────────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Chain leg planner ────────────────────────────────────
const MAX_DIRECT_KM = 200;

export function planDeliveryLegs(
    farmLat: number,
    farmLng: number,
    farmAddress: string,
    customerLat: number,
    customerLng: number,
    customerAddress: string,
    allWarehouses: { id: number; name: string; lat: number; lng: number; city: string }[]
): Array<{
    legIndex: number;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress: string;
    fromWarehouseId: number | null;
    toWarehouseId: number | null;
}> {
    const totalDist = haversineKm(farmLat, farmLng, customerLat, customerLng);

    if (totalDist <= MAX_DIRECT_KM || allWarehouses.length === 0) {
        return [
            {
                legIndex: 1,
                pickupLat: farmLat,
                pickupLng: farmLng,
                pickupAddress: farmAddress,
                deliveryLat: customerLat,
                deliveryLng: customerLng,
                deliveryAddress: customerAddress,
                fromWarehouseId: null,
                toWarehouseId: null,
            },
        ];
    }

    const legs: ReturnType<typeof planDeliveryLegs> = [];

    const nearFarm = allWarehouses.reduce((best, wh) => {
        const d = haversineKm(farmLat, farmLng, wh.lat, wh.lng);
        return d < haversineKm(farmLat, farmLng, best.lat, best.lng) ? wh : best;
    });

    const nearCustomer = allWarehouses.reduce((best, wh) => {
        const d = haversineKm(customerLat, customerLng, wh.lat, wh.lng);
        return d < haversineKm(customerLat, customerLng, best.lat, best.lng) ? wh : best;
    });

    if (nearFarm.id === nearCustomer.id) {
        legs.push({
            legIndex: 1,
            pickupLat: farmLat,
            pickupLng: farmLng,
            pickupAddress: farmAddress,
            deliveryLat: nearFarm.lat,
            deliveryLng: nearFarm.lng,
            deliveryAddress: `KrishiSetu Warehouse – ${nearFarm.name}, ${nearFarm.city}`,
            fromWarehouseId: null,
            toWarehouseId: nearFarm.id,
        });
        legs.push({
            legIndex: 2,
            pickupLat: nearFarm.lat,
            pickupLng: nearFarm.lng,
            pickupAddress: `KrishiSetu Warehouse – ${nearFarm.name}, ${nearFarm.city}`,
            deliveryLat: customerLat,
            deliveryLng: customerLng,
            deliveryAddress: customerAddress,
            fromWarehouseId: nearFarm.id,
            toWarehouseId: null,
        });
    } else {
        legs.push({
            legIndex: 1,
            pickupLat: farmLat,
            pickupLng: farmLng,
            pickupAddress: farmAddress,
            deliveryLat: nearFarm.lat,
            deliveryLng: nearFarm.lng,
            deliveryAddress: `KrishiSetu Warehouse – ${nearFarm.name}, ${nearFarm.city}`,
            fromWarehouseId: null,
            toWarehouseId: nearFarm.id,
        });
        legs.push({
            legIndex: 2,
            pickupLat: nearFarm.lat,
            pickupLng: nearFarm.lng,
            pickupAddress: `KrishiSetu Warehouse – ${nearFarm.name}, ${nearFarm.city}`,
            deliveryLat: nearCustomer.lat,
            deliveryLng: nearCustomer.lng,
            deliveryAddress: `KrishiSetu Warehouse – ${nearCustomer.name}, ${nearCustomer.city}`,
            fromWarehouseId: nearFarm.id,
            toWarehouseId: nearCustomer.id,
        });
        legs.push({
            legIndex: 3,
            pickupLat: nearCustomer.lat,
            pickupLng: nearCustomer.lng,
            pickupAddress: `KrishiSetu Warehouse – ${nearCustomer.name}, ${nearCustomer.city}`,
            deliveryLat: customerLat,
            deliveryLng: customerLng,
            deliveryAddress: customerAddress,
            fromWarehouseId: nearCustomer.id,
            toWarehouseId: null,
        });
    }

    return legs;
}

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const deliveryRouter = createRouter({
    // ── Warehouses ──────────────────────────────────────────
    getWarehouses: publicQuery.query(async () => {
        const db = getDb();
        return db.select().from(warehouses).where(eq(warehouses.isActive, true));
    }),

    // ── Partner Registration ────────────────────────────────
    registerAsPartner: authedQuery
        .input(
            z.object({
                vehicleType: z.enum(["bike", "auto", "van", "truck"]),
                licenseNumber: z.string().optional(),
                homeWarehouseId: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = getDb();
            const userId = ctx.user.id;

            const existing = await db
                .select()
                .from(deliveryPartners)
                .where(eq(deliveryPartners.userId, userId))
                .limit(1);
            if (existing.length > 0) {
                return { success: true, partner: existing[0] };
            }

            const [result] = await db.insert(deliveryPartners).values({
                userId,
                vehicleType: input.vehicleType,
                licenseNumber: input.licenseNumber,
                homeWarehouseId: input.homeWarehouseId,
                isAvailable: false,
                isVerified: true,
            });
            const partner = await db
                .select()
                .from(deliveryPartners)
                .where(eq(deliveryPartners.id, result.insertId))
                .limit(1);
            return { success: true, partner: partner[0] };
        }),

    getMyPartnerProfile: authedQuery.query(async ({ ctx }) => {
        const db = getDb();
        const partner = await db
            .select()
            .from(deliveryPartners)
            .where(eq(deliveryPartners.userId, ctx.user.id))
            .limit(1);
        return partner[0] || null;
    }),

    partnerSetAvailability: authedQuery
        .input(z.object({ isAvailable: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            const db = getDb();
            await db
                .update(deliveryPartners)
                .set({ isAvailable: input.isAvailable })
                .where(eq(deliveryPartners.userId, ctx.user.id));
            return { success: true };
        }),

    updatePartnerLocation: authedQuery
        .input(z.object({ lat: z.number(), lng: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const db = getDb();
            await db
                .update(deliveryPartners)
                .set({ currentLat: input.lat, currentLng: input.lng })
                .where(eq(deliveryPartners.userId, ctx.user.id));
            return { success: true };
        }),

    // ── Admin: List all partners ────────────────────────────
    adminGetPartners: publicQuery.query(async () => {
        const db = getDb();
        const rows = await db
            .select({
                id: deliveryPartners.id,
                userId: deliveryPartners.userId,
                name: users.name,
                phone: users.phone,
                avatar: users.avatar,
                vehicleType: deliveryPartners.vehicleType,
                licenseNumber: deliveryPartners.licenseNumber,
                isAvailable: deliveryPartners.isAvailable,
                isVerified: deliveryPartners.isVerified,
                avgRating: deliveryPartners.avgRating,
                totalDeliveries: deliveryPartners.totalDeliveries,
                totalEarnings: deliveryPartners.totalEarnings,
                currentLat: deliveryPartners.currentLat,
                currentLng: deliveryPartners.currentLng,
                createdAt: deliveryPartners.createdAt,
            })
            .from(deliveryPartners)
            .leftJoin(users, eq(deliveryPartners.userId, users.id))
            .orderBy(desc(deliveryPartners.createdAt));
        return rows.map((r) => ({
            ...r,
            totalEarnings: parseFloat(r.totalEarnings as unknown as string) || 0,
        }));
    }),

    getAvailablePartners: publicQuery.query(async () => {
        const db = getDb();
        const rows = await db
            .select({
                id: deliveryPartners.id,
                userId: deliveryPartners.userId,
                name: users.name,
                phone: users.phone,
                avatar: users.avatar,
                vehicleType: deliveryPartners.vehicleType,
                avgRating: deliveryPartners.avgRating,
                totalDeliveries: deliveryPartners.totalDeliveries,
                isAvailable: deliveryPartners.isAvailable,
                currentLat: deliveryPartners.currentLat,
                currentLng: deliveryPartners.currentLng,
            })
            .from(deliveryPartners)
            .leftJoin(users, eq(deliveryPartners.userId, users.id))
            .where(and(eq(deliveryPartners.isAvailable, true), eq(deliveryPartners.isVerified, true)));
        return rows;
    }),

    // ── Admin: Assign Delivery (plans legs, creates rows, assigns leg 1) ──
    adminAssignDelivery: authedQuery
        .input(
            z.object({
                orderId: z.number(),
                deliveryPartnerId: z.number(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();

            const farmerAlias = alias(users, "farmer");
            const customerAlias = alias(users, "customer");
            const [orderRow] = await db
                .select({
                    id: orders.id,
                    userId: orders.userId,
                    farmerId: orders.farmerId,
                    deliveryAddress: orders.deliveryAddress,
                    lat: orders.lat,
                    lng: orders.lng,
                    farmerLat: farmerAlias.lat,
                    farmerLng: farmerAlias.lng,
                    farmerLocation: farmerAlias.location,
                    cropName: crops.name,
                    customerName: customerAlias.name,
                })
                .from(orders)
                .leftJoin(farmerAlias, eq(orders.farmerId, farmerAlias.id))
                .leftJoin(customerAlias, eq(orders.userId, customerAlias.id))
                .leftJoin(crops, eq(orders.cropId, crops.id))
                .where(eq(orders.id, input.orderId))
                .limit(1);

            if (!orderRow) throw new Error("Order not found");

            const existingLegs = await db
                .select()
                .from(deliveries)
                .where(eq(deliveries.orderId, input.orderId));
            if (existingLegs.length > 0) throw new Error("Delivery already assigned for this order");

            const allWhs = await db
                .select({ id: warehouses.id, name: warehouses.name, lat: warehouses.lat, lng: warehouses.lng, city: warehouses.city })
                .from(warehouses)
                .where(eq(warehouses.isActive, true));

            const farmLat = orderRow.farmerLat ?? 20.5937;
            const farmLng = orderRow.farmerLng ?? 78.9629;
            const farmAddr = orderRow.farmerLocation ?? "Farm Location";
            const custLat = orderRow.lat ?? 28.6139;
            const custLng = orderRow.lng ?? 77.209;
            const custAddr = orderRow.deliveryAddress ?? "Customer Address";

            const legs = planDeliveryLegs(farmLat, farmLng, farmAddr, custLat, custLng, custAddr, allWhs);
            const totalLegs = legs.length;
            const otp = generateOTP();

            for (const leg of legs) {
                await db.insert(deliveries).values({
                    orderId: input.orderId,
                    deliveryPartnerId: leg.legIndex === 1 ? input.deliveryPartnerId : undefined,
                    legIndex: leg.legIndex,
                    totalLegs,
                    fromWarehouseId: leg.fromWarehouseId ?? undefined,
                    toWarehouseId: leg.toWarehouseId ?? undefined,
                    pickupAddress: leg.pickupAddress,
                    deliveryAddress: leg.deliveryAddress,
                    pickupLat: leg.pickupLat,
                    pickupLng: leg.pickupLng,
                    deliveryLat: leg.deliveryLat,
                    deliveryLng: leg.deliveryLng,
                    status: leg.legIndex === 1 ? "assigned" : "pending",
                    assignedAt: leg.legIndex === 1 ? new Date() : undefined,
                    partnerEarning: (50 + Math.floor(Math.random() * 50)).toString(),
                });
            }

            // OTP lives on the order, not a leg — verifyOTP checks orders.otp.
            await db.update(orders).set({ status: "confirmed", otp }).where(eq(orders.id, input.orderId));

            const partnerUser = await db
                .select({ userId: deliveryPartners.userId })
                .from(deliveryPartners)
                .where(eq(deliveryPartners.id, input.deliveryPartnerId))
                .limit(1);
            if (partnerUser[0]) {
                await db.insert(notifications).values({
                    userId: partnerUser[0].userId,
                    title: "New Delivery Assigned!",
                    message: `You have been assigned a new delivery for order. Pickup: ${farmAddr}. Drop: ${legs[0].deliveryAddress}`,
                    type: "delivery",
                    isRead: false,
                });
            }

            await db.insert(notifications).values({
                userId: orderRow.userId,
                title: "Order Confirmed & Delivery Partner Assigned 🚚",
                message: `Your order has been confirmed and a delivery partner has been assigned. ${totalLegs > 1 ? `Your order will travel through ${totalLegs} delivery legs. ` : ""}Your Delivery OTP is: ${otp}. Please share this 6-digit OTP with the delivery partner upon arrival to confirm delivery.`,
                type: "order",
                isRead: false,
            });

            return { success: true, legs: totalLegs, otp };
        }),

    // ── Admin: Assign next leg partner ─────────────────────
    adminAssignNextLeg: authedQuery
        .input(
            z.object({
                deliveryId: z.number(),
                deliveryPartnerId: z.number(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();
            
            // 1. Get the current leg
            const [currentLeg] = await db
                .select()
                .from(deliveries)
                .where(eq(deliveries.id, input.deliveryId))
                .limit(1);
            if (!currentLeg) throw new Error("Current delivery leg not found");

            // 2. Find the next leg for this order
            const [nextLeg] = await db
                .select()
                .from(deliveries)
                .where(and(
                    eq(deliveries.orderId, currentLeg.orderId),
                    eq(deliveries.legIndex, currentLeg.legIndex + 1)
                ))
                .limit(1);
            if (!nextLeg) throw new Error("Next delivery leg not found. Is this the last leg?");

            // 3. Assign the next leg to the new partner
            await db
                .update(deliveries)
                .set({
                    deliveryPartnerId: input.deliveryPartnerId,
                    status: "assigned",
                    assignedAt: new Date(),
                })
                .where(eq(deliveries.id, nextLeg.id));

            // 4. Send notification to the newly assigned partner
            const partnerUser = await db
                .select({ userId: deliveryPartners.userId })
                .from(deliveryPartners)
                .where(eq(deliveryPartners.id, input.deliveryPartnerId))
                .limit(1);
            
            if (partnerUser[0]) {
                await db.insert(notifications).values({
                    userId: partnerUser[0].userId,
                    title: "New Delivery Leg Assigned!",
                    message: `You have a new delivery leg (Leg ${nextLeg.legIndex}/${nextLeg.totalLegs}). Pickup: ${nextLeg.pickupAddress}`,
                    type: "delivery",
                    isRead: false,
                });
            }
            return { success: true };
        }),

    // ── Partner: Update delivery status (no terminal "delivered" here — that requires OTP) ──
    updateDeliveryStatus: authedQuery
        .input(
            z.object({
                deliveryId: z.number(),
                status: z.enum(["pending", "assigned", "picked_up", "at_warehouse", "out_for_delivery", "cancelled"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = getDb();

            const [partner] = await db.select({ id: deliveryPartners.id }).from(deliveryPartners).where(eq(deliveryPartners.userId, ctx.user.id)).limit(1);
            if (!partner) throw new Error("You are not registered as a delivery partner");

            const [leg] = await db
                .select()
                .from(deliveries)
                .where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.deliveryPartnerId, partner.id)))
                .limit(1);
            if (!leg) throw new Error("Delivery not found or not assigned to you");

            const updates: Partial<typeof deliveries.$inferInsert> = { status: input.status };
            if (input.status === "picked_up") updates.pickedUpAt = new Date();

            await db.update(deliveries).set(updates).where(eq(deliveries.id, input.deliveryId));

            // Auto-assign logic: Automatically assign the next leg to the same partner
            let nextLegAssigned = false;
            if (input.status === "at_warehouse" && leg.legIndex < leg.totalLegs) {
                const [nextLeg] = await db
                    .select()
                    .from(deliveries)
                    .where(and(eq(deliveries.orderId, leg.orderId), eq(deliveries.legIndex, leg.legIndex + 1)))
                    .limit(1);

                if (nextLeg) {
                    await db.update(deliveries)
                        .set({
                            deliveryPartnerId: leg.deliveryPartnerId,
                            status: "assigned",
                            assignedAt: new Date()
                        })
                        .where(eq(deliveries.id, nextLeg.id));
                    nextLegAssigned = true;
                }
            }

            const [orderRow] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, userId: orders.userId }).from(orders).where(eq(orders.id, leg.orderId)).limit(1);

            const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
            for (const admin of adminUsers) {
                let msg = `Partner ${ctx.user.name || "Delivery Partner"} updated Order #${orderRow?.orderNumber || leg.orderId} (Leg ${leg.legIndex}/${leg.totalLegs}) status to "${input.status}".`;
                if (input.status === "at_warehouse") {
                    msg = `Order #${orderRow?.orderNumber || leg.orderId} is out from warehouse and the next leg has automatically started with Partner ${ctx.user.name || "Delivery Partner"}.`;
                }
                await db.insert(notifications).values({
                    userId: admin.id,
                    title: input.status === "at_warehouse" ? "Warehouse Arrival & Next Leg Auto-Started" : `Delivery Action: ${input.status.toUpperCase()}`,
                    message: msg,
                    type: "system",
                    isRead: false,
                });
            }

            if (input.status === "out_for_delivery" && leg.legIndex === leg.totalLegs && orderRow) {
                await db.insert(notifications).values({
                    userId: orderRow.userId,
                    title: "Your order is out for delivery!",
                    message: "A delivery partner is on the way with your order. Please keep your OTP ready!",
                    type: "delivery",
                    isRead: false,
                });
                await db.update(orders).set({ status: "out_for_delivery" }).where(eq(orders.id, leg.orderId));
            }

            return { success: true };
        }),

    // ── Admin: Approve Warehouse Arrival & Release Next Leg ──
    adminApproveArrival: authedQuery
        .input(z.object({ deliveryId: z.number() }))
        .mutation(async ({ input }) => {
            const db = getDb();

            const [leg] = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId)).limit(1);
            if (!leg) throw new Error("Delivery leg not found");

            await db.update(deliveries).set({ status: "at_warehouse" }).where(eq(deliveries.id, input.deliveryId));

            const [orderRow] = await db.select({ userId: orders.userId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, leg.orderId)).limit(1);
            if (orderRow) {
                await db.insert(notifications).values({
                    userId: orderRow.userId,
                    title: `Order #${orderRow.orderNumber} Verified at Warehouse ✅`,
                    message: `Admin has verified your order arrival at the hub. It is proceeding to the next delivery leg.`,
                    type: "delivery",
                    isRead: false,
                });
            }
            return { success: true };
        }),

    // ── Partner: Verify OTP (completes final leg + order) ──
    verifyOTP: authedQuery
        .input(z.object({ deliveryId: z.number(), otp: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const db = getDb();

            const [partner] = await db.select({ id: deliveryPartners.id }).from(deliveryPartners).where(eq(deliveryPartners.userId, ctx.user.id)).limit(1);
            if (!partner) throw new Error("You are not registered as a delivery partner");

            const [leg] = await db
                .select()
                .from(deliveries)
                .where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.deliveryPartnerId, partner.id)))
                .limit(1);
            if (!leg) throw new Error("Delivery leg not found");

            const [orderRow] = await db.select({ id: orders.id, otp: orders.otp, userId: orders.userId }).from(orders).where(eq(orders.id, leg.orderId)).limit(1);
            if (!orderRow) throw new Error("Order not found");

            if (orderRow.otp !== input.otp) throw new Error("Invalid OTP. Please try again.");
            if (leg.otpVerified) throw new Error("OTP already verified.");

            await db
                .update(deliveries)
                .set({ status: "delivered", otpVerified: true, deliveredAt: new Date() })
                .where(eq(deliveries.id, input.deliveryId));

            await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, leg.orderId));

            await db
                .update(deliveryPartners)
                .set({
                    totalDeliveries: sql`COALESCE(totalDeliveries, 0) + 1`,
                    totalEarnings: sql`COALESCE(totalEarnings, 0) + ${leg.partnerEarning}`,
                })
                .where(eq(deliveryPartners.userId, ctx.user.id));

            await db.insert(notifications).values({
                userId: orderRow.userId,
                title: "Order Delivered!",
                message: "Your order has been delivered successfully. Please rate your delivery experience!",
                type: "delivery",
                isRead: false,
            });

            const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
            for (const admin of adminUsers) {
                await db.insert(notifications).values({
                    userId: admin.id,
                    title: "Order Successfully Delivered ✅",
                    message: `Order #${leg.orderId} was successfully delivered by partner ${ctx.user.id}.`,
                    type: "system",
                    isRead: false,
                });
            }

            return { success: true };
        }),

    // ── Get OTP for customer (on order details page) ───────
    getOrderOTP: publicQuery
        .input(z.object({ orderId: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();
            const result = await db
                .select({ otp: orders.otp, status: orders.status })
                .from(orders)
                .where(eq(orders.id, input.orderId))
                .limit(1);
            if (result.length === 0) return null;
            return { otp: result[0].otp, status: result[0].status };
        }),

    // ── Get tracking information for a specific order ───────
    getOrderTracking: publicQuery
        .input(z.object({ orderId: z.number() }))
        .query(async ({ input }) => {
            const db = getDb();
            const result = await db
                .select({
                    id: deliveries.id,
                    orderId: deliveries.orderId,
                    status: deliveries.status,
                    legIndex: deliveries.legIndex,
                    totalLegs: deliveries.totalLegs,
                    pickupLat: deliveries.pickupLat,
                    pickupLng: deliveries.pickupLng,
                    deliveryLat: deliveries.deliveryLat,
                    deliveryLng: deliveries.deliveryLng,
                    deliveryAddress: deliveries.deliveryAddress,
                    partnerLat: deliveryPartners.currentLat,
                    partnerLng: deliveryPartners.currentLng,
                })
                .from(deliveries)
                .leftJoin(deliveryPartners, eq(deliveries.deliveryPartnerId, deliveryPartners.id))
                .where(eq(deliveries.orderId, input.orderId))
                .orderBy(deliveries.legIndex);

            return result;
        }),

    // ── Partner: My deliveries ──────────────────────────────
    myDeliveries: authedQuery.query(async ({ ctx }) => {
        const db = getDb();
        const partner = await db
            .select({ id: deliveryPartners.id })
            .from(deliveryPartners)
            .where(eq(deliveryPartners.userId, ctx.user.id))
            .limit(1);
        if (!partner[0]) return [];

        const rows = await db
            .select({
                id: deliveries.id,
                orderId: deliveries.orderId,
                orderNumber: orders.orderNumber,
                legIndex: deliveries.legIndex,
                totalLegs: deliveries.totalLegs,
                pickupAddress: deliveries.pickupAddress,
                deliveryAddress: deliveries.deliveryAddress,
                pickupLat: deliveries.pickupLat,
                pickupLng: deliveries.pickupLng,
                deliveryLat: deliveries.deliveryLat,
                deliveryLng: deliveries.deliveryLng,
                status: deliveries.status,
                otpVerified: deliveries.otpVerified,
                partnerEarning: deliveries.partnerEarning,
                assignedAt: deliveries.assignedAt,
                deliveredAt: deliveries.deliveredAt,
                cropName: crops.name,
                customerName: users.name,
                customerPhone: users.phone,
                fromWarehouseId: deliveries.fromWarehouseId,
                toWarehouseId: deliveries.toWarehouseId,
                createdAt: deliveries.createdAt,
            })
            .from(deliveries)
            .leftJoin(orders, eq(deliveries.orderId, orders.id))
            .leftJoin(crops, eq(orders.cropId, crops.id))
            .leftJoin(users, eq(orders.userId, users.id))
            .where(eq(deliveries.deliveryPartnerId, partner[0].id))
            .orderBy(desc(deliveries.createdAt));

        return rows.map((r) => ({
            ...r,
            partnerEarning: Number(r.partnerEarning) || 0,
            assignedAt: r.assignedAt?.toISOString() || null,
            deliveredAt: r.deliveredAt?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
        }));
    }),

    // ── Customer: Rate delivery partner ────────────────────
    ratePartner: authedQuery
        .input(
            z.object({
                deliveryId: z.number(),
                orderId: z.number(),
                deliveryPartnerId: z.number(),
                userId: z.number(),
                rating: z.number().min(1).max(5),
                comment: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = getDb();

            const existing = await db
                .select()
                .from(deliveryRatings)
                .where(eq(deliveryRatings.deliveryId, input.deliveryId))
                .limit(1);
            if (existing.length > 0) throw new Error("You have already rated this delivery.");

            await db.insert(deliveryRatings).values({
                deliveryId: input.deliveryId,
                orderId: input.orderId,
                deliveryPartnerId: input.deliveryPartnerId,
                userId: input.userId,
                rating: input.rating,
                comment: input.comment,
            });

            const ratings = await db
                .select({ rating: deliveryRatings.rating })
                .from(deliveryRatings)
                .where(eq(deliveryRatings.deliveryPartnerId, input.deliveryPartnerId));
            const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            await db
                .update(deliveryPartners)
                .set({ avgRating: avg })
                .where(eq(deliveryPartners.id, input.deliveryPartnerId));

            return { success: true };
        }),

    // ── Admin: All deliveries ───────────────────────────────
    adminGetAllDeliveries: publicQuery
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async () => {
            const db = getDb();
            const partnerUser = alias(users, "partnerUser");
            const customerUser = alias(users, "customerUser");

            const rows = await db
                .select({
                    id: deliveries.id,
                    orderId: deliveries.orderId,
                    orderNumber: orders.orderNumber,
                    legIndex: deliveries.legIndex,
                    totalLegs: deliveries.totalLegs,
                    status: deliveries.status,
                    pickupAddress: deliveries.pickupAddress,
                    deliveryAddress: deliveries.deliveryAddress,
                    partnerName: partnerUser.name,
                    partnerPhone: partnerUser.phone,
                    customerName: customerUser.name,
                    cropName: crops.name,
                    partnerEarning: deliveries.partnerEarning,
                    partnerLat: deliveryPartners.currentLat,
                    partnerLng: deliveryPartners.currentLng,
                    assignedAt: deliveries.assignedAt,
                    deliveredAt: deliveries.deliveredAt,
                    createdAt: deliveries.createdAt,
                })
                .from(deliveries)
                .leftJoin(orders, eq(deliveries.orderId, orders.id))
                .leftJoin(crops, eq(orders.cropId, crops.id))
                .leftJoin(customerUser, eq(orders.userId, customerUser.id))
                .leftJoin(deliveryPartners, eq(deliveries.deliveryPartnerId, deliveryPartners.id))
                .leftJoin(partnerUser, eq(deliveryPartners.userId, partnerUser.id))
                .orderBy(desc(deliveries.createdAt))
                .limit(100);

            return rows.map((r) => ({
                ...r,
                partnerEarning: Number(r.partnerEarning) || 0,
                assignedAt: r.assignedAt?.toISOString() || null,
                deliveredAt: r.deliveredAt?.toISOString() || null,
                createdAt: r.createdAt.toISOString(),
            }));
        }),

    // ── Admin: Stats ────────────────────────────────────────
    adminGetDeliveryStats: publicQuery.query(async () => {
        const db = getDb();
        const [totalPartners] = await db.select({ value: count() }).from(deliveryPartners);
        const [availablePartners] = await db
            .select({ value: count() })
            .from(deliveryPartners)
            .where(eq(deliveryPartners.isAvailable, true));
        const [totalDeliveries] = await db.select({ value: count() }).from(deliveries);
        const [completedDeliveries] = await db
            .select({ value: count() })
            .from(deliveries)
            .where(eq(deliveries.status, "delivered"));
        return {
            totalPartners: totalPartners.value,
            availablePartners: availablePartners.value,
            totalDeliveries: totalDeliveries.value,
            completedDeliveries: completedDeliveries.value,
        };
    }),
});