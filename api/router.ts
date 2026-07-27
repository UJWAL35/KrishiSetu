import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { sensorRouter } from "./routers/sensor-router";
import { farmerRouter } from "./routers/farmer-router";
import { orderRouter } from "./routers/order-router";
import { schemeRouter } from "./routers/scheme-router";
import { notificationRouter } from "./routers/notification-router";
import { cropRouter } from "./routers/crop-router";
import { aiRouter } from "./routers/ai-router";
import { adminRouter } from "./routers/admin-router";
import { deliveryRouter } from "./routers/delivery-router";

export const appRouter = createRouter({
    ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
    auth: authRouter,
    sensor: sensorRouter,
    farmer: farmerRouter,
    order: orderRouter,
    scheme: schemeRouter,
    notification: notificationRouter,
    crop: cropRouter,
    ai: aiRouter,
    admin: adminRouter,
    delivery: deliveryRouter,
});

export type AppRouter = typeof appRouter;
