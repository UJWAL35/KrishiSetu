import {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    decimal,
    bigint,
    boolean,
    doublePrecision,
} from "drizzle-orm/pg-core";

// ── Users (auth system) ──────────────────────────────────
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    unionId: varchar("unionId", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    avatar: text("avatar"),
    role: varchar("role", { length: 50 }).$type<"consumer" | "farmer" | "admin" | "delivery_partner">().default("consumer").notNull(),
    phone: varchar("phone", { length: 20 }),
    location: varchar("location", { length: 255 }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    isVerified: boolean("isVerified").default(false),
    isProfileComplete: boolean("isProfileComplete").default(false),
    rating: doublePrecision("rating").default(0),
    reviewCount: integer("reviewCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
    password: varchar("password", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Farms ────────────────────────────────────────────────
export const farms = pgTable("farms", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    size: varchar("size", { length: 50 }),
    soilType: varchar("soilType", { length: 100 }),
    isOrganic: boolean("isOrganic").default(false),
    images: text("images"), // Store JSON stringified array of image URLs
    status: varchar("status", { length: 50 }).$type<"active" | "inactive">().default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;

// ── Sensor Readings ──────────────────────────────────────
export const sensorReadings = pgTable("sensor_readings", {
    id: serial("id").primaryKey(),
    farmId: bigint("farmId", { mode: "number" }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    type: varchar("type", { length: 50 }).$type<"temperature" | "soil_moisture" | "ph" | "humidity">().notNull(),
    value: doublePrecision("value").notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    status: varchar("status", { length: 50 }).$type<"optimal" | "warning" | "critical">().default("optimal").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;

// ── Spray Activities ─────────────────────────────────────
export const sprayActivities = pgTable("spray_activities", {
    id: serial("id").primaryKey(),
    farmId: bigint("farmId", { mode: "number" }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    type: varchar("type", { length: 50 }).$type<"water" | "pesticide" | "fertilizer">().notNull(),
    duration: integer("duration").notNull(),
    status: varchar("status", { length: 50 }).$type<"pending" | "in_progress" | "completed" | "failed">().default("pending").notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SprayActivity = typeof sprayActivities.$inferSelect;

// ── Crops ────────────────────────────────────────────────
export const crops = pgTable("crops", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    farmId: bigint("farmId", { mode: "number" }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 50 }).$type<"grains" | "vegetables" | "fruits" | "pulses" | "others">().notNull(),
    variety: varchar("variety", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).default("kg").notNull(),
    stock: integer("stock").default(0).notNull(),
    image: text("image"),
    isOrganic: boolean("isOrganic").default(false),
    isAvailable: boolean("isAvailable").default(true),
    harvestDate: timestamp("harvestDate"),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Crop = typeof crops.$inferSelect;

// ── Orders ───────────────────────────────────────────────
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    cropId: bigint("cropId", { mode: "number" }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    deliveryType: varchar("deliveryType", { length: 50 }).$type<"express" | "standard" | "pickup">().default("express").notNull(),
    status: varchar("status", { length: 50 }).$type<"pending" | "confirmed" | "processing" | "out_for_delivery" | "delivered" | "cancelled">().default("pending").notNull(),
    otp: varchar("otp", { length: 10 }),
    deliveryAddress: text("deliveryAddress"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ── Government Schemes ───────────────────────────────────
export const schemes = pgTable("schemes", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).$type<"financial" | "equipment" | "insurance" | "training" | "subsidy">().notNull(),
    benefit: varchar("benefit", { length: 255 }),
    eligibility: text("eligibility"),
    deadline: timestamp("deadline"),
    documentRequired: text("documentRequired"),
    applicationLink: text("applicationLink"),
    image: text("image"),
    isActive: boolean("isActive").default(true),
    isNew: boolean("isNew").default(false),
    color: varchar("color", { length: 50 }).default("#000000"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Scheme = typeof schemes.$inferSelect;

// ── Notifications ────────────────────────────────────────
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    type: varchar("type", { length: 50 }).$type<"scheme" | "order" | "sensor_alert" | "general" | "delivery" | "system">().default("general").notNull(),
    isRead: boolean("isRead").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ── Reviews ──────────────────────────────────────────────
export const reviews = pgTable("reviews", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ── Sensor Issues ─────────────────────────────────────────
export const sensorIssues = pgTable("sensor_issues", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    farmId: bigint("farmId", { mode: "number" }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    sensorType: varchar("sensorType", { length: 100 }).notNull(),
    issueType: varchar("issueType", { length: 100 }).notNull(),
    urgency: varchar("urgency", { length: 50 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).$type<"open" | "in_progress" | "resolved">().default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SensorIssue = typeof sensorIssues.$inferSelect;

// ── Favorite Farmers ─────────────────────────────────────
export const favoriteFarmers = pgTable("favorite_farmers", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    farmerId: bigint("farmerId", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteFarmer = typeof favoriteFarmers.$inferSelect;

// ── KrishiSetu Warehouses ─────────────────────────────────
export const warehouses = pgTable("warehouses", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    isActive: boolean("isActive").default(true),
    capacity: integer("capacity").default(1000), // in kg
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Warehouse = typeof warehouses.$inferSelect;

// ── Delivery Partners ─────────────────────────────────────
export const deliveryPartners = pgTable("delivery_partners", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull().unique(),
    vehicleType: varchar("vehicleType", { length: 50 }).$type<"bike" | "auto" | "van" | "truck">().default("bike").notNull(),
    licenseNumber: varchar("licenseNumber", { length: 50 }),
    isAvailable: boolean("isAvailable").default(false),
    isVerified: boolean("isVerified").default(false),
    avgRating: doublePrecision("avgRating").default(0),
    totalDeliveries: integer("totalDeliveries").default(0),
    totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0"),
    currentLat: doublePrecision("currentLat"),
    currentLng: doublePrecision("currentLng"),
    homeWarehouseId: bigint("homeWarehouseId", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type DeliveryPartner = typeof deliveryPartners.$inferSelect;

// ── Deliveries ────────────────────────────────────────────
export const deliveries = pgTable("deliveries", {
    id: serial("id").primaryKey(),
    orderId: bigint("orderId", { mode: "number" }).notNull(),
    deliveryPartnerId: bigint("deliveryPartnerId", { mode: "number" }),
    legIndex: integer("legIndex").default(1).notNull(),
    totalLegs: integer("totalLegs").default(1).notNull(),
    fromWarehouseId: bigint("fromWarehouseId", { mode: "number" }),
    toWarehouseId: bigint("toWarehouseId", { mode: "number" }),
    pickupAddress: text("pickupAddress"),
    deliveryAddress: text("deliveryAddress"),
    pickupLat: doublePrecision("pickupLat"),
    pickupLng: doublePrecision("pickupLng"),
    deliveryLat: doublePrecision("deliveryLat"),
    deliveryLng: doublePrecision("deliveryLng"),
    status: varchar("status", { length: 50 }).$type<"pending" | "assigned" | "picked_up" | "at_warehouse" | "out_for_delivery" | "delivered" | "cancelled">().default("pending").notNull(),
    otp: varchar("otp", { length: 10 }),
    otpVerified: boolean("otpVerified").default(false),
    partnerEarning: decimal("partnerEarning", { precision: 10, scale: 2 }).default("0"),
    assignedAt: timestamp("assignedAt"),
    pickedUpAt: timestamp("pickedUpAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Delivery = typeof deliveries.$inferSelect;

// ── Delivery Ratings ──────────────────────────────────────
export const deliveryRatings = pgTable("delivery_ratings", {
    id: serial("id").primaryKey(),
    deliveryId: bigint("deliveryId", { mode: "number" }).notNull().unique(),
    orderId: bigint("orderId", { mode: "number" }).notNull(),
    deliveryPartnerId: bigint("deliveryPartnerId", { mode: "number" }).notNull(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryRating = typeof deliveryRatings.$inferSelect;
